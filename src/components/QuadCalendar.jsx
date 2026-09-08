import React from 'react';
import { Clock, Users, ShieldAlert } from 'lucide-react';

export default function QuadCalendar({ 
  selectedDate, 
  bookings = [], 
  globalSettings = {},
  quadClosures = [],
  onSlotClick 
}) {
  const timeSlots = [];
  const startHour = parseInt(globalSettings?.quad_start_hour || 10, 10);
  const endHour = parseInt(globalSettings?.quad_end_hour || 20, 10);

  for (let h = startHour; h < endHour; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  timeSlots.push(`${endHour}:00`);

  const dateStr = selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : '';
  const activeClosure = quadClosures.find(c => c.date === dateStr);

  const maxBookingsPerSlot = parseInt(globalSettings?.quad_max_bookings_per_slot || 6, 10);
  const maxQuads = parseInt(globalSettings?.quad_max_quads_per_slot || 9, 10);
  const maxBuggies = parseInt(globalSettings?.quad_max_buggies_per_slot || 1, 10);

  // Filter only quad bookings
  const quadBookings = bookings.filter(b => b.activity_type === 'quad');
  const sortedBookings = [...quadBookings].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  
  // Arrange overlapping bookings into parallel tracks
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
    slotTime.setHours(parseInt(slotH, 10), parseInt(slotM, 10), 0, 0);

    return processedBookings.filter(b => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return slotTime.getTime() >= bStart.getTime() && slotTime.getTime() < bEnd.getTime();
    });
  };

  const getBookingForTrackAndSlot = (trackId, time) => {
    const [slotH, slotM] = time.split(':');
    const slotTime = new Date(selectedDate);
    slotTime.setHours(parseInt(slotH, 10), parseInt(slotM, 10), 0, 0);

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
        <h3 className="text-warning">კვადროციკლები და ბაგები დაკეტილია</h3>
        <p className="text-secondary margin-top-sm">მიზეზი: {activeClosure.reason}</p>
      </div>
    );
  }

  return (
    <div className="scheduler-wrapper glass-panel">
      {/* Table Header Row */}
      <div 
        className="scheduler-header-row eq-header-row" 
        style={{ display: 'grid', gridTemplateColumns: `80px repeat(${numColumns}, 1fr)` }}
      >
        <div className="scheduler-time-header">დრო</div>
        {Array.from({ length: numColumns }).map((_, i) => (
          <div key={i} className="scheduler-court-column-header eq-header court-header-lines hard">
            <div className="court-type-indicator">🏍️ კვადრო / ბაგი</div>
            <h4>ჯავშანი {i + 1}</h4>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="scheduler-grid-body">
        {timeSlots.map(time => {
          const activeBookings = getBookingsForSlot(time);
          
          let usedQuads = 0;
          let usedBuggies = 0;
          activeBookings.forEach(b => {
            usedQuads += (b.quads_count !== undefined ? b.quads_count : (b.horses_count || 0));
            usedBuggies += (b.buggies_count !== undefined ? b.buggies_count : (b.ponies_count || 0));
          });

          return (
            <div key={time} className="scheduler-grid-row">
              <div className="scheduler-row-time">{time}</div>

              <div 
                className="scheduler-row-cells eq-row-cells" 
                style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}
              >
                {Array.from({ length: numColumns }).map((_, trackId) => {
                  const booking = getBookingForTrackAndSlot(trackId, time);
                  
                  let isStartOfBooking = false;
                  let durationSlots = 1;
                  let colorClass = '';

                  if (booking) {
                    const bStart = new Date(booking.start_time);
                    const bEnd = new Date(booking.end_time);
                    const [slotH, slotM] = time.split(':');
                    const slotTime = new Date(selectedDate);
                    slotTime.setHours(parseInt(slotH, 10), parseInt(slotM, 10), 0, 0);
                    
                    isStartOfBooking = slotTime.getTime() === bStart.getTime();

                    const durationMins = (bEnd.getTime() - bStart.getTime()) / 60000;
                    durationSlots = Math.max(1, Math.round(durationMins / 30));

                    if (durationMins <= 30) colorClass = 'dur-30m';
                    else if (durationMins <= 60) colorClass = 'dur-1h';
                    else if (durationMins <= 90) colorClass = 'dur-1h30';
                    else if (durationMins <= 120) colorClass = 'dur-2h';
                    else colorClass = 'dur-3h';
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
                            alert(`ამ დროზე მეტ ჯავშანს ვეღარ დაამატებთ (მაქსიმუმ ${maxBookingsPerSlot} ჯავშანია დაშვებული).`);
                            return;
                          }
                          if (usedQuads >= maxQuads && usedBuggies >= maxBuggies) {
                            alert('ამ დროზე აღარც კვადროციკლი და აღარც ბაგი აღარაა თავისუფალი.');
                            return;
                          }
                          onSlotClick(time);
                        }
                      }}
                      className={`scheduler-grid-cell cell-hard ${booking ? `occupied ${colorClass}` : 'empty'} ${booking?.is_blocked ? 'blocked' : ''}`}
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
                            padding: '4px',
                            overflow: 'hidden'
                          }}>
                            {booking.is_blocked ? (
                              <span className="flex-align text-warning">
                                🔒 დაბლოკილია
                              </span>
                            ) : (
                              <>
                                <span className="cell-room-no">ოთახი {booking.room_number}</span>
                                <span className="cell-name-txt" style={{ whiteSpace: 'normal', wordBreak: 'break-word', fontWeight: 'bold' }}>
                                  {booking.full_name}
                                </span>
                                <div style={{ fontSize: '11px', marginTop: '3px', color: '#e0f2fe' }}>
                                  {((booking.quads_count !== undefined ? booking.quads_count : (booking.horses_count || 0)) > 0) && (
                                    <span>🏍️ {booking.quads_count !== undefined ? booking.quads_count : booking.horses_count} კვადრო</span>
                                  )}
                                  {((booking.quads_count !== undefined ? booking.quads_count : (booking.horses_count || 0)) > 0 && 
                                    (booking.buggies_count !== undefined ? booking.buggies_count : (booking.ponies_count || 0)) > 0) && <span>, </span>}
                                  {((booking.buggies_count !== undefined ? booking.buggies_count : (booking.ponies_count || 0)) > 0) && (
                                    <span>🚗 {booking.buggies_count !== undefined ? booking.buggies_count : booking.ponies_count} ბაგი</span>
                                  )}
                                </div>
                                {(() => {
                                  const extraCount = (booking.extra_guests_count !== undefined && booking.extra_guests_count !== null && booking.extra_guests_count > 0)
                                    ? booking.extra_guests_count
                                    : (() => {
                                        const m = booking.notes && booking.notes.match(/\+(\d+)\s*უკან\s*სტუმარი/);
                                        return m ? parseInt(m[1], 10) : (booking.has_extra_guest ? 1 : 0);
                                      })();
                                  return extraCount > 0 ? (
                                    <span style={{ fontSize: '10px', color: '#fef08a' }}>👥 +{extraCount} უკან სტუმარი</span>
                                  ) : null;
                                })()}
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
