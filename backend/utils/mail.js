const nodemailer = require('nodemailer');

let transporterInstance = null;

async function getTransporter() {
  if (transporterInstance) return transporterInstance;

  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[Ethereal Mail] Created Ethereal account: ${testAccount.user}`);
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    console.warn('[Ethereal Mail] Dynamic account creation failed, using static credentials.');
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'fohfkppxnfnz3b2q@ethereal.email',
        pass: 'MAXX8mbtTc1R5wfpwQ'
      }
    });
  }

  return transporterInstance;
}

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"Smart Health Predictor" <noreply@smarthealth.com>',
      to,
      subject,
      text,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Ethereal Mail] Email dispatched successfully: ${info.messageId}`);
    console.log(`[Ethereal Mail] Preview URL: ${previewUrl}`);

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.warn(`[Ethereal Mail] Dispatch error: ${err.message}`);
    return { success: false, error: err.message, previewUrl: null };
  }
};

module.exports = { sendMail };
