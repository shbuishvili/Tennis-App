import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Key, FileText, Ban, Trash2 } from 'lucide-react';

export default function BookingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  selectedSlot, 
  existingBooking,
  currentUser
}) {
  const [fullName, setFullName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [duration, setDuration] = useState(1); // in hours: 1, 1.5, 2
  const [racketsStatus, setRacketsStatus] = useState('excluded'); // 'included' or 'excluded'
  const [isBlocked, setIsBlocked] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingBooking) {
      setFullName(existingBooking.full_name || '');
      setRoomNumber(existingBooking.room_number || '');
      // Calculate duration in hours
      const diffMs = new Date(existingBooking.end_time) - new Date(existingBooking.start_time);
      const diffHrs = diffMs / (1000 * 60 * 60);
      setDuration(diffHrs || 1);
      setRacketsStatus(existingBooking.rackets_status || 'excluded');
      setIsBlocked(existingBooking.is_blocked || false);
      setNotes(existingBooking.notes || '');
    } else {
      setFullName('');
      setRoomNumber('');
      setDuration(1);
      setRacketsStatus('excluded');
      setIsBlocked(false);
      setNotes('');
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

    const start = selectedSlot ? new Date(selectedSlot.time) : new Date();
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

    const bookingData = {
      court_id: selectedSlot?.courtId,
      full_name: isBlocked ? 'ადმინისტრაციული ბლოკი' : fullName,
      room_number: isBlocked ? 'BLOCKED' : roomNumber,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      rackets_status: isBlocked ? 'excluded' : racketsStatus,
      is_blocked: isBlocked,
      notes: notes
    };

    if (existingBooking?.id) {
      bookingData.id = existingBooking.id;
    }

    onSave(bookingData);
  };

  // Convert JS Date to Georgian formatted time string
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>
            {existingBooking ? 'ჯავშნის რედაქტირება' : 'ახალი დაჯავშნა'}
            <span className="modal-court-badge">
              {selectedSlot ? (selectedSlot.courtName || `კორტი ${selectedSlot.courtId}`) : ''}
            </span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}

          {/* Block Court Toggle (Only for managers and super admins) */}
          {currentUser?.role !== 'staff' && (
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

              {/* Duration selection */}
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

              {/* Rackets Status Toggle */}
              <div className="form-group">
                <label className="form-label">ჩოგნები (Rackets)</label>
                <div className="rackets-toggle-container">
                  <button
                    type="button"
                    className={`rackets-toggle-btn included ${racketsStatus === 'included' ? 'active' : ''}`}
                    onClick={() => setRacketsStatus('included')}
                  >
                    🎾 Included (ფასში შედის)
                  </button>
                  <button
                    type="button"
                    className={`rackets-toggle-btn excluded ${racketsStatus === 'excluded' ? 'active' : ''}`}
                    onClick={() => setRacketsStatus('excluded')}
                  >
                    Excluded (თავისი აქვთ)
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Start Time details (Read-only representation) */}
          <div className="form-group time-info-panel">
            <Calendar size={14} className="margin-right-xs text-muted" />
            <span>
              დრო: <strong>{formatTime(selectedSlot?.time)}</strong> -დან
            </span>
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

        /* Rackets toggler matching slide 5 */
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

        .time-info-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
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
      `}</style>
    </div>
  );
}
