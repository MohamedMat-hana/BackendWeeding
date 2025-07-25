const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// --- START DEBUGGING LOGS ---
console.log('Server starting...');
console.log('Allowed Origins:', ['https://wedding-app-xy1y.vercel.app', 'http://localhost:3000', 'http://localhost:5173']);
console.log('Allowed Methods:', ['GET', 'POST', 'OPTIONS', 'DELETE']);
// --- END DEBUGGING LOGS ---

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['https://wedding-app-xy1y.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
  credentials: true,
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Nodemailer setup (rest of your nodemailer setup)
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
  attending: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const RSVP = mongoose.model('RSVP', rsvpSchema);

// Routes

// GET all RSVPs
app.get('/api/rsvps', async (req, res) => {
  console.log('GET /api/rsvps endpoint hit'); // Debugging log
  try {
    const submissions = await RSVP.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

// POST a new RSVP
app.post('/api/rsvp', async (req, res) => {
  console.log('POST /api/rsvp endpoint hit'); // Debugging log
  console.log('Request body:', req.body); // Debugging log
  const { name, attending } = req.body;

  if (!name || !attending) {
    console.log('Validation error: Name or attending missing'); // Debugging log
    return res.status(400).json({ message: 'Name and attendance status are required' });
  }

  try {
    const rsvp = new RSVP({ name, attending });
    await rsvp.save();
    console.log('Submission saved:', { name, attending });

    // Email sending logic (unchanged)
    const emailHtml = `
      <div style="font-family: 'Georgia', serif; line-height: 1.6; color: #4A3C31; max-width: 600px; margin: 0 auto; background-color: #FFF5F5; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #F8B7B7 0%, #FFD1DC 100%); padding: 30px; text-align: center;">
          <h1 style="color: #F8B7B7; margin: 0; font-size: 28px; font-weight: bold;">Mohamed & Rawan's Wedding</h1>
          <p style="color: #F8B7B7; font-size: 16px; margin: 10px 0 0;">A New RSVP Awaits!</p>
        </div>
        <div style="padding: 20px; background-color: #FFFFFF;">
          <p style="font-size: 16px; color: #4A3C31;">Dear Mohamed & Rawan,</p>
          <p style="font-size: 16px; color: #4A3C31;">You've received a new RSVP from your wedding website:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #FFF5F5; border-radius: 8px;">
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #4A3C31; border-bottom: 1px solid #F8B7B7;">Name:</td>
              <td style="padding: 12px; color: #4A3C31;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #4A3C31; border-bottom: 1px solid #F8B7B7;">Attendance:</td>
              <td style="padding: 12px; color: #4A3C31;">${attending}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #4A3C31;">Date & Time:</td>
              <td style="padding: 12px; color: #4A3C31;">${new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' })}</td>
            </tr>
          </table>
          <p style="font-size: 16px; color: #4A3C31; text-align: center;">Thank you for celebrating with us!</p>
        </div>
        <div style="background-color: #F8B7B7; padding: 15px; text-align: center; font-size: 12px; color: #4A3C31;">
          <p style="margin: 0;">© 2025 Mohamed & Rawan Wedding. All rights reserved.</p>
          <p style="margin: 5px 0 0;">Crafted with love for your special day.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Mohamed & Rawan Wedding" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New RSVP from ${name}`,
      html: emailHtml,
    });

    res.json({ message: 'Message submitted successfully!' });
  } catch (error) {
    console.error('Error saving RSVP or sending email:', error);
    res.status(500).json({ message: 'Error submitting RSVP' });
  }
});

// DELETE an RSVP by ID
app.delete('/api/rsvps/:id', async (req, res) => {
  console.log(`DELETE /api/rsvps/${req.params.id} endpoint hit`); // Debugging log
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid ID format:', id);
      return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const deletedRsvp = await RSVP.findByIdAndDelete(id);

    if (!deletedRsvp) {
      console.log('RSVP not found for ID:', id); // Debugging log
      return res.status(404).json({ message: 'RSVP not found' });
    }
    console.log('RSVP deleted successfully for ID:', id); // Debugging log
    res.status(200).json({ message: 'RSVP deleted successfully' });
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    res.status(500).json({ message: 'Error deleting RSVP' });
  }
});

// Add a catch-all route for unhandled requests (important for debugging 404s)
app.use((req, res, next) => {
    console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);
    res.status(404).send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Error</title></head><body><pre>Cannot ${req.method} ${req.originalUrl}</pre></body></html>`);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});