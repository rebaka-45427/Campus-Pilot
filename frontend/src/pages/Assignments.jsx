import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2, Edit2, Check } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import api from '../services/api';

export default function Assignments() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ subject: '', title: '', description: '', priority: 'Medium', deadline: '' });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const res = await api.get('/assignments');
      setAssignments(res.data);
    } catch (error) {
      setIsError(true);
      toast.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
      };
      
      if (editingId) {
        await api.put(`/assignments/${editingId}`, payload);
        toast.success('Assignment updated');
      } else {
        await api.post('/assignments', { ...payload, status: 'Pending' });
        toast.success('Assignment created');
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchAssignments();
    } catch (error) {
      toast.error(editingId ? 'Failed to update assignment' : 'Failed to create assignment');
    }
  };

  const handleEdit = (assignment) => {
    setFormData({
      subject: assignment.subject,
      title: assignment.title,
      description: assignment.description || '',
      priority: assignment.priority || 'Medium',
      deadline: new Date(assignment.deadline).toISOString().slice(0, 16)
    });
    setEditingId(assignment.id);
    setIsModalOpen(true);
  };

  const handleMarkComplete = async (id) => {
    try {
      await api.put(`/assignments/${id}`, { status: 'Completed' });
      toast.success('Assignment marked as completed');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to update assignment');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this assignment?')) {
      try {
        await api.delete(`/assignments/${id}`);
        toast.success('Assignment deleted');
        fetchAssignments();
      } catch (error) {
        toast.error('Failed to delete assignment');
      }
    }
  };

  const calculateStatus = (deadline, status) => {
    if (status === 'Completed') return { text: 'Completed', color: 'success', icon: CheckCircle2 };
    if (isPast(new Date(deadline))) return { text: 'Late', color: 'danger', icon: AlertCircle };
    return { text: 'Pending', color: 'warning', icon: Clock };
  };

  if (isLoading) {
    return <Loader text="Loading assignments..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load assignments</h3>
        <p className="text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-gray-500 mt-1">Keep track of your deadlines.</p>
        </div>
        <Button onClick={() => { setFormData({ subject: '', title: '', description: '', priority: 'Medium', deadline: '' }); setEditingId(null); setIsModalOpen(true); }}>
          <Plus size={20} className="mr-2" /> Add Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No assignments yet.</p>
            <p className="text-sm text-gray-400 mt-1">Click the button above to add one.</p>
          </div>
        ) : (
          assignments.map(assignment => {
            const date = new Date(assignment.deadline);
            const daysLeft = differenceInDays(date, new Date());
            const statusInfo = calculateStatus(date, assignment.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={assignment.id} className={`relative group overflow-hidden ${statusInfo.text === 'Completed' ? 'opacity-70 grayscale' : 'hover:border-primary/30'}`}>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {statusInfo.text !== 'Completed' && (
                    <button onClick={() => handleEdit(assignment)} className="p-2 bg-white border border-gray-100 text-gray-400 hover:text-primary shadow-sm rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(assignment.id)} className="p-2 bg-white border border-gray-100 text-gray-400 hover:text-danger shadow-sm rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-start space-x-3 mb-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl mt-1">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="flex space-x-2 mb-1">
                      <Badge variant="gray">{assignment.subject}</Badge>
                      <Badge variant={assignment.priority === 'High' ? 'danger' : assignment.priority === 'Medium' ? 'warning' : 'success'}>{assignment.priority}</Badge>
                    </div>
                    <h3 className="font-bold text-gray-900 leading-tight pr-16">{assignment.title}</h3>
                    {assignment.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2 pr-4">{assignment.description}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center">
                      <Calendar size={14} className="mr-1.5" /> Deadline
                    </span>
                    <span className="font-bold text-gray-900">{format(date, 'MMM do, yyyy')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200/50">
                    <span className="text-gray-500 flex items-center">
                      <StatusIcon size={14} className={`mr-1.5 text-${statusInfo.color}`} /> Status
                    </span>
                    <Badge variant={statusInfo.color}>{statusInfo.text}</Badge>
                  </div>
                </div>

                {statusInfo.text === 'Pending' && (
                  <div className={`mt-4 text-center text-sm font-bold p-2 rounded-lg ${daysLeft <= 2 ? 'bg-danger/10 text-danger' : daysLeft <= 5 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                    {daysLeft === 0 ? 'Due Today!' : daysLeft < 0 ? 'Past Due' : `${daysLeft} days remaining`}
                  </div>
                )}

                {statusInfo.text !== 'Completed' && (
                  <Button variant="outline" className="w-full mt-4 hover:bg-success/10 hover:text-success hover:border-success/30 transition-colors" onClick={() => handleMarkComplete(assignment.id)}>
                    <Check size={16} className="mr-2" /> Mark Completed
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); }} title={editingId ? "Edit Assignment" : "New Assignment"}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
              <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="e.g. Physics" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="e.g. Chapter 4 Questions" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl h-20 resize-none" placeholder="Add extra details..."></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
            <input required type="datetime-local" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <Button type="submit" className="w-full mt-4">{editingId ? "Update Assignment" : "Save Assignment"}</Button>
        </form>
      </Modal>

    </div>
  );
}
