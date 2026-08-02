import React, { useMemo } from 'react';
import { Clock, Users } from 'lucide-react';

export default function EquestrianCalendar({ 
  selectedDate, 
  bookings, 
  globalSettings,
  onSlotClick 
}) {
  const timeSlots = [];
  let startHour = 10;
  let endHour = 20;

  for (let h = startHour; h < endHour; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  timeSlots.push(`${endHour}:00`);

  const maxBookingsPerSlot = parseInt(globalSettings?.eq_max_bookings_per_slot || 2);
  const maxHorses = parseInt(globalSettings?.eq_max_horses_per_slot || 6);
  const maxPonies = parseInt(globalSettings?.eq_max_ponies_per_slot || 3);

  const getBookingsForSlot = (time) => {
    const [slotH, slotM] = time.split(':');
    const slotTime = new Date(selectedDate);
    slotTime.setHours(parseInt(slotH), parseInt(slotM), 0, 0);

    return bookings.filter(b => {
      if (b.activity_type !== 'equestrian') return false;
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return slotTime.getTime() >= bStart.getTime() && slotTime.getTime() < bEnd.getTime();
    });
  };

  const getExactStartBookings = (time) => {
    const [slotH, slotM] = time.split(':');
    const slotTime = new Date(selectedDate);
    slotTime.setHours(parseInt(slotH), parseInt(slotM), 0, 0);

    return bookings.filter(b => {
      if (b.activity_type !== 'equestrian') return false;
      const bStart = new Date(b.start_time);
      return bStart.getTime() === slotTime.getTime();
    });
  };

  return (
    <div className="scheduler-wrapper glass-panel">
      <div className="scheduler-header-row" style={{ gridTemplateColumns: '80px 1fr' }}>
        <div className="scheduler-time-header">დრო</div>
        <div className="scheduler-court-column-header eq-header">
          <div className="court-type-indicator">🐴 საჯინიბო</div>
          <h4>აქტივობები (მაქს. {maxHorses} ცხენი / {maxPonies} პონი)</h4>
        </div>
      </div>

      <div className="scheduler-grid-body">
        {timeSlots.map(time => {
          const isBreak = time >= '14:00' && time < '15:00';
          const activeBookings = getBookingsForSlot(time);
          const startBookings = getExactStartBookings(time);
          
          let usedHorses = 0;
          let usedPonies = 0;
          activeBookings.forEach(b => {
            usedHorses += (b.horses_count || 0);
            usedPonies += (b.ponies_count || 0);
          });

          return (
            <div key={time} className="scheduler-grid-row" style={{ gridTemplateColumns: '80px 1fr' }}>
              <div className="scheduler-row-time">{time}</div>

              <div 
                className={`scheduler-grid-cell ${isBreak ? 'cell-maintenance' : 'cell-clay'}`}
                style={{ padding: '4px', minHeight: '60px' }}
                onClick={() => {
                  if (isBreak) return;
                  if (startBookings.length >= maxBookingsPerSlot) {
                    alert('ამ დროზე მეტ ჯავშანს ვეღარ დაამატებთ (ლიმიტი ამოწურულია).');
                    return;
                  }
                  onSlotClick(time);
                }}
              >
                {isBreak ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-danger)' }}>
                    ☕ შესვენება
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', height: '100%' }}>
                    {startBookings.map(b => {
                       return (
                         <div key={b.id} className="booking-cell-content" style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '6px', borderRadius: '4px', borderLeft: '3px solid var(--color-clay)', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSlotClick(time, b);
                              }}>
                            <span className="cell-room-no">ოთახი {b.room_number}</span>
                            <span className="cell-name-txt">{b.full_name}</span>
                            <div style={{ fontSize: '11px', marginTop: '4px', color: '#ddd' }}>
                              {b.horses_count > 0 && `🐴 ცხენი: ${b.horses_count}`}
                              {b.ponies_count > 0 && ` 🐎 პონი: ${b.ponies_count}`}
                            </div>
                         </div>
                       )
                    })}
                    {startBookings.length === 0 && activeBookings.length > 0 && (
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                         <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                           (მიმდინარეობს ჯავშანი: ცხენი {usedHorses}, პონი {usedPonies})
                         </div>
                         <div style={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '4px', cursor: 'pointer' }}>
                           + დამატება
                         </div>
                       </div>
                    )}
                    {startBookings.length < maxBookingsPerSlot && startBookings.length > 0 && (
                       <div style={{ flex: 1, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer' }}>
                         + დამატება
                       </div>
                    )}
                    {startBookings.length === 0 && activeBookings.length === 0 && (
                       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                         <span className="cell-plus-icon">+</span>
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
