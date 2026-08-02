import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import BookingModal from './components/BookingModal';
import Login from './components/Login';
import StaffManagement from './components/StaffManagement';
import DateRangePicker from './components/DateRangePicker';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  Settings as SettingsIcon, 
  TrendingUp, 
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Plus,
  Search,
  Clock,
  Trophy,
  UserCheck,
  LogOut,
  Hammer,
  Trash2,
  Lock,
  Key,
  BarChart2
} from 'lucide-react';

import Analytics from './components/Analytics';
import EquestrianCalendar from './components/EquestrianCalendar';

const DEFAULT_COURTS = [
  { id: 1, name: 'კორტი 1 (Clay)', type: 'Clay', is_active: true, status: 'active' },
  { id: 2, name: 'კორტი 2 (Hard)', type: 'Hard', is_active: true, status: 'active' },
  { id: 3, name: 'კორტი 3 (Clay)', type: 'Clay', is_active: true, status: 'active' },
  { id: 4, name: 'კორტი 4 (Hard)', type: 'Hard', is_active: true, status: 'active' }
];

const DEFAULT_SETTINGS = [
  { day_type: 'weekday', open_time: '08:00', close_time: '22:00', is_active: true },
  { day_type: 'weekend', open_time: '09:00', close_time: '23:00', is_active: true },
  { day_type: 'holiday', open_time: '10:00', close_time: '18:00', is_active: true }
];

const TennisRacketIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <ellipse cx="12" cy="8" rx="5" ry="6" />
    <line x1="12" y1="2" x2="12" y2="14" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="8.5" y1="5" x2="15.5" y2="5" />
    <line x1="8.5" y1="11" x2="15.5" y2="11" />
    <line x1="12" y1="14" x2="12" y2="22" />
    <path d="M10 22h4" />
  </svg>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'calendar', 'customers', 'staff', 'settings', 'profile', 'analytics'
  const [activeDepartment, setActiveDepartment] = useState('tennis'); // 'tennis' or 'equestrian'
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [settings, setSettings] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({ 
    total_rackets: '20',
    allow_manager_analytics: 'true',
    allow_staff_analytics: 'false',
    eq_max_bookings_per_slot: '2',
    eq_max_horses_per_slot: '6',
    eq_max_ponies_per_slot: '3'
  });
  const [courtClosures, setCourtClosures] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Calendar specific state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourtMobile, setSelectedCourtMobile] = useState(1); // active court on mobile view
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Customer search state
  const [searchQuery, setSearchQuery] = useState('');

  // Settings & court creation states
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtType, setNewCourtType] = useState('Clay');

  // Court closures creation states
  const [closureCourtId, setClosureCourtId] = useState('');
  const [closureDateStart, setClosureDateStart] = useState('');
  const [closureDateEnd, setClosureDateEnd] = useState('');
  const [closureReason, setClosureReason] = useState('');

  // Change Password state for current user
  const [myOldPassword, setMyOldPassword] = useState('');
  const [myNewPassword, setMyNewPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Initial Load & Auth Check
  useEffect(() => {
    // Check persisted login (localStorage so it survives browser restarts)
    const savedUser = localStorage.getItem('tennis_app_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      // For staff, default tab must be calendar
      if (parsedUser.role === 'staff') {
        setActiveTab('calendar');
      } else {
        setActiveTab('dashboard');
      }
      if (parsedUser.department === 'equestrian') {
        setActiveDepartment('equestrian');
      }
    } else {
      setActiveTab('login');
    }
  }, []); // Run only once

  const canSeeAnalytics = currentUser?.role === 'super_admin' || 
    (currentUser?.role === 'manager' && globalSettings.allow_manager_analytics === 'true') ||
    (currentUser?.role === 'staff' && globalSettings.allow_staff_analytics === 'true');

  useEffect(() => {
    async function initApp() {
      setLoading(true);
      try {
        // Try fetching courts to check connection
        const { data: dbCourts, error: courtsError } = await supabase.from('courts').select('*').order('id', { ascending: true });
        if (courtsError) throw courtsError;

        setIsSupabaseConnected(true);
        setCourts(dbCourts || DEFAULT_COURTS);

        const { data: dbSettings } = await supabase.from('court_settings').select('*');
        setSettings(dbSettings?.length ? dbSettings : DEFAULT_SETTINGS);

        const { data: dbBookings } = await supabase.from('bookings').select('*');
        setBookings(dbBookings || []);

        const { data: dbClosures } = await supabase.from('court_closures').select('*');
        setCourtClosures(dbClosures || []);

        const { data: dbGlobal } = await supabase.from('global_settings').select('*');
        if (dbGlobal) {
          const gSettings = { 
            total_rackets: '20',
            allow_manager_analytics: 'true',
            allow_staff_analytics: 'false',
            eq_max_bookings_per_slot: '2',
            eq_max_horses_per_slot: '6',
            eq_max_ponies_per_slot: '3'
          };
          dbGlobal.forEach(s => {
            gSettings[s.key] = s.value;
          });
          setGlobalSettings(gSettings);
        }

        const { data: dbLogs } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        setActivityLogs(dbLogs || []);
      } catch (err) {
        console.warn('Supabase loading error, falling back to LocalStorage:', err.message);
        setIsSupabaseConnected(false);
        
        // Load from LocalStorage
        const localCourts = localStorage.getItem('courts');
        const localSettings = localStorage.getItem('court_settings');
        const localBookings = localStorage.getItem('bookings');
        const localClosures = localStorage.getItem('court_closures');

        if (localCourts) setCourts(JSON.parse(localCourts));
        else {
          setCourts(DEFAULT_COURTS);
          localStorage.setItem('courts', JSON.stringify(DEFAULT_COURTS));
        }

        if (localSettings) setSettings(JSON.parse(localSettings));
        else {
          setSettings(DEFAULT_SETTINGS);
          localStorage.setItem('court_settings', JSON.stringify(DEFAULT_SETTINGS));
        }

        if (localBookings) setBookings(JSON.parse(localBookings));
        else {
          setBookings([]);
          localStorage.setItem('bookings', JSON.stringify([]));
        }

        const localGlobal = localStorage.getItem('global_settings');
        if (localGlobal) setGlobalSettings(JSON.parse(localGlobal));
        else {
          const defGlobal = { 
            total_rackets: '20',
            allow_manager_analytics: 'true',
            allow_staff_analytics: 'false',
            eq_max_bookings_per_slot: '2',
            eq_max_horses_per_slot: '6',
            eq_max_ponies_per_slot: '3'
          };
          setGlobalSettings(defGlobal);
          localStorage.setItem('global_settings', JSON.stringify(defGlobal));
        }

        const localLogs = localStorage.getItem('activity_logs');
        if (localLogs) setActivityLogs(JSON.parse(localLogs));
        else {
          setActivityLogs([]);
          localStorage.setItem('activity_logs', JSON.stringify([]));
        }

        if (localClosures) setCourtClosures(JSON.parse(localClosures));
        else {
          setCourtClosures([]);
          localStorage.setItem('court_closures', JSON.stringify([]));
        }
      } finally {
        setLoading(false);
      }
    }
    initApp();
  }, []);

  // Real-time synchronization & polling fallback for bookings & closures
  useEffect(() => {
    let intervalId;

    if (isSupabaseConnected) {
      // 1. Supabase Realtime Subscription for bookings
      const bookingsChannel = supabase
        .channel('realtime-bookings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          async () => {
            const { data } = await supabase.from('bookings').select('*');
            if (data) setBookings(data);
          }
        )
        .subscribe();

      // 2. Supabase Realtime Subscription for court closures
      const closuresChannel = supabase
        .channel('realtime-closures')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'court_closures' },
          async () => {
            const { data } = await supabase.from('court_closures').select('*');
            if (data) setCourtClosures(data);
          }
        )
        .subscribe();

      // 3. Polling fallback (every 15 seconds) just in case Realtime is disabled
      intervalId = setInterval(async () => {
        const { data: bData } = await supabase.from('bookings').select('*');
        if (bData) setBookings(bData);
        
        const { data: cData } = await supabase.from('court_closures').select('*');
        if (cData) setCourtClosures(cData);
      }, 15000);

      return () => {
        supabase.removeChannel(bookingsChannel);
        supabase.removeChannel(closuresChannel);
        clearInterval(intervalId);
      };
    } else {
      // LocalStorage mode: check if other tabs made changes (every 5 seconds)
      intervalId = setInterval(() => {
        const localBookings = localStorage.getItem('bookings');
        if (localBookings) setBookings(JSON.parse(localBookings));

        const localClosures = localStorage.getItem('court_closures');
        if (localClosures) setCourtClosures(JSON.parse(localClosures));
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [isSupabaseConnected]);

  // Update mobile court view selection automatically if courts list changes
  useEffect(() => {
    if (courts.length > 0 && !courts.some(c => c.id === selectedCourtMobile)) {
      setSelectedCourtMobile(courts[0].id);
    }
  }, [courts]);

  // Auth helper
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('tennis_app_user', JSON.stringify(user));
    if (user.role === 'staff') {
      setActiveTab('calendar');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('tennis_app_user');
    setActiveTab('login');
  };

  const logActivity = async (actionType, details) => {
    if (!currentUser) return;
    
    const newLog = {
      user_id: currentUser.id,
      username: currentUser.username,
      action_type: actionType,
      details: details,
      // Supabase uses default now() for created_at, but we set for local fallback
      created_at: new Date().toISOString() 
    };

    if (isSupabaseConnected) {
      try {
        const { data, error } = await supabase.from('activity_logs').insert({
          user_id: currentUser.id,
          username: currentUser.username,
          action_type: actionType,
          details: details
        }).select();
        if (error) console.error("Error logging activity:", error);
        else if (data) setActivityLogs(prev => [data[0], ...prev].slice(0, 100));
      } catch (err) {
        console.error(err);
      }
    } else {
      const updatedLogs = [newLog, ...activityLogs].slice(0, 100);
      setActivityLogs(updatedLogs);
      localStorage.setItem('activity_logs', JSON.stringify(updatedLogs));
    }
  };

  // Helper: check if a court is closed for a specific date
  const getCourtClosureForDate = (courtId, date) => {
    const dateStr = date.toDateString();
    return courtClosures.find(c => {
      if (c.court_id !== courtId) return false;
      return new Date(c.closure_date).toDateString() === dateStr;
    });
  };

  // Sync bookings
  const handleSaveBooking = async (bookingData) => {
    setLoading(true);

    // Court closure / maintenance check (TENNIS ONLY)
    let court = null;
    if (bookingData.activity_type !== 'equestrian') {
      court = courts.find(c => c.id === bookingData.court_id);
      const bookingDate = new Date(bookingData.start_time);
      const closure = getCourtClosureForDate(bookingData.court_id, bookingDate);

      if (court?.status === 'maintenance' || closure) {
        alert(`შეცდომა: კორტი დაკეტილია (${closure ? closure.reason : 'სარემონტო სამუშაოების გამო'}) არჩეულ დღეს!`);
        setLoading(false);
        return;
      }
    }

    // Overlap check (TENNIS ONLY)
    if (bookingData.activity_type !== 'equestrian') {
      const newStart = new Date(bookingData.start_time).getTime();
      const newEnd = new Date(bookingData.end_time).getTime();
      
      const hasOverlap = bookings.some(b => {
        // Don't compare with itself if editing
        if (bookingData.id && b.id === bookingData.id) return false;
        // Only check same court
        if (b.court_id !== bookingData.court_id) return false;
        
        const existingStart = new Date(b.start_time).getTime();
        const existingEnd = new Date(b.end_time).getTime();
        
        // A overlaps B if (StartA < EndB) and (EndA > StartB)
        return newStart < existingEnd && newEnd > existingStart;
      });

      if (hasOverlap) {
        alert("შეცდომა: არჩეული დრო უკვე დაკავებულია ამ კორტზე. გთხოვთ შეცვალოთ დრო.");
        setLoading(false);
        return;
      }

      // Rackets Inventory Check
      if (bookingData.rackets_status === 'rented') {
        const requestedRackets = bookingData.rackets_count || 2;
        const totalAvailableRackets = parseInt(globalSettings.total_rackets || '20', 10);
        
        // We need to check every 30-min interval from newStart to newEnd
        let inventoryExceeded = false;
        for (let time = newStart; time < newEnd; time += 30 * 60 * 1000) {
          // Find all other bookings active at this exact 30-min slot
          let rentedAtThisTime = 0;
          bookings.forEach(b => {
            if (b.is_blocked || (bookingData.id && b.id === bookingData.id)) return;
            if (b.rackets_status === 'rented') {
              const bStart = new Date(b.start_time).getTime();
              const bEnd = new Date(b.end_time).getTime();
              if (time >= bStart && time < bEnd) {
                rentedAtThisTime += (b.rackets_count || 2);
              }
            }
          });
          
          if (rentedAtThisTime + requestedRackets > totalAvailableRackets) {
            inventoryExceeded = true;
            break;
          }
        }
        
        if (inventoryExceeded) {
          alert(`შეცდომა: ამ საათებში საკმარისი თავისუფალი ჩოგანი არ არის. სულ გვაქვს ${totalAvailableRackets} ჩოგანი.`);
          setLoading(false);
          return;
        }
      }
    } else {
      // --- EQUESTRIAN CHECKS ---
      const newStart = new Date(bookingData.start_time).getTime();
      const newEnd = new Date(bookingData.end_time).getTime();
      
      const maxEqBookings = parseInt(globalSettings.eq_max_bookings_per_slot || 2);
      const maxHorses = parseInt(globalSettings.eq_max_horses_per_slot || 6);
      const maxPonies = parseInt(globalSettings.eq_max_ponies_per_slot || 3);
      
      const reqHorses = bookingData.horses_count || 0;
      const reqPonies = bookingData.ponies_count || 0;

      // 1. Check break time (14:00 - 15:00)
      for (let time = newStart; time < newEnd; time += 30 * 60 * 1000) {
        const h = new Date(time).getHours();
        if (h === 14) {
          alert('შეცდომა: 14:00-დან 15:00-მდე შესვენებაა. ამ დროში ჯავშანი არ შეიძლება.');
          setLoading(false);
          return;
        }
      }

      // 2. Check limits for every 30-min interval
      let limitExceeded = false;
      let limitMsg = '';

      for (let time = newStart; time < newEnd; time += 30 * 60 * 1000) {
        let activeBookingsCount = 0;
        let activeHorsesCount = 0;
        let activePoniesCount = 0;

        bookings.forEach(b => {
          if (b.activity_type !== 'equestrian') return;
          if (bookingData.id && b.id === bookingData.id) return; // exclude self
          
          const bStart = new Date(b.start_time).getTime();
          const bEnd = new Date(b.end_time).getTime();
          
          // Count active resource at this time
          if (time >= bStart && time < bEnd) {
            activeHorsesCount += (b.horses_count || 0);
            activePoniesCount += (b.ponies_count || 0);
          }
          
          // Count bookings starting EXACTLY at this time (since the 2 booking limit applies to the start time)
          // Wait, the rule is "in the same time slot we have a limit of 2 bookings". 
          // If a booking is 2 hours long, does it prevent new bookings? Yes, it consumes resources, but the limit of 2 bookings per slot usually means "you can only fit 2 parallel tracks". We'll count active parallel bookings.
          if (time >= bStart && time < bEnd) {
             activeBookingsCount++;
          }
        });

        if (activeBookingsCount >= maxEqBookings) {
          limitExceeded = true;
          limitMsg = `შეცდომა: ამ დროს უკვე დაკავებულია ${maxEqBookings} ჯავშანი (ლიმიტი ამოწურულია).`;
          break;
        }
        if (activeHorsesCount + reqHorses > maxHorses) {
          limitExceeded = true;
          limitMsg = `შეცდომა: ამ დროს აღარ არის საკმარისი ცხენი. მაქსიმუმ დასაშვებია ${maxHorses}.`;
          break;
        }
        if (activePoniesCount + reqPonies > maxPonies) {
          limitExceeded = true;
          limitMsg = `შეცდომა: ამ დროს აღარ არის საკმარისი პონი. მაქსიმუმ დასაშვებია ${maxPonies}.`;
          break;
        }
      }

      if (limitExceeded) {
        alert(limitMsg);
        setLoading(false);
        return;
      }
    }

    try {
      if (isSupabaseConnected) {
        if (bookingData.id) {
          const { error } = await supabase
            .from('bookings')
            .update(bookingData)
            .eq('id', bookingData.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('bookings')
            .insert(bookingData);
          if (error) throw error;
        }
        
        // Refresh bookings
        const { data: dbBookings } = await supabase.from('bookings').select('*');
        setBookings(dbBookings || []);
        
        await logActivity(
          bookingData.id ? 'UPDATE_BOOKING' : 'CREATE_BOOKING',
          `${bookingData.full_name} (${new Date(bookingData.start_time).toLocaleString('ka-GE')} - ${new Date(bookingData.end_time).toLocaleString('ka-GE')}) კორტი: ${court?.name}`
        );
      } else {
        // LocalStorage fallback
        let updatedBookings = [...bookings];
        if (bookingData.id) {
          updatedBookings = updatedBookings.map(b => b.id === bookingData.id ? { ...b, ...bookingData } : b);
        } else {
          const newBooking = {
            id: Date.now(),
            ...bookingData
          };
          updatedBookings.push(newBooking);
        }
        setBookings(updatedBookings);
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));

        await logActivity(
          bookingData.id ? 'UPDATE_BOOKING' : 'CREATE_BOOKING',
          `${bookingData.full_name} (${new Date(bookingData.start_time).toLocaleString('ka-GE')}) (ლოკალური ონლაინის გარეშე)`
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('ჯავშნის შენახვისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('ნამდვილად გსურთ ამ ჯავშნის წაშლა?')) return;
    setLoading(true);
    try {
      const deletedBooking = bookings.find(b => b.id === bookingId);
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);
        if (error) throw error;

        // Refresh bookings
        const { data: dbBookings } = await supabase.from('bookings').select('*');
        setBookings(dbBookings || []);
        if (deletedBooking) {
          await logActivity('DELETE_BOOKING', `${deletedBooking.full_name} (${new Date(deletedBooking.start_time).toLocaleString('ka-GE')})`);
        }
      } else {
        const updatedBookings = bookings.filter(b => b.id !== bookingId);
        setBookings(updatedBookings);
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));
        if (deletedBooking) {
          await logActivity('DELETE_BOOKING', `${deletedBooking.full_name} (ლოკალური)`);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('ჯავშნის წაშლისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGlobalSetting = async (key, value) => {
    const newSettings = { ...globalSettings, [key]: value };
    setGlobalSettings(newSettings);
    
    if (isSupabaseConnected) {
      try {
        const { error } = await supabase
          .from('global_settings')
          .upsert({ key, value }, { onConflict: 'key' });
        if (error) console.error(error);
      } catch (err) {
        console.error(err);
      }
      await logActivity('UPDATE_GLOBAL_SETTING', `Key: ${key} -> ${value}`);
    } else {
      localStorage.setItem('global_settings', JSON.stringify(newSettings));
      await logActivity('UPDATE_GLOBAL_SETTING', `Key: ${key} -> ${value} (ლოკალური)`);
    }
  };

  const handleUpdateSettings = async (updatedSettingsRow) => {
    setLoading(true);
    try {
      const updatedList = settings.map(s => 
        s.day_type === updatedSettingsRow.day_type ? updatedSettingsRow : s
      );
      setSettings(updatedList);

      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('court_settings')
          .upsert(updatedSettingsRow);
        if (error) throw error;
        await logActivity('UPDATE_COURT_SETTING', `განრიგი შეიცვალა (${updatedSettingsRow.day_type})`);
      } else {
        localStorage.setItem('court_settings', JSON.stringify(updatedList));
        await logActivity('UPDATE_COURT_SETTING', `განრიგი შეიცვალა (${updatedSettingsRow.day_type}) (ლოკალური)`);
      }
    } catch (err) {
      alert('განრიგის განახლებისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a court
  const handleAddCourt = async (e) => {
    e.preventDefault();
    if (!newCourtName.trim()) return;

    setLoading(true);
    try {
      const newCourt = {
        name: newCourtName.trim(),
        type: newCourtType,
        is_active: true,
        status: 'active'
      };

      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('courts')
          .insert(newCourt);
        if (error) throw error;

        // Fetch refreshed courts
        const { data: dbCourts } = await supabase.from('courts').select('*').order('id', { ascending: true });
        setCourts(dbCourts || []);
      } else {
        const updatedCourts = [...courts, { id: Date.now(), ...newCourt }];
        setCourts(updatedCourts);
        localStorage.setItem('courts', JSON.stringify(updatedCourts));
      }

      setNewCourtName('');
    } catch (err) {
      alert('კორტის დამატებისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a court
  const handleDeleteCourt = async (courtId, courtName) => {
    if (courts.length <= 1) {
      alert('მინიმუმ 1 კორტი მაინც უნდა დარჩეს ბაზაში!');
      return;
    }

    if (!window.confirm(`ნამდვილად გსურთ კორტის "${courtName}" წაშლა? მასთან დაკავშირებული ყველა ჯავშანი წაიშლება.`)) return;

    setLoading(true);
    try {
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('courts')
          .delete()
          .eq('id', courtId);
        if (error) throw error;

        // Fetch refreshed courts
        const { data: dbCourts } = await supabase.from('courts').select('*').order('id', { ascending: true });
        setCourts(dbCourts || []);
      } else {
        const updatedCourts = courts.filter(c => c.id !== courtId);
        setCourts(updatedCourts);
        localStorage.setItem('courts', JSON.stringify(updatedCourts));
        
        // Filter out bookings
        const updatedBookings = bookings.filter(b => b.court_id !== courtId);
        setBookings(updatedBookings);
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      }
    } catch (err) {
      alert('კორტის წაშლისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle court maintenance status
  const handleToggleCourtMaintenance = async (courtId, currentStatus) => {
    const nextStatus = currentStatus === 'maintenance' ? 'active' : 'maintenance';
    setLoading(true);
    try {
      const updatedCourts = courts.map(c => c.id === courtId ? { ...c, status: nextStatus } : c);
      setCourts(updatedCourts);

      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('courts')
          .update({ status: nextStatus })
          .eq('id', courtId);
        if (error) throw error;
      } else {
        localStorage.setItem('courts', JSON.stringify(updatedCourts));
      }
    } catch (err) {
      alert('კორტის სტატუსის განახლებისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save court closure rule (date range — inserts one record per day)
  const handleAddClosure = async (e) => {
    e.preventDefault();
    if (!closureCourtId || !closureDateStart || !closureDateEnd || !closureReason.trim()) return;

    const start = new Date(closureDateStart);
    const end = new Date(closureDateEnd);
    if (end < start) {
      alert('დასრულების თარიღი უნდა იყოს დაწყების თარიღის შემდეგ!');
      return;
    }

    // Build array of every date in range
    const datesToClose = [];
    const cur = new Date(start);
    while (cur <= end) {
      datesToClose.push(cur.toISOString().split('T')[0]); // YYYY-MM-DD
      cur.setDate(cur.getDate() + 1);
    }

    setLoading(true);
    try {
      if (isSupabaseConnected) {
        const rows = datesToClose.map(d => ({
          court_id: parseInt(closureCourtId),
          closure_date: d,
          reason: closureReason.trim()
        }));
        // upsert to silently skip duplicates
        const { error } = await supabase
          .from('court_closures')
          .upsert(rows, { onConflict: 'court_id,closure_date' });
        if (error) throw error;

        const { data } = await supabase.from('court_closures').select('*');
        setCourtClosures(data || []);
      } else {
        const existingKeys = new Set(
          courtClosures.map(c => `${c.court_id}_${c.closure_date}`)
        );
        const newRecords = datesToClose
          .filter(d => !existingKeys.has(`${closureCourtId}_${d}`))
          .map(d => ({
            id: Date.now() + Math.random(),
            court_id: parseInt(closureCourtId),
            closure_date: d,
            reason: closureReason.trim()
          }));
        const updatedClosures = [...courtClosures, ...newRecords];
        setCourtClosures(updatedClosures);
        localStorage.setItem('court_closures', JSON.stringify(updatedClosures));
      }

      setClosureCourtId('');
      setClosureDateStart('');
      setClosureDateEnd('');
      setClosureReason('');
    } catch (err) {
      alert('ჩაკეტვის დამატებისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete court closure rules (batch)
  const handleDeleteClosures = async (closureIds) => {
    setLoading(true);
    try {
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('court_closures')
          .delete()
          .in('id', closureIds);
        if (error) throw error;

        const { data } = await supabase.from('court_closures').select('*');
        setCourtClosures(data || []);
      } else {
        const updatedClosures = courtClosures.filter(c => !closureIds.includes(c.id));
        setCourtClosures(updatedClosures);
        localStorage.setItem('court_closures', JSON.stringify(updatedClosures));
      }
    } catch (err) {
      alert('ჩაკეტვის გაუქმებისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Change self password helper
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!myOldPassword.trim() || !myNewPassword.trim()) {
      setPassError('გთხოვთ შეავსოთ ყველა ველი');
      return;
    }

    if (currentUser.password !== myOldPassword.trim()) {
      setPassError('ძველი პაროლი არასწორია');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('user_accounts')
          .update({ password: myNewPassword.trim() })
          .eq('id', currentUser.id);
        if (error) throw error;
      } else {
        // Local fallback edit
        const localUsers = localStorage.getItem('local_user_accounts');
        if (localUsers) {
          const parsed = JSON.parse(localUsers);
          const updated = parsed.map(u => 
            u.username === currentUser.username ? { ...u, password: myNewPassword.trim() } : u
          );
          localStorage.setItem('local_user_accounts', JSON.stringify(updated));
        }
      }

      // Update current state
      const updatedUser = { ...currentUser, password: myNewPassword.trim() };
      setCurrentUser(updatedUser);
      localStorage.setItem('tennis_app_user', JSON.stringify(updatedUser));

      setPassSuccess('პაროლი წარმატებით განახლდა!');
      setMyOldPassword('');
      setMyNewPassword('');
    } catch (err) {
      setPassError('პაროლის განახლებისას მოხდა შეცდომა: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper: determine operating hours for a selected date
  const getOperatingHours = (date) => {
    const isWeekendVal = date.getDay() === 0 || date.getDay() === 6; // Sunday=0, Saturday=6
    const type = isWeekendVal ? 'weekend' : 'weekday';
    const daySetting = settings.find(s => s.day_type === type);
    
    return {
      open: daySetting ? daySetting.open_time.substring(0, 5) : '08:00',
      close: daySetting ? daySetting.close_time.substring(0, 5) : '22:00'
    };
  };

  // Helper: generate 30-minute interval times array
  const generateTimeSlots = (openTime, closeTime) => {
    const slots = [];
    let currentHour = parseInt(openTime.split(':')[0]);
    let currentMin = parseInt(openTime.split(':')[1]);
    const endHour = parseInt(closeTime.split(':')[0]);
    const endMin = parseInt(closeTime.split(':')[1]);

    while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
      const formattedHour = String(currentHour).padStart(2, '0');
      const formattedMin = String(currentMin).padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMin}`);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }
    return slots;
  };

  // Calculate statistics for Dashboard
  const getDashboardStats = () => {
    const todayStr = selectedDate.toDateString();
    
    // Filter bookings for the selected date and active department
    const todayBookings = bookings.filter(b => {
      const start = new Date(b.start_time);
      const bType = b.activity_type || 'tennis';
      const isCorrectDepartment = (activeDepartment === 'equestrian' && bType === 'equestrian') ||
                                  (activeDepartment === 'tennis' && bType !== 'equestrian');
      return start.toDateString() === todayStr && isCorrectDepartment;
    });

    const activeBookingsCount = todayBookings.filter(b => !b.is_blocked).length;
    const blockedSlotsCount = todayBookings.filter(b => b.is_blocked).length;
    
    // Count resources rented
    let racketsIncluded = 0; // own racket
    let racketsExcluded = 0; // rented
    let horsesRented = 0;
    let poniesRented = 0;

    todayBookings.forEach(b => {
      if (!b.is_blocked) {
        if (b.rackets_status === 'included') {
          racketsIncluded += 2; // assume they brought at least 2
        } else {
          racketsExcluded += (b.rackets_count || 2);
        }
        horsesRented += (b.horses_count || 0);
        poniesRented += (b.ponies_count || 0);
      }
    });

    // Court occupancy
    const hours = getOperatingHours(selectedDate);
    const slots = generateTimeSlots(hours.open, hours.close);
    const activeCourts = courts.filter(c => c.status !== 'maintenance' && !getCourtClosureForDate(c.id, selectedDate));
    const totalSlotsPossible = slots.length * activeCourts.length;
    
    let occupiedSlotsCount = 0;
    todayBookings.forEach(b => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      const durationHours = (bEnd - bStart) / (1000 * 60 * 60);
      const slotsOccupied = durationHours * 2; // 2 slots per hour
      occupiedSlotsCount += slotsOccupied;
    });

    const occupancyRate = totalSlotsPossible > 0 
      ? Math.min(Math.round((occupiedSlotsCount / totalSlotsPossible) * 100), 100) 
      : 0;

    const activeCourtsCount = activeCourts.length;

    return {
      activeBookings: activeBookingsCount,
      blockedSlots: blockedSlotsCount,
      activeCourtsCount,
      racketsIncluded,
      racketsExcluded,
      racketsTotal: racketsIncluded + racketsExcluded,
      racketsPct: (racketsIncluded + racketsExcluded) > 0 
        ? Math.round((racketsExcluded / (racketsIncluded + racketsExcluded)) * 100) 
        : 0, // tracking rental demand (racketsExcluded)
      occupancyRate,
      horsesRented,
      poniesRented
    };
  };

  const stats = getDashboardStats();

  // Helper: check if a court and time slot is booked
  const getBookingForSlot = (courtId, timeSlot, date) => {
    if (courtId === null) return null;
    const [slotH, slotM] = timeSlot.split(':');
    const slotTime = new Date(date);
    slotTime.setHours(parseInt(slotH), parseInt(slotM), 0, 0);

    return bookings.find(b => {
      if (b.court_id !== courtId) return false;
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      return slotTime >= start && slotTime < end;
    });
  };

  const handleSlotClick = (courtId, timeSlot, courtStatus, closure, passedBooking = null) => {
    // If the court is in maintenance or closed for date, prevent bookings
    if (courtStatus === 'maintenance' || closure) {
      alert(`ეს კორტი დაკეტილია: ${closure ? closure.reason : 'სარემონტო სამუშაოების გამო'}!`);
      return;
    }

    let courtName = 'საჯინიბო';
    if (courtId !== null) {
      const court = courts.find(c => c.id === courtId);
      courtName = court ? court.name : `კორტი ${courtId}`;
    }

    // Build "YYYY-MM-DD" from selected calendar date
    const y = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const slotDateStr = `${y}-${mo}-${d}`;

    const booking = passedBooking || getBookingForSlot(courtId, timeSlot, selectedDate);

    if (booking) {
      // For existing booking: decode start_time (UTC ISO) → Georgia local (UTC+4)
      const startUtcMs = new Date(booking.start_time).getTime();
      const geMs = startUtcMs + 4 * 3600000;
      const geDate = new Date(geMs);
      const bY = geDate.getUTCFullYear();
      const bM = String(geDate.getUTCMonth() + 1).padStart(2, '0');
      const bD = String(geDate.getUTCDate()).padStart(2, '0');
      const bH = String(geDate.getUTCHours()).padStart(2, '0');
      const bMin = String(geDate.getUTCMinutes()).padStart(2, '0');
      setSelectedBooking(booking);
      setSelectedSlot({ 
        courtId, 
        courtName, 
        time: booking.start_time, // keep for backwards compat
        slotDate: `${bY}-${bM}-${bD}`,
        slotTime: `${bH}:${bMin}`
      });
    } else {
      setSelectedBooking(null);
      setSelectedSlot({ 
        courtId, 
        courtName, 
        time: null,
        slotDate: slotDateStr,
        slotTime: timeSlot  // e.g. "09:00" — exactly what was clicked
      });
    }
    setIsModalOpen(true);
  };


  // Get active time slots lists
  const currentHours = getOperatingHours(selectedDate);
  const timeSlots = generateTimeSlots(currentHours.open, currentHours.close);

  // Group bookings by guest for the "Customers" tab
  const getUniqueCustomers = () => {
    const customersMap = {};
    bookings.forEach(b => {
      if (b.is_blocked) return;
      const key = `${b.full_name.trim().toLowerCase()}_${b.room_number.trim()}`;
      if (!customersMap[key]) {
        customersMap[key] = {
          name: b.full_name,
          room: b.room_number,
          totalBookings: 0,
          racketsPrefs: { included: 0, excluded: 0 },
          history: []
        };
      }
      customersMap[key].totalBookings++;
      if (b.rackets_status) {
        customersMap[key].racketsPrefs[b.rackets_status]++;
      }
      customersMap[key].history.push(b);
    });

    const list = Object.values(customersMap);
    if (!searchQuery) return list;
    return list.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.room.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const customersList = getUniqueCustomers();

  const getDayTypeLabel = (dayType) => {
    switch(dayType) {
      case 'weekday': return 'ორშაბათი - პარასკევი';
      case 'weekend': return 'შაბათი - კვირა';
      case 'holiday': return 'სადღესასწაულო დღეები';
      default: return dayType;
    }
  };

  // If user session is not found, render login gate
  if (!currentUser || activeTab === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} isSupabaseConnected={isSupabaseConnected} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-logo">
          <TennisRacketIcon size={28} className="text-volt animate-spin-slow" />
          <h2>ADVENTURE BOOKINGS</h2>
        </div>

        {/* Profile Card in Sidebar */}
        <div className="user-profile-widget glass-panel">
          <UserCheck size={16} className="text-volt" />
          <div className="user-profile-details">
            <span className="user-name">{currentUser.full_name}</span>
            <span className="user-role">
              {currentUser.role === 'super_admin' && '👑 Super Admin'}
              {currentUser.role === 'manager' && '💼 Manager'}
              {currentUser.role === 'staff' && '🎾 Staff'}
            </span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {/* Global Department Switcher in Sidebar */}
          {(currentUser?.department === 'all' || !currentUser?.department || currentUser?.role !== 'staff') && (
            <div className="sidebar-department-switcher">
              <button 
                className={`sidebar-dep-btn ${activeDepartment === 'tennis' ? 'active' : ''}`}
                onClick={() => setActiveDepartment('tennis')}
              >
                🎾 ტენისი
              </button>
              <button 
                className={`sidebar-dep-btn ${activeDepartment === 'equestrian' ? 'active' : ''}`}
                onClick={() => setActiveDepartment('equestrian')}
              >
                🐴 საჯინიბო
              </button>
            </div>
          )}

          {currentUser.role !== 'staff' && (
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>დეშბორდი</span>
            </button>
          )}

          <button 
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarIcon size={18} />
            <span>კალენდარი</span>
          </button>

          {currentUser.role !== 'staff' && (
            <button 
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <Users size={18} />
              <span>სტუმრები</span>
            </button>
          )}

          {/* User management tab - only for managers and super admins */}
          {currentUser.role !== 'staff' && (
            <button 
              className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <Users size={18} className="text-volt" />
              <span>თანამშრომლები</span>
            </button>
          )}

          {currentUser.role !== 'staff' && (
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon size={18} />
              <span>განრიგი/კორტები</span>
            </button>
          )}

          {canSeeAnalytics && (
            <button 
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart2 size={18} />
              <span>ანალიტიკა & ლოგები</span>
            </button>
          )}

          {/* Account Password Change tab for all users */}
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Lock size={18} />
            <span>პაროლის შეცვლა</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="db-status flex-align margin-bottom-sm">
            <span className={`status-indicator ${isSupabaseConnected ? 'connected' : 'local'}`}></span>
            <span className="text-xs">
              {isSupabaseConnected ? 'Connected' : 'Local Storage Mode'}
            </span>
          </div>
          <button className="btn btn-danger btn-xs width-100 flex-align justify-center" onClick={handleSignOut}>
            <LogOut size={12} className="margin-right-xs" />
            გასვლა
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header glass-panel">
          <div className="header-title-area">
            <h1>
              {activeTab === 'dashboard' && 'ადმინისტრატორის პანელი'}
              {activeTab === 'calendar' && activeDepartment === 'tennis' && 'კორტების განრიგი'}
              {activeTab === 'calendar' && activeDepartment === 'equestrian' && 'საჯინიბოს განრიგი'}
              {activeTab === 'customers' && 'სტუმრების აღრიცხვა'}
              {activeTab === 'staff' && 'თანამშრომელთა მართვა'}
              {activeTab === 'settings' && 'კორტების პარამეტრები'}
              {activeTab === 'profile' && 'ანგარიშის პარამეტრები'}
            </h1>
            <p className="text-sm text-secondary">
              {selectedDate.toLocaleDateString('ka-GE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="header-actions">
            {/* Quick date control for Calendar and Dashboard */}
            {(activeTab === 'calendar' || activeTab === 'dashboard') && (
              <div className="date-controls flex-align glass-panel">
                <button 
                  onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24*60*60*1000))} 
                  className="date-nav-btn"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="date-display">
                  {selectedDate.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' })}
                </span>
                <button 
                  onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24*60*60*1000))} 
                  className="date-nav-btn"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            
            <button 
              className="btn btn-primary"
              onClick={() => {
                setSelectedBooking(null);

                // Compute current Georgia time (UTC+4) as plain date/time strings
                const now = new Date();
                const geMs = now.getTime() + now.getTimezoneOffset() * 60000 + 4 * 3600000;
                const ge = new Date(geMs);
                const slotDate = `${ge.getUTCFullYear()}-${String(ge.getUTCMonth()+1).padStart(2,'0')}-${String(ge.getUTCDate()).padStart(2,'0')}`;
                
                // Round minutes to 00 or 30
                let mins = ge.getUTCMinutes();
                if (mins < 15) mins = 0;
                else if (mins < 45) mins = 30;
                else {
                  mins = 0;
                  ge.setUTCHours(ge.getUTCHours() + 1);
                }
                const slotTime = `${String(ge.getUTCHours()).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;

                setSelectedSlot({ 
                  courtId: activeDepartment === 'equestrian' ? null : (courts[0]?.id || 1), 
                  courtName: activeDepartment === 'equestrian' ? 'საჯინიბო' : (courts[0]?.name || 'კორტი 1'),
                  time: null,
                  slotDate,
                  slotTime
                });
                setIsModalOpen(true);
              }}
            >
              <Plus size={18} />
              <span>ახალი ჯავშანი</span>
            </button>

            {/* Mobile-only logout button */}
            <button 
              className="btn btn-danger btn-xs mobile-logout-header-btn"
              onClick={handleSignOut}
              title="გასვლა"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Tab Views */}
        <div className="tab-view-container">
          
          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && currentUser.role !== 'staff' && (
            <div className="dashboard-view animate-fade-in">
              {/* KPI Cards Grid */}
              <div className="stats-grid">
                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper blue">
                    <Activity size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">აქტიური ჯავშნები (დღეს)</span>
                    <span className="stat-value">{stats.activeBookings}</span>
                  </div>
                </div>

                {activeDepartment === 'tennis' ? (
                  <>
                    <div className="stat-card glass-panel">
                      <div className="stat-icon-wrapper volt">
                        <Trophy size={20} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">გაცემული ჩოგნები</span>
                        <span className="stat-value">{stats.racketsTotal}</span>
                      </div>
                    </div>

                    <div className="stat-card glass-panel">
                      <div className="stat-icon-wrapper orange">
                        <TrendingUp size={20} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">კორტების დატვირთვა</span>
                        <span className="stat-value">{stats.occupancyRate}%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-card glass-panel">
                      <div className="stat-icon-wrapper volt">
                        <Trophy size={20} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">გაცემული ცხენები</span>
                        <span className="stat-value">{stats.horsesRented}</span>
                      </div>
                    </div>

                    <div className="stat-card glass-panel">
                      <div className="stat-icon-wrapper orange">
                        <Trophy size={20} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">გაცემული პონები</span>
                        <span className="stat-value">{stats.poniesRented}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper warning">
                    <ShieldAlert size={20} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">აქტიური კორტები</span>
                    <span className="stat-value">{stats.activeCourtsCount} / {courts.length}</span>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Section */}
              <div className="dashboard-main-row">
                {/* Rackets inventory pie chart / circular progress (Slide 8 style) */}
                {activeDepartment === 'tennis' && (
                  <div className="dashboard-card glass-panel card-rackets-inventory">
                    <h3>ჩოგნების ინვენტარის აღრიცხვა</h3>
                    <p className="text-xs text-secondary margin-bottom-md">დღიური მოთხოვნის დაქირავების პროცენტული განაწილება</p>
                    
                    <div className="rackets-chart-box">
                      <div className="svg-chart-container">
                        <svg width="200" height="200" viewBox="0 0 36 36" className="circular-chart">
                          {/* Background track representing Excluded */}
                          <path className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="3.5"
                          />
                          {/* Foreground track representing Included (Volt color) */}
                          <path className="circle"
                            strokeDasharray={`${stats.racketsPct}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--color-volt)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          <text x="18" y="20.35" className="chart-percentage">
                            {stats.racketsPct}%
                          </text>
                        </svg>
                      </div>

                      <div className="chart-legend-box">
                        <div className="legend-item flex-align">
                          <span className="legend-dot volt"></span>
                          <div className="legend-details">
                            <span className="legend-label">Rented (ნაქირავები)</span>
                            <span className="legend-value">{stats.racketsExcluded} ცალი ({stats.racketsTotal > 0 ? stats.racketsPct : 0}%)</span>
                          </div>
                        </div>
                        <div className="legend-item flex-align">
                          <span className="legend-dot dark"></span>
                          <div className="legend-details">
                            <span className="legend-label">Included (თავისი აქვთ)</span>
                            <span className="legend-value">{stats.racketsIncluded} ცალი ({stats.racketsTotal > 0 ? (100 - stats.racketsPct) : 0}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Today's timeline overview */}
                <div className="dashboard-card glass-panel card-timeline">
                  <h3>დღევანდელი ჯავშნების განრიგი</h3>
                  <p className="text-xs text-secondary margin-bottom-md">სტუმრების დროული მონიტორინგისთვის</p>
                  
                  <div className="dashboard-timeline-list">
                    {bookings.filter(b => {
                      const start = new Date(b.start_time);
                      const isSameDay = start.toDateString() === selectedDate.toDateString();
                      const isSameDept = b.activity_type === activeDepartment || (!b.activity_type && activeDepartment === 'tennis');
                      return isSameDay && isSameDept;
                    }).length === 0 ? (
                      <div className="timeline-empty flex-align-center">
                        <Clock size={36} className="text-muted margin-bottom-sm" />
                        <p className="text-sm text-secondary">დღეს ჯავშნები არ არის</p>
                      </div>
                    ) : (
                      bookings
                        .filter(b => {
                          const start = new Date(b.start_time);
                          const isSameDay = start.toDateString() === selectedDate.toDateString();
                          const isSameDept = b.activity_type === activeDepartment || (!b.activity_type && activeDepartment === 'tennis');
                          return isSameDay && isSameDept;
                        })
                        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                        .map(b => {
                          const start = new Date(b.start_time).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
                          const end = new Date(b.end_time).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
                          const court = courts.find(c => c.id === b.court_id);
                          return (
                            <div key={b.id} className={`timeline-booking-item ${b.is_blocked ? 'blocked' : ''}`}>
                              <span className="timeline-time">{start} - {end}</span>
                              <div className={`timeline-body ${b.activity_type === 'equestrian' ? 'clay' : (court?.type === 'Clay' ? 'clay' : 'hard')}`}>
                                <div className="timeline-body-title">
                                  <strong>{b.full_name}</strong>
                                  {!b.is_blocked && <span className="timeline-room">ოთახი: {b.room_number}</span>}
                                </div>
                                <div className="timeline-body-footer">
                                  <span className="timeline-court">
                                    {b.activity_type === 'equestrian' ? '🐴 საჯინიბო' : (court ? court.name : 'წაშლილი კორტი')}
                                  </span>
                                  {!b.is_blocked && b.activity_type !== 'equestrian' && (
                                    <span className={`racket-badge ${b.rackets_status}`}>
                                      🎾 {b.rackets_status === 'included' ? 'თავისი ჩოგანი' : 'ნაქირავები'}
                                    </span>
                                  )}
                                  {!b.is_blocked && b.activity_type === 'equestrian' && (
                                    <span className="racket-badge">
                                      {b.horses_count > 0 && `🐴 ${b.horses_count}`}
                                      {b.ponies_count > 0 && ` 🐎 ${b.ponies_count}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CALENDAR/SCHEDULER VIEW */}
          {activeTab === 'calendar' && (
            <div className="calendar-view animate-fade-in">
              
              {activeDepartment === 'equestrian' ? (
                <EquestrianCalendar 
                  selectedDate={selectedDate}
                  bookings={bookings}
                  globalSettings={globalSettings}
                  onSlotClick={(time, existingBooking) => handleSlotClick(null, time, 'active', null, existingBooking)}
                />
              ) : (
                <>
              {/* Mobile Court Selector Tabs (Slide 3/10) */}
              <div className="mobile-court-tabs">
                {courts.map(court => {
                  const closure = getCourtClosureForDate(court.id, selectedDate);
                  const isClosed = court.status === 'maintenance' || closure;
                  return (
                    <button
                      key={court.id}
                      className={`mobile-court-tab-btn ${court.type === 'Clay' ? 'clay' : 'hard'} ${isClosed ? 'maintenance-tab' : ''} ${selectedCourtMobile === court.id ? 'active' : ''}`}
                      onClick={() => setSelectedCourtMobile(court.id)}
                    >
                      {isClosed ? `🛠️ ${court.name}` : court.name}
                    </button>
                  );
                })}
              </div>

              {/* Grid / Calendar Scheduler */}
              <div className="scheduler-wrapper glass-panel">
                <div className="scheduler-header-row">
                  <div className="scheduler-time-header">დრო</div>
                  
                  {/* Desktop columns list (dynamic court count side-by-side) */}
                  <div className="scheduler-courts-header-row" style={{ gridTemplateColumns: `repeat(${courts.length}, 1fr)` }}>
                    {courts.map(court => {
                      const closure = getCourtClosureForDate(court.id, selectedDate);
                      const isClosed = court.status === 'maintenance' || closure;
                      return (
                        <div 
                          key={court.id} 
                          className={`scheduler-court-column-header court-header-lines ${court.type === 'Clay' ? 'clay' : 'hard'} ${isClosed ? 'in-maintenance-header' : ''} ${selectedCourtMobile === court.id ? 'mobile-visible' : 'mobile-hidden'}`}
                        >
                          <div className="court-type-indicator">
                            {isClosed ? `🛠️ ${closure ? closure.reason : 'რემონტი'}` : (court.type === 'Clay' ? '🧱 Clay' : '🔵 Hard')}
                          </div>
                          <h4>{court.name}</h4>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="scheduler-grid-body">
                  {timeSlots.map(time => (
                    <div key={time} className="scheduler-grid-row">
                      <div className="scheduler-row-time">{time}</div>

                      <div className="scheduler-row-cells" style={{ gridTemplateColumns: `repeat(${courts.length}, 1fr)` }}>
                        {courts.map(court => {
                          const isMobileActive = selectedCourtMobile === court.id;
                          const closure = getCourtClosureForDate(court.id, selectedDate);
                          
                          // If court is in maintenance or closed for date, render blocked cell
                          if (court.status === 'maintenance' || closure) {
                            const blockReason = closure ? closure.reason : 'დაკეტილია';
                            return (
                              <div
                                key={`${court.id}_${time}`}
                                className={`scheduler-grid-cell cell-maintenance ${isMobileActive ? 'mobile-visible' : 'mobile-hidden'}`}
                                onClick={() => handleSlotClick(court.id, time, court.status, closure)}
                              >
                                <span className="maintenance-cell-txt">
                                  <Hammer size={12} className="margin-right-xs text-danger" />
                                  {blockReason}
                                </span>
                              </div>
                            );
                          }

                          const booking = getBookingForSlot(court.id, time, selectedDate);
                          
                          let isStartOfBooking = false;
                          let durationSlots = 1;
                          let colorClass = '';
                          
                          if (booking) {
                            const bStart = new Date(booking.start_time);
                            const bEnd = new Date(booking.end_time);
                            const [slotH, slotM] = time.split(':');
                            const slotTime = new Date(selectedDate);
                            slotTime.setHours(parseInt(slotH), parseInt(slotM), 0, 0);
                            
                            isStartOfBooking = slotTime.getTime() === bStart.getTime();
                            
                            const durationMins = (bEnd.getTime() - bStart.getTime()) / 60000;
                            durationSlots = durationMins / 30;
                            
                            if (durationMins <= 30) colorClass = 'dur-30m';
                            else if (durationMins <= 60) colorClass = 'dur-1h';
                            else if (durationMins <= 90) colorClass = 'dur-1h30';
                            else colorClass = 'dur-2h';
                          }

                          return (
                            <div 
                              key={`${court.id}_${time}`} 
                              onClick={() => handleSlotClick(court.id, time, court.status, closure)}
                              className={`scheduler-grid-cell ${court.type === 'Clay' ? 'cell-clay' : 'cell-hard'} ${booking ? `occupied ${colorClass}` : 'empty'} ${booking?.is_blocked ? 'blocked' : ''} ${isMobileActive ? 'mobile-visible' : 'mobile-hidden'}`}
                            >
                              {booking ? (
                                isStartOfBooking && (
                                  <div className="booking-cell-content" style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0,
                                    height: `calc(${durationSlots * 100}% + ${durationSlots - 1}px)`,
                                    zIndex: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    padding: '4px'
                                  }}>
                                    {booking.is_blocked ? (
                                      <span className="flex-align text-warning">
                                        <ShieldAlert size={12} className="margin-right-xs" />
                                        დაბლოკილია
                                      </span>
                                    ) : (
                                      <>
                                        <span className="cell-room-no">ოთახი {booking.room_number}</span>
                                        <span className="cell-name-txt" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{booking.full_name}</span>
                                        {durationSlots > 1 && (
                                          <span className={`cell-racket-indicator ${booking.rackets_status}`}>
                                            {booking.rackets_status === 'included' ? '🎾 Included' : 'Rented'}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )
                              ) : (
                                <span className="cell-plus-icon">+</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </>
              )}
            </div>
          )}

          {/* 3. CUSTOMERS VIEW */}
          {activeTab === 'customers' && currentUser.role !== 'staff' && (
            <div className="customers-view animate-fade-in">
              <div className="customers-main glass-panel">
                <div className="customers-header">
                  <h3>სტუმრების ბაზა ({customersList.length})</h3>
                  
                  {/* Search bar */}
                  <div className="search-bar">
                    <Search size={16} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="მოძებნე სახელი ან ოთახის ნომერი..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="customers-table-wrapper">
                  {customersList.length === 0 ? (
                    <div className="table-empty">
                      <Users size={32} className="text-muted margin-bottom-sm" />
                      <p>სტუმრები არ მოიძებნა</p>
                    </div>
                  ) : (
                    <table className="customers-table">
                      <thead>
                        <tr>
                          <th>სტუმარი</th>
                          <th>ოთახი</th>
                          <th>ჯავშნები</th>
                          <th>ჩოგნის პრეფერენცია</th>
                          <th>ბოლო აქტივობა</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersList.map((c, i) => {
                          const lastBooking = c.history[c.history.length - 1];
                          const formattedDate = lastBooking 
                            ? new Date(lastBooking.start_time).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' })
                            : '-';
                          return (
                            <tr key={i}>
                              <td><strong>{c.name}</strong></td>
                              <td>{c.room}</td>
                              <td>
                                <span className="badge badge-blue">{c.totalBookings} ჯავშანი</span>
                              </td>
                              <td>
                                <span className="badge badge-volt">
                                  Included: {c.racketsPrefs.included || 0}
                                </span>
                                <span className="badge badge-dark margin-left-xs">
                                  Excluded: {c.racketsPrefs.excluded || 0}
                                </span>
                              </td>
                              <td>
                                <span className="text-xs text-secondary">{formattedDate}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. STAFF MANAGEMENT VIEW (Only for managers/admins) */}
          {activeTab === 'staff' && currentUser.role !== 'staff' && (
            <StaffManagement 
              isSupabaseConnected={isSupabaseConnected} 
              currentUser={currentUser} 
            />
          )}

          {/* 5. SETTINGS VIEW */}
          {activeTab === 'settings' && currentUser.role !== 'staff' && (
            <div className="settings-view animate-fade-in">
              <div className="settings-layout">
                {/* Global Settings */}
                <div className="settings-card glass-panel" style={{ marginBottom: '24px' }}>
                  <h3>სისტემური პარამეტრები</h3>
                  <p className="text-xs text-secondary margin-bottom-md">გლობალური პარამეტრების მართვა</p>
                  
                  {activeDepartment === 'tennis' && (
                    <div className="form-group flex-align margin-bottom-sm">
                      <label className="form-label margin-right-md" style={{ marginBottom: 0 }}>ჩოგნების მაქსიმალური რაოდენობა კლუბში:</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="0"
                        value={globalSettings.total_rackets || 20}
                        onChange={(e) => handleUpdateGlobalSetting('total_rackets', e.target.value)}
                        style={{ width: '100px' }}
                      />
                    </div>
                  )}
                  
                  {activeDepartment === 'equestrian' && (
                    <>
                      <div className="form-group flex-align margin-bottom-sm">
                        <label className="form-label margin-right-md" style={{ marginBottom: 0 }}>საჯინიბო - ერთ სლოტზე მაქსიმალური ჯავშნები:</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="1"
                          value={globalSettings.eq_max_bookings_per_slot || 2}
                          onChange={(e) => handleUpdateGlobalSetting('eq_max_bookings_per_slot', e.target.value)}
                          style={{ width: '100px' }}
                        />
                      </div>

                      <div className="form-group flex-align margin-bottom-sm">
                        <label className="form-label margin-right-md" style={{ marginBottom: 0 }}>საჯინიბო - ჯამური ცხენების რაოდენობა სლოტზე:</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="0"
                          value={globalSettings.eq_max_horses_per_slot || 6}
                          onChange={(e) => handleUpdateGlobalSetting('eq_max_horses_per_slot', e.target.value)}
                          style={{ width: '100px' }}
                        />
                      </div>

                      <div className="form-group flex-align margin-bottom-sm">
                        <label className="form-label margin-right-md" style={{ marginBottom: 0 }}>საჯინიბო - ჯამური პონების რაოდენობა სლოტზე:</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="0"
                          value={globalSettings.eq_max_ponies_per_slot || 3}
                          onChange={(e) => handleUpdateGlobalSetting('eq_max_ponies_per_slot', e.target.value)}
                          style={{ width: '100px' }}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="checkbox-container margin-bottom-sm">
                      <input 
                        type="checkbox" 
                        checked={globalSettings.allow_manager_analytics === 'true'} 
                        onChange={(e) => handleUpdateGlobalSetting('allow_manager_analytics', e.target.checked ? 'true' : 'false')} 
                      />
                      <span className="checkbox-checkmark"></span>
                      <span className="checkbox-label-text">მენეჯერებს შეეძლოთ ანალიტიკის ნახვა</span>
                    </label>
                    
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={globalSettings.allow_staff_analytics === 'true'} 
                        onChange={(e) => handleUpdateGlobalSetting('allow_staff_analytics', e.target.checked ? 'true' : 'false')} 
                      />
                      <span className="checkbox-checkmark"></span>
                      <span className="checkbox-label-text">ოპერატორებს (staff) შეეძლოთ ანალიტიკის ნახვა</span>
                    </label>
                  </div>
                </div>

                {/* Operating hours table */}
                <div className="settings-card glass-panel">
                  <h3>სამუშაო საათების კონტროლი</h3>
                  <p className="text-xs text-secondary margin-bottom-md">კალენდრის სამუშაო საათების განსაზღვრა</p>
                  
                  <div className="settings-table-wrapper">
                    <table className="settings-table">
                      <thead>
                        <tr>
                          <th>კვირის დღე</th>
                          <th>გახსნა</th>
                          <th>დაკეტვა</th>
                          <th>სტატუსი</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settings.map((row) => (
                          <tr key={row.day_type}>
                            <td><strong>{getDayTypeLabel(row.day_type)}</strong></td>
                            <td>
                              <input 
                                type="time" 
                                className="form-input time-input-field" 
                                value={row.open_time.substring(0, 5)}
                                onChange={(e) => handleUpdateSettings({
                                  ...row,
                                  open_time: `${e.target.value}:00`
                                })}
                              />
                            </td>
                            <td>
                              <input 
                                type="time" 
                                className="form-input time-input-field" 
                                value={row.close_time.substring(0, 5)}
                                onChange={(e) => handleUpdateSettings({
                                  ...row,
                                  close_time: `${e.target.value}:00`
                                })}
                              />
                            </td>
                            <td>
                              <button 
                                className={`btn btn-xs status-toggle-btn ${row.is_active ? 'active' : 'inactive'}`}
                                onClick={() => handleUpdateSettings({
                                  ...row,
                                  is_active: !row.is_active
                                })}
                              >
                                {row.is_active ? 'აქტიური' : 'შეზღუდული'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Court configurations (ADD, DELETE, MAINTENANCE) */}
                <div className="settings-card glass-panel">
                  <h3>კორტების მართვა და რემონტი</h3>
                  <p className="text-xs text-secondary margin-bottom-md">ახალი კორტის დამატება, წაშლა ან რემონტზე დაკეტვა</p>
                  
                  {/* Add Court form */}
                  <form onSubmit={handleAddCourt} className="add-court-form margin-bottom-md flex-align">
                    <input 
                      type="text" 
                      className="form-input text-sm"
                      value={newCourtName}
                      onChange={(e) => setNewCourtName(e.target.value)}
                      placeholder="კორტის სახელი (მაგ. კორტი 5)"
                      required
                    />
                    <select
                      className="form-input select-court-type text-sm"
                      value={newCourtType}
                      onChange={(e) => setNewCourtType(e.target.value)}
                    >
                      <option value="Clay">🧱 Clay</option>
                      <option value="Hard">🔵 Hard</option>
                    </select>
                    <button type="submit" className="btn btn-primary btn-xs">
                      დამატება
                    </button>
                  </form>

                  {/* Courts list */}
                  <div className="courts-edit-list">
                    {courts.map(court => (
                      <div key={court.id} className="court-edit-item glass-panel">
                        <span className={`court-type-dot ${court.type === 'Clay' ? 'clay' : 'hard'}`}></span>
                        <div className="court-details-col">
                          <strong>{court.name}</strong>
                          <span className="text-xs text-secondary capitalize">{court.type} court</span>
                        </div>
                        
                        <div className="court-edit-actions">
                          {/* Toggle Maintenance button */}
                          <button 
                            className={`btn btn-xs flex-align ${court.status === 'maintenance' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => handleToggleCourtMaintenance(court.id, court.status)}
                          >
                            <Hammer size={12} className="margin-right-xs" />
                            {court.status === 'maintenance' ? 'რემონტზეა' : 'გახსნა'}
                          </button>

                          {/* Delete court */}
                          <button 
                            className="btn btn-danger btn-xs flex-align btn-delete-court"
                            onClick={() => handleDeleteCourt(court.id, court.name)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Court Closures by Date */}
                <div className="settings-card glass-panel margin-top-md">
                  <h3>კორტების ჩაკეტვა თარიღებით</h3>
                  <p className="text-xs text-secondary margin-bottom-md">ჩაკეტეთ კორტი კონკრეტულ თარიღზე ღონისძიების ან ტურნირის გამო</p>
                  
                  {/* Add Closure form */}
                  <form onSubmit={handleAddClosure} className="closure-form margin-bottom-md">
                    {/* Row 1: court + date range picker */}
                    <div className="closure-form-top">
                      <div className="closure-form-group">
                        <label className="form-label">კორტი</label>
                        <select
                          className="form-input text-sm"
                          value={closureCourtId}
                          onChange={(e) => setClosureCourtId(e.target.value)}
                          required
                        >
                          <option value="">აირჩიეთ კორტი</option>
                          {courts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="closure-form-group closure-datepicker-group">
                        <label className="form-label">პერიოდი (დაწყება → დასრულება)</label>
                        <DateRangePicker
                          startDate={closureDateStart}
                          endDate={closureDateEnd}
                          onStartChange={setClosureDateStart}
                          onEndChange={setClosureDateEnd}
                        />
                      </div>
                    </div>

                    {/* Row 2: reason + submit */}
                    <div className="closure-form-bottom">
                      <div className="closure-form-group" style={{ flex: 1 }}>
                        <label className="form-label">მიზეზი</label>
                        <input
                          type="text"
                          className="form-input text-sm"
                          value={closureReason}
                          onChange={(e) => setClosureReason(e.target.value)}
                          placeholder="მაგ. ტურნირი, ღონისძიება, რემონტი"
                          required
                        />
                      </div>
                      <div className="closure-submit-col">
                        <label className="form-label">&nbsp;</label>
                        <button type="submit" className="btn btn-primary btn-xs">
                          ჩაკეტვა
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Closures list */}
                  <div className="courts-edit-list" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {courtClosures.length === 0 ? (
                      <p className="text-xs text-muted padding-xs">აქტიური ჩაკეტვები არ არის</p>
                    ) : (
                      courtClosures
                        .sort((a, b) => new Date(a.closure_date) - new Date(b.closure_date))
                        .reduce((groups, closure) => {
                          // Group consecutive dates for same court+reason into one row
                          const last = groups[groups.length - 1];
                          if (
                            last &&
                            last.court_id === parseInt(closure.court_id) &&
                            last.reason === closure.reason &&
                            // consecutive day?
                            (new Date(closure.closure_date) - new Date(last.endDate)) / 86400000 === 1
                          ) {
                            last.endDate = closure.closure_date;
                            last.ids.push(closure.id);
                          } else {
                            groups.push({
                              court_id: parseInt(closure.court_id),
                              reason: closure.reason,
                              startDate: closure.closure_date,
                              endDate: closure.closure_date,
                              ids: [closure.id]
                            });
                          }
                          return groups;
                        }, [])
                        .map((group, i) => {
                          const court = courts.find(c => c.id === group.court_id);
                          const fmtDate = (d) => new Date(d).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric', year: 'numeric' });
                          const dateLabel = group.startDate === group.endDate
                            ? fmtDate(group.startDate)
                            : `${fmtDate(group.startDate)} — ${fmtDate(group.endDate)}`;
                          return (
                            <div key={i} className="court-edit-item glass-panel">
                              <div className="court-details-col">
                                <strong>{court ? court.name : `კორტი ${group.court_id}`}</strong>
                                <span className="text-xs text-secondary">{dateLabel} · {group.reason}</span>
                              </div>
                              <div className="court-edit-actions">
                                <button 
                                  className="btn btn-danger btn-xs flex-align btn-delete-court"
                                  onClick={async () => {
                                    if (!window.confirm('ნამდვილად გსურთ ამ ჩაკეტვის გაუქმება?')) return;
                                    await handleDeleteClosures(group.ids);
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. PROFILE VIEW (Password change) */}
          {activeTab === 'profile' && (
            <div className="profile-view animate-fade-in">
              <div className="profile-card-container glass-panel">
                <div className="card-header-with-icon">
                  <Lock size={20} className="text-volt" />
                  <h3>პაროლის შეცვლა</h3>
                </div>
                <p className="text-xs text-secondary margin-bottom-md">შეცვალეთ თქვენი ანგარიშის პირადი პაროლი უსაფრთხოებისთვის</p>

                <form onSubmit={handleChangePassword} className="profile-form">
                  {passError && <div className="form-error">{passError}</div>}
                  {passSuccess && <div className="form-success">{passSuccess}</div>}

                  <div className="form-group">
                    <label className="form-label">ძველი პაროლი</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={myOldPassword}
                      onChange={(e) => setMyOldPassword(e.target.value)}
                      placeholder="ჩაწერეთ ძველი პაროლი"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ახალი პაროლი</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={myNewPassword}
                      onChange={(e) => setMyNewPassword(e.target.value)}
                      placeholder="ჩაწერეთ ახალი პაროლი"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    პაროლის განახლება
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 7. ANALYTICS VIEW */}
          {activeTab === 'analytics' && canSeeAnalytics && (
            <Analytics 
              bookings={bookings}
              courts={courts}
              activityLogs={activityLogs}
              activeDepartment={activeDepartment}
            />
          )}
          
        </div>
        </main>

      {/* Interactive Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBooking}
        onDelete={handleDeleteBooking}
        selectedSlot={selectedSlot}
        existingBooking={selectedBooking}
        currentUser={currentUser}
        courts={courts}
        activeDepartment={activeDepartment}
      />

      <style>{`
        /* Court closure date range form */
        .closure-form {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .closure-form-top {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 12px;
          align-items: end;
        }

        .closure-form-bottom {
          display: flex;
          gap: 12px;
          align-items: end;
        }

        .closure-submit-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
        }

        .closure-datepicker-group {
          min-width: 0;
        }

        .closure-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        @media (max-width: 900px) {
          .closure-form-top {
            grid-template-columns: 1fr;
          }
          .closure-form-bottom {
            flex-direction: column;
          }
          .closure-submit-col {
            align-self: stretch;
          }
          .closure-submit-col .btn {
            width: 100%;
          }
        }

        /* User Profile widget in sidebar */
        .user-profile-widget {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          margin-bottom: 20px;
          border-radius: var(--radius-sm);
          background: rgba(255,255,255,0.02);
        }
        
        .user-profile-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 700;
          font-size: 0.85rem;
          color: white;
        }

        .user-role {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        /* Maintenance court representation in grid */
        .cell-maintenance {
          background: repeating-linear-gradient(
            45deg,
            rgba(239, 68, 68, 0.05),
            rgba(239, 68, 68, 0.05) 10px,
            rgba(239, 68, 68, 0.1) 10px,
            rgba(239, 68, 68, 0.1) 20px
          ) !important;
          border-left: 3px dashed var(--color-danger) !important;
          cursor: not-allowed !important;
        }

        .maintenance-cell-txt {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-danger);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .in-maintenance-header {
          background: rgba(239, 68, 68, 0.08) !important;
          border-bottom: 2px solid var(--color-danger) !important;
        }

        /* Court add and settings list */
        .add-court-form {
          gap: 12px;
        }
        .select-court-type {
          max-width: 110px;
          background-color: rgba(0, 0, 0, 0.4);
        }
        .select-court-type option {
          background-color: var(--bg-secondary);
        }

        .court-details-col {
          display: flex;
          flex-direction: column;
        }

        .court-edit-actions {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .btn-delete-court {
          padding: 6px;
        }

        .padding-xs {
          padding: 10px;
        }

        /* Profile Password View */
        .profile-view {
          display: flex;
          justify-content: center;
          padding-top: 40px;
        }
        .profile-card-container {
          width: 100%;
          max-width: 440px;
          padding: 24px;
          box-shadow: var(--shadow-md);
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        /* Styles copied and updated from index.css for consistency */
        .sidebar {
          width: 240px;
          min-width: 240px;
          display: flex;
          flex-direction: column;
          border-radius: 0;
          border-right: 1px solid var(--border-color);
          background: rgba(10, 13, 20, 0.95);
          padding: 24px 16px;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-left: 8px;
        }
        .sidebar-logo h2 {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.15rem;
          color: white;
          letter-spacing: 0.05em;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 24px;
        }
        .sidebar-department-switcher {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar-dep-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          font-weight: 500;
        }
        .sidebar-dep-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .sidebar-dep-btn.active {
          background: rgba(204, 255, 0, 0.1);
          border-color: var(--color-volt);
          color: var(--color-volt);
          font-weight: 600;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          font-family: var(--font-heading);
        }
        .nav-item:hover {
          color: white;
          background: rgba(255, 255, 255, 0.03);
        }
        .nav-item.active {
          background: rgba(204, 255, 0, 0.1);
          color: var(--color-volt);
          box-shadow: inset 3px 0 0 var(--color-volt);
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
        }
        .status-indicator.connected { background: var(--color-success); }
        .status-indicator.local { background: var(--color-warning); }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow-y: auto;
        }

        .main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-radius: 0;
          border-bottom: 1px solid var(--border-color);
        }

        .date-controls {
          padding: 4px 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .date-nav-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
        }
        .date-nav-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .date-display {
          font-weight: 600;
          font-size: 0.9rem;
          color: white;
          min-width: 80px;
          text-align: center;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .tab-view-container {
          padding: 24px;
          flex: 1;
        }

        /* Mobile logout btn in header */
        .mobile-logout-header-btn {
          display: none !important;
        }

        /* 1. Dashboard Styles */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon-wrapper.blue { background: rgba(14, 165, 233, 0.1); color: var(--color-hard); }
        .stat-icon-wrapper.volt { background: rgba(204, 255, 0, 0.1); color: var(--color-volt); }
        .stat-icon-wrapper.orange { background: rgba(208, 90, 63, 0.1); color: var(--color-clay); }
        .stat-icon-wrapper.warning { background: rgba(245, 158, 11, 0.1); color: var(--color-warning); }

        .stat-info {
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .stat-value {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.5rem;
          color: white;
        }

        .dashboard-main-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .dashboard-card {
          padding: 24px;
        }

        /* Slide 8 Pie Chart */
        .rackets-chart-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-top: 16px;
        }
        
        .svg-chart-container {
          position: relative;
          display: flex;
          justify-content: center;
        }
        
        .circular-chart {
          display: block;
          max-width: 160px;
          max-height: 160px;
        }

        .circle {
          animation: progress 1s ease-out forwards;
        }

        @keyframes progress {
          0% { stroke-dasharray: 0 100; }
        }

        .chart-percentage {
          fill: #fff;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 0.45rem;
          text-anchor: middle;
        }

        .chart-legend-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .legend-dot.volt { background-color: var(--color-volt); }
        .legend-dot.dark { background-color: #1e293b; }

        .legend-details {
          display: flex;
          flex-direction: column;
        }
        .legend-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }
        .legend-value {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .dashboard-timeline-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .timeline-booking-item {
          display: flex;
          gap: 16px;
        }
        .timeline-time {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--color-volt);
          min-width: 90px;
          margin-top: 4px;
        }

        .timeline-body {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-left: 3px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
        }
        .timeline-body.clay { border-left-color: var(--color-clay); }
        .timeline-body.hard { border-left-color: var(--color-hard); }

        .timeline-booking-item.blocked .timeline-time {
          color: var(--color-warning);
        }
        .timeline-booking-item.blocked .timeline-body {
          background: rgba(245, 158, 11, 0.02);
          border-left-color: var(--color-warning);
          opacity: 0.7;
        }

        .timeline-body-title {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          margin-bottom: 4px;
        }
        .timeline-room {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }
        .timeline-body-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .racket-badge {
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid transparent;
        }
        .racket-badge.included {
          background: rgba(204, 255, 0, 0.1);
          color: var(--color-volt);
          border-color: rgba(204, 255, 0, 0.2);
        }
        .racket-badge.excluded {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border-color: var(--border-color);
        }

        /* 2. Scheduler/Calendar Styles */
        .mobile-court-tabs {
          display: none;
        }

        .scheduler-wrapper {
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .scheduler-header-row {
          display: flex;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-color);
        }
        .scheduler-time-header {
          width: 80px;
          min-width: 80px;
          padding: 16px;
          border-right: 1px solid var(--border-color);
          text-align: center;
          font-weight: bold;
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        
        .scheduler-courts-header-row {
          display: grid;
          flex: 1;
        }

        .scheduler-court-column-header {
          padding: 14px;
          text-align: center;
          border-right: 1px solid var(--border-color);
        }
        .scheduler-court-column-header:last-child { border-right: none; }
        
        .scheduler-court-column-header.clay {
          background: linear-gradient(180deg, rgba(208, 90, 63, 0.08) 0%, transparent 100%);
        }
        .scheduler-court-column-header.hard {
          background: linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, transparent 100%);
        }
        
        .court-type-indicator {
          font-size: 0.65rem;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .scheduler-court-column-header.clay .court-type-indicator { color: var(--color-clay); }
        .scheduler-court-column-header.hard .court-type-indicator { color: var(--color-hard); }

        .scheduler-court-column-header h4 {
          font-size: 0.95rem;
          color: white;
        }

        .scheduler-grid-body {
          max-height: 600px;
          overflow-y: auto;
        }

        .scheduler-grid-row {
          display: flex;
          border-bottom: 1px solid var(--border-color);
        }
        .scheduler-grid-row:last-child { border-bottom: none; }

        .scheduler-row-time {
          width: 80px;
          min-width: 80px;
          padding: 12px;
          border-right: 1px solid var(--border-color);
          text-align: center;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.85rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scheduler-row-cells {
          display: grid;
          flex: 1;
        }

        .scheduler-grid-cell {
          min-height: 65px;
          border-right: 1px solid var(--border-color);
          padding: 8px;
          position: relative;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .scheduler-grid-cell:last-child { border-right: none; }

        .scheduler-grid-cell.empty:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .scheduler-grid-cell.empty .cell-plus-icon {
          opacity: 0;
          color: var(--color-volt);
          font-weight: bold;
          font-size: 1.25rem;
          align-self: center;
          transition: opacity var(--transition-fast);
        }
        .scheduler-grid-cell.empty:hover .cell-plus-icon {
          opacity: 1;
        }

        .scheduler-grid-cell.occupied {
          cursor: pointer;
        }
        
        .scheduler-grid-cell.occupied.cell-clay {
          background: rgba(208, 90, 63, 0.15);
          border-left: 3px solid var(--color-clay);
        }
        .scheduler-grid-cell.occupied.cell-hard {
          background: rgba(14, 165, 233, 0.15);
          border-left: 3px solid var(--color-hard);
        }

        .scheduler-grid-cell.occupied.blocked {
          background: rgba(245, 158, 11, 0.08) !important;
          border-left-color: var(--color-warning) !important;
          color: var(--color-warning);
        }

        .scheduler-grid-cell.occupied.dur-30m {
          background: rgba(20, 184, 166, 0.15) !important;
          border-left-color: #14b8a6 !important;
        }
        .scheduler-grid-cell.occupied.dur-1h {
          background: rgba(14, 165, 233, 0.15) !important;
          border-left-color: #0ea5e9 !important;
        }
        .scheduler-grid-cell.occupied.dur-1h30 {
          background: rgba(139, 92, 246, 0.15) !important;
          border-left-color: #8b5cf6 !important;
        }
        .scheduler-grid-cell.occupied.dur-2h {
          background: rgba(236, 72, 153, 0.15) !important;
          border-left-color: #ec4899 !important;
        }

        .booking-cell-content {
          animation: cellFadeIn 0.2s ease-out;
          pointer-events: none; /* Let clicks pass through to the cell */
        }
        
        @keyframes cellFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .cell-room-no {
          font-weight: 700;
          color: white;
          font-size: 0.8rem;
          margin-bottom: 2px;
        }
        .cell-name-txt {
          font-weight: 500;
          color: var(--text-secondary);
          font-size: 0.75rem;
          line-height: 1.1;
        }
        .cell-racket-indicator {
          font-size: 0.65rem;
          font-weight: 800;
          margin-top: 2px;
        }
        .cell-racket-indicator.included { color: var(--color-volt); }
        .cell-racket-indicator.excluded { color: var(--text-muted); }

        /* 3. Customers View */
        .customers-main {
          padding: 24px;
          width: 100%;
        }
        .customers-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }
        
        .search-bar {
          position: relative;
          width: 300px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .search-bar input {
          width: 100%;
          padding: 10px 12px 10px 38px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: white;
          font-size: 0.85rem;
        }
        .search-bar input:focus {
          outline: none;
          border-color: var(--color-volt);
        }

        .customers-table-wrapper {
          overflow-x: auto;
        }
        .customers-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .customers-table th {
          padding: 12px 16px;
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-size: 0.8rem;
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-color);
        }
        .customers-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }
        .customers-table tr:last-child td { border-bottom: none; }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .badge-blue { background: rgba(14, 165, 233, 0.1); color: var(--color-hard); }
        .badge-volt { background: rgba(204, 255, 0, 0.1); color: var(--color-volt); }
        .badge-dark { background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); }

        .table-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          color: var(--text-muted);
        }

        /* 4. Settings View */
        .settings-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .settings-card {
          padding: 24px;
        }
        .settings-table-wrapper {
          overflow-x: auto;
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }
        .settings-table {
          width: 100%;
          border-collapse: collapse;
        }
        .settings-table th {
          padding: 12px;
          text-align: left;
          color: var(--text-secondary);
          font-size: 0.8rem;
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-color);
        }
        .settings-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .time-input-field {
          padding: 6px 10px;
          max-width: 90px;
          font-size: 0.85rem;
          text-align: center;
        }
        
        .status-toggle-btn {
          font-size: 0.75rem;
          padding: 6px 12px;
        }
        .status-toggle-btn.active {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-toggle-btn.inactive {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .courts-edit-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .court-edit-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          gap: 16px;
        }
        .court-type-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .court-type-dot.clay { background-color: var(--color-clay); }
        .court-type-dot.hard { background-color: var(--color-hard); }

        /* Animations & Helpers */
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .flex-align-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .width-100 { width: 100%; }
        .margin-bottom-md { margin-bottom: 16px; }
        .margin-bottom-sm { margin-bottom: 8px; }
        .margin-top-sm { margin-top: 8px; }
        .margin-top-md { margin-top: 16px; }
        .margin-left-xs { margin-left: 6px; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .text-secondary { color: var(--text-secondary); }
        .text-muted { color: var(--text-muted); }
        .text-volt { color: var(--color-volt); }
        .uppercase { text-transform: uppercase; }
        .font-bold { font-weight: 700; }
        .btn-xs { padding: 6px 12px; font-size: 0.75rem; }

        /* Responsive Design */
        @media (max-width: 900px) {
          /* Prevent zoom on iPhone by enforcing 16px inputs */
          input, select, textarea {
            font-size: 16px !important;
          }

          .main-content {
            width: 100%;
            max-width: 100vw;
            min-width: 0;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .tab-view-container {
            padding: 12px;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }

          .settings-card, .dashboard-card, .customers-main, .profile-card-container {
            padding: 16px;
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
          }

          .profile-view {
            padding-top: 16px;
            width: 100%;
            min-width: 0;
            max-width: 100%;
          }

          .court-edit-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 12px;
          }

          .court-edit-actions {
            width: 100%;
            justify-content: flex-end;
            margin-top: 4px;
          }

          .app-container {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            min-width: 100%;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 12px 20px;
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            position: sticky;
            top: 0;
            z-index: 100;
          }

          .sidebar-logo {
            margin-bottom: 0;
            padding-left: 0;
          }
          
          .user-profile-widget {
            display: none; /* Hide profile widget on small mobile header, they can see/edit in tabs */
          }

          .sidebar-nav {
            flex-direction: row;
            gap: 4px;
          }
          .nav-item {
            padding: 8px 12px;
            font-size: 0.85rem;
          }
          .nav-item span {
            display: none; /* Hide text, only icons on small screens */
          }

          .sidebar-footer {
            display: none; /* Hide status details on mobile header */
          }

          .main-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
            padding: 16px 20px;
          }
          .header-actions {
            width: 100%;
            justify-content: space-between;
            gap: 10px;
          }

          /* Mobile logout btn in header actions list on mobile */
          .mobile-logout-header-btn {
            display: inline-flex !important;
            padding: 8px 12px;
          }

          .dashboard-main-row {
            grid-template-columns: 1fr;
          }

          .settings-layout {
            grid-template-columns: 1fr;
          }

          /* Mobile Scheduler Tabs transformation (Slide 3/10) */
          .mobile-court-tabs {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            margin-bottom: 16px;
            padding-bottom: 8px;
          }
          .mobile-court-tab-btn {
            padding: 8px 16px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-color);
            background: rgba(255, 255, 255, 0.02);
            color: var(--text-secondary);
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            white-space: nowrap;
            font-family: inherit;
            transition: all var(--transition-fast);
          }
          .mobile-court-tab-btn.active.clay {
            background-color: var(--color-clay);
            color: white;
            border-color: var(--color-clay);
          }
          .mobile-court-tab-btn.active.hard {
            background-color: var(--color-hard);
            color: white;
            border-color: var(--color-hard);
          }
          
          .mobile-court-tab-btn.maintenance-tab {
            border-color: var(--color-danger);
            color: var(--color-danger);
          }
          .mobile-court-tab-btn.active.maintenance-tab {
            background-color: var(--color-danger);
            color: white;
          }

          .scheduler-courts-header-row {
            grid-template-columns: 1fr !important;
          }
          .scheduler-row-cells {
            grid-template-columns: 1fr !important;
          }

          .mobile-hidden {
            display: none !important;
          }
          .mobile-visible {
            display: flex !important;
          }
          .scheduler-grid-cell.mobile-visible {
            border-right: none;
          }

          /* Optimize cell sizes for tall devices (iPhone 16/17 Pro) */
          .scheduler-grid-cell {
            min-height: 55px !important;
            padding: 6px !important;
          }
          .booking-cell-content {
            font-size: 0.72rem !important;
          }
        }
      `}</style>
    </div>
  );
}
