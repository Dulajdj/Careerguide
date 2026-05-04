const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedRecipients = [
  'nuradhadakshina1234@gmail.com',
  'dulajdjhansa@gmail.com'
];

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: Number(process.env.EMAIL_PORT) === 587 ? false : true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false   // ← fixes "self-signed certificate" error
  }
});

transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  Email transport not ready:', error.message);
    console.warn('   Check EMAIL_USER and EMAIL_PASS in your .env file.');
  } else {
    console.log('✅ Email transport is ready.');
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?\d[\d\s\-().]{7,}$/.test(v);
const escapeHtml   = (s) =>
  String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

app.post('/api/contact', async (req, res) => {
  const { name, phone, email, recipientEmail, message } = req.body ?? {};

  const nameTrim    = typeof name    === 'string' ? name.trim()    : '';
  const phoneTrim   = typeof phone   === 'string' ? phone.trim()   : '';
  const emailTrim   = typeof email   === 'string' ? email.trim()   : '';
  const messageTrim = typeof message === 'string' ? message.trim() : '';

  if (!nameTrim || nameTrim.length < 2)
    return res.status(400).json({ error: 'Please provide a valid name (at least 2 characters).' });
  if (!isValidPhone(phoneTrim))
    return res.status(400).json({ error: 'Please provide a valid phone number.' });
  if (!isValidEmail(emailTrim))
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  if (!allowedRecipients.includes(recipientEmail))
    return res.status(400).json({ error: 'Selected recipient is not valid.' });
  if (!messageTrim || messageTrim.length < 10)
    return res.status(400).json({ error: 'Message must be at least 10 characters.' });

  const mailOptions = {
    from: `"AI Career Guide" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    replyTo: emailTrim,
    subject: `New message from ${escapeHtml(nameTrim)} – AI Career Guide`,
    text: [
      `Name:    ${nameTrim}`,
      `Phone:   ${phoneTrim}`,
      `Email:   ${emailTrim}`,
      ``,
      `Message:`,
      messageTrim
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:24px;color:#fff;">
          <h2 style="margin:0;font-size:20px;">New Contact Request</h2>
          <p style="margin:4px 0 0;opacity:.8;font-size:13px;">AI Career Guide</p>
        </div>
        <div style="padding:24px;background:#fff;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:90px;">Name</td>
                <td style="padding:8px 0;font-weight:600;">${escapeHtml(nameTrim)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Phone</td>
                <td style="padding:8px 0;">${escapeHtml(phoneTrim)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Email</td>
                <td style="padding:8px 0;"><a href="mailto:${escapeHtml(emailTrim)}">${escapeHtml(emailTrim)}</a></td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
          <p style="color:#64748b;font-size:13px;margin:0 0 8px;">Message</p>
          <p style="margin:0;line-height:1.7;">${escapeHtml(messageTrim).replace(/\n/g,'<br>')}</p>
        </div>
        <div style="padding:12px 24px;background:#f8fafc;font-size:12px;color:#94a3b8;">
          Sent via AI Career Guide contact form
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ message: "Your message was sent successfully! We'll get back to you soon." });
  } catch (err) {
    console.error('Mail send error:', err.message);
    return res.status(500).json({ error: 'Unable to send your message right now. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
