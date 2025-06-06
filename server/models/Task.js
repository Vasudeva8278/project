import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'shopping', 'health', 'education', 'other'],
    default: 'other'
  },
  dueDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  subtasks: [subtaskSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#1976D2'
  },
  customFields: {
    type: Map,
    of: String,
    default: new Map()
  }
}, {
  timestamps: true
});

// Index for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ createdBy: 1 });

export default mongoose.model('Task', taskSchema);