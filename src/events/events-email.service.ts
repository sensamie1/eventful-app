import * as nodemailer from 'nodemailer';

export async function sendTicketEmail(email: string, qrcodeLink: string, event_name: string, event_date: Date, location: string): Promise<void> {
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
        .qrcode-image {
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
        <p><strong>Ticket Booked Successfully.</strong></p>
        <p>You have succefully booked a ticket for the following event:</p>
        <p><b>Event:</b> ${event_name}</p>
        <p><b>Date:</b> ${event_date}</p>
        <p><b>Location:</b> ${location}</p>

        <p><b>The QR Code below is your access to the event.</b></p>
        <p><b>Keep this safe.</b></p>
        <img src="${qrcodeLink}" alt="QR Code" class="qrcode-image">
      </body>
    </html>
  `
  const mailOptions = {
    from: 'Eventful',
    to: email,
    subject: 'Event Ticket',
    html: htmlContent
  };
  await transporter.sendMail(mailOptions)
}
