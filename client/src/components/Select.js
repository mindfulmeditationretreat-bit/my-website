'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Professional themed dropdown (replaces the native <select>).
// The menu is portaled to <body> with fixed positioning so it always
// overlays surrounding cards regardless of ancestor stacking contexts.
// options: [{ value, label }], value: string, onChange: (value) => void
export default function Select({ options, value, onChange, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const selected = options.find((o) => o.value === value);

  function measure() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  function openMenu() {
    measure();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e) {
      if (btnRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function reposition() { measure(); }
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  function pick(val) {
    onChange(val);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { openMenu(); return; }
      setActive((i) => {
        const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
        return (next + options.length) % options.length;
      });
    }
    if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault();
      pick(options[active].value);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input flex items-center justify-between text-left ${open ? 'border-gold ring-1 ring-gold/40' : ''}`}
      >
        <span className={selected ? 'text-cream' : 'text-cream/40'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-cream/50 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && coords && typeof document !== 'undefined' && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
          className="z-[100] max-h-72 overflow-y-auto rounded-xl border border-gold/25 bg-[#0d0a06] shadow-glow py-1 fade-in-down"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o.value)}
                className={`px-4 py-2.5 cursor-pointer text-sm flex items-center justify-between transition ${
                  i === active ? 'bg-gold/15 text-cream' : 'text-cream/80'
                }`}
              >
                {o.label}
                {isSelected && (
                  <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}
