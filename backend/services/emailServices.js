/**
 * Send an email using the Resend API (HTTP Port 443)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} - API response
 */
exports.sendEmail = async ({ to, subject, text, html }) => {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: 'CRAM <noreply@cram-app.online>',
            to: [to],
            subject: subject,
            text: text,
            html: html,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to send email via Resend');
    }

    return data;
};

/**
 * Verify that the email service is ready (by checking if the API Key is present)
 * @returns {Promise<boolean>}
 */
exports.verifyConnection = async () => {
    if (!process.env.RESEND_API_KEY) {
        console.error('Email service error: RESEND_API_KEY is missing');
        return false;
    }
    console.log('Email service (Resend) is ready');
    return true;
};
