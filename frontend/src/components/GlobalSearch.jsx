import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, CheckSquare, BookOpen, GraduationCap, StickyNote, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], assignments: [], subjects: [], notes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ tasks: [], assignments: [], subjects: [], notes: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], assignments: [], subjects: [], notes: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (error) {
        console.error('Search error', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  if (!isOpen) return null;

  const totalResults = results.tasks.length + results.assignments.length + results.subjects.length + results.notes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 px-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-gray-100">
        <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-gray-50/50">
          <Search size={20} className="text-gray-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-lg"
            placeholder="Search tasks, notes, assignments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin ml-3"></div>}
          <button onClick={() => setIsOpen(false)} className="ml-3 text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="p-8 text-center text-gray-500">
              <Command size={48} className="mx-auto mb-4 text-gray-300 opacity-50" />
              <p>Type to search across CampusPilot.os</p>
            </div>
          ) : totalResults === 0 && !isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-4 p-2">
              {results.tasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Tasks</h3>
                  {results.tasks.map(task => (
                    <button key={task.id} onClick={() => handleNavigate('/tasks')} className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 rounded-lg group">
                      <CheckSquare size={16} className="text-warning mr-3 opacity-70 group-hover:opacity-100" />
                      <span className="font-medium text-gray-900 truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.assignments.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">Assignments</h3>
                  {results.assignments.map(asg => (
                    <button key={asg.id} onClick={() => handleNavigate('/assignments')} className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 rounded-lg group">
                      <BookOpen size={16} className="text-primary mr-3 opacity-70 group-hover:opacity-100" />
                      <span className="font-medium text-gray-900 truncate">{asg.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.subjects.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">Subjects</h3>
                  {results.subjects.map(sub => (
                    <button key={sub.id} onClick={() => handleNavigate('/attendance')} className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 rounded-lg group">
                      <GraduationCap size={16} className="text-success mr-3 opacity-70 group-hover:opacity-100" />
                      <span className="font-medium text-gray-900 truncate">{sub.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.notes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">Notes</h3>
                  {results.notes.map(note => (
                    <button key={note.id} onClick={() => handleNavigate('/notes')} className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 rounded-lg group">
                      <StickyNote size={16} className="text-purple-500 mr-3 opacity-70 group-hover:opacity-100" />
                      <span className="font-medium text-gray-900 truncate">{note.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">Press <kbd className="font-sans bg-white border border-gray-200 rounded px-1.5 shadow-sm font-bold text-gray-900">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
