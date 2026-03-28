const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

/**
 * Send an email using the configured Gmail transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} - Nodemailer send result
 */
exports.sendEmail = async ({ to, subject, text, html }) => {
    const mailOptions = {
        from: `"CRAM" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
};

/**
 * Verify that the email transporter connection is working
 * @returns {Promise<boolean>}
 */
exports.verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('Email service is ready');
        return true;
    } catch (error) {
        console.error('Email service error:', error.message);
        return false;
    }
};
