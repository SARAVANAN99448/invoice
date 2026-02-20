const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase once
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_BUCKET
  });
}

async function uploadPDFToFirebase(filePath, orderId) {
  const bucket = admin.storage().bucket();
  const destination = `invoices/INV-${orderId}.pdf`;

  await bucket.upload(filePath, {
    destination,
    metadata: { contentType: 'application/pdf' }
  });

  // Generate signed URL valid for 7 days
  const file = bucket.file(destination);
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  console.log(`📁 PDF uploaded: ${destination}`);
  return signedUrl;
}

module.exports = { uploadPDFToFirebase };
