import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './src/routes/userRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/userModel.js';
import { ethers } from 'ethers';
import cookieParser from 'cookie-parser';
import { validateToken } from './src/services/auth.js';

const app = express();
const PORT = 3500;

const mongoUri = "mongodb+srv://opkp:opkp7671090@spark2.c2yr3ct.mongodb.net/?retryWrites=true&w=majority&appName=spark2";

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) return next();

        try {
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload;
        } catch (error) {
            console.error('Token validation error:', error);
        }
        return next();
    };
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use('/users', userRoutes);

app.get('/hash', (req, res) =>{
    res.render('hash',{
        user: req.user
    });
})
app.get('/block', (req, res) =>{
    res.render('block',{
        user: req.user
    });
})


app.get('/blockchain', (req, res) =>{
    res.render('blockchain');
})

app.get('/', (req, res) => {
    res.render('home',{
        user: req.user
    });
});

app.get('/signin', (req, res) => {
    res.render('signin',{
        user: req.user
    });
});

app.get('/login', (req, res) => {
    res.render('login',{
        user: req.user
    });
});

app.get('/profile', async (req, res) => {
    try {
        const userId = req.query.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect("/");
        }
        res.render('profile', { user });
        
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.redirect('/');
    }
});

app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
            username,
            password, // Hash password before saving
        });

        await newUser.save();
        res.status(201).redirect('/');
    } catch (err) {
        console.error('Error signing up:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const token = await User.matchPasswordAndGenerateToken(username, password);
        return res.cookie("token", token).redirect('/',{user: req.user});
    } catch (err) {
        console.error('Login error:', err.message);
        return res.render("login", { err: "Incorrect username or password" });
    }
});

app.get('/logout', (req, res) => {
    return res.clearCookie("token").redirect('/');
});

app.get('/wallet', async (req, res) => {
    const { userId } = req.query;

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
        console.error('Error fetching wallet:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

app.get('/wallet/generate', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.redirect('/wallet');
    }

    try {
        const user_ = await User.findById(userId);
        if (!user_) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user_.tutorialCompleted) {
            return res.status(403).json({ message: 'Complete the tutorial first' });
        }
        if (user_.walletAddress) {
            return res.status(400).json({ message: 'Wallet already generated' });
        }

        const wallet = ethers.Wallet.createRandom();

        user_.walletAddress = wallet.address;
        user_.privateKey = wallet.privateKey;
        user_.publicKey= wallet.publicKey;
        await user_.save();

        res.render('home', {user:user_}); 

    } catch (err) {
        console.error('Error generating wallet:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});