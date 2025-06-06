import React from 'react';
import { Task } from '../../store/slices/taskSlice';
import { Calendar, Flag, Tag, User, Clock, Edit, Trash2, UserCheck } from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'shopping': return 'bg-pink-100 text-pink-800';
      case 'health': return 'bg-green-100 text-green-800';
      case 'education': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = () => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today && task.status !== 'done';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
  const isAssignedToMe = task.assignedTo._id === currentUser?.id;
  const isCreatedByMe = task.createdBy._id === currentUser?.id;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 ml-2">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit task"
          >
            <Edit className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-gray-500" />
          <div className="text-xs">
            <span className="text-gray-500">Assigned to: </span>
            <span className={`font-medium ${isAssignedToMe ? 'text-blue-600' : 'text-gray-700'}`}>
              {isAssignedToMe ? 'You' : task.assignedTo.name}
            </span>
          </div>
        </div>
        {!isCreatedByMe && (
          <div className="text-xs text-gray-500">
            by {task.createdBy.name}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-2 mb-3">
        {/* Priority and Category */}
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            <Flag className="w-3 h-3 mr-1" />
            {task.priority}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
            <Tag className="w-3 h-3 mr-1" />
            {task.category}
          </span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center space-x-1 text-xs ${isOverdue() ? 'text-red-600' : 'text-gray-500'}`}>
            <Calendar className="w-3 h-3" />
            <span>{formatDate(task.dueDate)}</span>
            {isOverdue() && <span className="font-medium">(Overdue)</span>}
          </div>
        )}

        {/* Subtasks Progress */}
        {task.subtasks.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">
              {completedSubtasks}/{task.subtasks.length}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{task.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
        {task.color !== '#1976D2' && (
          <div
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: task.color }}
            title="Task color"
          ></div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;