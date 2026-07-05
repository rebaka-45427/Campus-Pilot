import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, CalendarClock, Clock } from 'lucide-react';
import { KEYS, getList, setItem, generateId } from '../utils/storage';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const EMPTY_FORM = {
  day: 'Monday',
  subject: '',
  start_time: '',
  end_time: '',
  room: '',
};

function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function WeeklyTimetable() {
  const [slots, setSlots]           = useState(() => getList(KEYS.timetable));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData]       = useState({ ...EMPTY_FORM });

  // ─── Persist helper ───────────────────────────────────────────────────────
  const persist = (updated) => {
    setItem(KEYS.timetable, updated);
    setSlots(updated);
  };

  // ─── Slots per day ────────────────────────────────────────────────────────
  const getSlotsForDay = useMemo(
    () => (day) =>
      slots
        .filter(s => s.day === day)
        .sort((a, b) => (a.start_time < b.start_time ? -1 : 1)),
    [slots],
  );

  const totalSlots = slots.length;

  // ─── Modal helpers ────────────────────────────────────────────────────────
  const openModal = (slot = null) => {
    setEditingSlot(slot);
    setFormData(
      slot
        ? { day: slot.day, subject: slot.subject, start_time: slot.start_time, end_time: slot.end_time, room: slot.room || '' }
        : { ...EMPTY_FORM },
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
    setFormData({ ...EMPTY_FORM });
  };

  const setField = (key) => (e) =>
    setFormData(p => ({ ...p, [key]: e.target.value }));

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const { day, subject, start_time, end_time, room } = formData;

    if (!subject.trim()) {
      toast.error('Subject is required.');
      return;
    }
    if (!start_time || !end_time) {
      toast.error('Start and end times are required.');
      return;
    }
    if (start_time >= end_time) {
      toast.error('End time must be after start time.');
      return;
    }

    let updated;
    if (editingSlot) {
      updated = slots.map(s =>
        s.id === editingSlot.id
          ? { ...s, day, subject: subject.trim(), start_time, end_time, room: room.trim() }
          : s,
      );
      toast.success('Class updated.');
    } else {
      const newSlot = {
        id: generateId(),
        day,
        subject: subject.trim(),
        start_time,
        end_time,
        room: room.trim(),
        created_at: new Date().toISOString(),
      };
      updated = [...slots, newSlot];
      toast.success('Class added.');
    }

    persist(updated);
    closeModal();
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteSlot = (id) => {
    if (!window.confirm('Remove this class from the timetable?')) return;
    const updated = slots.filter(s => s.id !== id);
    persist(updated);
    toast.success('Class removed.');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="tt-page">
      {/* ── Header ── */}
      <div className="tt-header">
        <div className="tt-header-left">
          <CalendarClock size={28} className="tt-title-icon" />
          <h1 className="tt-title">Weekly Timetable</h1>
        </div>
        <Button variant="primary" onClick={() => openModal()} className="tt-add-btn">
          <Plus size={16} />
          Add Class
        </Button>
      </div>

      {/* ── Sub-header info ── */}
      <p className="tt-subtitle">
        {totalSlots === 0
          ? 'No classes scheduled yet.'
          : `${totalSlots} class${totalSlots !== 1 ? 'es' : ''} scheduled across the week`}
      </p>

      {/* ── Timetable grid ── */}
      {totalSlots === 0 ? (
        <div className="tt-empty">
          <CalendarClock size={52} className="tt-empty-icon" />
          <p className="tt-empty-text">Your timetable is empty.</p>
          <p className="tt-empty-sub">Add your first class to get started.</p>
          <Button variant="primary" onClick={() => openModal()}>
            <Plus size={16} /> Add Class
          </Button>
        </div>
      ) : (
        <div className="tt-grid-wrap">
          <div className="tt-grid">
            {DAYS.map(day => {
              const daySlots = getSlotsForDay(day);
              return (
                <div key={day} className="tt-day-col">
                  <div className="tt-day-header">
                    <span className="tt-day-name">{day}</span>
                    {daySlots.length > 0 && (
                      <span className="tt-day-badge">{daySlots.length}</span>
                    )}
                  </div>
                  <div className="tt-day-slots">
                    {daySlots.length === 0 ? (
                      <div className="tt-day-empty">
                        <span className="tt-day-empty-text">Free day</span>
                      </div>
                    ) : (
                      daySlots.map(slot => (
                        <SlotCard
                          key={slot.id}
                          slot={slot}
                          onEdit={() => openModal(slot)}
                          onDelete={() => deleteSlot(slot.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSlot ? 'Edit Class' : 'Add Class'}
      >
        <form onSubmit={handleSubmit} className="tt-form">
          {/* Day */}
          <div className="tt-form-group">
            <label htmlFor="tt-day" className="tt-form-label">Day</label>
            <select
              id="tt-day"
              className="tt-form-select"
              value={formData.day}
              onChange={setField('day')}
            >
              {DAYS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="tt-form-group">
            <label htmlFor="tt-subject" className="tt-form-label">
              Subject <span className="tt-form-required">*</span>
            </label>
            <input
              id="tt-subject"
              type="text"
              className="tt-form-input"
              placeholder="e.g. Calculus II"
              value={formData.subject}
              onChange={setField('subject')}
              autoFocus
            />
          </div>

          {/* Times */}
          <div className="tt-form-row">
            <div className="tt-form-group tt-form-group--half">
              <label htmlFor="tt-start" className="tt-form-label">
                Start Time <span className="tt-form-required">*</span>
              </label>
              <input
                id="tt-start"
                type="time"
                className="tt-form-input"
                value={formData.start_time}
                onChange={setField('start_time')}
              />
            </div>
            <div className="tt-form-group tt-form-group--half">
              <label htmlFor="tt-end" className="tt-form-label">
                End Time <span className="tt-form-required">*</span>
              </label>
              <input
                id="tt-end"
                type="time"
                className="tt-form-input"
                value={formData.end_time}
                onChange={setField('end_time')}
              />
            </div>
          </div>

          {/* Room */}
          <div className="tt-form-group">
            <label htmlFor="tt-room" className="tt-form-label">Room / Location</label>
            <input
              id="tt-room"
              type="text"
              className="tt-form-input"
              placeholder="e.g. Room 204, Online"
              value={formData.room}
              onChange={setField('room')}
            />
          </div>

          <div className="tt-form-actions">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingSlot ? 'Save Changes' : 'Add Class'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Scoped styles ── */}
      <style>{`
        /* ── Page ── */
        .tt-page {
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ── Header ── */
        .tt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .tt-header-left {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .tt-title-icon {
          color: var(--color-primary, #6366f1);
        }
        .tt-title {
          font-size: 1.625rem;
          font-weight: 700;
          margin: 0;
          color: var(--color-text-primary, #f1f5f9);
        }
        .tt-add-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .tt-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted, #94a3b8);
          margin: 0;
        }

        /* ── Grid wrapper (horizontal scroll on mobile) ── */
        .tt-grid-wrap {
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }
        .tt-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(130px, 1fr));
          gap: 0.75rem;
          min-width: 700px;
        }

        /* ── Day column ── */
        .tt-day-col {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 0;
        }
        .tt-day-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.625rem;
          border-radius: 0.5rem;
          background: var(--color-surface, #1e293b);
          border: 1px solid var(--color-border, #334155);
        }
        .tt-day-name {
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--color-text-primary, #f1f5f9);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tt-day-badge {
          font-size: 0.7rem;
          font-weight: 700;
          background: var(--color-primary, #6366f1);
          color: #fff;
          border-radius: 9999px;
          padding: 0.1rem 0.45rem;
          min-width: 1.2rem;
          text-align: center;
        }
        .tt-day-slots {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        /* ── Day empty placeholder ── */
        .tt-day-empty {
          border-radius: 0.5rem;
          border: 1px dashed var(--color-border, #334155);
          padding: 1rem 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70px;
        }
        .tt-day-empty-text {
          font-size: 0.75rem;
          color: var(--color-text-muted, #94a3b8);
          opacity: 0.5;
        }

        /* ── Slot card ── */
        .tt-slot-card {
          border-radius: 0.5rem;
          border: 1px solid var(--color-border, #334155);
          background: var(--color-surface, #1e293b);
          padding: 0.625rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          position: relative;
          transition: border-color 0.15s, box-shadow 0.15s;
          overflow: hidden;
        }
        .tt-slot-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--color-primary, #6366f1);
          border-radius: 3px 0 0 3px;
        }
        .tt-slot-card:hover {
          border-color: var(--color-primary, #6366f1);
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.15);
        }
        .tt-slot-card:hover .tt-slot-actions {
          opacity: 1;
          pointer-events: auto;
        }
        .tt-slot-subject {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--color-text-primary, #f1f5f9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 0.25rem;
        }
        .tt-slot-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.73rem;
          color: var(--color-primary, #6366f1);
          font-weight: 500;
        }
        .tt-slot-time-icon {
          flex-shrink: 0;
        }
        .tt-slot-room {
          font-size: 0.72rem;
          color: var(--color-text-muted, #94a3b8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tt-slot-actions {
          display: flex;
          gap: 0.2rem;
          justify-content: flex-end;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
          margin-top: 0.25rem;
        }
        .tt-slot-btn {
          padding: 0.25rem;
          border-radius: 0.3rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted, #94a3b8);
          display: flex;
          align-items: center;
          transition: color 0.15s, background 0.15s;
        }
        .tt-slot-btn:hover {
          background: var(--color-hover, #334155);
          color: var(--color-text-primary, #f1f5f9);
        }
        .tt-slot-btn--delete:hover {
          color: #ef4444;
        }

        /* ── Empty state (no slots at all) ── */
        .tt-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 5rem 1rem;
          text-align: center;
        }
        .tt-empty-icon {
          color: var(--color-text-muted, #94a3b8);
          opacity: 0.4;
        }
        .tt-empty-text {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--color-text-primary, #f1f5f9);
          margin: 0;
        }
        .tt-empty-sub {
          font-size: 0.875rem;
          color: var(--color-text-muted, #94a3b8);
          margin: 0;
        }

        /* ── Modal form ── */
        .tt-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .tt-form-row {
          display: flex;
          gap: 0.75rem;
        }
        .tt-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .tt-form-group--half {
          flex: 1;
        }
        .tt-form-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text-primary, #f1f5f9);
        }
        .tt-form-required {
          color: #ef4444;
        }
        .tt-form-input,
        .tt-form-select {
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border, #334155);
          background: var(--color-bg, #0f172a);
          color: var(--color-text-primary, #f1f5f9);
          font-size: 0.9rem;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .tt-form-select {
          appearance: none;
          cursor: pointer;
        }
        .tt-form-input:focus,
        .tt-form-select:focus {
          border-color: var(--color-primary, #6366f1);
        }
        .tt-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}

// ─── Slot Card sub-component ─────────────────────────────────────────────────
function SlotCard({ slot, onEdit, onDelete }) {
  return (
    <div className="tt-slot-card">
      <span className="tt-slot-subject" title={slot.subject}>
        {slot.subject}
      </span>
      <span className="tt-slot-time">
        <Clock size={11} className="tt-slot-time-icon" />
        {fmt12(slot.start_time)} – {fmt12(slot.end_time)}
      </span>
      {slot.room && (
        <span className="tt-slot-room" title={slot.room}>
          📍 {slot.room}
        </span>
      )}
      <div className="tt-slot-actions">
        <button className="tt-slot-btn" title="Edit" onClick={onEdit}>
          <Edit2 size={13} />
        </button>
        <button className="tt-slot-btn tt-slot-btn--delete" title="Remove" onClick={onDelete}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
