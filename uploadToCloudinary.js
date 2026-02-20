const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadPDFToCloudinary(filePath, orderId) {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'raw',            // required for PDF/non-image files
    folder: 'invoices',
    public_id: `INV-${orderId}`,
    format: 'pdf'
  });

  console.log(`📁 PDF uploaded to Cloudinary: ${result.secure_url}`);
  return result.secure_url;          // permanent public HTTPS URL ✅
}

module.exports = { uploadPDFToCloudinary };
