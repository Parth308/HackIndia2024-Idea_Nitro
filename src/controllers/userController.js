import { ethers } from 'ethers';
import User from '../models/userModel.js'; 
import { encryptPrivateKey } from '../utils/walletUtils.js';

export async function completeTutorial(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.tutorialCompleted = true;

  if (!user.walletAddress) {
    const wallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);
    user.walletAddress = wallet.address;
    user.privateKey = encryptedPrivateKey;
  }

  await user.save();

  console.log('Tutorial completed! Wallet address:', user.walletAddress);

  return user;
}
