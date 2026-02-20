const express   = require('express');
const crypto    = require('crypto');
const { generateInvoicePDF }      = require('./generateInvoice');
const { uploadPDFToCloudinary }   = require('./uploadToCloudinary');
const { sendInvoiceOnWhatsApp }   = require('./sendWhatsApp');
require('dotenv').config();

const app = express();
app.use(express.json());

// ── Health Check ──────────────────────────────
app.get('/', (req, res) => {
  res.send('✅ Invoice WhatsApp Server is running!');
});

// ── Razorpay Webhook ──────────────────────────
app.post('/razorpay-webhook', async (req, res) => {

  // 1. Verify Razorpay signature
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    console.error('❌ Invalid webhook signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // 2. Only handle payment.captured
  if (req.body.event !== 'payment.captured') {
    return res.status(200).send('Event ignored');
  }

  const payment = req.body.payload.payment.entity;

  // 3. Extract customer details
  const orderData = {
    orderId:      payment.order_id  || payment.id,
    paymentId:    payment.id,
    customerName: payment.notes?.name  || 'Valued Customer',
    phone:        payment.contact.replace('+', ''),  // "919876543210"
    email:        payment.email        || 'N/A',
    amount:       payment.amount,                    // in paise
    description:  payment.description || 'Professional Services'
  };

  console.log(`\n🔔 Payment captured: ${orderData.orderId}`);
  console.log(`👤 Customer: ${orderData.customerName} | ${orderData.phone}`);

  try {
    // Step A: Generate PDF
    console.log('📄 Generating PDF invoice...');
    const pdfPath = await generateInvoicePDF(orderData);
    console.log(`✅ PDF ready: ${pdfPath}`);

    // Step B: Upload to Cloudinary
    console.log('☁️  Uploading to Cloudinary...');
    const pdfUrl = await uploadPDFToCloudinary(pdfPath, orderData.orderId);
    console.log(`✅ Cloudinary URL ready`);

    // Step C: Send on WhatsApp
    console.log('📲 Sending WhatsApp invoice...');
    await sendInvoiceOnWhatsApp(
      orderData.phone,
      pdfUrl,
      orderData.customerName,
      orderData.orderId
    );
    console.log(`✅ Invoice sent to ${orderData.phone} successfully!\n`);

  } catch (err) {
    console.error('❌ Invoice flow failed:', err.message);
  }

  res.status(200).json({ status: 'ok' });
});

// ── Start Server ──────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
