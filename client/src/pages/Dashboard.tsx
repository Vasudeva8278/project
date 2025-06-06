import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchTasks, createTask, updateTask, deleteTask, reorderTasks, setFilters } from '../store/slices/taskSlice';
import { openTaskModal } from '../store/slices/uiSlice';
import TaskCard from '../components/Task/TaskCard';
import TaskModal from '../components/Task/TaskModal';
import FilterBar from '../components/Task/FilterBar';
import { Plus, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, loading, filters } = useAppSelector((state) => state.tasks);
  const { taskModalOpen } = useAppSelector((state) => state.ui);

  const [columns, setColumns] = useState({
    todo: { id: 'todo', title: 'To Do', tasks: [] as any[] },
    inprogress: { id: 'inprogress', title: 'In Progress', tasks: [] as any[] },
    done: { id: 'done', title: 'Done', tasks: [] as any[] },
  });

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    // Organize tasks by status
    const organizedTasks = {
      todo: { id: 'todo', title: 'To Do', tasks: tasks.filter(task => task.status === 'todo').sort((a, b) => a.order - b.order) },
      inprogress: { id: 'inprogress', title: 'In Progress', tasks: tasks.filter(task => task.status === 'inprogress').sort((a, b) => a.order - b.order) },
      done: { id: 'done', title: 'Done', tasks: tasks.filter(task => task.status === 'done').sort((a, b) => a.order - b.order) },
    };
    setColumns(organizedTasks);
  }, [tasks]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColumn = columns[source.droppableId as keyof typeof columns];
    const destColumn = columns[destination.droppableId as keyof typeof columns];
    const task = sourceColumn.tasks[source.index];

    // Create new columns state
    const newSourceTasks = [...sourceColumn.tasks];
    const newDestTasks = source.droppableId === destination.droppableId ? newSourceTasks : [...destColumn.tasks];

    // Remove task from source
    newSourceTasks.splice(source.index, 1);

    // Add task to destination
    if (source.droppableId === destination.droppableId) {
      newSourceTasks.splice(destination.index, 0, task);
    } else {
      newDestTasks.splice(destination.index, 0, { ...task, status: destination.droppableId });
    }

    // Update local state immediately for smooth UX
    const newColumns = {
      ...columns,
      [source.droppableId]: { ...sourceColumn, tasks: newSourceTasks },
      [destination.droppableId]: { ...destColumn, tasks: newDestTasks },
    };
    setColumns(newColumns);

    // Prepare updates for backend
    const updates = [];
    
    // Update source column orders
    newSourceTasks.forEach((task, index) => {
      updates.push({ id: task._id, status: source.droppableId, order: index });
    });

    // Update destination column orders (if different from source)
    if (source.droppableId !== destination.droppableId) {
      newDestTasks.forEach((task, index) => {
        updates.push({ id: task._id, status: destination.droppableId, order: index });
      });
    }

    // Send updates to backend
    dispatch(reorderTasks(updates))
      .catch(() => {
        toast.error('Failed to update task order');
        // Revert on error
        setColumns(columns);
      });
  };

  const handleAddTask = (columnId: string) => {
    dispatch(openTaskModal(null));
  };

  const handleEditTask = (taskId: string) => {
    dispatch(openTaskModal(taskId));
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await dispatch(deleteTask(taskId)).unwrap();
        toast.success('Task deleted successfully');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const getOverdueTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === tomorrow.getTime();
    });
  };

  const overdueTasks = getOverdueTasks();
  const upcomingTasks = getUpcomingTasks();

  return (
    <div className="p-6 h-full">
      {/* Alerts */}
      {(overdueTasks.length > 0 || upcomingTasks.length > 0) && (
        <div className="mb-6 space-y-3">
          {overdueTasks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-red-700">
                  {overdueTasks.map(task => task.title).join(', ')}
                </p>
              </div>
            </div>
          )}
          
          {upcomingTasks.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {upcomingTasks.length} task{upcomingTasks.length > 1 ? 's' : ''} due tomorrow
                </h3>
                <p className="text-sm text-yellow-700">
                  {upcomingTasks.map(task => task.title).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">To Do</p>
              <p className="text-3xl font-bold text-blue-600">{columns.todo.tasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-orange-600">{columns.inprogress.tasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-orange-600 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{columns.done.tasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.values(columns).map((column) => (
              <div key={column.id} className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                      {column.tasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Add task"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-gray-50' : ''
                      }`}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}`}
                            >
                              <TaskCard
                                task={task}
                                onEdit={() => handleEditTask(task._id)}
                                onDelete={() => handleDeleteTask(task._id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Task Modal */}
      {taskModalOpen && <TaskModal />}
    </div>
  );
};

export default Dashboard;