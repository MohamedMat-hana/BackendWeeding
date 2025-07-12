const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());

const submissions = []; // In-memory storage

app.post('/api/rsvp', (req, res) => {
  console.log('Request body:', req.body);
  const { name, email, attending } = req.body;
  if (!name || !email || !attending) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  submissions.push({ name, email, attending });
  console.log('Submission:', { name, email, attending });
  res.json({ message: 'RSVP submitted successfully!' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});