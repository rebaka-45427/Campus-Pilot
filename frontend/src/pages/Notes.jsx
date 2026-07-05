import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, StickyNote, Pin, Archive, Search, ArchiveX } from 'lucide-react';
import { KEYS, getList, setItem, generateId } from '../utils/storage';
import { addActivity } from '../utils/activity';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const VIEWS = ['active', 'pinned', 'archived'];

const VIEW_LABELS = {
  active: 'Active',
  pinned: 'Pinned',
  archived: 'Archived',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Notes() {
  const [notes, setNotes] = useState(() => getList(KEYS.notes));
  const [search, setSearch] = useState('');
  const [view, setView] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  // ─── Derived counts ───────────────────────────────────────────────────────
  const activeCount   = useMemo(() => notes.filter(n => !n.archived).length, [notes]);
  const pinnedCount   = useMemo(() => notes.filter(n => n.pinned && !n.archived).length, [notes]);
  const archivedCount = useMemo(() => notes.filter(n => n.archived).length, [notes]);

  // ─── Filtered notes ───────────────────────────────────────────────────────
  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase().trim();
    let base;
    if (view === 'active')   base = notes.filter(n => !n.archived);
    else if (view === 'pinned') base = notes.filter(n => n.pinned && !n.archived);
    else                     base = notes.filter(n => n.archived);

    if (!q) return base;
    return base.filter(
      n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q),
    );
  }, [notes, view, search]);

  // ─── Persist helper ───────────────────────────────────────────────────────
  const persist = (updated) => {
    setItem(KEYS.notes, updated);
    setNotes(updated);
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────
  const openModal = (note = null) => {
    setEditingNote(note);
    setFormData(
      note
        ? { title: note.title, content: note.content }
        : { title: '', content: '' },
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setFormData({ title: '', content: '' });
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const { title, content } = formData;
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }

    const now = new Date().toISOString();
    let updated;

    if (editingNote) {
      updated = notes.map(n =>
        n.id === editingNote.id
          ? { ...n, title: title.trim(), content: content.trim(), updated_at: now }
          : n,
      );
      addActivity({ type: 'note_updated', label: `Updated note "${title.trim()}"` });
      toast.success('Note updated.');
    } else {
      const newNote = {
        id: generateId(),
        title: title.trim(),
        content: content.trim(),
        pinned: false,
        archived: false,
        created_at: now,
        updated_at: now,
      };
      updated = [newNote, ...notes];
      addActivity({ type: 'note_created', label: `Created note "${title.trim()}"` });
      toast.success('Note created.');
    }

    persist(updated);
    closeModal();
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteNote = (id) => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    const target = notes.find(n => n.id === id);
    const updated = notes.filter(n => n.id !== id);
    persist(updated);
    addActivity({ type: 'note_deleted', label: `Deleted note "${target?.title}"` });
    toast.success('Note deleted.');
  };

  // ─── Toggle pin ───────────────────────────────────────────────────────────
  const togglePin = (id) => {
    const updated = notes.map(n =>
      n.id === id ? { ...n, pinned: !n.pinned, updated_at: new Date().toISOString() } : n,
    );
    persist(updated);
    const isPinned = updated.find(n => n.id === id)?.pinned;
    toast.success(isPinned ? 'Note pinned.' : 'Note unpinned.');
  };

  // ─── Toggle archive ───────────────────────────────────────────────────────
  const toggleArchive = (id) => {
    const updated = notes.map(n =>
      n.id === id ? { ...n, archived: !n.archived, updated_at: new Date().toISOString() } : n,
    );
    persist(updated);
    const isArchived = updated.find(n => n.id === id)?.archived;
    toast.success(isArchived ? 'Note archived.' : 'Note restored.');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="notes-page">
      {/* ── Header ── */}
      <div className="notes-header">
        <div className="notes-header-left">
          <StickyNote size={28} className="notes-title-icon" />
          <h1 className="notes-title">Notes</h1>
        </div>
        <Button variant="primary" onClick={() => openModal()} className="notes-new-btn">
          <Plus size={16} />
          New Note
        </Button>
      </div>

      {/* ── Stats row ── */}
      <div className="notes-stats-row">
        <span className="notes-stat">
          <span className="notes-stat-value">{activeCount}</span>
          <span className="notes-stat-label">Active</span>
        </span>
        <span className="notes-stat-divider" />
        <span className="notes-stat">
          <span className="notes-stat-value">{pinnedCount}</span>
          <span className="notes-stat-label">Pinned</span>
        </span>
        <span className="notes-stat-divider" />
        <span className="notes-stat">
          <span className="notes-stat-value">{archivedCount}</span>
          <span className="notes-stat-label">Archived</span>
        </span>
      </div>

      {/* ── Search + Tabs ── */}
      <div className="notes-controls">
        <div className="notes-search-wrap">
          <Search size={16} className="notes-search-icon" />
          <input
            type="text"
            className="notes-search-input"
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="notes-tabs">
          {VIEWS.map(v => (
            <button
              key={v}
              className={`notes-tab${view === v ? ' notes-tab--active' : ''}`}
              onClick={() => setView(v)}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {filteredNotes.length === 0 ? (
        <div className="notes-empty">
          <StickyNote size={48} className="notes-empty-icon" />
          <p className="notes-empty-text">
            {search
              ? 'No notes match your search.'
              : view === 'archived'
              ? 'No archived notes.'
              : view === 'pinned'
              ? 'No pinned notes.'
              : 'No notes yet. Create your first note!'}
          </p>
          {view === 'active' && !search && (
            <Button variant="primary" onClick={() => openModal()}>
              <Plus size={16} /> New Note
            </Button>
          )}
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => openModal(note)}
              onDelete={() => deleteNote(note.id)}
              onPin={() => togglePin(note.id)}
              onArchive={() => toggleArchive(note.id)}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingNote ? 'Edit Note' : 'New Note'}
      >
        <form onSubmit={handleSubmit} className="notes-form">
          <div className="notes-form-group">
            <label htmlFor="note-title" className="notes-form-label">
              Title <span className="notes-form-required">*</span>
            </label>
            <input
              id="note-title"
              type="text"
              className="notes-form-input"
              placeholder="Note title"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="notes-form-group">
            <label htmlFor="note-content" className="notes-form-label">
              Content
            </label>
            <textarea
              id="note-content"
              className="notes-form-textarea"
              placeholder="Write your note here…"
              value={formData.content}
              onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
              rows={6}
            />
          </div>
          <div className="notes-form-actions">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingNote ? 'Save Changes' : 'Create Note'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Scoped styles ── */}
      <style>{`
        /* ── Page layout ── */
        .notes-page {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ── Header ── */
        .notes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .notes-header-left {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .notes-title-icon {
          color: var(--color-primary, #6366f1);
        }
        .notes-title {
          font-size: 1.625rem;
          font-weight: 700;
          margin: 0;
          color: var(--color-text-primary, #f1f5f9);
        }
        .notes-new-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        /* ── Stats row ── */
        .notes-stats-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .notes-stat {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
        }
        .notes-stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-primary, #6366f1);
        }
        .notes-stat-label {
          font-size: 0.8rem;
          color: var(--color-text-muted, #94a3b8);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .notes-stat-divider {
          width: 1px;
          height: 1.2rem;
          background: var(--color-border, #334155);
        }

        /* ── Controls ── */
        .notes-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .notes-search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .notes-search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted, #94a3b8);
          pointer-events: none;
        }
        .notes-search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border, #334155);
          background: var(--color-surface, #1e293b);
          color: var(--color-text-primary, #f1f5f9);
          font-size: 0.9rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .notes-search-input:focus {
          border-color: var(--color-primary, #6366f1);
        }
        .notes-tabs {
          display: flex;
          gap: 0.25rem;
          background: var(--color-surface, #1e293b);
          border: 1px solid var(--color-border, #334155);
          border-radius: 0.5rem;
          padding: 0.25rem;
        }
        .notes-tab {
          padding: 0.35rem 0.875rem;
          border-radius: 0.375rem;
          border: none;
          background: transparent;
          color: var(--color-text-muted, #94a3b8);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .notes-tab:hover {
          color: var(--color-text-primary, #f1f5f9);
        }
        .notes-tab--active {
          background: var(--color-primary, #6366f1);
          color: #fff;
        }

        /* ── Grid ── */
        .notes-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .notes-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .notes-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* ── Note card ── */
        .note-card {
          border-radius: 0.75rem;
          border: 1px solid var(--color-border, #334155);
          background: var(--color-surface, #1e293b);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: border-color 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .note-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        }
        .note-card--pinned {
          border-color: #ca8a04;
          box-shadow: 0 0 0 1px #ca8a0440;
        }
        .note-card--archived {
          opacity: 0.55;
        }
        .note-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .note-card-title {
          font-size: 0.975rem;
          font-weight: 600;
          color: var(--color-text-primary, #f1f5f9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          margin: 0;
        }
        .note-card-pin-badge {
          color: #ca8a04;
          flex-shrink: 0;
        }
        .note-card-content {
          font-size: 0.85rem;
          color: var(--color-text-muted, #94a3b8);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
          white-space: pre-wrap;
          word-break: break-word;
          min-height: 3.6em;
        }
        .note-card-meta {
          font-size: 0.73rem;
          color: var(--color-text-muted, #94a3b8);
        }
        .note-card-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.25rem;
          border-top: 1px solid var(--color-border, #334155);
          padding-top: 0.5rem;
        }
        .note-card-action-btn {
          padding: 0.3rem;
          border-radius: 0.375rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted, #94a3b8);
          display: flex;
          align-items: center;
          transition: color 0.15s, background 0.15s;
        }
        .note-card-action-btn:hover {
          background: var(--color-hover, #334155);
          color: var(--color-text-primary, #f1f5f9);
        }
        .note-card-action-btn--pin-active {
          color: #ca8a04;
        }
        .note-card-action-btn--delete:hover {
          color: #ef4444;
        }
        .note-card-spacer { flex: 1; }

        /* ── Empty state ── */
        .notes-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 4rem 1rem;
          text-align: center;
        }
        .notes-empty-icon {
          color: var(--color-text-muted, #94a3b8);
          opacity: 0.5;
        }
        .notes-empty-text {
          color: var(--color-text-muted, #94a3b8);
          font-size: 0.95rem;
          margin: 0;
        }

        /* ── Modal form ── */
        .notes-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .notes-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .notes-form-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text-primary, #f1f5f9);
        }
        .notes-form-required {
          color: #ef4444;
        }
        .notes-form-input,
        .notes-form-textarea {
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border, #334155);
          background: var(--color-bg, #0f172a);
          color: var(--color-text-primary, #f1f5f9);
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .notes-form-textarea {
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
          line-height: 1.6;
        }
        .notes-form-input:focus,
        .notes-form-textarea:focus {
          border-color: var(--color-primary, #6366f1);
        }
        .notes-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}

// ─── Note Card sub-component ────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onPin, onArchive }) {
  const cardClass = [
    'note-card',
    note.pinned && !note.archived ? 'note-card--pinned' : '',
    note.archived ? 'note-card--archived' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      <div className="note-card-header">
        <h3 className="note-card-title" title={note.title}>
          {note.title || 'Untitled'}
        </h3>
        {note.pinned && !note.archived && (
          <Pin size={14} className="note-card-pin-badge" />
        )}
      </div>

      <p className="note-card-content">
        {note.content || <span style={{ fontStyle: 'italic' }}>No content</span>}
      </p>

      <span className="note-card-meta">
        {note.updated_at !== note.created_at
          ? `Updated ${formatDate(note.updated_at)}`
          : `Created ${formatDate(note.created_at)}`}
      </span>

      <div className="note-card-actions">
        {/* Pin */}
        <button
          className={`note-card-action-btn${note.pinned ? ' note-card-action-btn--pin-active' : ''}`}
          title={note.pinned ? 'Unpin' : 'Pin'}
          onClick={onPin}
        >
          <Pin size={15} />
        </button>

        {/* Archive / Restore */}
        <button
          className="note-card-action-btn"
          title={note.archived ? 'Restore' : 'Archive'}
          onClick={onArchive}
        >
          {note.archived ? <ArchiveX size={15} /> : <Archive size={15} />}
        </button>

        <span className="note-card-spacer" />

        {/* Edit */}
        <button
          className="note-card-action-btn"
          title="Edit"
          onClick={onEdit}
        >
          <Edit2 size={15} />
        </button>

        {/* Delete */}
        <button
          className="note-card-action-btn note-card-action-btn--delete"
          title="Delete"
          onClick={onDelete}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
