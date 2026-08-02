import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Key, FileText, Ban, Trash2, Clock } from 'lucide-react';

// Helper: Get current Georgia time (UTC+4) as a local Date object
function getGeorgiaNow() {
  const now = new Date();
  // UTC+4 offset in ms
  const georgiaOffset = 4 * 60 * 60 * 1000;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMs + georgiaOffset);
}

function toInputDate(d) {
  // YYYY-MM-DD for <input type="date">
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toInputTime(d) {
  // HH:MM for <input type="time">
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function buildISOFromInputs(dateStr, timeStr) {
  // Combine date + time strings into a Date, treated as Georgia local time (UTC+4)
  // We'll store as UTC ISO string offset by -4h so that the value
  // represents the correct moment in time.
  if (!dateStr || !timeStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  // Build UTC time: Georgia (UTC+4) local - 4h = UTC
  const utcMs = Date.UTC(y, mo - 1, d, h - 4, mi, 0, 0);
  return new Date(utcMs).toISOString();
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  selectedSlot, 
  existingBooking,
  currentUser,
  courts = [],
  activeDepartment = 'tennis'
}) {
  const [fullName, setFullName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1); // in hours: 1, 1.5, 2
  const [racketsStatus, setRacketsStatus] = useState('included');
  const [racketsCount, setRacketsCount] = useState(2);
  const [isBlocked, setIsBlocked] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState(1);

  // Equestrian states
  const [packageName, setPackageName] = useState('walk_1km');
  const [horsesCount, setHorsesCount] = useState(1);
  const [poniesCount, setPoniesCount] = useState(0);

  useEffect(() => {
    if (existingBooking) {
      setFullName(existingBooking.full_name || '');
      setRoomNumber(existingBooking.room_number || '');
      setSelectedCourtId(existingBooking.court_id || 1);
      // Use slotDate/slotTime if provided by handleSlotClick (already decoded as Georgia local)
      if (selectedSlot?.slotDate && selectedSlot?.slotTime) {
        setStartDate(selectedSlot.slotDate);
        setStartTime(selectedSlot.slotTime);
      } else {
        // Fallback: decode UTC ISO → Georgia local using UTC methods (browser-timezone-safe)
        const ge = new Date(new Date(existingBooking.start_time).getTime() + 4 * 3600000);
        setStartDate(`${ge.getUTCFullYear()}-${String(ge.getUTCMonth()+1).padStart(2,'0')}-${String(ge.getUTCDate()).padStart(2,'0')}`);
        setStartTime(`${String(ge.getUTCHours()).padStart(2,'0')}:${String(ge.getUTCMinutes()).padStart(2,'0')}`);
      }
      const diffMs = new Date(existingBooking.end_time) - new Date(existingBooking.start_time);
      setDuration(diffMs / 3600000 || 1);
      
      // Convert old DB value 'excluded' to 'rented' for UI, otherwise use DB value
      const status = existingBooking.rackets_status || 'included';
      setRacketsStatus(status === 'excluded' ? 'rented' : status);
      setRacketsCount(existingBooking.rackets_count || 2);
      
      setIsBlocked(existingBooking.is_blocked || false);
      setNotes(existingBooking.notes || '');

      setPackageName(existingBooking.package_name || 'walk_1km');
      setHorsesCount(existingBooking.horses_count || (existingBooking.activity_type === 'equestrian' ? 1 : 0));
      setPoniesCount(existingBooking.ponies_count || 0);
    } else {
      setFullName('');
      setRoomNumber('');
      setSelectedCourtId(selectedSlot?.courtId || 1);
      // Use slotDate/slotTime strings if available (passed directly from calendar click or new button)
      if (selectedSlot?.slotDate && selectedSlot?.slotTime) {
        setStartDate(selectedSlot.slotDate);
        setStartTime(selectedSlot.slotTime);
      } else {
        // Fallback: current Georgia time
        const ge = getGeorgiaNow();
        setStartDate(toInputDate(ge));
        setStartTime(toInputTime(ge));
      }
      setDuration(1);
      setRacketsStatus('included');
      setRacketsCount(2);
      setIsBlocked(false);
      setNotes('');
      setPackageName('walk_1km');
      setHorsesCount(activeDepartment === 'equestrian' ? 1 : 0);
      setPoniesCount(0);
    }
    setError('');
  }, [existingBooking, selectedSlot, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isBlocked && (!fullName.trim() || !roomNumber.trim())) {
      setError('გთხოვთ შეავსოთ სტუმრის სახელი და ოთახის ნომერი');
      return;
    }

    if (!startDate || !startTime) {
      setError('გთხოვთ მიუთითოთ დაწყების თარიღი და დრო');
      return;
    }

    const startISO = buildISOFromInputs(startDate, startTime);
    if (!startISO) {
      setError('თარიღი ან დრო არასწორია');
      return;
    }

    const startMs = new Date(startISO).getTime();
    
    let actualDuration = duration;
    if (activeDepartment === 'equestrian') {
      if (packageName === 'walk_1km' || packageName === 'pony_walk') actualDuration = 0.5;
      else if (packageName === 'walk_2km' || packageName === 'tour_4km') actualDuration = 1.0;
      else if (packageName === 'tour_7km') actualDuration = 2.0;
    }
    
    const endISO = new Date(startMs + actualDuration * 3600000).toISOString();

    const bookingData = {
      court_id: activeDepartment === 'equestrian' ? null : selectedCourtId,
      full_name: isBlocked ? 'ადმინისტრაციული ბლოკი' : fullName.trim(),
      room_number: isBlocked ? 'BLOCKED' : roomNumber.trim(),
      start_time: startISO,
      end_time: endISO,
      rackets_status: isBlocked ? 'included' : racketsStatus,
      rackets_count: isBlocked ? 0 : racketsCount,
      activity_type: activeDepartment,
      package_name: activeDepartment === 'equestrian' ? packageName : null,
      horses_count: activeDepartment === 'equestrian' ? horsesCount : 0,
      ponies_count: activeDepartment === 'equestrian' ? poniesCount : 0,
      is_blocked: isBlocked,
      notes: notes
    };

    if (existingBooking?.id) {
      bookingData.id = existingBooking.id;
    }

    onSave(bookingData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>
            {existingBooking ? 'ჯავშნის რედაქტირება' : 'ახალი დაჯავშნა'}
            {activeDepartment === 'tennis' && (
              <span className="modal-court-badge">
                {courts.find(c => c.id === selectedCourtId)?.name || `კორტი ${selectedCourtId}`}
              </span>
            )}
            {activeDepartment === 'equestrian' && (
              <span className="modal-court-badge" style={{ backgroundColor: '#8b5a2b' }}>
                საჯინიბო
              </span>
            )}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}

          {/* Court Selection (Only for Tennis) */}
          {activeDepartment === 'tennis' && (
            <div className="form-group">
              <label className="form-label">კორტი</label>
              <select 
                className="form-input" 
                value={selectedCourtId} 
                onChange={(e) => setSelectedCourtId(Number(e.target.value))}
              >
                {courts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* --- EQUESTRIAN SPECIFIC FIELDS --- */}
          {activeDepartment === 'equestrian' && !isBlocked && (
            <>
              <div className="form-group">
                <label className="form-label">პაკეტი / მომსახურება</label>
                <select 
                  className="form-input" 
                  value={packageName} 
                  onChange={(e) => {
                    setPackageName(e.target.value);
                    if (e.target.value === 'pony_walk') {
                      setHorsesCount(0);
                      setPoniesCount(1);
                    } else {
                      setHorsesCount(1);
                      setPoniesCount(0);
                    }
                  }}
                >
                  <option value="walk_1km">გასეირნება 1კმ (30 წთ)</option>
                  <option value="walk_2km">გასეირნება 2კმ (1 სთ)</option>
                  <option value="tour_4km">ტური 4.4კმ (1 სთ)</option>
                  <option value="tour_7km">ტური 7კმ (2 სთ)</option>
                  <option value="pony_walk">პონით გასეირნება საბავშვო (30 წთ)</option>
                </select>
              </div>

              {packageName !== 'pony_walk' && (
                <div className="form-group">
                  <label className="form-label">ცხენების რაოდენობა</label>
                  <select 
                    className="form-input" 
                    value={horsesCount} 
                    onChange={(e) => setHorsesCount(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} ცხენი</option>)}
                  </select>
                </div>
              )}

              {packageName === 'pony_walk' && (
                <div className="form-group">
                  <label className="form-label">პონების რაოდენობა</label>
                  <select 
                    className="form-input" 
                    value={poniesCount} 
                    onChange={(e) => setPoniesCount(Number(e.target.value))}
                  >
                    {[1,2,3].map(n => <option key={n} value={n}>{n} პონი</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          {/* --- TENNIS SPECIFIC FIELDS --- */}
          {activeDepartment === 'tennis' && !isBlocked && (
            <>
              <div className="form-group">
                <label className="form-label">ხანგრძლივობა</label>
                <div className="duration-selector">
                  {[1, 1.5, 2].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`duration-btn ${duration === val ? 'active' : ''}`}
                      onClick={() => setDuration(val)}
                    >
                      {val} სთ
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ჩოგნები (Rackets)</label>
                <div className="rackets-toggle-container">
                  <button
                    type="button"
                    className={`rackets-toggle-btn included ${racketsStatus === 'included' ? 'active' : ''}`}
                    onClick={() => setRacketsStatus('included')}
                  >
                    🎾 Included (თავისი აქვთ)
                  </button>
                  <button
                    type="button"
                    className={`rackets-toggle-btn excluded ${racketsStatus === 'rented' ? 'active' : ''}`}
                    onClick={() => setRacketsStatus('rented')}
                  >
                    Rented (ნაქირავები)
                  </button>
                </div>
                {racketsStatus === 'rented' && (
                  <div className="margin-top-sm animate-fade-in flex-align">
                    <span className="text-sm text-secondary margin-right-sm">რაოდენობა:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={racketsCount} 
                      onChange={(e) => setRacketsCount(parseInt(e.target.value) || 0)} 
                      className="form-input" 
                      style={{ width: '80px', padding: '6px 12px' }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Block Court Toggle (Only for managers and super admins, and only Tennis) */}
          {currentUser?.role !== 'staff' && activeDepartment === 'tennis' && (
            <div className="form-group block-toggle-group">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={isBlocked} 
                  onChange={(e) => setIsBlocked(e.target.checked)} 
                />
                <span className="checkbox-checkmark"></span>
                <span className="checkbox-label-text flex-align">
                  <Ban size={16} className="text-warning margin-right-xs" />
                  დროებით დაბლოკვა (ადმინისტრაციული)
                </span>
              </label>
            </div>
          )}

          {!isBlocked && (
            <>
              {/* Guest Full Name */}
              <div className="form-group">
                <label className="form-label">სტუმრის სახელი და გვარი</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="მაგ. გიორგი ბერიძე"
                    required={!isBlocked}
                  />
                </div>
              </div>

              {/* Room Number */}
              <div className="form-group">
                <label className="form-label">ოთახის ნომერი</label>
                <div className="input-with-icon">
                  <Key size={16} className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="მაგ. 305"
                    required={!isBlocked}
                  />
                </div>
              </div>
            </>
          )}

          {/* Editable date + time fields */}
          <div className="form-group">
            <label className="form-label">
              <Clock size={14} className="margin-right-xs text-muted" style={{display:'inline', verticalAlign:'middle'}} />
              თარიღი და დრო
            </label>
            <div className="datetime-row">
              <input
                type="date"
                className="form-input datetime-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <input
                type="time"
                className="form-input datetime-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="1800"
                required
              />
            </div>
          </div>

          {/* Optional notes */}
          <div className="form-group">
            <label className="form-label">შენიშვნა (არასავალდებულო)</label>
            <div className="textarea-container">
              <FileText size={16} className="textarea-icon" />
              <textarea 
                className="form-input form-textarea" 
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="დამატებითი დეტალები..."
              />
            </div>
          </div>

          {/* Modal Footer buttons */}
          <div className="modal-footer">
            {existingBooking && (
              <button 
                type="button" 
                className="btn btn-danger btn-delete" 
                onClick={() => onDelete(existingBooking.id)}
              >
                <Trash2 size={16} />
                ჯავშნის წაშლა
              </button>
            )}
            <div className="modal-footer-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                გაუქმება
              </button>
              <button type="submit" className="btn btn-primary">
                {isBlocked ? 'დაბლოკვა' : (existingBooking ? 'განახლება' : 'დაჯავშნა')}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        
        .modal-content {
          width: 100%;
          max-width: 480px;
          border-radius: var(--radius-lg);
          padding: 24px;
          animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), var(--shadow-glow);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-court-badge {
          font-size: 0.75rem;
          background: rgba(204, 255, 0, 0.1);
          color: var(--color-volt);
          padding: 3px 8px;
          border-radius: 20px;
          border: 1px solid rgba(204, 255, 0, 0.2);
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
        }
        .modal-close-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .form-error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-danger);
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-bottom: 16px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .input-with-icon {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .input-with-icon .form-input {
          padding-left: 38px;
        }

        .textarea-container {
          position: relative;
        }
        .textarea-icon {
          position: absolute;
          left: 12px;
          top: 12px;
          color: var(--text-muted);
        }
        .textarea-container .form-textarea {
          padding-left: 38px;
          resize: none;
        }

        /* Date + Time row */
        .datetime-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .datetime-input {
          font-size: 0.95rem;
          color: white;
          text-align: center;
        }
        /* Make native date/time picker icon match theme */
        .datetime-input::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.5);
          cursor: pointer;
        }

        /* Duration Buttons */
        .duration-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .duration-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 10px;
          border-radius: var(--radius-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: inherit;
        }
        .duration-btn:hover {
          border-color: var(--border-hover);
          color: white;
        }
        .duration-btn.active {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--color-volt);
          color: var(--color-volt);
        }

        /* Rackets toggler */
        .rackets-toggle-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .rackets-toggle-btn {
          padding: 12px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
          font-family: inherit;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
        }

        .rackets-toggle-btn.included.active {
          background-color: var(--color-volt);
          color: #000;
          border-color: var(--color-volt);
          box-shadow: 0 4px 15px rgba(204, 255, 0, 0.15);
        }

        .rackets-toggle-btn.excluded.active {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border-color: var(--text-muted);
        }

        .rackets-toggle-btn:hover:not(.active) {
          border-color: var(--border-hover);
          color: white;
        }

        /* Block Court checkbox design */
        .block-toggle-group {
          background: rgba(245, 158, 11, 0.03);
          border: 1px dashed rgba(245, 158, 11, 0.2);
          padding: 12px;
          border-radius: var(--radius-sm);
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          position: relative;
          cursor: pointer;
          user-select: none;
        }
        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        .checkbox-checkmark {
          height: 18px;
          width: 18px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          margin-right: 10px;
          display: inline-block;
          position: relative;
          transition: all var(--transition-fast);
        }
        .checkbox-container:hover input ~ .checkbox-checkmark {
          border-color: var(--color-warning);
        }
        .checkbox-container input:checked ~ .checkbox-checkmark {
          background-color: var(--color-warning);
          border-color: var(--color-warning);
        }
        .checkbox-checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 6px;
          top: 2px;
          width: 4px;
          height: 9px;
          border: solid black;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .checkbox-container input:checked ~ .checkbox-checkmark:after {
          display: block;
        }
        .checkbox-label-text {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .flex-align {
          display: inline-flex;
          align-items: center;
        }
        .margin-right-xs {
          margin-right: 6px;
        }
        .text-warning {
          color: var(--color-warning);
        }
        .text-muted {
          color: var(--text-muted);
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 24px;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }
        .modal-footer-actions {
          display: flex;
          gap: 10px;
          margin-left: auto;
        }
        
        .btn-delete {
          padding: 10px 14px;
        }

        /* Mobile */
        @media (max-width: 900px) {
          .modal-content {
            max-width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }
          .datetime-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
