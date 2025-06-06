import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createTask, updateTask } from '../../store/slices/taskSlice';
import { fetchUsers, searchUsers, clearSearchResults } from '../../store/slices/userSlice';
import { closeTaskModal } from '../../store/slices/uiSlice';
import { X, Plus, Trash2, Calendar, Search, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const TaskModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);
  const { selectedTaskId } = useAppSelector((state) => state.ui);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { users, searchResults, searchLoading } = useAppSelector((state) => state.users);

  const selectedTask = selectedTaskId ? tasks.find(task => task._id === selectedTaskId) : null;
  const isEditing = Boolean(selectedTask);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'inprogress' | 'done',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'other' as 'work' | 'personal' | 'shopping' | 'health' | 'education' | 'other',
    dueDate: '',
    tags: [] as string[],
    subtasks: [] as Array<{ title: string; completed: boolean }>,
    color: '#1976D2',
    customFields: {} as Record<string, string>,
    assignedTo: '',
  });

  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description,
        status: selectedTask.status,
        priority: selectedTask.priority,
        category: selectedTask.category,
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : '',
        tags: selectedTask.tags,
        subtasks: selectedTask.subtasks.map(st => ({ title: st.title, completed: st.completed })),
        color: selectedTask.color,
        customFields: selectedTask.customFields || {},
        assignedTo: selectedTask.assignedTo._id,
      });
      setUserSearchQuery(selectedTask.assignedTo.name);
    } else {
      // Default to current user for new tasks
      setFormData(prev => ({ ...prev, assignedTo: currentUser?.id || '' }));
      setUserSearchQuery(currentUser?.name || '');
    }
  }, [selectedTask, currentUser]);

  useEffect(() => {
    if (userSearchQuery.length >= 2) {
      dispatch(searchUsers(userSearchQuery));
    } else {
      dispatch(clearSearchResults());
    }
  }, [userSearchQuery, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assignedTo) {
      toast.error('Please assign the task to someone');
      return;
    }

    try {
      const taskData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      };

      if (isEditing) {
        await dispatch(updateTask({ id: selectedTaskId!, data: taskData })).unwrap();
        toast.success('Task updated successfully');
      } else {
        await dispatch(createTask(taskData)).unwrap();
        toast.success('Task created successfully');
      }
      
      dispatch(closeTaskModal());
    } catch (error) {
      toast.error(isEditing ? 'Failed to update task' : 'Failed to create task');
    }
  };

  const handleUserSelect = (user: any) => {
    setFormData(prev => ({ ...prev, assignedTo: user._id }));
    setUserSearchQuery(user.name);
    setShowUserDropdown(false);
    dispatch(clearSearchResults());
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, { title: newSubtask.trim(), completed: false }]
      }));
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  const handleToggleSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask, i) => 
        i === index ? { ...subtask, completed: !subtask.completed } : subtask
      )
    }));
  };

  const handleAddCustomField = () => {
    if (customFieldKey.trim() && customFieldValue.trim()) {
      setFormData(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [customFieldKey.trim()]: customFieldValue.trim()
        }
      }));
      setCustomFieldKey('');
      setCustomFieldValue('');
    }
  };

  const handleRemoveCustomField = (key: string) => {
    setFormData(prev => {
      const newCustomFields = { ...prev.customFields };
      delete newCustomFields[key];
      return { ...prev, customFields: newCustomFields };
    });
  };

  const availableUsers = userSearchQuery.length >= 2 ? searchResults : users;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={() => dispatch(closeTaskModal())}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task title"
            />
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To *
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search users..."
                />
              </div>
              
              {showUserDropdown && (availableUsers.length > 0 || searchLoading) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-3 text-center text-gray-500">Searching...</div>
                  ) : (
                    <>
                      {/* Current user option */}
                      <button
                        type="button"
                        onClick={() => handleUserSelect({ _id: currentUser?.id, name: currentUser?.name })}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{currentUser?.name} (You)</div>
                          <div className="text-sm text-gray-500">{currentUser?.email}</div>
                        </div>
                      </button>
                      
                      {availableUsers.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task description"
            />
          </div>

          {/* Status, Priority, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="shopping">Shopping</option>
                <option value="health">Health</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Due Date and Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex space-x-2">
                {['#1976D2', '#00695C', '#FF6F00', '#D32F2F', '#7B1FA2', '#388E3C'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-400' : 'border-gray-200'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtasks
            </label>
            <div className="space-y-2 mb-3">
              {formData.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(index)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add subtask"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Fields
            </label>
            <div className="space-y-2 mb-3">
              {Object.entries(formData.customFields).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="flex-1">{value}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customFieldKey}
                onChange={(e) => setCustomFieldKey(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Field name"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Field value"
                />
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => dispatch(closeTaskModal())}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;