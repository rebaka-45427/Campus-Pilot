import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Pin, StickyNote, Edit3, Archive, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import api from '../services/api';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active, archived
  const [saveStatus, setSaveStatus] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_pinned: false,
    is_archived: false
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (!editingNote) return;

    // Skip auto-save if formData matches editingNote exactly (e.g. just opened)
    if (
      formData.title === editingNote.title && 
      formData.content === editingNote.content && 
      formData.is_pinned === editingNote.is_pinned &&
      formData.is_archived === editingNote.is_archived
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaveStatus('Saving...');
      try {
        await api.put(`/notes/${editingNote.id}`, formData);
        setSaveStatus('Saved');
        fetchNotes();
      } catch (e) {
        setSaveStatus('Error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, editingNote]);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch (error) {
      toast.error('Failed to load notes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await api.put(`/notes/${editingNote.id}`, formData);
        toast.success('Note updated');
      } else {
        await api.post('/notes', formData);
        toast.success('Note created');
      }
      setIsModalOpen(false);
      fetchNotes();
    } catch (error) {
      toast.error('Error saving note');
    }
  };

  const openModal = (note = null) => {
    setSaveStatus('');
    if (note) {
      setEditingNote(note);
      setFormData({ title: note.title, content: note.content, is_pinned: note.is_pinned, is_archived: note.is_archived || false });
    } else {
      setEditingNote(null);
      setFormData({ title: '', content: '', is_pinned: false, is_archived: false });
    }
    setIsModalOpen(true);
  };

  const deleteNote = async (id) => {
    if (window.confirm('Delete this note?')) {
      try {
        await api.delete(`/notes/${id}`);
        toast.success('Note deleted');
        fetchNotes();
      } catch (error) {
        toast.error('Error deleting note');
      }
    }
  };

  const togglePin = async (id) => {
    try {
      await api.put(`/notes/${id}/pin`);
      fetchNotes();
    } catch (error) {
      toast.error('Error pinning note');
    }
  };

  const toggleArchive = async (id) => {
    try {
      await api.put(`/notes/${id}/archive`);
      fetchNotes();
      toast.success('Note moved');
    } catch (error) {
      toast.error('Error archiving note');
    }
  };

  const displayedNotes = notes.filter(note => activeTab === 'archived' ? note.is_archived : !note.is_archived);
  
  const filteredNotes = displayedNotes.filter(note => 
    note.title.toLowerCase().includes(search.toLowerCase()) || 
    note.content.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.is_pinned - a.is_pinned);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notes</h2>
          <p className="text-gray-500 mt-1">Capture your thoughts and ideas.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={20} className="mr-2" /> New Note
        </Button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('active')} 
          className={`pb-2 px-1 font-bold text-sm ${activeTab === 'active' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          Active Notes
        </button>
        <button 
          onClick={() => setActiveTab('archived')} 
          className={`pb-2 px-1 font-bold text-sm ${activeTab === 'archived' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          Archived
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search notes..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <StickyNote className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No notes found. Create one!</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <Card key={note.id} hover className="relative group flex flex-col h-64">
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 text-lg truncate pr-4">{note.title}</h3>
                <button onClick={() => togglePin(note.id)} className={`p-1.5 rounded-lg transition-colors ${note.is_pinned ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'}`}>
                  <Pin size={18} className={note.is_pinned ? 'fill-primary' : ''} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>

              <div className="pt-4 mt-auto border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                <span>{format(new Date(note.created_at), 'MMM do, yyyy')}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleArchive(note.id)} className="hover:text-warning" title={note.is_archived ? 'Unarchive' : 'Archive'}><Archive size={16} /></button>
                  <button onClick={() => openModal(note)} className="hover:text-primary"><Edit3 size={16} /></button>
                  <button onClick={() => deleteNote(note.id)} className="hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>

            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingNote ? "Edit Note" : "New Note"} className="max-w-2xl">
        {editingNote && saveStatus && (
          <div className="absolute top-6 right-12 text-xs font-bold text-gray-400 flex items-center">
            {saveStatus === 'Saving...' ? <RefreshCw size={12} className="animate-spin mr-1" /> : null}
            {saveStatus}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="Note title" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Content</label>
            <textarea required rows="10" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-4 py-2 border rounded-xl resize-none" placeholder="Start typing..."></textarea>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="pin" checked={formData.is_pinned} onChange={e => setFormData({...formData, is_pinned: e.target.checked})} className="mr-2" />
            <label htmlFor="pin" className="text-sm text-gray-700">Pin this note to the top</label>
          </div>
          <Button type="submit" className="w-full mt-4">{editingNote ? 'Save Note' : 'Create Note'}</Button>
        </form>
      </Modal>

    </div>
  );
}
