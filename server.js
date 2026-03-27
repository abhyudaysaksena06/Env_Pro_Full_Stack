require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

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
        .then(() => console.log('Successfully connected to MongoDB Atlas Cloud Cluster!'))
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

// REST API Bindings

app.get('/api/items', async (req, res) => {
    try {
        const items = await EwasteItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Failed to retrieve active marketplace entities from Atlas.'});
    }
});

app.post('/api/items', upload.single('itemPhoto'), async (req, res) => {
    try {
        const newItem = new EwasteItem({
            serialNumber: req.body.serialNumber,
            itemName: req.body.itemName,
            itemPrice: req.body.itemPrice,
            description: req.body.description,
            listedBy: req.body.listedBy || 'Anonymous Student',
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

// Bind Server Network Protocols
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n=================================');
    console.log('GreenScore Stateless Backend Active!');
    console.log(`Cloud Application successfully listening natively on 0.0.0.0:${PORT}`);
    console.log('=================================\n');
});
