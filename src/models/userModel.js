import mongoose from 'mongoose';
import { createHmac, randomBytes } from 'crypto';
import { createTokenForUser } from '../services/auth.js';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  salt: { type: String },
  password: { type: String, required: true },
  tutorialCompleted: { type: Boolean, default: false },
  walletAddress: { type: String },
  privateKey: { type: String },
  publicKey: { type: String }
});

userSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) {
    return next(); // Pass control to the next middleware
  }

  const salt = randomBytes(16).toString('hex'); // Use hex encoding
  const hashedPassword = createHmac('sha256', salt)
    .update(user.password)
    .digest('hex');

  user.salt = salt;
  user.password = hashedPassword;

  next();
});

userSchema.statics.matchPasswordAndGenerateToken = async function (username, password) {
  const user = await this.findOne({ username });
  if (!user) throw new Error('User not found');

  const salt = user.salt;
  const hashedPassword = user.password;

  const userProvidedHash = createHmac('sha256', salt)
    .update(password)
    .digest('hex');

  if (hashedPassword !== userProvidedHash) throw new Error('Incorrect password');

  const token = createTokenForUser(user); // Ensure this function returns a token
  return token;
}

const User = mongoose.model('User', userSchema);

export default User;
