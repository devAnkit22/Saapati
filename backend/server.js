// require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// // =======================
// // 🔐 CONFIG
// // =======================
// const CLIENT_ID = "M236MRXSXALKN_2604231009";
// const CLIENT_SECRET = "Y2NlNDI5ODUtYTYyZC00NzFlLTliZGEtMDhkOGMxZTc2Mjk5";
// const CLIENT_VERSION = 1;

// // =======================
// // ⚡ TOKEN CACHE (BASED ON API EXPIRY)
// // =======================
// let cachedToken = null;
// let tokenExpiryTime = 0;

// const qs = require('querystring');

// async function getAccessToken() {
//   try {
//     const res = await axios.post(
//       "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
//       qs.stringify({
//         client_id: CLIENT_ID,
//         client_secret: CLIENT_SECRET,
//         grant_type: "client_credentials",
//         client_version: CLIENT_VERSION
//       }),
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded"
//         }
//       }
//     );

//     const data = res.data;

//     cachedToken = data.access_token;
//     tokenExpiryTime = Date.now() + (data.expires_in * 1000) - 5000;

//     return cachedToken;

//   } catch (err) {
//     console.error("❌ Auth Error:", err.response?.data || err.message);
//     return null;
//   }
// }

// // =======================
// // 💳 CREATE PAYMENT
// // =======================
// app.post('/create-payment', async (req, res) => {
//   const { amount } = req.body;

//   if (!amount || isNaN(amount)) {
//     return res.status(400).json({ error: "Invalid amount" });
//   }

//   const orderId = "txn_" + Date.now();

//   try {
//     const token = await getAccessToken();

//     if (!token) {
//       return res.status(500).json({ error: "Auth failed" });
//     }

//     const response = await axios.post(
//       "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
//       {
//         merchantOrderId: orderId, // ✅ IMPORTANT (changed)
//         amount: Math.round(amount * 100),
//         expireAfter: 1200, // ✅ REQUIRED (in seconds)

//         metaInfo: {
//           udf1: "Saapati Order"
//         },

//         paymentFlow: {
//           type: "PG_CHECKOUT",
//           message: "Pay for your order",
//           merchantUrls: {
//             redirectUrl: "https://saapati.in/payment-success.html"
//           }
//         }
//       },
//       {
//         headers: {
//           Authorization: `O-Bearer ${token}`, // ✅ VERY IMPORTANT
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const redirectUrl =
//   response.data?.redirectUrl ||
//   response.data?.data?.redirectUrl ||
//   response.data?.data?.instrumentResponse?.redirectInfo?.url;

//     if (!redirectUrl) {
//         console.error("❌ No redirect URL in response:", response.data);
//         return res.status(500).json({
//             success: false,
//             error: "No redirect URL received"
//         });
//         }

//     res.json({
//       success: true,
//       orderId,
//       redirectUrl
//     });

//     console.log("PHONEPE RAW RESPONSE:", JSON.stringify(response.data, null, 2));

//   } catch (err) {
//     console.error("❌ Payment Error:", err.response?.data || err.message);
//     res.status(500).json(err.response?.data || { error: "Payment failed" });
//   }
// });

// // =======================
// // 🔍 CHECK STATUS
// // =======================
// app.get('/check-status/:txnId', async (req, res) => {
//   const txnId = req.params.txnId;

//   try {
//     const token = await getAccessToken();

//     if (!token) {
//       return res.status(500).json({ error: "Auth failed" });
//     }

//     const response = await axios.get(
//       `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/status/${txnId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       }
//     );

//     res.json(response.data);

//   } catch (err) {
//     console.error("❌ Status Error:", err.response?.data || err.message);
//     res.status(500).json(err.response?.data || { error: "Status failed" });
//   }
// });

// // =======================
// // 🔔 CALLBACK
// // =======================
// app.post('/payment-callback', async (req, res) => {
//   try {
//     console.log("📩 Callback received:", req.body);

//     const txnId = req.body?.merchantTransactionId;

//     if (!txnId) {
//       return res.status(400).send("Missing txnId");
//     }

//     const token = await getAccessToken();

//     const statusRes = await axios.get(
//       `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/status/${txnId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       }
//     );

//     console.log("✅ Verified Payment:", statusRes.data);

//     // 👉 TODO: update DB

//     res.status(200).send('OK');

