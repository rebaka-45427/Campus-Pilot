import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import api from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLORS = [
  { name: 'Purple', class: 'bg-purple-100 text-purple-900 border-purple-200' },
  { name: 'Blue', class: 'bg-blue-100 text-blue-900 border-blue-200' },
  { name: 'Green', class: 'bg-green-100 text-green-900 border-green-200' },
  { name: 'Yellow', class: 'bg-yellow-100 text-yellow-900 border-yellow-200' },
  { name: 'Red', class: 'bg-red-100 text-red-900 border-red-200' },
  { name: 'Pink', class: 'bg-pink-100 text-pink-900 border-pink-200' },
];

export default function WeeklyTimetable() {
  const [entries, setEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState('Monday');
  
  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    subject: '',
    room: '',
    teacher: '',
    color: COLORS[0].class
  });

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await api.get('/timetable');
      setEntries(res.data);
    } catch (error) {
      toast.error('Failed to load timetable');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/timetable', formData);
      toast.success('Added to timetable');
      setIsModalOpen(false);
      fetchTimetable();
    } catch (error) {
      toast.error('Failed to add entry');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this class?')) {
      try {
        await api.delete(`/timetable/${id}`);
        toast.success('Deleted');
        fetchTimetable();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const dayEntries = entries.filter(e => e.day_of_week === activeDay).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Timetable</h2>
          <p className="text-gray-500 mt-1">Manage your weekly class schedule.</p>
        </div>
        <Button onClick={() => { setFormData({...formData, day_of_week: activeDay}); setIsModalOpen(true); }}>
          <Plus size={20} className="mr-2" /> Add Class
        </Button>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 custom-scrollbar">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeDay === day ? 'bg-primary text-white shadow-soft' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {dayEntries.length === 0 ? (
          <Card className="text-center py-12 text-gray-500">
            No classes scheduled for {activeDay}. Enjoy your day off!
          </Card>
        ) : (
          dayEntries.map(entry => (
            <Card key={entry.id} className={`p-0 overflow-hidden border ${entry.color.split(' ')[2]} flex flex-col md:flex-row group`}>
              <div className={`md:w-32 p-4 flex flex-col items-center justify-center ${entry.color.split(' ')[0]} ${entry.color.split(' ')[1]}`}>
                <span className="font-bold text-lg">{entry.start_time}</span>
                <span className="text-sm opacity-80">to</span>
                <span className="font-bold text-lg">{entry.end_time}</span>
              </div>
              <div className="p-5 flex-1 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{entry.subject}</h3>
                  <div className="flex gap-4 text-sm text-gray-600">
                    {entry.room && (
                      <span className="flex items-center"><MapPin size={16} className="mr-1" /> {entry.room}</span>
                    )}
                    {entry.teacher && (
                      <span className="flex items-center"><User size={16} className="mr-1" /> {entry.teacher}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={20} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Class">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Day</label>
              <select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
              <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
              <input required type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">End Time</label>
              <input required type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Room</label>
              <input type="text" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Teacher</label>
              <input type="text" value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Color Label</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <div 
                  key={c.name}
                  onClick={() => setFormData({...formData, color: c.class})}
                  className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${c.class.split(' ')[0]} ${formData.color === c.class ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full mt-4">Save Class</Button>
        </form>
      </Modal>

    </div>
  );
}
