Time: 3:30-5:01 pm

## Agenda

### Email Service Integration
- Review options for sending automated emails (verification codes, password resets).
- Discuss security and ease of use for the backend.

## Notes

### Decided to use Nodemailer
- Group evaluated SendGrid vs. Nodemailer.
- **Nodemailer** was chosen due to its open-source nature and simpler integration with our existing Express backend.
- Plan to implement an `emailServices.js` module in the backend.
- Security: Use environment variables for credentials to avoid committing secrets to version control.
