import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, GraduationCap, Edit2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { KEYS, getList, setItem, generateId } from '../utils/storage';
import { addActivity } from '../utils/activity';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

/* ─── colour scheme helper ─── */
function getColorScheme(pct) {
  if (pct >= 75) {
    return {
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/20',
      fill: '#10B981',
      ring: 'ring-success',
    };
  }
  if (pct >= 60) {
    return {
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      fill: '#F59E0B',
      ring: 'ring-warning',
    };
  }
  return {
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    fill: '#EF4444',
    ring: 'ring-danger',
  };
}

const INITIAL_FORM = { name: '', total_classes: 0, classes_attended: 0 };

export default function Attendance() {
  const [subjects, setSubjects] = useState(() => getList(KEYS.subjects));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  /* ─── helpers ─── */
  const openAddModal = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(INITIAL_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value),
    }));
  };

  /* ─── add / update subject ─── */
  const handleAddSubject = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
    if (Number(formData.classes_attended) > Number(formData.total_classes)) {
      toast.error('Classes attended cannot exceed total classes');
      return;
    }

    const current = getList(KEYS.subjects);

    if (editingId) {
      const updated = current.map((s) =>
        s.id === editingId
          ? {
              ...s,
              name: formData.name,
              total_classes: Number(formData.total_classes),
              classes_attended: Number(formData.classes_attended),
            }
          : s
      );
      setItem(KEYS.subjects, updated);
      setSubjects(updated);
      addActivity(`Updated subject: ${formData.name}`);
      toast.success('Subject updated');
    } else {
      const newSubject = {
        id: generateId(),
        name: formData.name,
        total_classes: Number(formData.total_classes),
        classes_attended: Number(formData.classes_attended),
      };
      const updated = [...current, newSubject];
      setItem(KEYS.subjects, updated);
      setSubjects(updated);
      addActivity(`Added subject: ${formData.name}`);
      toast.success('Subject added');
    }

    closeModal();
  };

  /* ─── edit ─── */
  const handleEditSubject = (subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name,
      total_classes: subject.total_classes,
      classes_attended: subject.classes_attended,
    });
    setIsModalOpen(true);
  };

  /* ─── mark present ─── */
  const handleMarkPresent = (id) => {
    const current = getList(KEYS.subjects);
    const updated = current.map((s) =>
      s.id === id
        ? {
            ...s,
            total_classes: s.total_classes + 1,
            classes_attended: s.classes_attended + 1,
          }
        : s
    );
    setItem(KEYS.subjects, updated);
    setSubjects(updated);
    const subject = updated.find((s) => s.id === id);
    addActivity(`Marked present for subject: ${subject?.name}`);
    toast.success('Marked Present');
  };

  /* ─── mark absent ─── */
  const handleMarkAbsent = (id) => {
    const current = getList(KEYS.subjects);
    const updated = current.map((s) =>
      s.id === id
        ? { ...s, total_classes: s.total_classes + 1 }
        : s
    );
    setItem(KEYS.subjects, updated);
    setSubjects(updated);
    const subject = updated.find((s) => s.id === id);
    addActivity(`Marked absent for subject: ${subject?.name}`);
    toast.success('Marked Absent');
  };

  /* ─── delete ─── */
  const handleDelete = (id) => {
    const subject = subjects.find((s) => s.id === id);
    if (!window.confirm(`Delete "${subject?.name}"?`)) return;
    const updated = getList(KEYS.subjects).filter((s) => s.id !== id);
    setItem(KEYS.subjects, updated);
    setSubjects(updated);
    toast.success('Subject deleted');
  };

  /* ─── computed stats ─── */
  const totalClasses = subjects.reduce((s, sub) => s + (sub.total_classes || 0), 0);
  const totalAttended = subjects.reduce((s, sub) => s + (sub.classes_attended || 0), 0);
  const overallPercentage =
    totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

  const overallScheme = getColorScheme(overallPercentage);

  /* ─── render ─── */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
          <p className="text-text-secondary text-sm mt-1">
            Monitor your attendance across all subjects
          </p>
        </div>
        <Button onClick={openAddModal} icon={<Plus size={16} />}>
          Add Subject
        </Button>
      </div>

      {/* Overview card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Circular SVG progress ring */}
          <div className="relative shrink-0">
            <svg width="160" height="160" className="-rotate-90">
              {/* Background track */}
              <circle
                cx="80"
                cy="80"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-bg-secondary"
                strokeDasharray="251 251"
              />
              {/* Progress arc */}
              <circle
                cx="80"
                cy="80"
                r="40"
                fill="none"
                stroke={overallScheme.fill}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${overallPercentage * 2.51} 251`}
                className="transition-all duration-700"
              />
            </svg>
            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${overallScheme.color}`}>
                {overallPercentage}%
              </span>
              <span className="text-text-secondary text-xs">Overall</span>
            </div>
          </div>

          {/* Semester stats */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
            <div className={`rounded-xl p-4 ${overallScheme.bg} border ${overallScheme.border}`}>
              <p className={`text-2xl font-bold ${overallScheme.color}`}>{overallPercentage}%</p>
              <p className="text-text-secondary text-sm mt-1">Attendance Rate</p>
            </div>
            <div className="rounded-xl p-4 bg-bg-secondary border border-border">
              <p className="text-2xl font-bold text-text-primary">{totalAttended}</p>
              <p className="text-text-secondary text-sm mt-1">Classes Attended</p>
            </div>
            <div className="rounded-xl p-4 bg-bg-secondary border border-border">
              <p className="text-2xl font-bold text-text-primary">{totalClasses}</p>
              <p className="text-text-secondary text-sm mt-1">Total Classes</p>
            </div>
            <div className="rounded-xl p-4 bg-bg-secondary border border-border">
              <p className="text-2xl font-bold text-text-primary">{subjects.length}</p>
              <p className="text-text-secondary text-sm mt-1">Subjects</p>
            </div>
            <div className="rounded-xl p-4 bg-bg-secondary border border-border col-span-2 sm:col-span-2">
              <div className="flex items-center gap-2">
                {overallPercentage >= 75 ? (
                  <CheckCircle2 size={16} className="text-success" />
                ) : (
                  <AlertCircle size={16} className="text-danger" />
                )}
                <p className={`text-sm font-medium ${overallScheme.color}`}>
                  {overallPercentage >= 75
                    ? 'Great! You meet the 75% requirement'
                    : `Need ${Math.max(0, Math.ceil((75 * totalClasses - 100 * totalAttended) / 25))} more classes to reach 75%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Subject cards */}
      {subjects.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-4">
          <GraduationCap size={48} className="text-text-secondary opacity-40" />
          <div>
            <p className="text-text-primary font-medium">No subjects added yet</p>
            <p className="text-text-secondary text-sm mt-1">
              Click "Add Subject" to start tracking attendance
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => {
            const pct =
              subject.total_classes === 0
                ? 0
                : Math.round((subject.classes_attended / subject.total_classes) * 100);
            const scheme = getColorScheme(pct);

            return (
              <Card key={subject.id} className="p-5 group">
                {/* Subject name + actions */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-semibold text-text-primary">{subject.name}</h3>
                    <p className="text-text-secondary text-xs mt-0.5">
                      {subject.classes_attended} / {subject.total_classes} classes
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditSubject(subject)}
                      className="p-1.5 rounded-md hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
                      className="p-1.5 rounded-md hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Percentage label */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${scheme.color}`}>{pct}%</span>
                  {pct < 75 && (
                    <span className="text-xs text-danger flex items-center gap-1">
                      <AlertCircle size={11} /> Below 75%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-bg-secondary overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: scheme.fill }}
                  />
                </div>

                {/* Mark present / absent buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkPresent(subject.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    Present
                  </button>
                  <button
                    onClick={() => handleMarkAbsent(subject.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-colors"
                  >
                    <XCircle size={14} />
                    Absent
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Subject' : 'Add Subject'}
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          {/* Subject name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Subject Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Mathematics"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          {/* Total classes */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Total Classes
            </label>
            <input
              type="number"
              name="total_classes"
              value={formData.total_classes}
              onChange={handleChange}
              min={0}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Classes attended */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Classes Attended
            </label>
            <input
              type="number"
              name="classes_attended"
              value={formData.classes_attended}
              onChange={handleChange}
              min={0}
              max={formData.total_classes}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {Number(formData.classes_attended) > Number(formData.total_classes) && (
              <p className="text-danger text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={11} />
                Cannot exceed total classes
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Save Changes' : 'Add Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
