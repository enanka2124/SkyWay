/**
 * Standalone Email Tester for SkyWay
 * Run this to verify your SMTP / Gmail settings in .env
 */
require('dotenv').config();
const { sendRegistrationEmail } = require('./utils/mailer');

async function testMail() {
  console.log('--- SkyWay Email Test Start ---');
  console.log(`Using Email: ${process.env.EMAIL_USER}`);
  
  // Dummy user object for testing
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: process.env.EMAIL_USER, // Sending to yourself for verification
    phone: '1234567890',
    address: { city: 'Test City' }
  };

  try {
    const result = await sendRegistrationEmail(testUser);
    if (result) {
      console.log('✅ Success! Check your inbox (and spam folder).');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ Failed! Check the console logs above for errors.');
    }
  } catch (err) {
    console.error('💥 Error running test:', err);
  }
  
  process.exit();
}

testMail();
