# NetSuite Third-Party Shipping API Integration

## 📌 Project Overview
This project demonstrates a seamless integration between Oracle NetSuite and a third-party shipping provider (mocked via a Node.js API). It automates the process of generating tracking numbers upon order fulfillment and continuously synchronizes the shipping status back into NetSuite.

This is a critical requirement in many e-commerce and retail NetSuite implementations, ensuring that customer service and sales teams have real-time visibility into order delivery statuses directly within the ERP.

## 🏗️ Architecture & Flow

The integration uses two main SuiteScripts:

1. **Outbound Push (User Event Script)**
   - **Trigger:** Saving a new `Item Fulfillment` record.
   - **Action:** Captures fulfillment details (Order ID, Destination, Items) and makes a `POST` request to the Shipping API.
   - **Result:** Retrieves a unique Tracking Number (`AWB...`) and updates the custom field `custbody_api_tracking_num` on the fulfillment record.

2. **Inbound Sync (Map/Reduce Script)**
   - **Trigger:** Scheduled periodically (e.g., hourly).
   - **Action (Get Input Data):** Queries NetSuite for all Item Fulfillments that have a tracking number but do not have a status of `DELIVERED`.
   - **Action (Map):** Makes parallel `GET` requests to the Shipping API for each tracking number to fetch the latest status.
   - **Action (Reduce):** Updates the NetSuite custom field `custbody_shipping_status` if the status has changed (e.g., from `PROCESSING` to `IN_TRANSIT` or `DELIVERED`).

## 🛠️ Technology Stack
* **SuiteScript 2.1**: User Event (`N/https`, `N/record`), Map/Reduce (`N/search`, `N/https`)
* **API Authentication**: Custom API Key headers
* **Data Format**: JSON
* **Mock Server**: Node.js & Express.js (included for local testing/demo purposes)

## 📁 Folder Structure

```
NetSuite-Shipping-API-Integration/
│
├── mock-api/                             # Local Node.js mock server to simulate the Shipping Provider
│   ├── index.js                          # Express server endpoints
│   └── package.json
│
└── src/
    ├── FileCabinet/SuiteScripts/Shipping_API_Integration/
    │   ├── UE_PushShipmentToAPI.js       # Outbound script
    │   └── MR_SyncShippingStatus.js      # Status sync script
    │
    └── Objects/                          # NetSuite Customization Objects
        └── customscript_...              # (To be added: XML definitions for deployment)
```

## 🚀 How to Run the Demo Locally

To present this portfolio piece, you can run the mock API locally to demonstrate how the SuiteScripts interact with an external service.

1. **Start the Mock API:**
   ```bash
   cd mock-api
   npm install
   npm start
   ```
   *The mock server will run on `http://localhost:3000`*

2. **API Endpoints Simulated:**
   * `POST /api/shipments` - Creates a shipment and returns a tracking number.
   * `GET /api/shipments/:trackingNumber` - Returns a random shipping status (`PROCESSING`, `SHIPPED`, `IN_TRANSIT`, `DELIVERED`).

3. **Deploying to NetSuite:**
   * Upload the scripts in the `src/FileCabinet` to your NetSuite account.
   * Create custom transaction body fields:
     * `custbody_api_tracking_num` (Free-Form Text)
     * `custbody_shipping_status` (List/Record or Free-Form Text)
   * Deploy `UE_PushShipmentToAPI.js` to the `Item Fulfillment` record.
   * Deploy `MR_SyncShippingStatus.js` and set the script parameters (API URL and API Key).

## 💡 Key Developer Skills Demonstrated
* **System Integration:** Handling RESTful API calls securely from NetSuite.
* **Error Handling:** Graceful failure handling and NetSuite execution logging (`N/log`, `N/error`).
* **Governance Awareness:** Utilizing Map/Reduce for high-volume status syncing to avoid API timeout or usage limits.
* **Decoupled Architecture:** Using Script Parameters to store base URLs and API Keys, preventing hardcoded secrets and allowing easy migration from Sandbox to Production environments.
