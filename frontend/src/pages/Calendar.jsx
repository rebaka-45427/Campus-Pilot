import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, CheckSquare, CalendarDays } from 'lucide-react';
import { KEYS, getList } from '../utils/storage';
import Card from '../components/Card';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const tasks = useMemo(() => getList(KEYS.tasks), []);
  const assignments = useMemo(() => getList(KEYS.assignments), []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const prevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const nextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  // Build events map: key = 'YYYY-MM-DD', value = { tasks: [], assignments: [] }
  const eventsMap = useMemo(() => {
    const map = {};

    const key = (date) => {
      const d = new Date(date);
      if (isNaN(d)) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    tasks.forEach(task => {
      const k = key(task.due_date || task.dueDate);
      if (!k) return;
      if (!map[k]) map[k] = { tasks: [], assignments: [] };
      map[k].tasks.push(task);
    });

    assignments.forEach(a => {
      const k = key(a.due_date || a.dueDate);
      if (!k) return;
      if (!map[k]) map[k] = { tasks: [], assignments: [] };
      map[k].assignments.push(a);
    });

    return map;
  }, [tasks, assignments]);

  // Build calendar cells: null = empty padding, number = day
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const getEventsForDay = (day) => {
    if (!day) return { tasks: [], assignments: [] };
    const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsMap[k] || { tasks: [], assignments: [] };
  };

  const isToday = (day) => {
    if (!day) return false;
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  // Count total events this month
  const monthEventCount = useMemo(() => {
    let t = 0, a = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ev = getEventsForDay(d);
      t += ev.tasks.length;
      a += ev.assignments.length;
    }
    return { tasks: t, assignments: a };
  }, [eventsMap, year, month, daysInMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-400" />
            Calendar
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {monthEventCount.tasks} tasks · {monthEventCount.assignments} assignments this month
          </p>
        </div>
        <button
          onClick={goToToday}
          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        >
          Today
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/60">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-white font-bold text-lg tracking-wide">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-700/60">
          {DAY_NAMES.map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const events = getEventsForDay(day);
            const allEvents = [
              ...events.tasks.map(t => ({ ...t, _type: 'task' })),
              ...events.assignments.map(a => ({ ...a, _type: 'assignment' })),
            ];
            const visible = allEvents.slice(0, 2);
            const overflow = allEvents.length - visible.length;
            const todayCell = isToday(day);

            return (
              <div
                key={idx}
                className={`min-h-[90px] p-1.5 border-b border-r border-gray-700/40 last:border-r-0
                  ${!day ? 'bg-gray-900/30' : 'hover:bg-gray-800/40 transition-colors'}
                  ${idx % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                {day && (
                  <>
                    {/* Day Number */}
                    <div className="flex justify-end mb-1">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                          ${todayCell
                            ? 'bg-purple-500 text-white'
                            : 'text-gray-400 hover:text-white'
                          }`}
                      >
                        {day}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="space-y-0.5">
                      {visible.map((event, eIdx) => (
                        <EventPill key={eIdx} event={event} />
                      ))}
                      {overflow > 0 && (
                        <div className="text-[10px] text-gray-500 pl-1 font-medium">
                          +{overflow} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-5 text-sm text-gray-400">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <span>Task</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>Assignment</span>
        </div>
      </div>
    </div>
  );
}

function EventPill({ event }) {
  const isTask = event._type === 'task';
  const title = event.title || event.name || 'Untitled';
  const truncated = title.length > 14 ? title.slice(0, 13) + '…' : title;

  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate
        ${isTask
          ? 'bg-purple-900/60 text-purple-300'
          : 'bg-blue-900/60 text-blue-300'
        }`}
      title={title}
    >
      {isTask
        ? <CheckSquare className="w-2.5 h-2.5 flex-shrink-0" />
        : <BookOpen className="w-2.5 h-2.5 flex-shrink-0" />
      }
      <span className="truncate">{truncated}</span>
    </div>
  );
}
