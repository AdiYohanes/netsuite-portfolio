/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * @description
 * This script triggers when an Item Fulfillment is saved.
 * It sends the fulfillment data to a Third-Party Shipping API
 * and saves the returned Tracking Number back to the NetSuite record.
 */

define(['N/https', 'N/record', 'N/log', 'N/runtime', 'N/error'],

    (https, record, log, runtime, error) => {

        /**
         * Function definition to be triggered after record is submitted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type !== scriptContext.UserEventType.CREATE &&
                scriptContext.type !== scriptContext.UserEventType.EDIT) {
                return;
            }

            const newRecord = scriptContext.newRecord;
            const recordId = newRecord.id;
            const recordType = newRecord.type;

            try {
                // Check if already has tracking number to prevent infinite loops on edit
                // Assuming we use standard 'trackingnumbers' field or custom field 'custbody_api_tracking_num'
                const existingTracking = newRecord.getValue({ fieldId: 'custbody_api_tracking_num' });
                if (existingTracking) {
                    log.debug('Skipping', `Record ${recordId} already has tracking number: ${existingTracking}`);
                    return;
                }

                // Get Script Parameters (best practice for API URLs and Keys)
                const currentScript = runtime.getCurrentScript();
                const apiUrl = currentScript.getParameter({ name: 'custscript_shipping_api_url' }) || 'http://localhost:3000/api/shipments'; // Fallback for demo
                const apiKey = currentScript.getParameter({ name: 'custscript_shipping_api_key' }) || 'MOCK_SHIPPING_API_KEY_12345'; // Fallback for demo

                // 1. Gather Payload Data from NetSuite Record
                const orderId = newRecord.getValue({ fieldId: 'createdfrom' }); // The Sales Order ID

                // Constructing the payload based on API requirement
                const payload = {
                    orderId: orderId,
                    fulfillmentId: recordId,
                    destination: getShippingAddress(newRecord),
                    items: getFulfillmentItems(newRecord)
                };

                // 2. Make Call to External API
                log.debug('Calling Shipping API', `Payload: ${JSON.stringify(payload)}`);

                let response;
                try {
                    response = https.post({
                        url: apiUrl,
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': apiKey
                        }
                    });
                } catch (e) {
                    log.error('API Call Failed', e.message);
                    throw error.create({ name: 'API_CONNECTION_ERROR', message: 'Failed to connect to Shipping API' });
                }

                // 3. Process API Response
                if (response.code === 201 || response.code === 200) {
                    const responseBody = JSON.parse(response.body);
                    log.debug('API Success', `Response: ${response.body}`);

                    if (responseBody.status === 'success' && responseBody.data && responseBody.data.trackingNumber) {
                        const trackingNumber = responseBody.data.trackingNumber;

                        // 4. Update NetSuite Record with Tracking Number
                        // We use record.submitFields to avoid loading the whole record again
                        record.submitFields({
                            type: recordType,
                            id: recordId,
                            values: {
                                'custbody_api_tracking_num': trackingNumber,
                                'custbody_shipping_status': responseBody.data.status || 'PROCESSING'
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                        log.audit('Tracking Updated', `Updated Fulfillment ${recordId} with Tracking Number: ${trackingNumber}`);
                    }
                } else {
                    log.error('API Error', `Status: ${response.code}, Body: ${response.body}`);
                    // Optionally: Create a custom record to log this error for admin review
                }

            } catch (e) {
                log.error({ title: 'Error in afterSubmit', details: e });
            }
        };

        // --- Helper Functions ---

        const getShippingAddress = (rec) => {
            // Simplified for demo - usually you'd pull from shippingaddress subrecord
            return {
                addressee: rec.getValue('shipaddressee') || 'Valued Customer',
                zip: rec.getValue('shipzip') || '12345',
                country: rec.getValue('shipcountry') || 'ID'
            };
        };

        const getFulfillmentItems = (rec) => {
            const items = [];
            const lineCount = rec.getLineCount({ sublistId: 'item' });
            for (let i = 0; i < lineCount; i++) {
                items.push({
                    itemId: rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i }),
                    quantity: rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })
                });
            }
            return items;
        };

        return {
            afterSubmit: afterSubmit
        };

    });
