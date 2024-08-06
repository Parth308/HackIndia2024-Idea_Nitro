import express from 'express';
import { completeTutorial } from '../controllers/userController.js'; 

const router = express.Router();

router.post('/complete-tutorial/:userId', async (req, res) => {
  try {
    const user = await completeTutorial(req.params.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
