import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, CheckSquare, BookOpen, GraduationCap, StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KEYS, getList } from '../utils/storage';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], assignments: [], subjects: [], notes: [] });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setQuery('');
      setResults({ tasks: [], assignments: [], subjects: [], notes: [] });
    }
  }, [isOpen]);

  const search = useCallback((q) => {
    if (!q.trim()) {
      setResults({ tasks: [], assignments: [], subjects: [], notes: [] });
      return;
    }
    const lower = q.toLowerCase();
    const tasks       = getList(KEYS.tasks).filter(t => t.title?.toLowerCase().includes(lower)).slice(0, 4);
    const assignments = getList(KEYS.assignments).filter(a => a.title?.toLowerCase().includes(lower) || a.subject?.toLowerCase().includes(lower)).slice(0, 4);
    const subjects    = getList(KEYS.subjects).filter(s => s.name?.toLowerCase().includes(lower)).slice(0, 4);
    const notes       = getList(KEYS.notes).filter(n => n.title?.toLowerCase().includes(lower) || n.content?.toLowerCase().includes(lower)).slice(0, 4);
    setResults({ tasks, assignments, subjects, notes });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const hasResults = results.tasks.length > 0 || results.assignments.length > 0 || results.subjects.length > 0 || results.notes.length > 0;

  const navigateTo = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4" onClick={() => setIsOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      {/* Search Panel */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center px-5 py-4 border-b border-gray-100">
          <Search size={20} className="text-gray-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, assignments, notes, subjects..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-gray-900 text-base outline-none placeholder-gray-400 bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 ml-2">
              <X size={18} />
            </button>
          )}
          <kbd className="ml-3 hidden md:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-lg">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {!query && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              Start typing to search across all your data
            </div>
          )}

          {query && !hasResults && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No results found for "<span className="font-medium text-gray-600">{query}</span>"
            </div>
          )}

          {results.tasks.length > 0 && (
            <ResultSection title="Tasks" icon={<CheckSquare size={14} />}>
              {results.tasks.map(t => (
                <ResultItem
                  key={t.id}
                  label={t.title}
                  sub={`${t.category} · ${t.priority} Priority · ${t.status}`}
                  onClick={() => navigateTo('/tasks')}
                  strikethrough={t.status === 'completed'}
                />
              ))}
            </ResultSection>
          )}

          {results.assignments.length > 0 && (
            <ResultSection title="Assignments" icon={<BookOpen size={14} />}>
              {results.assignments.map(a => (
                <ResultItem
                  key={a.id}
                  label={a.title}
                  sub={a.subject}
                  onClick={() => navigateTo('/assignments')}
                />
              ))}
            </ResultSection>
          )}

          {results.subjects.length > 0 && (
            <ResultSection title="Subjects" icon={<GraduationCap size={14} />}>
              {results.subjects.map(s => {
                const pct = s.total_classes === 0 ? 0 : Math.round((s.classes_attended / s.total_classes) * 100);
                return (
                  <ResultItem
                    key={s.id}
                    label={s.name}
                    sub={`Attendance: ${pct}% (${s.classes_attended}/${s.total_classes})`}
                    onClick={() => navigateTo('/attendance')}
                  />
                );
              })}
            </ResultSection>
          )}

          {results.notes.length > 0 && (
            <ResultSection title="Notes" icon={<StickyNote size={14} />}>
              {results.notes.map(n => (
                <ResultItem
                  key={n.id}
                  label={n.title}
                  sub={n.content?.slice(0, 60) + (n.content?.length > 60 ? '…' : '')}
                  onClick={() => navigateTo('/notes')}
                />
              ))}
            </ResultSection>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
          <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-medium">↵</kbd> to navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-medium">Ctrl+K</kbd> to toggle</span>
        </div>
      </div>
    </div>
  );
}

function ResultSection({ title, icon, children }) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultItem({ label, sub, onClick, strikethrough }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-3 hover:bg-primary/5 transition-colors flex flex-col"
    >
      <span className={`text-sm font-medium text-gray-900 ${strikethrough ? 'line-through text-gray-400' : ''}`}>
        {label}
      </span>
      {sub && <span className="text-xs text-gray-400 mt-0.5">{sub}</span>}
    </button>
  );
}
