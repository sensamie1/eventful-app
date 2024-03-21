import * as nodemailer from 'nodemailer';

export async function sendReminderEmail(email: string, event_name: string, event_date: Date, location: string): Promise<void> {
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
        <p><strong>Event Reminder.</strong></p>
        <p><b>Reminder:</b> Your event is scheduled as follows:</p><br>
        <p><b>Event:</b> ${event_name}</p>
        <p><b>Date:</b> ${event_date}</p>
        <p><b>Location:</b> ${location}</p><br>
        <p><b>Remember your ticket email as that is your access to the above event.</b></p>
        
      </body>
    </html>
  `
  const mailOptions = {
    from: 'Eventful',
    to: email,
    subject: 'Event Reminder',
    html: htmlContent
  };
  await transporter.sendMail(mailOptions)
}
