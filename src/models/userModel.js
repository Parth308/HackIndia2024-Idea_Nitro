import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true},
  password: { type: String, required: true },
  tutorialCompleted: { type: Boolean, default: false},
  walletAddress: { type: String },
  privateKey: { type: String }
});

const User = mongoose.model('User', userSchema);

export default User;
