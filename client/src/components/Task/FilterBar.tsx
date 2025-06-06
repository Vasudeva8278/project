import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setFilters, clearFilters } from '../../store/slices/taskSlice';
import { Filter, X, Search, Eye } from 'lucide-react';

const FilterBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.tasks);

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value || undefined }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '' && value !== 'all');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Filters</span>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear all</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* View Filter */}
          <div className="relative">
            <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filters.view || 'all'}
              onChange={(e) => handleFilterChange('view', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="assigned">Assigned to Me</option>
              <option value="created">Created by Me</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="shopping">Shopping</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>

          {/* Due Date Filter */}
          <input
            type="date"
            value={filters.dueDate || ''}
            onChange={(e) => handleFilterChange('dueDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;