//   } catch (error) {
//     console.error("❌ Callback Error:", error.response?.data || error.message);
//     res.status(500).send('Callback failed');
//   }
// });

// Models

// const variantNumericMap = {
//   "adrak_chai_250g": 1001,
//   "adrak_chai_750g": 1002,
//   "elaichi_chai_250g": 1003,
//   "elaichi_chai_750g": 1004,
//   "masala_chai_250g": 1005,
//   "masala_chai_750g": 1006,
//   "plain_tea_250g": 1007,
//   "plain_tea_750g": 1008
// };

const products = [
  {
    product_id: "adrak_chai",
    name: "Adrak Chai (Ginger Tea)",
    image: "images/adrakNew.png",
    variants: [
      { size: "250g", price: 259 },
      { size: "750g", price: 519 }
    ]
  },
  {
    product_id: "elaichi_chai",
    name: "Elaichi Chai",
    image: "images/elachiFinal.png",
    variants: [
      { size: "250g", price: 259 },
      { size: "750g", price: 519 }
    ]
  },
  {
    product_id: "masala_chai",
    name: "Masala Chai",
    image: "images/masalaNew.png",
    variants: [
      { size: "250g", price: 329 },
      { size: "750g", price: 589 }
    ]
  },
  {
    product_id: "plain_tea",
    name: "Plain Tea",
    image: "images/remvoebg.png",
    variants: [
      { size: "250g", price: 229 },
      { size: "750g", price: 479 }
    ]
  }
];

// =======================
// 🚀 SHIP ROCKET
// =======================

const crypto = require('crypto');

const API_KEY = "IGxixj5BnPA6XqVR";
const API_SECRET = "kJsJg5VwN0xrdl8BwRIm4vleFQJKudSw";

