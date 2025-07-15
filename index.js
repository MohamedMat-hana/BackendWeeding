const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['https://wedding-app-xy1y.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// RSVP Schema
const rsvpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  attending: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const RSVP = mongoose.model('RSVP', rsvpSchema);

// Routes
app.get('/api/rsvps', async (req, res) => {
  try {
    const submissions = await RSVP.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

app.post('/api/rsvp', async (req, res) => {
  console.log('Request body:', req.body);
  const { name, email, attending } = req.body;
  if (!name || !email || !attending) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const rsvp = new RSVP({ name, email, attending });
    await rsvp.save();
    console.log('Submission saved:', { name, email, attending });

    await transporter.sendMail({
      from: `"Mohamed & Rawan Wedding" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New RSVP from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nAttending: ${attending}`,
    });

    res.json({ message: 'RSVP submitted successfully!' });
  } catch (error) {
    console.error('Error saving RSVP or sending email:', error);
    res.status(500).json({ message: 'Error submitting RSVP' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});