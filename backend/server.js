// require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// 🔐 CONFIG
// =======================
const CLIENT_ID = "M236MRXSXALKN_2604231009";
const CLIENT_SECRET = "Y2NlNDI5ODUtYTYyZC00NzFlLTliZGEtMDhkOGMxZTc2Mjk5";
const CLIENT_VERSION = 1;

// =======================
// ⚡ TOKEN CACHE (BASED ON API EXPIRY)
// =======================
let cachedToken = null;
let tokenExpiryTime = 0;

const qs = require('querystring');

async function getAccessToken() {
  try {
    const res = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
      qs.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
        client_version: CLIENT_VERSION
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const data = res.data;

    cachedToken = data.access_token;
    tokenExpiryTime = Date.now() + (data.expires_in * 1000) - 5000;

    return cachedToken;

  } catch (err) {
    console.error("❌ Auth Error:", err.response?.data || err.message);
    return null;
  }
}

// =======================
// 💳 CREATE PAYMENT
// =======================
app.post('/create-payment', async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const orderId = "txn_" + Date.now();

  try {
    const token = await getAccessToken();

    if (!token) {
      return res.status(500).json({ error: "Auth failed" });
    }

    const response = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
      {
        merchantOrderId: orderId, // ✅ IMPORTANT (changed)
        amount: Math.round(amount * 100),
        expireAfter: 1200, // ✅ REQUIRED (in seconds)

        metaInfo: {
          udf1: "Saapati Order"
        },

        paymentFlow: {
          type: "PG_CHECKOUT",
          message: "Pay for your order",
          merchantUrls: {
            redirectUrl: "https://saapati.in/payment-success.html"
          }
        }
      },
      {
        headers: {
          Authorization: `O-Bearer ${token}`, // ✅ VERY IMPORTANT
          "Content-Type": "application/json"
        }
      }
    );

    const redirectUrl =
  response.data?.redirectUrl ||
  response.data?.data?.redirectUrl ||
  response.data?.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectUrl) {
        console.error("❌ No redirect URL in response:", response.data);
        return res.status(500).json({
            success: false,
            error: "No redirect URL received"
        });
        }

    res.json({
      success: true,
      orderId,
      redirectUrl
    });

    console.log("PHONEPE RAW RESPONSE:", JSON.stringify(response.data, null, 2));

  } catch (err) {
    console.error("❌ Payment Error:", err.response?.data || err.message);
    res.status(500).json(err.response?.data || { error: "Payment failed" });
  }
});

// =======================
// 🔍 CHECK STATUS
// =======================
app.get('/check-status/:txnId', async (req, res) => {
  const txnId = req.params.txnId;

  try {
    const token = await getAccessToken();

    if (!token) {
      return res.status(500).json({ error: "Auth failed" });
    }

    const response = await axios.get(
      `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/status/${txnId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error("❌ Status Error:", err.response?.data || err.message);
    res.status(500).json(err.response?.data || { error: "Status failed" });
  }
});

// =======================
// 🔔 CALLBACK
// =======================
app.post('/payment-callback', async (req, res) => {
  try {
    console.log("📩 Callback received:", req.body);

    const txnId = req.body?.merchantTransactionId;

    if (!txnId) {
      return res.status(400).send("Missing txnId");
    }

    const token = await getAccessToken();

    const statusRes = await axios.get(
      `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/status/${txnId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("✅ Verified Payment:", statusRes.data);

    // 👉 TODO: update DB

    res.status(200).send('OK');

  } catch (error) {
    console.error("❌ Callback Error:", error.response?.data || error.message);
    res.status(500).send('Callback failed');
  }
});

// =======================
// 🚀 START SERVER
// =======================
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});