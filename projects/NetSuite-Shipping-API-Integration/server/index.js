const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// API Key Validation Middleware
const authenticateKey = (req, res, next) => {
    let apiKey = req.headers['x-api-key'];
    if (apiKey === 'MOCK_SHIPPING_API_KEY_12345') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
};

// Generate Random Tracking Number
const generateTrackingNumber = () => {
    const prefix = 'AWB';
    const num = Math.floor(1000000000 + Math.random() * 9000000000); // 10 digit number
    return `${prefix}${num}`;
};

// --- Mock Endpoints ---

// 1. Create Shipment (Simulates pushing order from NetSuite to Shipper)
app.post('/api/shipments', authenticateKey, (req, res) => {
    console.log('Received shipment request:', req.body);

    const { orderId, destination, items } = req.body;

    // Basic validation
    if (!orderId || !destination) {
        return res.status(400).json({ error: 'Missing required fields: orderId, destination' });
    }

    // Simulate processing delay
    setTimeout(() => {
        const trackingNumber = generateTrackingNumber();
        res.status(201).json({
            status: 'success',
            message: 'Shipment created successfully',
            data: {
                shipmentId: `SHIP-${Date.now()}`,
                orderId: orderId,
                trackingNumber: trackingNumber,
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +3 days
                status: 'PROCESSING'
            }
        });
    }, 500);
});

// 2. Get Shipment Status (Simulates checking status back)
app.get('/api/shipments/:trackingNumber', authenticateKey, (req, res) => {
    const { trackingNumber } = req.params;

    const statuses = ['PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    res.json({
        status: 'success',
        data: {
            trackingNumber: trackingNumber,
            currentStatus: randomStatus,
            lastUpdated: new Date().toISOString()
        }
    });
});

app.listen(port, () => {
    console.log(`Mock Shipping API is running on http://localhost:${port}`);
    console.log(`Use Header: x-api-key: MOCK_SHIPPING_API_KEY_12345`);
});