app.post('/generate-token', async (req, res) => {
  try {
    console.log("\n================= NEW TOKEN REQUEST =================");

    const { name, size, price, quantity } = req.body;

    console.log("🟡 Incoming Data:", req.body);

    if (!name || !size) {
      return res.status(400).json({ error: "Missing product data" });
    }

    // ✅ STEP 1: Map product name → product_id
    const productMap = {
      "Adrak Chai (Ginger Tea)": "adrak_chai",
      "Elaichi Chai": "elaichi_chai",
      "Masala Chai": "masala_chai",
      "Plain Tea": "plain_tea"
    };

    const product_id = productMap[name];

    if (!product_id) {
      return res.status(400).json({ error: "Invalid product name" });
    }

    // ✅ STEP 2: Create key
    const variant_key = `${product_id}_${size}`;

    // ✅ STEP 3: Numeric variant mapping (STRING FORMAT)
    const variantNumericMap = {
      "adrak_chai_250g": 10000,
      "adrak_chai_750g": 10001,

      "elaichi_chai_250g": 10010,
      "elaichi_chai_750g": 10011,

      "masala_chai_250g": 10020,
      "masala_chai_750g": 10021,

      "plain_tea_250g": 10030,
      "plain_tea_750g": 10031
    };

    const variant_id = variantNumericMap[variant_key];

    if (!variant_id) {
      console.log("❌ Variant mapping failed:", variant_key);
      return res.status(400).json({ error: "Invalid variant" });
    }

    console.log("🟢 variant_id (FINAL):", variant_id);

    // ✅ STEP 4: FINAL PAYLOAD (ONLY WHAT SHIPROCKET WANTS)
    const payload = {
      cart_data: {
        items: [
          {
            variant_id: variant_id, // 🔥 CRITICAL FIELD
            quantity: quantity || 1
          }
        ],
        custom_attributes: {
          source: "web"
        },
        mobile_app: false
      },
      redirect_url: "http://127.0.0.1:5500/payment-success.html",
      timestamp: new Date().toISOString()
    };

    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

    // ✅ STEP 5: HMAC
    const payloadString = JSON.stringify(payload);

    const hmac = crypto
      .createHmac('sha256', API_SECRET)
      .update(payloadString)
      .digest('base64');

    console.log("🔐 HMAC:", hmac);

    // ✅ STEP 6: API CALL
    const response = await axios.post(
      "https://checkout-api.shiprocket.com/api/v1/access-token/checkout",
      payload,
      {
        headers: {
          'X-Api-Key': API_KEY,
          'X-Api-HMAC-SHA256': hmac,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ Shiprocket Response:", response.data);

    const shiprocketData = response.data;

    if (!shiprocketData?.ok || !shiprocketData?.result?.token) {
      console.log("❌ Invalid Shiprocket response");
      return res.status(400).json({
        success: false,
        message: "Token generation failed",
        raw: shiprocketData
      });
    }

    // ✅ Send clean response for frontend
    res.json({
      success: true,
      token: shiprocketData.result.token,
      order_id: shiprocketData.result.data?.order_id
    });

  } catch (err) {
    console.log("❌ FULL ERROR:");
    console.log("Status:", err.response?.status);
    console.log("Data:", err.response?.data);
    console.log("Message:", err.message);

    res.status(500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message || "Token failed"
    });
  }
});

// =======================
// 🛒 SHIPROCKET CATALOG APIs
// =======================

app.get('/api/products', (req, res) => {
  const formatted = products.map((p, index) => ({
    id: 1000 + index, // ✅ numeric product id
    title: p.name,
    body_html: `<p>${p.name}</p>`,
    vendor: "Saapati",
    product_type: "Tea",
    created_at: new Date().toISOString(),
    handle: p.product_id,
    updated_at: new Date().toISOString(),
    tags: "Tea",
    status: "active",
    variants: p.variants.map((v, i) => ({
      id: (1000 + index) * 10 + i, // ✅ numeric variant id
      title: v.size,
      price: v.price.toString(),
      sku: `${p.product_id}_${v.size}`,
      quantity: 100,
      taxable: true,
      grams: v.size === "750g" ? 750 : 250,
      weight: v.size === "750g" ? 0.75 : 0.25,
      weight_unit: "kg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      option_values: {
        Size: v.size
      },
      image: {
        src: p.image
      }
    })),
    image: {
      src: p.image
    },
    options: [
      {
        name: "Size",
        values: p.variants.map(v => v.size)
      }
    ]
  }));

  res.json({
    data: {
      total: formatted.length,
      products: formatted
    }
  });
});

app.get('/api/collections', (req, res) => {
  res.json({
    data: {
      total: 1,
      collections: [
        {
          id: 1,
          title: "Tea",
          handle: "tea",
          body_html: "<p>All tea products</p>",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          image: {
            src: "https://via.placeholder.com/150"
          }
        }
      ]
    }
  });
});

app.get('/api/collections/:id/products', (req, res) => {
  const formatted = products.map((p, index) => ({
    id: 1000 + index, // ✅ numeric product id
    title: p.name,
    body_html: `<p>${p.name}</p>`,
    vendor: "Your Brand",
    product_type: "Tea",
    created_at: new Date().toISOString(),
    handle: p.product_id,
    updated_at: new Date().toISOString(),
    tags: "Tea",
    status: "active",
    variants: p.variants.map((v, i) => ({
      id: (1000 + index) * 10 + i, // ✅ numeric variant id
      title: v.size,
      price: v.price.toString(),
      sku: `${p.product_id}_${v.size}`,
      quantity: 100,
      taxable: true,
      grams: v.size === "750g" ? 750 : 250,
      weight: v.size === "750g" ? 0.75 : 0.25,
      weight_unit: "kg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      option_values: {
        Size: v.size
      },
      image: {
        src: p.image
      }
    })),
    options: [
      {
        name: "Size",
        values: p.variants.map(v => v.size)
      }
    ],
    image: {
      src: p.image
    }
  }));

  res.json({
    data: {
      total: formatted.length,
      products: formatted
    }
  });
});

app.get('/payment-success', (req, res) => {
  console.log("✅ Payment Success Hit:", req.query);

  res.send(`
    <h1>✅ Payment Successful</h1>
    <pre>${JSON.stringify(req.query, null, 2)}</pre>
  `);
});

app.get('/payment-failed', (req, res) => {
  console.log("❌ Payment Failed Hit:", req.query);

  res.send(`
    <h1>❌ Payment Failed</h1>
    <pre>${JSON.stringify(req.query, null, 2)}</pre>
  `);
});

// 🔔 Webhook 
app.post('/shiprocket-webhook', (req, res) => {
  console.log("📦 Order Data:", req.body);
  res.sendStatus(200);
});


// =======================
// 🚀 START SERVER
// =======================
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});