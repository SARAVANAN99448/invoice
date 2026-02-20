const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateInvoicePDF(orderData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice_${orderData.orderId}.pdf`;
    const outputPath = path.join('/tmp', filename);
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // ── HEADER ──────────────────────────────────
    doc.fontSize(22)
       .font('Helvetica-Bold')
       .text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(2).stroke();
    doc.moveDown();

    // ── FIRM DETAILS ─────────────────────────────
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .text('Your CA Firm Name');
    doc.font('Helvetica')
       .fontSize(11)
       .text('GSTIN: 33AAAAA0000A1Z5')
       .text('123, Anna Salai, Chennai - 600002')
       .text('Phone: +91 98765 43210')
       .text('Email: firm@example.com');
    doc.moveDown();

    // ── INVOICE META ──────────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.font('Helvetica-Bold').text('Invoice No:  ', { continued: true });
    doc.font('Helvetica').text(`INV-${orderData.orderId}`);
    doc.font('Helvetica-Bold').text('Payment ID:  ', { continued: true });
    doc.font('Helvetica').text(`${orderData.paymentId}`);
    doc.font('Helvetica-Bold').text('Date:        ', { continued: true });
    doc.font('Helvetica').text(new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    }));
    doc.moveDown();

    // ── CUSTOMER DETAILS ──────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Billed To:');
    doc.font('Helvetica')
       .text(orderData.customerName)
       .text(`Phone: +${orderData.phone}`)
       .text(`Email: ${orderData.email}`);
    doc.moveDown();

    // ── LINE ITEMS TABLE ──────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).stroke();
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Description',   50,  doc.y, { width: 320 });
    doc.text('Amount (₹)',   420,  doc.y - doc.currentLineHeight(), { width: 130, align: 'right' });
    doc.moveDown(0.4);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).stroke();
    doc.moveDown(0.4);

    // Line item
    const baseAmount = orderData.amount / 100;
    doc.font('Helvetica').fontSize(11);
    doc.text(orderData.description,  50,  doc.y, { width: 320 });
    doc.text(`${baseAmount.toFixed(2)}`, 420, doc.y - doc.currentLineHeight(), { width: 130, align: 'right' });
    doc.moveDown(0.8);

    // ── GST BREAKUP ───────────────────────────────
    const cgst  = (baseAmount * 0.09).toFixed(2);
    const sgst  = (baseAmount * 0.09).toFixed(2);
    const total = (baseAmount + parseFloat(cgst) + parseFloat(sgst)).toFixed(2);

    doc.moveTo(300, doc.y).lineTo(550, doc.y).lineWidth(1).stroke();
    doc.moveDown(0.4);

    doc.font('Helvetica').text('Subtotal:',        300, doc.y, { width: 120 });
    doc.text(`${baseAmount.toFixed(2)}`,          420, doc.y - doc.currentLineHeight(), { width: 130, align: 'right' });
    doc.moveDown(0.3);

    doc.text('CGST @ 9%:',                        300, doc.y, { width: 120 });
    doc.text(`${cgst}`,                           420, doc.y - doc.currentLineHeight(), { width: 130, align: 'right' });
    doc.moveDown(0.3);

    doc.text('SGST @ 9%:',                        300, doc.y, { width: 120 });
    doc.text(`${sgst}`,                           420, doc.y - doc.currentLineHeight(), { width: 130, align: 'right' });
    doc.moveDown(0.3);

    doc.moveTo(300, doc.y).lineTo(550, doc.y).lineWidth(1).stroke();
    doc.moveDown(0.4);

    doc.font('Helvetica-Bold').text('Total Amount:', 300, doc.y, { width: 120 });
    doc.text(`Rs. ${total}`,                      420, doc.y - doc.currentLineHeight(), { width: 130, align: 'right' });
    doc.moveDown(2);

    // ── FOOTER ────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(9)
       .text('This is a computer-generated invoice and does not require a physical signature.', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

module.exports = { generateInvoicePDF };
