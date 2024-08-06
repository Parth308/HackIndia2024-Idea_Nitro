import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './src/routes/userRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/userModel.js';
import { ethers } from "ethers";
import CryptoJS from 'crypto-js';

const app = express();
const PORT = 3500;

const mongoUri = "mongodb+srv://opkp:opkp7671090@spark2.c2yr3ct.mongodb.net/?retryWrites=true&w=majority&appName=spark2";

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use('/users', userRoutes);

app.get('/hash', (req, res) =>{
    res.render('hash');
})
app.get('/block', (req, res) =>{
    res.render('block');
})

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/signin', (req, res) => {
    res.render('signin');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
            username,
            password,
        });

        await newUser.save();
        console.log(newUser);

        res.status(201).redirect('/');
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        res.redirect('/');
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


app.get('/wallet', async (req, res) => {
    const { userId } = req.query;

    console.log('User ID:', userId);

    if (!userId) {
        return res.redirect('/');
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found');
            return res.status(404).render("/");
        }
        res.render('wallet', { user });
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

app.get('/wallet/generate', async (req, res) => {
    const { userId } = req.query;
    console.log(userId);

    if (!userId) {
        return res.redirect('/wallet');
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.tutorialCompleted) {
            return res.status(403).json({ message: 'Complete the tutorial first' });
        }
        if (user.walletAddress) {
            return res.status(400).json({ message: 'Wallet already generated' });
        }

        // Generate wallet
        const wallet = ethers.Wallet.createRandom();
        console.log(wallet);
        const key=2443;
        const encryptedPrivateKey =  CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(key), 'phrase');

        // Update user with wallet info
        user.walletAddress = wallet.address;
        user.privateKey = encryptedPrivateKey;
        await user.save();

        res.redirect(`/wallet?userId=${user._id}`);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});