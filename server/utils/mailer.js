const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (transporter) {
    try {
      await transporter.verify();
      return transporter;
    } catch (err) {
      transporter = null;
    }
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-app-password') {
    console.error('Missing or invalid EMAIL_USER / EMAIL_PASS in .env — emails will not be sent.');
    return null;
  }

  const pass = process.env.EMAIL_PASS.replace(/\s+/g, '');

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: pass,
    },
  });

  try {
    await transporter.verify();
    console.log('Mailer ready:', process.env.EMAIL_USER);
  } catch (error) {
    console.error('SMTP connection failed:', error.message);
    transporter = null;
  }

  return transporter;
};

const sendEmail = async (options) => {
  const mailer = await getTransporter();
  if (!mailer) return null;

  const mailOptions = {
    from: `"SkyWay Support" <${process.env.EMAIL_USER || 'no-reply@skyway.com'}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Preview email: ${previewUrl}`);
    }

    return info;
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    return null;
  }
};

const sendRegistrationEmail = async (user) => {
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SkyWay Registration</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .main-table { width: 100% !important; }
      .padding-mobile { padding: 20px !important; }
      .card-table { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f4f4f4">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="600"><tr><td><![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="main-table" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#1a1a1a" style="padding: 30px 20px;">
              <h1 style="color: #ffcc00; margin: 0; letter-spacing: 4px; font-size: 28px;">SKYWAY</h1>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td class="padding-mobile" style="padding: 40px;">
              <h2 style="color: #333; margin-bottom: 20px;">Welcome to the family, ${user.firstName}!</h2>
              <p style="color: #555; line-height: 1.6; font-size: 16px;">Your registration was successful. We are thrilled to have you on board. SkyWay is your premium gateway to hassle-free travel booking.</p>

              <!-- Account Details -->
              <table border="0" cellpadding="20" cellspacing="0" width="100%" bgcolor="#f9f9f9" style="border-radius: 8px; margin-top: 30px;">
                <tr>
                  <td>
                    <h3 style="margin-top: 0; color: #1a1a1a; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Account Summary</h3>
                    <p style="margin: 10px 0; color: #666; font-size: 14px;"><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                    <p style="margin: 10px 0; color: #666; font-size: 14px;"><strong>Email:</strong> ${user.email}</p>
                    <p style="margin: 10px 0; color: #666; font-size: 14px;"><strong>Phone:</strong> ${user.phone}</p>
                    <p style="margin: 10px 0; color: #666; font-size: 14px;"><strong>City:</strong> ${user.address?.city || 'Not set'}</p>
                  </td>
                </tr>
              </table>

              <p style="color: #888; font-size: 13px; margin-top: 20px;">Please keep these details secure. You can use your email and password to log in anytime.</p>

              <!-- Promo Section -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px; border-top: 1px dashed #ddd; padding-top: 30px;">
                <tr>
                  <td align="center">
                    <h3 style="color: #1a1a1a; font-size: 20px; margin-bottom: 25px;">Ready for your next adventure?</h3>

                    <div style="text-align: center;">
                      <!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="560"><tr><td width="280" valign="top"><![endif]-->

                      <!-- Card 1 (Flight) -->
                      <table border="0" cellpadding="0" cellspacing="0" width="270" class="card-table" style="display: inline-block; margin: 10px; border-collapse: separate; vertical-align: top;">
                        <tr>
                          <td align="center" bgcolor="#0b1d3a" style="padding: 30px 20px; border-radius: 15px; color: #ffffff;">
                            <div style="font-size: 40px; margin-bottom: 15px;">✈️</div>
                            <h4 style="margin: 0 0 10px; color: #ffcc00; font-size: 18px; font-family: sans-serif;">Global Flights</h4>
                            <p style="font-size: 13px; margin-bottom: 20px; line-height: 1.4; opacity: 0.9; font-family: sans-serif;">Book international flights with up to 20% off on your first trip!</p>
                            <a href="${process.env.CLIENT_URL}" style="background-color: #ffcc00; color: #0b1d3a; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 13px; display: inline-block; font-family: sans-serif;">Explore Flights</a>
                          </td>
                        </tr>
                      </table>

                      <!--[if (gte mso 9)|(IE)]></td><td width="280" valign="top"><![endif]-->

                      <!-- Card 2 (Hotel) -->
                      <table border="0" cellpadding="0" cellspacing="0" width="270" class="card-table" style="display: inline-block; margin: 10px; border-collapse: separate; vertical-align: top;">
                        <tr>
                          <td align="center" bgcolor="#ffcc00" style="padding: 30px 20px; border-radius: 15px; color: #0b1d3a;">
                            <div style="font-size: 40px; margin-bottom: 15px;">🏨</div>
                            <h4 style="margin: 0 0 10px; font-size: 18px; font-family: sans-serif;">Premium Hotels</h4>
                            <p style="font-size: 13px; margin-bottom: 20px; line-height: 1.4; opacity: 0.9; font-family: sans-serif;">Stay at the finest hotels worldwide with SkyWay exclusive rates.</p>
                            <a href="${process.env.CLIENT_URL}/hotels" style="background-color: #0b1d3a; color: #ffcc00; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 13px; display: inline-block; font-family: sans-serif;">Browse Hotels</a>
                          </td>
                        </tr>
                      </table>

                      <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Main Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.CLIENT_URL}" style="background-color: #1a1a1a; color: #ffcc00; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">Launch Platform</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="#f4f4f4" style="padding: 30px; color: #888; font-size: 12px;">
              <p style="margin: 0 0 10px;">&copy; 2026 SkyWay Airlines. All rights reserved.</p>
              <p style="margin: 0;">You received this email because you registered on SkyWay.</p>
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return await sendEmail({
    to: user.email,
    subject: `Congratulations ${user.firstName}! Your SkyWay Account is Ready ✈️`,
    html,
  });
};

const sendResetPasswordEmail = async (user, resetUrl) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <h1 style="color: #ffcc00; margin: 0;">SKYWAY</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p style="color: #555; line-height: 1.6;">We received a request to reset your SkyWay account password. Click the button below to proceed. If you didn't request this, you can safely ignore this email.</p>
        <p style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" style="background: #ffcc00; color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Set New Password</a>
        </p>
        <p style="color: #888; font-size: 13px; text-align: center;">This link will expire in 10 minutes.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'SkyWay - Password Reset Request',
    html,
  });
};

const sendRecoveryEmail = async (user) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <h1 style="color: #ffcc00; margin: 0;">SKYWAY</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <h2 style="color: #333;">Account Recovery Information</h2>
        <p style="color: #555; line-height: 1.6;">Someone requested account details for the phone number associated with this email address.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin-top: 0; color: #1a1a1a; font-size: 16px;">Registered Account Details:</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Full Name:</strong> ${user.firstName} ${user.lastName}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Registered Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Phone Number:</strong> ${user.phone}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Address:</strong> ${user.address?.address}, ${user.address?.city}</p>
        </div>
        <p style="color: #555; margin-top: 20px;">We have also sent a notification to your registered phone number ${user.phone}. If this wasn't you, please secure your account immediately.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'SkyWay - Account Recovery Info',
    html,
  });
};

module.exports = {
  sendRegistrationEmail,
  sendResetPasswordEmail,
  sendRecoveryEmail,
};
