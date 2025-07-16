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

// RSVP Schema - Email field removed
const rsvpSchema = new mongoose.Schema({
  name: { type: String, required: true },
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
  // Destructure name and attending only, email is no longer expected
  const { name, attending } = req.body; 
  
  // Validate only name and attending
  if (!name || !attending) {
    return res.status(400).json({ message: 'Name and attendance status are required' });
  }

   try {
    // Create new RSVP with attending
    const rsvp = new RSVP({ name, attending }); 
    await rsvp.save();
    console.log('Submission saved:', { name, attending });

    // HTML content for the email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
          <h2 style="color: #9b2c2c; margin: 0;">New Message for Mohamed & Rawan!</h2>
        </div>
        <div style="padding: 20px;">
          <p>You've received a new message from your wedding website:</p>
          <p style="background-color: #f0f0f0; padding: 15px; border-left: 5px solid #9b2c2c; margin-bottom: 20px;">
            <strong>Name:</strong> ${name}<br>
            <strong>Message:</strong> ${attending}
          </p>
          <p>This message was sent on ${new Date().toLocaleString()}.</p>
        </div>
        <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 0.8em; color: #777; border-top: 1px solid #ddd;">
          <p>&copy; Mohamed & Rawan Wedding. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send email with HTML content
    await transporter.sendMail({
      from: `"Mohamed & Rawan Wedding" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Message from ${name}`, // Subject remains the same
      html: emailHtml, // Use 'html' instead of 'text'
    });

    res.json({ message: 'Message submitted successfully!' });
  } catch (error) {
    console.error('Error saving RSVP or sending email:', error);
    res.status(500).json({ message: 'Error submitting RSVP' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
