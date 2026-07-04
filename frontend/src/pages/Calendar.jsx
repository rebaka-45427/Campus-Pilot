import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckSquare, BookOpen } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Badge from '../components/Badge';
import api from '../services/api';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState({ tasks: [], assignments: [] });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const [tasksRes, assignmentsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/assignments')
      ]);
      setEvents({ tasks: tasksRes.data, assignments: assignmentsRes.data });
    } catch (error) {
      toast.error('Failed to load events');
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = day => setSelectedDate(day);

  // Generate Calendar Grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Check events for this day
      const dayTasks = events.tasks.filter(t => t.deadline && isSameDay(parseISO(t.deadline), cloneDay));
      const dayAssignments = events.assignments.filter(a => a.deadline && isSameDay(parseISO(a.deadline), cloneDay));
      const hasEvents = dayTasks.length > 0 || dayAssignments.length > 0;

      days.push(
        <div
          className={`relative p-2 min-h-[100px] border border-gray-100 transition-colors cursor-pointer ${
            !isSameMonth(day, monthStart)
              ? "bg-gray-50/50 text-gray-300"
              : isSameDay(day, selectedDate)
              ? "bg-primary/5 border-primary/20"
              : "bg-white hover:bg-gray-50"
          }`}
          key={day}
          onClick={() => onDateClick(cloneDay)}
        >
          <div className="flex justify-between items-start">
            <span className={`font-medium text-sm ${isSameDay(day, new Date()) ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
              {formattedDate}
            </span>
            {hasEvents && (
              <div className="flex gap-1">
                {dayTasks.length > 0 && <div className="w-2 h-2 rounded-full bg-warning"></div>}
                {dayAssignments.length > 0 && <div className="w-2 h-2 rounded-full bg-primary"></div>}
              </div>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {dayAssignments.slice(0, 2).map(a => (
              <div key={`a-${a.id}`} className="text-xs truncate bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                Asg: {a.title}
              </div>
            ))}
            {dayTasks.slice(0, 2).map(t => (
              <div key={`t-${t.id}`} className="text-xs truncate bg-warning/10 text-warning px-1.5 py-0.5 rounded font-medium">
                {t.title}
              </div>
            ))}
            {(dayTasks.length + dayAssignments.length) > 4 && (
              <div className="text-xs text-gray-400 font-medium pl-1">
                +{(dayTasks.length + dayAssignments.length) - 4} more
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day}>
        {days}
      </div>
    );
    days = [];
  }

  // Selected Day Events
  const selectedTasks = events.tasks.filter(t => t.deadline && isSameDay(parseISO(t.deadline), selectedDate));
  const selectedAssignments = events.assignments.filter(a => a.deadline && isSameDay(parseISO(a.deadline), selectedDate));

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-500 mt-1">Track your deadlines across the month.</p>
        </div>
        <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft size={20} /></button>
          <span className="font-bold text-lg min-w-[120px] text-center">{format(currentDate, "MMMM yyyy")}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="col-span-1 lg:col-span-3 p-0 overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          <div>{rows}</div>
        </Card>

        <Card className="col-span-1 h-fit">
          <h3 className="font-bold text-lg text-gray-900 mb-2">{format(selectedDate, "EEEE, MMM do")}</h3>
          <p className="text-sm text-gray-500 mb-6">Events for this day</p>

          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center">
                <BookOpen size={16} className="mr-2 text-primary" /> Assignments ({selectedAssignments.length})
              </h4>
              <div className="space-y-2">
                {selectedAssignments.length === 0 ? <p className="text-xs text-gray-400">None</p> : 
                  selectedAssignments.map(a => (
                    <div key={a.id} className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                      <div className="font-bold text-primary">{a.subject}</div>
                      <div className="text-gray-900 font-medium">{a.title}</div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center">
                <CheckSquare size={16} className="mr-2 text-warning" /> Tasks ({selectedTasks.length})
              </h4>
              <div className="space-y-2">
                {selectedTasks.length === 0 ? <p className="text-xs text-gray-400">None</p> : 
                  selectedTasks.map(t => (
                    <div key={t.id} className="p-3 bg-warning/5 border border-warning/20 rounded-lg text-sm flex justify-between items-start">
                      <div className="font-medium text-gray-900">{t.title}</div>
                      <Badge variant={t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'gray'}>
                        {t.priority}
                      </Badge>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
