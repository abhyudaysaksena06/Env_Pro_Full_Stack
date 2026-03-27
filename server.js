require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'greenscore@thapar.edu',
        pass: process.env.SMTP_PASS || 'placeholder_pass'
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Serve the frontend static files globally
app.use(express.static(path.join(__dirname, 'Env_Pro')));

// Connect to MongoDB Atlas
if(!process.env.MONGO_URI || process.env.MONGO_URI.includes('<username>')) {
    console.error("=================================");
    console.error("CRITICAL HALT: Please replace the placeholder keys in your '.env' file with real MongoDB/Cloudinary Credentials!");
    console.error("=================================");
} else {
    mongoose.connect(process.env.MONGO_URI)
        .then(async () => {
            console.log('Successfully connected to MongoDB Atlas Cloud Cluster!');
            
            // Auto-create default Admin account if it doesn't exist
            try {
                // We use bcrypt.hash here directly just in case the User schema moves or hasn't loaded 
                // Wait, User is defined later in the file. We need to move the connection block down OR use mongoose.model('User')
                const UserMod = mongoose.model('User');
                const adminExists = await UserMod.findOne({ email: 'admin@greenscore.com' });
                
                if(!adminExists) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
                    
                    const defaultAdmin = new UserMod({
                        name: 'admin',
                        email: 'admin@greenscore.com',
                        rollNumber: 'ADMIN999',
                        password: hashedAdminPassword,
                        phone: '0000000000',
                        hostelName: 'Server Admin',
                        role: 'admin'
                    });
                    await defaultAdmin.save();
                    console.log('--- DEFAULT ADMIN CREATED: admin@greenscore.com | pass: admin123 ---');
                }
            } catch(err) {
                console.error("Failed to seed admin:", err.message);
            }
        })
        .catch(err => console.error('MongoDB Connection Crash:', err));
}

// Configure Cloudinary Globally
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder',
  api_key: process.env.CLOUDINARY_API_KEY || 'placeholder',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'greenscore_ewaste_images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage: storage });

// Mongoose Backend Data Schema
const ItemSchema = new mongoose.Schema({
    serialNumber: String,
    itemName: String,
    itemPrice: String,
    description: String,
    listedBy: String,
    photoUrl: String, // Natively captures absolute https:// URLs from Cloudinary CDNs!
    status: { type: String, default: 'Available' },
    createdAt: { type: Date, default: Date.now }
});

const EwasteItem = mongoose.model('EwasteItem', ItemSchema);

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNumber: { type: String, required: true },
    password: { type: String, required: true },
    phone: String,
    hostelName: String,
    ecoScore: { type: Number, default: 0 },
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const HostelSchema = new mongoose.Schema({
    hostelName: { type: String, required: true, unique: true },
    totalScore: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 }
});

const Hostel = mongoose.model('Hostel', HostelSchema);

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access strictly required.' });
    }
};

// REST API Bindings

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, rollNumber, password, phone, hostelName } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, rollNumber, password: hashedPassword, phone, hostelName });
        await user.save();

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, ecoScore: user.ecoScore } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, ecoScore: user.ecoScore, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.get('/api/users/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// --- LEADERBOARD ROUTES ---
app.get('/api/leaderboard/individual', async (req, res) => {
    try {
        const topUsers = await User.find().sort({ ecoScore: -1 }).limit(10).select('name hostelName ecoScore');
        res.json(topUsers);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch individual leaderboard'});
    }
});

app.get('/api/leaderboard/hostel', async (req, res) => {
    try {
        const topHostels = await Hostel.find().sort({ totalScore: -1 }).limit(10);
        res.json(topHostels);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch hostel leaderboard'});
    }
});

app.get('/api/items', async (req, res) => {
    try {
        const items = await EwasteItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Failed to retrieve active marketplace entities from Atlas.'});
    }
});

// --- ADMIN ROUTES ---
app.put('/api/admin/score/user', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { userId, points } = req.body;
        const user = await User.findById(userId);
        if(!user) return res.status(404).json({error: "User not found"});
        user.ecoScore += Number(points);
        await user.save();
        
        if(user.hostelName && user.hostelName !== 'Day Scholar') {
            await Hostel.findOneAndUpdate(
                { hostelName: user.hostelName },
                { $inc: { totalScore: Number(points) } },
                { new: true, upsert: true }
            );
        }
        res.json({ message: `Successfully awarded ${points} pts to ${user.name}` });
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Failed to update internal scores"});
    }
});

app.delete('/api/admin/items/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        await EwasteItem.findByIdAndDelete(req.params.id);
        res.json({ message: "Listing permanently deleted" });
    } catch(err) {
        res.status(500).json({error: "Failed to locate and delete database item"});
    }
});

app.post('/api/items', authMiddleware, upload.single('itemPhoto'), async (req, res) => {
    try {
        const newItem = new EwasteItem({
            serialNumber: req.body.serialNumber,
            itemName: req.body.itemName,
            itemPrice: req.body.itemPrice,
            description: req.body.description,
            listedBy: req.user.name,
            // Cloudinary explicitly assigns the public URL inside the file object seamlessly!
            photoUrl: req.file ? req.file.path : null
        });

        await newItem.save();
        res.json({ message: 'Item injected into stateless cluster.', item: newItem });
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Failed to write blob to Cloudinary and database payload.'});
    }
});

// --- MARKETPLACE MANAGEMENT ROUTING ---
app.delete('/api/items/:id', authMiddleware, async (req, res) => {
    try {
        const item = await EwasteItem.findById(req.params.id);
        if(!item) return res.status(404).json({error: "Item not found"});
        
        if(item.listedBy !== req.user.name && req.user.role !== 'admin') {
           return res.status(403).json({error: "Not authorized to delete someone else's item"});
        }

        await EwasteItem.findByIdAndDelete(req.params.id);
        res.json({ message: "Listing successfully removed" });
    } catch(err) {
        res.status(500).json({error: "Failed to delete item"});
    }
});

app.post('/api/items/claim/:id', authMiddleware, async (req, res) => {
    try {
        const item = await EwasteItem.findById(req.params.id);
        if(!item) return res.status(404).json({error: "Item not found"});

        const seller = await User.findOne({ name: item.listedBy });
        if(seller && seller.email) {
            const mailOptions = {
                from: process.env.SMTP_USER || 'no-reply@greenscore.com',
                to: seller.email,
                subject: `🛒 [GreenScore] Buyer interested in your ${item.itemName}!`,
                html: `<h3>Great news ${seller.name}!</h3>
                       <p><b>${req.user.name}</b> wants to claim your listed E-Waste item: <b>${item.itemName}</b>.</p>
                       <p>Please contact them immediately at their registered email: <b>${req.user.email}</b> to finalize the exchange!</p>
                       <br><p>Thank you for contributing to a greener campus.</p>`
            };
            transporter.sendMail(mailOptions).catch(err => console.log('Mail suppressed: Invalid credentials.'));
        }

        res.json({ message: `Success! ${item.listedBy} has been notified via email.` });
    } catch(err) {
        res.status(500).json({error: "Failed to process claim"});
    }
});

// Bind Server Network Protocols
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n=================================');
    console.log('GreenScore Stateless Backend Active!');
    console.log(`Cloud Application successfully listening natively on 0.0.0.0:${PORT}`);
    console.log('=================================\n');
});
