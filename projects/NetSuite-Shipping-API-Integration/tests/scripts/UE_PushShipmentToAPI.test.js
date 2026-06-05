// tests/scripts/UE_PushShipmentToAPI.test.js
const https = require('N/https');
const record = require('N/record');
const log = require('N/log');

describe('UE_PushShipmentToAPI', () => {

    let UE_PushShipmentToAPI;

    beforeAll(() => {
        // Evaluate the script; jest.setup.js captures it in global.__ssModule
        require('../../src/scripts/UE_PushShipmentToAPI.js');
        UE_PushShipmentToAPI = global.__ssModule;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should skip if the event type is not CREATE or EDIT', () => {
        const scriptContext = {
            type: 'delete', // e.g. delete event
            UserEventType: {
                CREATE: 'create',
                EDIT: 'edit'
            }
        };

        UE_PushShipmentToAPI.afterSubmit(scriptContext);

        expect(https.post).not.toHaveBeenCalled();
        expect(record.submitFields).not.toHaveBeenCalled();
    });

    it('should skip if tracking number already exists', () => {
        const scriptContext = {
            type: 'edit',
            UserEventType: { CREATE: 'create', EDIT: 'edit' },
            newRecord: {
                id: 123,
                type: 'itemfulfillment',
                getValue: jest.fn().mockImplementation((options) => {
                    if (options.fieldId === 'custbody_api_tracking_num') {
                        return 'AWB123456789'; // Already exists
                    }
                    return null;
                })
            }
        };

        UE_PushShipmentToAPI.afterSubmit(scriptContext);

        expect(log.debug).toHaveBeenCalledWith('Skipping', 'Record 123 already has tracking number: AWB123456789');
        expect(https.post).not.toHaveBeenCalled();
    });

    it('should make an API call and update record when tracking number does not exist', () => {
        // Mock the HTTPS response
        https.post.mockReturnValue({
            code: 201,
            body: JSON.stringify({
                status: 'success',
                data: {
                    trackingNumber: 'AWB999888777',
                    status: 'PROCESSING'
                }
            })
        });

        const scriptContext = {
            type: 'create',
            UserEventType: { CREATE: 'create', EDIT: 'edit' },
            newRecord: {
                id: 123,
                type: 'itemfulfillment',
                getValue: jest.fn().mockImplementation((options) => {
                    if (typeof options === 'object') {
                        if (options.fieldId === 'custbody_api_tracking_num') return null;
                        if (options.fieldId === 'createdfrom') return 'SO-100';
                    } else { // String based get for helper
                        if (options === 'shipaddressee') return 'John Doe';
                        if (options === 'shipzip') return '12345';
                        if (options === 'shipcountry') return 'ID';
                    }
                    return null;
                }),
                getLineCount: jest.fn().mockReturnValue(1),
                getSublistValue: jest.fn().mockReturnValue('ItemA')
            }
        };

        UE_PushShipmentToAPI.afterSubmit(scriptContext);

        // Verify API was called
        expect(https.post).toHaveBeenCalled();
        const apiArgs = https.post.mock.calls[0][0];
        expect(apiArgs.url).toBe('http://localhost:3000/api/shipments');

        // Verify Record was updated
        expect(record.submitFields).toHaveBeenCalledWith({
            type: 'itemfulfillment',
            id: 123,
            values: {
                'custbody_api_tracking_num': 'AWB999888777',
                'custbody_shipping_status': 'PROCESSING'
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });
    });
});
