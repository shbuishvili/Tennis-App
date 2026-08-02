import React, { useMemo } from 'react';
import { Clock, Users, ShieldAlert } from 'lucide-react';

export default function EquestrianCalendar({ 
  selectedDate, 
  bookings, 
  globalSettings,
  eqClosures = [],
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

  const dateStr = selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : '';
  const activeClosure = eqClosures.find(c => c.date === dateStr);

  const maxBookingsPerSlot = parseInt(globalSettings?.eq_max_bookings_per_slot || 2);
  const maxHorses = parseInt(globalSettings?.eq_max_horses_per_slot || 6);
  const maxPonies = parseInt(globalSettings?.eq_max_ponies_per_slot || 3);

  const equestrianBookings = bookings.filter(b => b.activity_type === 'equestrian');
  const sortedBookings = [...equestrianBookings].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  
  const processedBookings = [];
  sortedBookings.forEach(b => {
    let track = 0;
    while (processedBookings.some(pb => pb.track === track && new Date(pb.end_time).getTime() > new Date(b.start_time).getTime() && new Date(pb.start_time).getTime() < new Date(b.end_time).getTime())) {
      track++;
    }
    processedBookings.push({ ...b, track });
  });

  const maxTracksNeeded = Math.max(-1, ...processedBookings.map(b => b.track)) + 1;
  const numColumns = Math.max(maxTracksNeeded, maxBookingsPerSlot);

  const getBookingsForSlot = (time) => {
    const [slotH, slotM] = time.split(':');
    const slotTime = new Date(selectedDate);
    slotTime.setHours(parseInt(slotH), parseInt(slotM), 0, 0);

    return processedBookings.filter(b => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return slotTime.getTime() >= bStart.getTime() && slotTime.getTime() < bEnd.getTime();
    });
  };

  const getBookingForTrackAndSlot = (trackId, time) => {
    const [slotH, slotM] = time.split(':');
    const slotTime = new Date(selectedDate);
    slotTime.setHours(parseInt(slotH), parseInt(slotM), 0, 0);

    return processedBookings.find(b => {
      if (b.track !== trackId) return false;
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      return slotTime.getTime() >= bStart && slotTime.getTime() < bEnd;
    });
  };

  if (activeClosure) {
    return (
      <div className="scheduler-wrapper glass-panel flex-align flex-justify-center" style={{ minHeight: '400px', flexDirection: 'column' }}>
        <ShieldAlert size={48} className="text-warning margin-bottom-md" />
        <h3 className="text-warning">საჯინიბო დაკეტილია</h3>
        <p className="text-secondary margin-top-sm">მიზეზი: {activeClosure.reason}</p>
      </div>
    );
  }

  return (
    <div className="scheduler-wrapper glass-panel">
      <div className="scheduler-header-row eq-header-row" style={{ gridTemplateColumns: `80px repeat(${numColumns}, 1fr)` }}>
        <div className="scheduler-time-header">დრო</div>
        {Array.from({ length: numColumns }).map((_, i) => (
          <div key={i} className="scheduler-court-column-header eq-header court-header-lines clay">
            <div className="court-type-indicator">🐴 საჯინიბო</div>
            <h4>ჯავშანი {i + 1}</h4>
          </div>
        ))}
      </div>

      <div className="scheduler-grid-body">
        {timeSlots.map(time => {
          const isBreak = time >= '14:00' && time < '15:00';
          const activeBookings = getBookingsForSlot(time);
          
          let usedHorses = 0;
          let usedPonies = 0;
          activeBookings.forEach(b => {
            usedHorses += (b.horses_count || 0);
            usedPonies += (b.ponies_count || 0);
          });

          return (
            <div key={time} className="scheduler-grid-row">
              <div className="scheduler-row-time">{time}</div>

              <div className="scheduler-row-cells eq-row-cells" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
                {Array.from({ length: numColumns }).map((_, trackId) => {
                  
                  if (isBreak) {
                    return (
                      <div key={trackId} className="scheduler-grid-cell cell-maintenance">
                        <span className="maintenance-cell-txt">☕ შესვენება</span>
                      </div>
                    );
                  }

                  const booking = getBookingForTrackAndSlot(trackId, time);
                  
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
                      key={trackId}
                      onClick={(e) => {
                        if (booking) {
                          e.stopPropagation();
                          onSlotClick(time, booking);
                        } else {
                          if (activeBookings.length >= maxBookingsPerSlot) {
                            alert('ამ დროზე მეტ ჯავშანს ვეღარ დაამატებთ (ლიმიტი ამოწურულია).');
                            return;
                          }
                          if (usedHorses >= maxHorses && usedPonies >= maxPonies) {
                            alert('ამ დროზე აღარც ცხენი და აღარც პონია თავისუფალი.');
                            return;
                          }
                          onSlotClick(time);
                        }
                      }}
                      className={`scheduler-grid-cell cell-clay ${booking ? `occupied ${colorClass}` : 'empty'} ${booking?.is_blocked ? 'blocked' : ''}`}
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
                                🔒 დაბლოკილია
                              </span>
                            ) : (
                              <>
                                <span className="cell-room-no">ოთახი {booking.room_number}</span>
                                <span className="cell-name-txt" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{booking.full_name}</span>
                                <div style={{ fontSize: '11px', marginTop: '4px', color: '#ddd' }}>
                                  {booking.horses_count > 0 && `🐴 ცხენი: ${booking.horses_count}`}
                                  {booking.ponies_count > 0 && ` 🐎 პონი: ${booking.ponies_count}`}
                                </div>
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
          );
        })}
      </div>
    </div>
  );
}
