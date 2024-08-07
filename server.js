import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './src/routes/userRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/userModel.js';
import Comment from './src/models/comment.js'; 
import { ethers } from 'ethers';
import cookieParser from 'cookie-parser';
import { validateToken } from './src/services/auth.js';
import jwt from 'jsonwebtoken';
import getUserFromCookie from './src/middlewares/getUserfromCookie.js';
import trackVisits from './src/middlewares/trackermiddlware.js';
import { createTokenForUser } from './src/services/auth.js';
const app = express();
const PORT = 3500;

const mongoUri = "mongodb+srv://opkp:opkp7671090@spark2.c2yr3ct.mongodb.net/?retryWrites=true&w=majority&appName=spark2";

// abhi ke liye importing user model

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
app.use(getUserFromCookie);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use('/users', userRoutes);

app.get('/hash',trackVisits, async (req, res) =>{
    try {
        const comments = await Comment.find({ page: 'hash' }).populate('userId', 'username');
        res.render('hash', {
            user: req.user,
            currentPage: 'hash',
            comments
        });
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.render('hash', {
            currentPage: 'hash',
            user: req.user,
            comments: []
        });
    }
});

app.get('/block', trackVisits, async (req, res) => {
    try {
        const comments = await Comment.find({ page: 'block' }).populate('userId', 'username');
        console.log(comments);
        res.render('block', {
            user: req.user,
            currentPage: 'block',
            comments
        });
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.render('block', {
            user: req.user,
            currentPage: 'block',
            comments: []
        });
    }
});

app.get('/blockchain', trackVisits, async (req, res) => {
    try {
        const comments = await Comment.find({ page: 'blockchain' }).populate('userId', 'username');
        res.render('blockchain', {
            user: req.user,
            currentPage: 'blockchain',
            comments
        });
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.render('blockchain', {
            user: req.user,
            currentPage: 'blockchain',
            comments: []
        });
    }
});

app.get('/', (req, res) => {
    res.render('home',{
        currentPage: 'home',
        user: req.user
    });
});

app.get('/signin', (req, res) => {
    res.render('signin',{
        currentPage: 'signin',
        user: req.user
    });
});

app.get('/login', (req, res) => {
    res.render('login',{
        currentPage: 'login',
        user: req.user
    });
});

app.get('/profile', async (req, res) => {
    try {
        const userId = req.user?._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect("/");
        }
        res.render('profile', { user ,
            currentPage: 'profile',
        });
        
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

        const savedUser = await newUser.save();
        const token = createTokenForUser(savedUser);
        res.cookie("token", token);
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
        res.cookie("token", token);
        return res.redirect('/');
    } catch (err) {
        console.error('Login error:', err.message);
        return res.render("login", { err: "Incorrect username or password" });
    }
});

app.get('/logout', (req, res) => {
    return res.clearCookie("token").redirect('/');
});


app.get('/wallet/generate', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.redirect('/');
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

        res.render('profile', {user:user_,
            currentPage: 'profile'
        }); 

    } catch (err) {
        console.error('Error generating wallet:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

app.get('/comments/:page', async (req, res) => {
    try {
        const comments = await Comment.find({ page: req.params.page }).populate('userId', 'username');
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.post('/comments', async (req, res) => {
    try {
        const { page, content } = req.body;
        const newComment = new Comment({
            userId: req.user._id,
            page,
            content
        });
        await newComment.save();
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/about',(req, res)=>{
    res.render('about',{
        user: req.user,
        currentPage:'about',
    });
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});