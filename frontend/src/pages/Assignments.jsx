import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { KEYS, getList, setItem, generateId } from '../utils/storage';
import { addActivity } from '../utils/activity';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

const FILTERS = ['All', 'Pending', 'In Progress', 'Submitted'];

const STATUS_FILTER_MAP = {
  'Pending': 'pending',
  'In Progress': 'in_progress',
  'Submitted': 'submitted',
};

const STATUS_BADGE_VARIANT = {
  submitted: 'success',
  pending: 'warning',
  in_progress: 'primary',
  late: 'danger',
};

const PRIORITY_BADGE_VARIANT = {
  High: 'danger',
  Medium: 'warning',
  Low: 'primary',
};

const INITIAL_FORM = {
  title: '',
  subject: '',
  priority: 'Medium',
  status: 'pending',
  due_date: '',
  description: '',
};

export default function Assignments() {
  const [assignments, setAssignments] = useState(() => getList(KEYS.assignments));
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  /* ─── helpers ─── */
  const openAddModal = () => {
    setEditingAssignment(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      subject: assignment.subject,
      priority: assignment.priority,
      status: assignment.status,
      due_date: assignment.due_date,
      description: assignment.description,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
    setFormData(INITIAL_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ─── submit (create / update) ─── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const current = getList(KEYS.assignments);

    if (editingAssignment) {
      const updated = current.map((a) =>
        a.id === editingAssignment.id ? { ...a, ...formData } : a
      );
      setItem(KEYS.assignments, updated);
      setAssignments(updated);
      addActivity(`Updated assignment: ${formData.title}`);
      toast.success('Assignment updated');
    } else {
      const newAssignment = {
        id: generateId(),
        ...formData,
        created_at: new Date().toISOString(),
      };
      const updated = [newAssignment, ...current];
      setItem(KEYS.assignments, updated);
      setAssignments(updated);
      addActivity(`Added assignment: ${formData.title}`);
      toast.success('Assignment added');
    }

    closeModal();
  };

  /* ─── delete ─── */
  const deleteAssignment = (assignment) => {
    if (!window.confirm(`Delete "${assignment.title}"?`)) return;
    const updated = getList(KEYS.assignments).filter((a) => a.id !== assignment.id);
    setItem(KEYS.assignments, updated);
    setAssignments(updated);
    addActivity(`Deleted assignment: ${assignment.title}`);
    toast.success('Assignment deleted');
  };

  /* ─── derived ─── */
  const now = new Date();

  const filteredAssignments = assignments.filter((a) => {
    const matchSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'All' || a.status === STATUS_FILTER_MAP[filter];
    return matchSearch && matchFilter;
  });

  const totalCount = assignments.length;
  const pendingCount = assignments.filter((a) => a.status === 'pending').length;
  const submittedCount = assignments.filter((a) => a.status === 'submitted').length;

  const isOverdue = (a) =>
    a.due_date && new Date(a.due_date) < now && a.status !== 'submitted';

  /* ─── render ─── */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Assignments</h1>
          <p className="text-text-secondary text-sm mt-1">
            Track and manage your academic assignments
          </p>
        </div>
        <Button onClick={openAddModal} icon={<Plus size={16} />}>
          Add Assignment
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{totalCount}</p>
          <p className="text-xs text-text-secondary mt-1">Total</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-xs text-text-secondary mt-1">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{submittedCount}</p>
          <p className="text-xs text-text-secondary mt-1">Submitted</p>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by title or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment list */}
      {filteredAssignments.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-4">
          <BookOpen size={48} className="text-text-secondary opacity-40" />
          <div>
            <p className="text-text-primary font-medium">No assignments found</p>
            <p className="text-text-secondary text-sm mt-1">
              {search || filter !== 'All'
                ? 'Try adjusting your search or filter'
                : 'Click "Add Assignment" to get started'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAssignments.map((assignment) => {
            const overdue = isOverdue(assignment);
            return (
              <Card
                key={assignment.id}
                className="p-5 group relative hover:shadow-lg transition-shadow"
              >
                {/* Overdue indicator */}
                {overdue && (
                  <div className="flex items-center gap-1 text-danger text-xs font-semibold mb-2">
                    <AlertCircle size={13} />
                    Overdue
                  </div>
                )}

                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-text-primary leading-tight line-clamp-2">
                    {assignment.title}
                  </h3>
                  {/* Action buttons (hover reveal) */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openEditModal(assignment)}
                      className="p-1.5 rounded-md hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteAssignment(assignment)}
                      className="p-1.5 rounded-md hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subject */}
                {assignment.subject && (
                  <p className="text-text-secondary text-sm mt-1">{assignment.subject}</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={STATUS_BADGE_VARIANT[assignment.status] || 'primary'}>
                    {assignment.status === 'in_progress'
                      ? 'In Progress'
                      : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </Badge>
                  <Badge variant={PRIORITY_BADGE_VARIANT[assignment.priority] || 'primary'}>
                    {assignment.priority}
                  </Badge>
                </div>

                {/* Due date */}
                {assignment.due_date && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-text-secondary">
                    <Clock size={12} />
                    <span>
                      Due {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                {/* Description preview */}
                {assignment.description && (
                  <p className="text-text-secondary text-xs mt-2 line-clamp-2">
                    {assignment.description}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Assignment title"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Subject
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Mathematics"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes or details…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingAssignment ? 'Save Changes' : 'Add Assignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
