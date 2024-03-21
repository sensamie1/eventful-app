import * as nodemailer from 'nodemailer';

export async function sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    },
  });

  const htmlContent = `
    <html>
      <head>
        <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
          text-align: center;
        }
  
        .logo-image {
          display: block;
          width: 200px;
          height: auto;
          border-radius: 5px;
          margin-top: 20px;
        }
  
        button {
          background-color: #3f0e38;
          color: #fff;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
  
        button:hover {
          background-color: #6a4565;
        }
  
        p {
          margin-top: 20px;
          font-size: 18px;
        }
  
        a {
          color: #fff;
          text-decoration: none;
        }
        </style>
      </head>
      <body>
        <img src="https://res.cloudinary.com/ddi6arl8i/image/upload/v1709984366/eventful-logo_mczyov.png" alt="Eventful Logo" class="logo-image">
        <p><strong>Welcome to Evetful App.</strong></p>
        <p>Your signup was successful.</p>
        <p>Click on this link to verify your email:</p>
        <button><a href="${verificationLink}" style="color: #fff;">Verify</a></button>
      </body>
    </html>
  `
  const mailOptions = {
    from: 'Eventful',
    to: email,
    subject: 'Email Verification',
    html: htmlContent
  };
  await transporter.sendMail(mailOptions)
}


export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    },
  });

  const htmlContent = `
    <html>
      <head>
        <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
          text-align: center;
        }
  
        .logo-image {
          display: block;
          width: 200px;
          height: auto;
          border-radius: 5px;
          margin-top: 20px;
        }
  
        button {
          background-color: #3f0e38;
          color: #fff;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
  
        button:hover {
          background-color: #6a4565;
        }
  
        p {
          margin-top: 20px;
          font-size: 18px;
        }
  
        a {
          color: #fff;
          text-decoration: none;
        }
        </style>
      </head>
      <body>
        <img src="https://res.cloudinary.com/ddi6arl8i/image/upload/v1709984366/eventful-logo_mczyov.png" alt="Eventful Logo" class="logo-image">
        <p><strong>Password Reset.</strong></p>
        <p>You requested for password reset.</p>
        <p>Click on this link to change your password:</p>
        <button><a href="${resetLink}" style="color: #fff;">Reset</a></button>
        <p>If you did not request a password change, ignore this message. Password reset link expires in 5min.</p>
      </body>
    </html>
  `
  const mailOptions = {
    from: 'Eventful',
    to: email,
    subject: 'Password Reset',
    html: htmlContent
  };
  await transporter.sendMail(mailOptions)
}