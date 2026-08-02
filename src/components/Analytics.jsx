import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Activity, Filter, Clock } from 'lucide-react';

export default function Analytics({ bookings, courts, activityLogs, activeDepartment }) {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().substring(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  
  // Filter bookings by date
  const filteredBookings = useMemo(() => {
    if (!startDate || !endDate) return bookings;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return bookings.filter(b => {
      const bStart = new Date(b.start_time);
      const bType = b.activity_type || 'tennis';
      const isCorrectDepartment = (activeDepartment === 'equestrian' && bType === 'equestrian') ||
                                  (activeDepartment === 'tennis' && bType !== 'equestrian');
      return bStart >= start && bStart <= end && isCorrectDepartment;
    });
  }, [bookings, startDate, endDate, activeDepartment]);

  // Filter logs by date
  const filteredLogs = useMemo(() => {
    if (!startDate || !endDate) return activityLogs;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return activityLogs.filter(log => {
      const lDate = new Date(log.created_at);
      return lDate >= start && lDate <= end;
    });
  }, [activityLogs, startDate, endDate]);

  const stats = useMemo(() => {
    let totalBookings = 0;
    let racketsRented = 0;
    let courtCounts = {};
    courts.forEach(c => { courtCounts[c.id] = 0; });

    let horsesRented = 0;
    let poniesRented = 0;

    filteredBookings.forEach(b => {
      if (b.is_blocked) return;
      totalBookings++;
      
      if (b.rackets_status === 'rented') {
        racketsRented += (b.rackets_count || 2);
      }
      
      horsesRented += (b.horses_count || 0);
      poniesRented += (b.ponies_count || 0);
      
      if (courtCounts[b.court_id] !== undefined) {
        courtCounts[b.court_id]++;
      }
    });

    return { totalBookings, racketsRented, courtCounts, horsesRented, poniesRented };
  }, [filteredBookings, courts]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp className="text-volt" />
          ანალიტიკა და რეპორტები
        </h2>
        
        <div className="flex-align" style={{ gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
          <Filter size={16} className="text-secondary" />
          <div className="flex-align" style={{ gap: '8px' }}>
            <span className="text-sm text-secondary">დან:</span>
            <input 
              type="date" 
              className="form-input" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ width: '130px', padding: '6px' }}
            />
          </div>
          <div className="flex-align" style={{ gap: '8px' }}>
            <span className="text-sm text-secondary">მდე:</span>
            <input 
              type="date" 
              className="form-input" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ width: '130px', padding: '6px' }}
            />
          </div>
        </div>
      </div>

      <div className="stats-grid margin-bottom-lg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-card glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(224, 255, 36, 0.1)', color: 'var(--color-volt)', padding: '12px', borderRadius: '50%', display: 'inline-flex', marginBottom: '12px' }}>
            <Calendar size={24} />
          </div>
          <p className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>სულ ჯავშანი პერიოდში</p>
          <h3 className="stat-value" style={{ fontSize: '2rem', color: '#fff' }}>{stats.totalBookings}</h3>
        </div>

        {activeDepartment === 'tennis' ? (
          <div className="stat-card glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '12px', borderRadius: '50%', display: 'inline-flex', marginBottom: '12px' }}>
              <Activity size={24} />
            </div>
            <p className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>სულ გაქირავებული ჩოგანი</p>
            <h3 className="stat-value" style={{ fontSize: '2rem', color: '#fff' }}>{stats.racketsRented}</h3>
          </div>
        ) : (
          <>
            <div className="stat-card glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '12px', borderRadius: '50%', display: 'inline-flex', marginBottom: '12px' }}>
                <Activity size={24} />
              </div>
              <p className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>სულ დაჯავშნილი ცხენი</p>
              <h3 className="stat-value" style={{ fontSize: '2rem', color: '#fff' }}>{stats.horsesRented}</h3>
            </div>
            <div className="stat-card glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '12px', borderRadius: '50%', display: 'inline-flex', marginBottom: '12px' }}>
                <Activity size={24} />
              </div>
              <p className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>სულ დაჯავშნილი პონი</p>
              <h3 className="stat-value" style={{ fontSize: '2rem', color: '#fff' }}>{stats.poniesRented}</h3>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {activeDepartment === 'tennis' && (
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem' }}>დატვირთულობა კორტების მიხედვით</h3>
            <div className="court-stats-list">
              {courts.map(c => {
                const count = stats.courtCounts[c.id] || 0;
                const pct = stats.totalBookings > 0 ? Math.round((count / stats.totalBookings) * 100) : 0;
                return (
                  <div key={c.id} style={{ marginBottom: '16px' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#fff', fontSize: '0.9rem' }}>{c.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{count} ჯავშანი ({pct}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-volt)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', maxHeight: '500px', overflowY: 'auto' }}>
          <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} className="text-volt" />
            აქტივობების ჟურნალი (Logs)
          </h3>
          {filteredLogs.length === 0 ? (
            <p className="text-secondary text-center" style={{ padding: '20px 0' }}>აქტივობები არ მოიძებნა</p>
          ) : (
            <div className="logs-list">
              {filteredLogs.map(log => (
                <div key={log.id || log.created_at} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: '500', fontSize: '0.9rem' }}>{log.username}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {new Date(log.created_at).toLocaleString('ka-GE')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      background: log.action_type.includes('DELETE') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(224, 255, 36, 0.1)',
                      color: log.action_type.includes('DELETE') ? '#ef4444' : 'var(--color-volt)',
                      marginTop: '2px',
                      whiteSpace: 'nowrap'
                    }}>
                      {log.action_type}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      {log.details}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
