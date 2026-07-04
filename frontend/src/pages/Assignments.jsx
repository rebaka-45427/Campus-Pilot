import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import api from '../services/api';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ subject: '', title: '', deadline: '' });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data);
    } catch (error) {
      toast.error('Failed to load assignments');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
        status: 'Pending'
      });
      toast.success('Assignment created');
      setIsModalOpen(false);
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to create assignment');
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

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-gray-500 mt-1">Keep track of your deadlines.</p>
        </div>
        <Button onClick={() => { setFormData({ subject: '', title: '', deadline: '' }); setIsModalOpen(true); }}>
          <Plus size={20} className="mr-2" /> Add Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No upcoming assignments. You're all caught up!
          </div>
        ) : (
          assignments.map(assignment => {
            const date = new Date(assignment.deadline);
            const daysLeft = differenceInDays(date, new Date());
            const statusInfo = calculateStatus(date, assignment.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={assignment.id} className="relative group overflow-hidden hover:border-primary/30">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDelete(assignment.id)} className="p-2 bg-gray-50 text-gray-400 hover:text-danger rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <Badge variant="gray" className="mb-1">{assignment.subject}</Badge>
                    <h3 className="font-bold text-gray-900 leading-tight pr-8">{assignment.title}</h3>
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
              </Card>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Assignment">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
            <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="e.g. Physics" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="e.g. Chapter 4 Questions" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
            <input required type="datetime-local" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <Button type="submit" className="w-full mt-4">Save Assignment</Button>
        </form>
      </Modal>

    </div>
  );
}
