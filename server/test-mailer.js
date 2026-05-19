const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sendRegistrationEmail } = require('./utils/mailer');

async function testMail() {
  console.log("Testing mailer with:");
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS is set:", !!process.env.EMAIL_PASS);
  
  const mockUser = {
    firstName: 'Test',
    lastName: 'User',
    email: process.env.EMAIL_USER, // send to themselves to test
    phone: '1234567890',
    address: { city: 'Test City' }
  };

  try {
    const info = await sendRegistrationEmail(mockUser);
    if (info) {
      console.log("SUCCESS: Email sent! Message ID:", info.messageId);
    } else {
      console.log("FAILED: sendRegistrationEmail returned null.");
    }
  } catch (err) {
    console.error("ERROR during sending:", err);
  }
}

testMail();
