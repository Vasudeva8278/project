import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

const createNotification = async (recipientId, senderId, type, title, message, taskId = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      task: taskId
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
  }
};


router.get('/', async (req, res) => {
  try {
    const { status, category, priority, dueDate, search, view } = req.query;
    let filter = {};

   
    if (view === 'assigned') {
      filter.assignedTo = req.user._id;
    } else if (view === 'created') {
      filter.createdBy = req.user._id;
    } else {
      
      filter.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }

   
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (dueDate) {
      const date = new Date(dueDate);
      filter.dueDate = {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      };
    }
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('assignedTo').notEmpty().withMessage('Task must be assigned to someone')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { assignedTo, ...taskData } = req.body;

    
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: 'Assigned user not found' });
    }

    const task = new Task({
      ...taskData,
      createdBy: req.user._id,
      assignedTo: assignedTo
    });

    await task.save();

    
    await task.populate('createdBy', 'name email avatar');
    await task.populate('assignedTo', 'name email avatar');

    
    if (assignedTo !== req.user._id.toString()) {
      await createNotification(
        assignedTo,
        req.user._id,
        'task_assigned',
        'New Task Assigned',
        `${req.user.name} assigned you a new task: "${task.title}"`,
        task._id
      );
    }

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { assignedTo, ...updateData } = req.body;
    
    const currentTask = await Task.findOne({
      _id: req.params.id,
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    });

    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    
    if (assignedTo && assignedTo !== currentTask.assignedTo.toString()) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ message: 'Assigned user not found' });
      }
      updateData.assignedTo = assignedTo;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email avatar')
     .populate('assignedTo', 'name email avatar');

   
    if (assignedTo && assignedTo !== currentTask.assignedTo.toString()) {
      
      await createNotification(
        assignedTo,
        req.user._id,
        'task_assigned',
        'Task Reassigned',
        `${req.user.name} assigned you a task: "${task.title}"`,
        task._id
      );
    } else if (updateData.status === 'done' && currentTask.status !== 'done') {
      
      if (currentTask.createdBy.toString() !== req.user._id.toString()) {
        await createNotification(
          currentTask.createdBy,
          req.user._id,
          'task_completed',
          'Task Completed',
          `${req.user.name} completed the task: "${task.title}"`,
          task._id
        );
      }
    } else if (currentTask.assignedTo.toString() !== req.user._id.toString()) {
     
      await createNotification(
        currentTask.assignedTo,
        req.user._id,
        'task_updated',
        'Task Updated',
        `${req.user.name} updated your task: "${task.title}"`,
        task._id
      );
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    await Notification.deleteMany({ task: req.params.id });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/bulk/reorder', async (req, res) => {
  try {
    const { updates } = req.body; 

    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { 
          _id: update.id, 
          $or: [
            { assignedTo: req.user._id },
            { createdBy: req.user._id }
          ]
        },
        update: { status: update.status, order: update.order }
      }
    }));

    await Task.bulkWrite(bulkOps);
    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;