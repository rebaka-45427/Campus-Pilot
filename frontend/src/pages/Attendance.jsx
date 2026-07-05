import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GraduationCap, Edit2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loader from '../components/Loader';

import api from '../services/api';

export default function Attendance() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', total_classes: 0, classes_attended: 0 });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const res = await api.get('/attendance');
      setSubjects(res.data);
    } catch (error) {
      setIsError(true);
      toast.error('Failed to fetch attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        if (formData.classes_attended > formData.total_classes) {
          toast.error("Attended classes cannot be greater than total classes");
          return;
        }
        await api.put(`/attendance/${editingId}`, formData);
        toast.success('Subject updated');
      } else {
        await api.post('/attendance', formData);
        toast.success('Subject added');
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchSubjects();
    } catch (error) {
      toast.error(editingId ? 'Failed to update subject' : 'Failed to add subject');
    }
  };

  const handleEditSubject = (subject) => {
    setFormData(subject);
    setEditingId(subject.id);
    setIsModalOpen(true);
  };

  const handleMarkPresent = async (id) => {
    try {
      await api.patch(`/attendance/${id}/present`);
      toast.success('Marked Present');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to mark present');
    }
  };

  const handleMarkAbsent = async (id) => {
    try {
      await api.patch(`/attendance/${id}/absent`);
      toast.success('Marked as absent');
      // No need to fetchSubjects since absent doesn't modify anything
    } catch (error) {
      toast.error('Failed to mark absent');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this subject?')) {
      try {
        await api.delete(`/attendance/${id}`);
        toast.success('Subject deleted');
        fetchSubjects();
      } catch (error) {
        toast.error('Failed to delete subject');
      }
    }
  };

  const totalClasses = subjects.reduce((sum, s) => sum + s.total_classes, 0);
  const totalAttended = subjects.reduce((sum, s) => sum + s.classes_attended, 0);
  const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);
  
  const getColorScheme = (percentage) => {
    if (percentage >= 75) return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', fill: '#10B981', ring: 'ring-success' };
    if (percentage >= 60) return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', fill: '#F59E0B', ring: 'ring-warning' };
    return { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', fill: '#EF4444', ring: 'ring-danger' };
  };

  const overallScheme = getColorScheme(overallPercentage);

  if (isLoading) {
    return <Loader text="Loading attendance..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load attendance</h3>
        <p className="text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Tracker</h2>
          <p className="text-gray-500 mt-1">Keep your attendance above 75% to stay in the green zone.</p>
        </div>
        <Button onClick={() => { setFormData({ name: '', total_classes: 0, classes_attended: 0 }); setEditingId(null); setIsModalOpen(true); }}>
          <Plus size={20} className="mr-2" /> Add Subject
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`col-span-1 md:col-span-3 flex flex-col md:flex-row items-center p-8 border ${overallScheme.border} ${overallScheme.bg}`}>
          
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-white/50" strokeWidth="12" />
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke={overallScheme.fill}
                strokeWidth="12" 
                strokeDasharray={`${overallPercentage * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${overallScheme.color}`}>{overallPercentage}%</span>
              <span className="text-xs font-bold text-gray-600">Overall</span>
            </div>
          </div>

          <div className="mt-6 md:mt-0 md:ml-12 flex-1 w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Semester Overview</h3>
            <p className="text-gray-600 mb-6 max-w-lg">
              {overallPercentage >= 75 ? "Great job! You are maintaining excellent attendance." 
              : overallPercentage >= 60 ? "Warning: Your attendance is slipping. Try not to miss any more classes."
              : "Critical Alert: Your attendance is dangerously low. Please prioritize attending classes."}
            </p>
            <div className="flex gap-8">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Total Classes</p>
                <p className="text-2xl font-black text-gray-900">{totalClasses}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Attended</p>
                <p className="text-2xl font-black text-gray-900">{totalAttended}</p>
              </div>
            </div>
          </div>
        </Card>

        {subjects.length === 0 ? (
          <div className="col-span-1 md:col-span-3 text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-900">No subjects tracked yet.</p>
            <p className="text-sm text-gray-400 mt-1">Click the button above to add your first subject.</p>
          </div>
        ) : (
          subjects.map(subject => {
            const pct = subject.total_classes === 0 ? 0 : Math.round((subject.classes_attended / subject.total_classes) * 100);
            const scheme = getColorScheme(pct);

            return (
              <Card key={subject.id} className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                  <button onClick={() => handleEditSubject(subject)} className="text-gray-400 hover:text-primary bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(subject.id)} className="text-gray-400 hover:text-danger bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${scheme.bg} ${scheme.color}`}>
                    <GraduationCap size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg truncate pr-16">{subject.name}</h3>
                </div>

                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className={`text-3xl font-black ${scheme.color}`}>{pct}%</span>
                  </div>
                  <div className="text-right text-sm font-medium text-gray-500">
                    {subject.classes_attended} / {subject.total_classes}
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6">
                  <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: scheme.fill }}></div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1 text-sm py-2 hover:bg-success/10 hover:text-success hover:border-success/30 transition-colors" onClick={() => handleMarkPresent(subject.id)}>
                    <CheckCircle2 size={16} className="mr-1 inline" /> Present
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm py-2 hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors" onClick={() => handleMarkAbsent(subject.id)}>
                    <XCircle size={16} className="mr-1 inline" /> Absent
                  </Button>
                </div>

              </Card>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); }} title={editingId ? "Edit Subject" : "Add New Subject"}>
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="e.g. Data Structures" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Total Classes</label>
              <input required type="number" min="0" value={formData.total_classes} onChange={e => setFormData({...formData, total_classes: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Classes Attended</label>
              <input required type="number" min="0" max={formData.total_classes} value={formData.classes_attended} onChange={e => setFormData({...formData, classes_attended: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
          <Button type="submit" className="w-full mt-4">Save Subject</Button>
        </form>
      </Modal>

    </div>
  );
}
