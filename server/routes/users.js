import express from 'express';
import User from '../models/User.js';

const router = express.Router();


router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, 
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email avatar')
    .limit(10);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email avatar')
      .sort({ name: 1 });

    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;