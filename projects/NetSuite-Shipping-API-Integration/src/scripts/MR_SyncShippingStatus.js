/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 *
 * @description
 * This script runs periodically to check the shipping status
 * of fulfillments via the Third-Party Shipping API and updates NetSuite.
 */

define(['N/search', 'N/https', 'N/record', 'N/log', 'N/runtime'],

    (search, https, record, log, runtime) => {

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        const getInputData = () => {
            // Find all Item Fulfillments that have a tracking number but are not yet 'DELIVERED'
            // Assumes custom fields: custbody_api_tracking_num and custbody_shipping_status

            log.debug('getInputData', 'Starting search for pending shipments');

            return search.create({
                type: search.Type.ITEM_FULFILLMENT,
                filters: [
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['custbody_api_tracking_num', 'isnotempty', ''],
                    'AND',
                    ['custbody_shipping_status', 'isnot', 'DELIVERED'] // Don't check delivered items
                ],
                columns: [
                    'internalid',
                    'custbody_api_tracking_num',
                    'custbody_shipping_status'
                ]
            });
        };

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        const map = (context) => {
            try {
                const searchResult = JSON.parse(context.value);
                const fulfillmentId = searchResult.id;
                const trackingNumber = searchResult.values.custbody_api_tracking_num;
                const currentStatus = searchResult.values.custbody_shipping_status;

                if (!trackingNumber) {
                    log.debug('Map Skipped', `Fulfillment ${fulfillmentId} has no tracking number.`);
                    return;
                }

                // Get Script Parameters
                const currentScript = runtime.getCurrentScript();
                // Using URL params to hit GET /api/shipments/:trackingNumber
                const baseUrl = currentScript.getParameter({ name: 'custscript_shipping_api_base_url' }) || 'http://localhost:3000/api/shipments';
                const apiKey = currentScript.getParameter({ name: 'custscript_shipping_api_key' }) || 'MOCK_SHIPPING_API_KEY_12345';

                const endpointUrl = `${baseUrl}/${trackingNumber}`;

                log.debug('Map Stage', `Checking status for Tracking: ${trackingNumber} on record: ${fulfillmentId}`);

                // Call the API
                let response = https.get({
                    url: endpointUrl,
                    headers: {
                        'x-api-key': apiKey
                    }
                });

                if (response.code === 200) {
                    const responseBody = JSON.parse(response.body);

                    if (responseBody.status === 'success' && responseBody.data) {
                        const newStatus = responseBody.data.currentStatus;

                        log.debug('API Response', `Tracking: ${trackingNumber}, Old Status: ${currentStatus}, New Status: ${newStatus}`);

                        // If status changed, pass it to the reduce stage to update the record
                        if (newStatus && newStatus !== currentStatus) {
                            context.write({
                                key: fulfillmentId,
                                value: {
                                    trackingNumber: trackingNumber,
                                    newStatus: newStatus,
                                    lastUpdated: responseBody.data.lastUpdated
                                }
                            });
                        }
                    }
                } else {
                    log.error('API Error', `Tracking ${trackingNumber} Status Code: ${response.code}`);
                }

            } catch (e) {
                log.error('Error in Map Stage', e.message);
            }
        };

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        const reduce = (context) => {
            const fulfillmentId = context.key;

            try {
                // Map can write multiple values per key if not careful, we just take the first one
                const data = JSON.parse(context.values[0]);
                const newStatus = data.newStatus;

                log.audit('Reduce Stage', `Updating Fulfillment ${fulfillmentId} to status: ${newStatus}`);

                // Update the NetSuite record
                record.submitFields({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: fulfillmentId,
                    values: {
                        'custbody_shipping_status': newStatus
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

            } catch (e) {
                log.error(`Error in Reduce Stage for ID ${fulfillmentId}`, e.message);
            }
        };

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        const summarize = (summary) => {
            log.audit('Map/Reduce Complete', `Total seconds: ${summary.seconds}`);

            if (summary.inputSummary.error) {
                log.error('Input Error', summary.inputSummary.error);
            }

            summary.mapSummary.errors.iterator().each((key, error) => {
                log.error(`Map Error for key: ${key}`, error);
                return true;
            });

            summary.reduceSummary.errors.iterator().each((key, error) => {
                log.error(`Reduce Error for key: ${key}`, error);
                return true;
            });
        };

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
