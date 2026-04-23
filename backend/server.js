const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const MERCHANT_ID = "YOUR_CLIENT_ID";
const SALT_KEY = "YOUR_CLIENT_SECRET";
const SALT_INDEX = 1;

// Create payment
app.post('/create-payment', async (req, res) => {
    const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: "txn_" + Date.now(),
        merchantUserId: "user123",
        amount: 10000, // in paise (₹100)
        redirectUrl: "https://yourwebsite.com/payment-success",
        redirectMode: "POST",
        callbackUrl: "https://yourwebsite.com/payment-callback",
        paymentInstrument: {
            type: "PAY_PAGE"
        }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

    const stringToHash = base64Payload + "/pg/v1/pay" + SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + "###" + SALT_INDEX;

    try {
        const response = await axios.post(
            "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
            { request: base64Payload },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": checksum
                }
            }
        );

        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(500).send("Payment error");
    }
});

// ✅ 2. Check Payment Status API (ADD HERE)
app.get('/check-status/:txnId', async (req, res) => {
    const txnId = req.params.txnId;

    const stringToHash = `/pg/v1/status/${MERCHANT_ID}/${txnId}` + SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + "###" + SALT_INDEX;

    const url = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${MERCHANT_ID}/${txnId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                "X-VERIFY": checksum
            }
        });

        res.json(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send("Status check failed");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));