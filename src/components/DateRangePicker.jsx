import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS_GE = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
];
const DAYS_GE = ['კვ', 'ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა'];

function toYMD(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(str) {
  if (!str) return '';
  const d = fromYMD(str);
  return d.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }) {
  const [open, setOpen] = useState(false);
  // picking step: 'start' | 'end'
  const [picking, setPicking] = useState('start');
  // calendar view
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  // hover for range preview
  const [hoveredDate, setHoveredDate] = useState(null);

  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setPicking('start');
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // When opening, go to start date's month if available
  const handleOpen = () => {
    if (startDate) {
      const d = fromYMD(startDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    setPicking('start');
    setOpen(true);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (dateStr) => {
    if (picking === 'start') {
      onStartChange(dateStr);
      // Reset end if new start is after current end
      if (endDate && dateStr > endDate) onEndChange(dateStr);
      setPicking('end');
    } else {
      // Ensure end >= start
      if (startDate && dateStr < startDate) {
        onStartChange(dateStr);
        onEndChange(startDate);
      } else {
        onEndChange(dateStr);
      }
      setOpen(false);
      setPicking('start');
    }
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth); // 0=Sun
  // Shift so week starts Monday: Mon=0..Sun=6
  const startOffset = (firstDay + 6) % 7;
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(dayNum);
    }
  }

  const effectiveEnd = picking === 'end' && hoveredDate
    ? (startDate && hoveredDate >= startDate ? hoveredDate : startDate)
    : endDate;

  const renderCell = (dayNum) => {
    if (!dayNum) return <div key={`empty-${Math.random()}`} className="drp-cell drp-empty" />;

    const dateStr = toYMD(new Date(viewYear, viewMonth, dayNum));
    const isStart = dateStr === startDate;
    const isEnd = dateStr === endDate || (picking === 'end' && dateStr === hoveredDate);
    const inRange = startDate && effectiveEnd && dateStr > startDate && dateStr < effectiveEnd;
    const isToday = dateStr === toYMD(today);
    const isPast = dateStr < toYMD(today);

    let cls = 'drp-cell';
    if (isStart) cls += ' drp-start';
    if (isEnd && endDate) cls += ' drp-end';
    if (inRange) cls += ' drp-in-range';
    if (isToday) cls += ' drp-today';
    if (isPast && !isStart && !isEnd) cls += ' drp-past';

    return (
      <div
        key={dateStr}
        className={cls}
        onClick={() => handleDayClick(dateStr)}
        onMouseEnter={() => picking === 'end' && setHoveredDate(dateStr)}
        onMouseLeave={() => setHoveredDate(null)}
      >
        {dayNum}
      </div>
    );
  };

  return (
    <div className="drp-container" ref={containerRef}>
      {/* Trigger row */}
      <div className="drp-trigger" onClick={handleOpen}>
        <div className={`drp-trigger-field ${!startDate ? 'drp-placeholder' : ''}`}>
          <Calendar size={14} className="drp-trigger-icon" />
          <span>{startDate ? formatDisplay(startDate) : 'დაწყება'}</span>
        </div>
        <span className="drp-arrow">→</span>
        <div className={`drp-trigger-field ${!endDate ? 'drp-placeholder' : ''}`}>
          <Calendar size={14} className="drp-trigger-icon" />
          <span>{endDate ? formatDisplay(endDate) : 'დასრულება'}</span>
        </div>
      </div>

      {/* Calendar Popup */}
      {open && (
        <div className="drp-popup glass-panel">
          {/* Hint */}
          <div className="drp-hint">
            {picking === 'start' ? '📅 აირჩიეთ დაწყების თარიღი' : '📅 აირჩიეთ დასრულების თარიღი'}
          </div>

          {/* Month nav */}
          <div className="drp-month-nav">
            <button type="button" className="drp-nav-btn" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className="drp-month-label">
              {MONTHS_GE[viewMonth]} {viewYear}
            </span>
            <button type="button" className="drp-nav-btn" onClick={nextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day names header */}
          <div className="drp-days-header">
            {['ორ','სა','ოთ','ხუ','პა','შა','კვ'].map(d => (
              <div key={d} className="drp-day-name">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="drp-grid">
            {cells.map((day, i) => (
              day ? renderCell(day) : <div key={`e-${i}`} className="drp-cell drp-empty" />
            ))}
          </div>

          {/* Footer */}
          {startDate && endDate && picking === 'start' && (
            <div className="drp-footer">
              <span className="text-xs text-secondary">
                {formatDisplay(startDate)} → {formatDisplay(endDate)}
              </span>
              <button
                type="button"
                className="btn btn-xs btn-danger"
                onClick={() => { onStartChange(''); onEndChange(''); setOpen(false); }}
              >
                გასუფთავება
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .drp-container {
          position: relative;
          width: 100%;
        }

        .drp-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,0,0,0.25);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          cursor: pointer;
          transition: border-color 0.15s;
          user-select: none;
        }
        .drp-trigger:hover {
          border-color: var(--color-volt);
        }

        .drp-trigger-field {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 500;
          color: white;
          min-width: 100px;
        }
        .drp-trigger-field.drp-placeholder {
          color: var(--text-muted);
        }
        .drp-trigger-icon {
          color: var(--color-volt);
          flex-shrink: 0;
        }

        .drp-arrow {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .drp-popup {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 9999;
          width: 300px;
          padding: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(204,255,0,0.15);
          animation: drpFadeIn 0.15s ease-out;
        }

        @keyframes drpFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .drp-hint {
          font-size: 0.78rem;
          color: var(--color-volt);
          font-weight: 700;
          margin-bottom: 12px;
          text-align: center;
        }

        .drp-month-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .drp-month-label {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
        }

        .drp-nav-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: background 0.1s, color 0.1s;
        }
        .drp-nav-btn:hover {
          background: rgba(255,255,255,0.06);
          color: white;
        }

        .drp-days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 4px;
        }
        .drp-day-name {
          text-align: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          padding: 4px 0;
        }

        .drp-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .drp-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
          color: white;
          font-weight: 500;
          position: relative;
        }
        .drp-cell:not(.drp-empty):not(.drp-past):hover {
          background: rgba(204,255,0,0.15);
          color: var(--color-volt);
        }
        .drp-empty {
          cursor: default;
        }
        .drp-past {
          color: var(--text-muted);
          cursor: default;
        }
        .drp-today {
          border: 1px solid rgba(255,255,255,0.2);
        }

        .drp-start, .drp-end {
          background: var(--color-volt) !important;
          color: #000 !important;
          font-weight: 800;
          border-radius: 6px;
        }

        .drp-in-range {
          background: rgba(204,255,0,0.12) !important;
          color: var(--color-volt) !important;
          border-radius: 0;
        }
        .drp-start + .drp-in-range,
        .drp-in-range:first-child {
          border-radius: 6px 0 0 6px;
        }
        .drp-in-range:last-child {
          border-radius: 0 6px 6px 0;
        }

        .drp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
        }

        @media (max-width: 900px) {
          .drp-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
          }
        }
      `}</style>
    </div>
  );
}
