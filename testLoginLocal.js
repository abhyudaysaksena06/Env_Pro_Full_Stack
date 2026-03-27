require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
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

        const email = 'admin@greenscore.com';
        const password = 'admin123';

        const user = await User.findOne({ email });
        console.log("User found in DB:", !!user);
        
        if (!user) {
            console.log("USER NOT FOUND"); return process.exit(1);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password matching result:", isMatch);

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
        console.log("JWT Payload Generated Successfully!");
        process.exit(0);
    } catch(err) {
        console.error("FATAL ERROR TRACE:", err);
        process.exit(1);
    }
}
test();
