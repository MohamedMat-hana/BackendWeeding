const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON bodies (fixes req.body error)
app.use(cors({
  origin: 'https://wedding-invitation-server-bmfg.onrender.com'
}));
const submissions = []; // In-memory storage (use database for production)

app.post('/api/rsvp', (req, res) => {
  console.log('Request body:', req.body);
  const { name, email, attending } = req.body;
  if (!name || !email || !attending) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  submissions.push({ name, email, attending });
  console.log('Submission:', { name, email, attending });
  res.json({ message: 'RSVP submitted successfully!' });

  // Optional: Email notification
  /*
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'wedding-email@example.com',
    subject: 'New RSVP Submission',
    text: `Name: ${name}\nEmail: ${email}\nAttending: ${attending}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Email error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
  */
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});