import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, CheckSquare, Clock, Timer } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import api from '../services/api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // All, Pending, Completed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Study',
    priority: 'Medium',
    deadline: '',
    estimated_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      toast.error('Failed to load tasks');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created');
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (error) {
      toast.error('Error saving task');
    }
  };

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        category: task.category,
        priority: task.priority,
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
        estimated_time: task.estimated_time || '',
        notes: task.notes || ''
      });
    } else {
      setEditingTask(null);
      setFormData({ title: '', category: 'Study', priority: 'Medium', deadline: '', estimated_time: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      fetchTasks();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const deleteTask = async (id) => {
    if(window.confirm('Delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        toast.success('Task deleted');
        fetchTasks();
      } catch (error) {
        toast.error('Error deleting task');
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' ? true : task.status === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative min-h-screen">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Manager</h2>
          <p className="text-gray-500 mt-1">Organize your work and track progress.</p>
        </div>
        <Button onClick={() => openModal()} className="md:w-auto">
          <Plus size={20} className="mr-2" /> New Task
        </Button>
      </div>

      <Card className="mb-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-gray-900">Overall Progress</span>
          <span className="font-bold text-primary">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1">
          {['All', 'Pending', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-primary text-white shadow-soft' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="text-center py-12">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="text-gray-500 mt-1">Create a new task to get started.</p>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-primary hover:border-l-primary/80">
              <div className="flex items-start md:items-center gap-4">
                <button 
                  onClick={() => toggleStatus(task)}
                  className={`mt-1 md:mt-0 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-success border-success text-white' : 'border-gray-300 hover:border-success'}`}
                >
                  {task.status === 'completed' && <CheckSquare size={14} />}
                </button>
                <div>
                  <h4 className={`text-lg font-bold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                    <Badge variant="gray">{task.category}</Badge>
                    <Badge variant={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'primary'}>
                      {task.priority} Priority
                    </Badge>
                    {task.deadline && (
                      <span className="flex items-center text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {format(new Date(task.deadline), 'MMM d, h:mm a')}
                      </span>
                    )}
                    {task.estimated_time && (
                      <span className="flex items-center text-gray-500">
                        <Timer size={14} className="mr-1" />
                        {task.estimated_time}
                      </span>
                    )}
                    {task.completed_at && task.status === 'completed' && (
                      <span className="flex items-center text-success font-medium text-xs">
                        Completed: {format(new Date(task.completed_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <button onClick={() => openModal(task)} className="p-2 text-gray-400 hover:text-primary bg-gray-50 hover:bg-primary/10 rounded-lg transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-danger bg-gray-50 hover:bg-danger/10 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? "Edit Task" : "New Task"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                <option>Study</option><option>Assignment</option><option>Project</option><option>Personal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
              <input type="datetime-local" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estimated Time</label>
              <input type="text" placeholder="e.g. 2 hours" value={formData.estimated_time} onChange={e => setFormData({...formData, estimated_time: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
          <Button type="submit" className="w-full">{editingTask ? 'Save Changes' : 'Create Task'}</Button>
        </form>
      </Modal>

    </div>
  );
}
