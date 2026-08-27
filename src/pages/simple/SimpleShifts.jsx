import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simpleLifeService } from '../../services/simpleLifeService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { 
  Plus, Loader2, Trash, Calendar, Edit2, 
  Sun, Moon, Sunset, Coffee, Clock, Home, Repeat
} from 'lucide-react';
import Swal from 'sweetalert2';

// Helper to format Date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate duration in hours, handling overnight
const getDuration = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  
  let s = sh + sm/60;
  let e = eh + em/60;
  if (e < s) e += 24; // Overnight
  return parseFloat((e - s).toFixed(2));
};

export default function SimpleShifts() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPatternOpen, setIsPatternOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Forms
  const [shiftForm, setShiftForm] = useState({ date: formatDate(new Date()), shift_type: 'Morning', start_time: '07:00', end_time: '16:00', location: 'Office', notes: '' });
  
  // Update time every minute for countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['simple-shifts', user?.id],
    queryFn: () => simpleLifeService.getShifts(user?.id),
    enabled: !!user?.id
  });

  const { data: homeVisits } = useQuery({
    queryKey: ['simple-visits', user?.id],
    queryFn: () => simpleLifeService.getHomeVisits(user?.id),
    enabled: !!user?.id
  });

  const addMut = useMutation({
    mutationFn: (d) => simpleLifeService.addShift(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-shifts'] });
      setIsAddOpen(false);
      Swal.fire({ icon: 'success', title: 'Shift Added', timer: 1000, showConfirmButton: false });
    }
  });

  const delMut = useMutation({
    mutationFn: (id) => simpleLifeService.deleteShift(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-shifts'] })
  });

  const addMultipleMut = useMutation({
    mutationFn: (arr) => simpleLifeService.addMultipleShifts(arr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-shifts'] });
      setIsPatternOpen(false);
      Swal.fire({ icon: 'success', title: 'Pattern Generated', timer: 1000, showConfirmButton: false });
    }
  });

  // Shift type configurations
  const shiftTypes = {
    'Morning': { icon: <Sun size={18} />, defaultStart: '07:00', defaultEnd: '16:00', color: 'text-amber-500' },
    'Evening': { icon: <Sunset size={18} />, defaultStart: '14:00', defaultEnd: '23:00', color: 'text-orange-500' },
    'Night': { icon: <Moon size={18} />, defaultStart: '22:00', defaultEnd: '07:00', color: 'text-indigo-500' },
    'Off': { icon: <Coffee size={18} />, defaultStart: '', defaultEnd: '', color: 'text-emerald-500' },
    'Custom': { icon: <Clock size={18} />, defaultStart: '09:00', defaultEnd: '17:00', color: 'text-slate-500' }
  };

  const setQuickShift = (type) => {
    setShiftForm({
      ...shiftForm,
      shift_type: type,
      start_time: shiftTypes[type].defaultStart,
      end_time: shiftTypes[type].defaultEnd
    });
  };

  // Derived state calculations
  const d = useMemo(() => {
    if (!shifts) return { todayShift: null, nextShift: null, weekly: [], stats: {}, recent: [], nextFree: null, visitConflict: null };

    const todayStr = formatDate(now);
    
    // Sort shifts
    const sorted = [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Find today's shift
    const todayShift = sorted.find(s => s.date === todayStr) || { date: todayStr, shift_type: 'Off' };
    
    // Find next shift (after today, not 'Off')
    const nextShift = sorted.find(s => s.date > todayStr && s.shift_type !== 'Off');

    // Find next free day
    let nextFree = sorted.find(s => s.date > todayStr && s.shift_type === 'Off');
    if (!nextFree && sorted.length > 0) {
      // If no off day is scheduled, assume the day after the last scheduled shift is free
      const lastShift = sorted[sorted.length - 1];
      const nextDay = new Date(lastShift.date);
      nextDay.setDate(nextDay.getDate() + 1);
      nextFree = { date: formatDate(nextDay), shift_type: 'Off' };
    }

    // Weekly Schedule (Mon-Sun of current week)
    const currentDayOfWeek = now.getDay() || 7; // Make Sunday 7 instead of 0
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek + 1); // Monday
    
    const weekly = [];
    for(let i=0; i<7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const ds = formatDate(date);
      const shift = sorted.find(s => s.date === ds) || { date: ds, shift_type: 'Off' };
      weekly.push({
        date: ds,
        dayName: date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
        shift
      });
    }

    // Monthly Stats
    const mShifts = sorted.filter(s => s.date.startsWith(todayStr.substring(0, 7)));
    let totalHrs = 0;
    const stats = { total: mShifts.length, Morning: 0, Evening: 0, Night: 0, Off: 0, Custom: 0 };
    mShifts.forEach(s => {
      stats[s.shift_type] = (stats[s.shift_type] || 0) + 1;
      if (s.start_time && s.end_time) totalHrs += getDuration(s.start_time, s.end_time);
    });
    stats.hours = totalHrs;

    // Countdown Logic for Today's shift
    let status = 'OFF';
    let countdown = '';
    
    if (todayShift.shift_type !== 'Off' && todayShift.start_time) {
      const [sh, sm] = todayShift.start_time.split(':').map(Number);
      const [eh, em] = (todayShift.end_time || todayShift.start_time).split(':').map(Number);
      
      const startDateTime = new Date(now);
      startDateTime.setHours(sh, sm, 0, 0);
      
      let endDateTime = new Date(now);
      endDateTime.setHours(eh, em, 0, 0);
      if (eh < sh) endDateTime.setDate(endDateTime.getDate() + 1); // Overnight

      if (now < startDateTime) {
        status = 'UPCOMING';
        const diff = startDateTime - now;
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        countdown = `Starts in ${hrs}h ${mins}m`;
      } else if (now >= startDateTime && now <= endDateTime) {
        status = 'ACTIVE';
        const diff = endDateTime - now;
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        countdown = `Ends in ${hrs}h ${mins}m`;
      } else {
        status = 'COMPLETED';
        countdown = 'Shift completed';
      }
    }

    todayShift.status = status;
    todayShift.countdown = countdown;

    // Home Visit Connection
    let visitConflict = null;
    if (homeVisits) {
      const upcomingVisit = homeVisits.find(v => v.departure >= todayStr || (v.return && v.return >= todayStr));
      if (upcomingVisit) {
        const visitShifts = sorted.filter(s => s.date >= upcomingVisit.departure && (!upcomingVisit.return || s.date <= upcomingVisit.return));
        const hasWork = visitShifts.some(s => s.shift_type !== 'Off');
        visitConflict = { visit: upcomingVisit, hasWork, shifts: visitShifts };
      }
    }

    const recent = [...sorted].filter(s => s.date < todayStr).reverse().slice(0, 5);

    return { todayShift, nextShift, weekly, stats, recent, nextFree, visitConflict };
  }, [shifts, homeVisits, now]);

  // Pattern Generator State
  const [patternState, setPatternState] = useState({
    startDate: formatDate(new Date()),
    repeats: 4,
    sequence: [
      { shift_type: 'Night', start_time: '22:00', end_time: '07:00' },
      { shift_type: 'Night', start_time: '22:00', end_time: '07:00' },
      { shift_type: 'Night', start_time: '22:00', end_time: '07:00' },
      { shift_type: 'Off', start_time: '', end_time: '' },
      { shift_type: 'Morning', start_time: '07:00', end_time: '16:00' },
      { shift_type: 'Morning', start_time: '07:00', end_time: '16:00' },
      { shift_type: 'Off', start_time: '', end_time: '' },
    ]
  });

  const generatePattern = () => {
    const toInsert = [];
    let current = new Date(patternState.startDate);
    
    for (let loop = 0; loop < patternState.repeats; loop++) {
      for (const item of patternState.sequence) {
        toInsert.push({
          user_id: user?.id,
          date: formatDate(current),
          shift_type: item.shift_type,
          start_time: item.start_time || null,
          end_time: item.end_time || null,
          location: 'Office'
        });
        current.setDate(current.getDate() + 1);
      }
    }
    addMultipleMut.mutate(toInsert);
  };

  const getFormatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hh = parseInt(h);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 || 12;
    return `${hh}:${m} ${ampm}`;
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-50">Shifts</h2>
          <p className="text-slate-500">{now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> ADD SHIFT
        </button>
      </header>

      {/* Hero: Today's Shift */}
      <Card className={`${d.todayShift?.shift_type === 'Off' ? 'bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm' : d.todayShift?.status === 'ACTIVE' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white' : 'bg-[#111827] text-white dark:border dark:border-zinc-800'} border-none shadow-xl overflow-hidden relative`}>
        <div className="absolute right-0 top-0 opacity-10 -mr-10 -mt-10 pointer-events-none">
          {d.todayShift?.shift_type !== 'Off' ? shiftTypes[d.todayShift.shift_type]?.icon && <div style={{transform: 'scale(10)'}}>{shiftTypes[d.todayShift.shift_type].icon}</div> : <Coffee size={200}/>}
        </div>
        <div className="relative z-10 p-4 md:p-6">
          <p className={`${d.todayShift?.shift_type === 'Off' ? 'text-slate-500' : 'text-indigo-200'} text-sm font-bold tracking-widest uppercase mb-4 flex items-center gap-2`}>
            {d.todayShift?.shift_type === 'Off' ? '☀️ DAY OFF' : d.todayShift?.status === 'ACTIVE' ? '🟢 CURRENTLY WORKING' : '🌙 TODAY\'S SHIFT'}
          </p>
          
          {d.todayShift?.shift_type !== 'Off' ? (
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
              <div>
                <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase">
                  {d.todayShift.shift_type}
                </h3>
                <p className="text-xl font-medium opacity-90">
                  {getFormatTime(d.todayShift.start_time)} → {getFormatTime(d.todayShift.end_time)}
                </p>
                <p className="opacity-70 mt-1">{d.todayShift.location}</p>
              </div>
              <div className="bg-black/20 px-6 py-4 rounded-xl backdrop-blur-sm">
                <p className="font-bold text-lg">{d.todayShift.countdown}</p>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-50 mb-2">No shift today.</h3>
              {d.nextShift && (
                <p className="text-slate-500 font-medium">
                  Next shift: {new Date(d.nextShift.date).toLocaleDateString('en-GB', {weekday: 'long'})} · {getFormatTime(d.nextShift.start_time)}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Shift / Free Day */}
        <Card className="border-none shadow-sm flex flex-col justify-between">
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-3">NEXT SHIFT</p>
          {d.nextShift ? (
            <div>
              <p className="font-bold text-lg text-slate-800 dark:text-zinc-50 mb-1">
                {new Date(d.nextShift.date).toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'short'})}
              </p>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-2">
                {shiftTypes[d.nextShift.shift_type]?.icon} {d.nextShift.shift_type}
              </div>
              <p className="text-slate-500">{getFormatTime(d.nextShift.start_time)} → {getFormatTime(d.nextShift.end_time)}</p>
            </div>
          ) : (
            <p className="text-slate-500 italic">No upcoming shifts scheduled.</p>
          )}
          
          {d.nextFree && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">NEXT FREE DAY</p>
              <p className="font-bold text-emerald-600 flex items-center gap-2"><Coffee size={16}/> {new Date(d.nextFree.date).toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'short'})}</p>
            </div>
          )}
        </Card>

        {/* This Month Stats */}
        <Card className="border-none shadow-sm">
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-3">THIS MONTH ({now.toLocaleDateString('en-GB', {month: 'short'})})</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-slate-800 dark:text-zinc-50">{d.stats.total}</span>
            <span className="text-slate-500 font-medium">Shifts Scheduled</span>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> <span className="text-slate-500 w-16">Night</span> <span className="font-bold">{d.stats.Night}</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> <span className="text-slate-500 w-16">Morning</span> <span className="font-bold">{d.stats.Morning}</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> <span className="text-slate-500 w-16">Evening</span> <span className="font-bold">{d.stats.Evening}</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className="text-slate-500 w-16">Off</span> <span className="font-bold">{d.stats.Off}</span></div>
          </div>
          
          <div className="bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm p-3 rounded-xl border border-slate-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Total Work Hours</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">{d.stats.hours} hrs</span>
          </div>
        </Card>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-2">
        <h3 className="font-bold text-slate-800 dark:text-zinc-50 uppercase text-sm tracking-wider ml-2">WEEKLY SCHEDULE</h3>
        <Card className="p-0 border-none shadow-sm overflow-hidden">
          <div className="flex flex-col md:grid md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-zinc-800">
            {d.weekly.map((day, i) => {
              const isToday = day.date === formatDate(now);
              return (
                <div key={i} className={`p-3 md:p-4 text-center ${isToday ? 'bg-indigo-50 dark:bg-indigo-500/15' : 'bg-white dark:bg-zinc-900/90 backdrop-blur-sm'} flex md:flex-col items-center justify-between md:justify-start gap-4 md:gap-0`}>
                  <p className={`text-xs md:text-sm font-bold md:mb-3 w-16 md:w-auto text-left md:text-center ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-zinc-400'}`}>{day.dayName}</p>
                  <div className="flex md:flex-col items-center gap-4 md:gap-2 flex-1 md:flex-none justify-end md:justify-center">
                    {day.shift.shift_type !== 'Off' && day.shift.start_time ? (
                      <div className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-zinc-400 flex md:flex-col items-center gap-1 md:gap-0 leading-tight">
                        <p>{day.shift.start_time.split(':')[0]}</p>
                        <p className="text-slate-300 md:my-0.5">-</p>
                        <p>{day.shift.end_time?.split(':')[0]}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-emerald-500 md:mt-2">OFF</p>
                    )}
                    <div className={`p-2 rounded-full ${day.shift.shift_type !== 'Off' ? 'bg-slate-100 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300' : 'text-[#10B981]'}`}>
                      {shiftTypes[day.shift.shift_type]?.icon || <Coffee size={18}/>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Home Visit Connection */}
      {d.visitConflict && (
        <Card className="border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <Home size={24} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase mb-1">Upcoming Home Visit</p>
              <h4 className="font-bold text-slate-800 dark:text-zinc-50 mb-2">
                {new Date(d.visitConflict.visit.departure).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} 
                {d.visitConflict.visit.return && ` → ${new Date(d.visitConflict.visit.return).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`}
              </h4>
              {d.visitConflict.hasWork ? (
                <p className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-3 py-1 rounded-lg inline-block">
                  ⚠️ You have {d.visitConflict.shifts.filter(s => s.shift_type!=='Off').length} shift(s) scheduled during this trip.
                </p>
              ) : (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 px-3 py-1 rounded-lg inline-block">
                  ✅ Schedule is clear for this trip.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Buttons for empty state or actions */}
      <div className="flex gap-4">
        <button onClick={() => setIsAddOpen(true)} className="flex-1 bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 text-slate-700 dark:text-zinc-300 py-3 rounded-xl font-bold transition-colors shadow-sm text-sm">
          + ADD SHIFT
        </button>
        <button onClick={() => setIsPatternOpen(true)} className="flex-1 bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 text-slate-700 dark:text-zinc-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm text-sm">
          <Repeat size={16} className="text-indigo-500"/> CREATE PATTERN
        </button>
      </div>

      {/* Recent Shifts */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-zinc-50 uppercase text-sm tracking-wider ml-2">RECENT SHIFTS</h3>
        {d.recent.length > 0 ? (
          d.recent.map(s => (
            <Card key={s.id} className="p-4 flex justify-between items-center border-none shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl ${shiftTypes[s.shift_type]?.color || 'text-slate-500'}`}>
                  {shiftTypes[s.shift_type]?.icon}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
                    {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/60 text-slate-500 uppercase">{s.shift_type}</span>
                  </p>
                  {s.shift_type !== 'Off' && (
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {getFormatTime(s.start_time)} → {getFormatTime(s.end_time)} • {getDuration(s.start_time, s.end_time)} hrs
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => delMut.mutate(s.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash size={16}/>
              </button>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center border-none shadow-sm">
            <p className="text-slate-500 font-medium">No previous shifts recorded.</p>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Shift">
        <form onSubmit={(e) => { e.preventDefault(); addMut.mutate(shiftForm); }} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Quick Select</label>
            <div className="grid grid-cols-4 gap-2">
              {['Morning', 'Evening', 'Night', 'Off'].map(type => (
                <button 
                  key={type} type="button" onClick={() => setQuickShift(type)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${shiftForm.shift_type === type ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                >
                  {shiftTypes[type].icon}
                  <span className="text-xs font-bold">{type}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
            <input type="date" required value={shiftForm.date} onChange={e => setShiftForm({...shiftForm, date: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm" />
          </div>
          {shiftForm.shift_type !== 'Off' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input type="time" required value={shiftForm.start_time} onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input type="time" required value={shiftForm.end_time} onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
              </div>
            </div>
          )}
          <button type="submit" disabled={addMut.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black mt-6 disabled:opacity-50 transition-colors shadow-md">SAVE SHIFT</button>
        </form>
      </Modal>

      <Modal isOpen={isPatternOpen} onClose={() => setIsPatternOpen(false)} title="Generate Shift Pattern">
        <form onSubmit={(e) => { e.preventDefault(); generatePattern(); }} className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">This will generate a repeating schedule directly into your calendar. Default pattern: 3 Nights, 1 Off, 2 Mornings, 1 Off.</p>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
            <input type="date" required value={patternState.startDate} onChange={e => setPatternState({...patternState, startDate: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Number of Weeks / Repeats</label>
            <input type="number" min="1" max="12" value={patternState.repeats} onChange={e => setPatternState({...patternState, repeats: parseInt(e.target.value)})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm" />
          </div>
          <div className="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl text-sm font-mono text-slate-600 dark:text-zinc-400">
            {patternState.sequence.map((item, i) => (
              <div key={i} className="flex gap-2">
                <span className="w-4">{i+1}.</span>
                <span className="font-bold">{item.shift_type}</span>
              </div>
            ))}
          </div>
          <button type="submit" disabled={addMultipleMut.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black mt-6 disabled:opacity-50 transition-colors shadow-md">
            {addMultipleMut.isPending ? 'GENERATING...' : `GENERATE ${patternState.repeats * patternState.sequence.length} SHIFTS`}
          </button>
        </form>
      </Modal>

    </div>
  );
}
