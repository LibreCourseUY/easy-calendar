import { useState, useMemo, useCallback, useEffect, useRef } from 'preact/hooks';
import defaultData from '../sample-data.json';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

const I18N = {
  es: {
    search: 'Buscar eventos...',
    back: 'Calendarios',
    empty: 'No hay calendarios configurados.',
    notFound: 'Calendario no encontrado.',
    events: (n) => `${n} evento${n === 1 ? '' : 's'}`,
    months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    days: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
    langBtn: 'EN',
    themeTip: 'Cambiar tema',
  },
  en: {
    search: 'Search events...',
    back: 'Calendars',
    empty: 'No calendars configured.',
    notFound: 'Calendar not found.',
    events: (n) => `${n} event${n === 1 ? '' : 's'}`,
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    langBtn: 'ES',
    themeTip: 'Toggle theme',
  }
};

function normalizeEndpoint(p) {
  return String(p || '').trim().replace(/^\/+|\/+$/g, '');
}

function parseEvents(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(e => {
    const [dd, mm, yyyy] = String(e.date).split('/').map(Number);
    return { name: e.name, date: new Date(yyyy, mm - 1, dd), type: e.type || 'unknown', time: e.time || null };
  }).filter(e => !isNaN(e.date));
}

function parseCalendars(raw) {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.calendars) ? raw.calendars : [];
  return list.map(c => {
    const endpoint = normalizeEndpoint(c.endpoint);
    return {
      endpoint,
      name: c.name || endpoint,
      description: c.description || '',
      events: parseEvents(c.events),
    };
  }).filter(c => c.endpoint && c.name);
}

function usePathname() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

function navigate(to) {
  if (window.location.pathname === to) return;
  window.history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function slugFromPath(pathname) {
  let p = pathname;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  return p.replace(/^\/+|\/+$/g, '');
}

function hashType(type) {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function typeColor(type) {
  const h = hashType(type) % 360;
  return `hsl(${h}, 72%, 62%)`;
}

function typeBg(type, dark) {
  const h = hashType(type) % 360;
  return dark ? `hsl(${h}, 45%, 22%)` : `hsl(${h}, 60%, 85%)`;
}

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function startDay(y, m) { return new Date(y, m, 1).getDay(); }
function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function computeTooltipPos(rect, tipW, tipH, vw, vh) {
  const gap = 8;
  const margin = 8;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const maxX = Math.max(margin, vw - tipW - margin);
  const maxY = Math.max(margin, vh - tipH - margin);

  const candidates = [
    { x: cx - tipW / 2, y: rect.top - gap - tipH },
    { x: cx - tipW / 2, y: rect.bottom + gap },
    { x: rect.left - gap - tipW, y: cy - tipH / 2 },
    { x: rect.right + gap, y: cy - tipH / 2 },
  ];

  let best = null;
  for (const c of candidates) {
    const x = Math.min(Math.max(c.x, margin), maxX);
    const y = Math.min(Math.max(c.y, margin), maxY);
    const overflow = Math.abs(x - c.x) + Math.abs(y - c.y);
    if (!best || overflow < best.overflow) best = { x, y, overflow };
  }
  return best;
}

function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

function SunIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}

function MoonIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}

function GithubIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>;
}

function HeaderControls({ t, dark, setDark, lang, setLang, children }) {
  return (
    <div class="header-controls">
      {children}
      <button class="lang-toggle" onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}>{t.langBtn}</button>
      <button class="theme-toggle" onClick={() => setDark(d => !d)} title={t.themeTip}>
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>
      <a class="gh-link" href="https://github.com/LibreCourseUY/easy-calendar" target="_blank" rel="noopener noreferrer" title="GitHub">
        <GithubIcon />
      </a>
    </div>
  );
}

function CardBoard({ calendars, heading, t, notFound, dark, setDark, lang, setLang }) {
  return (
    <>
      <header>
        <h1>{heading}</h1>
        <HeaderControls t={t} dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      </header>
      {notFound && <p class="board-note">{t.notFound}</p>}
      {calendars.length === 0
        ? (!notFound && <p class="board-note">{t.empty}</p>)
        : (
          <div class="board">
            {calendars.map(c => (
              <a
                key={c.endpoint}
                class="card"
                href={`${BASE}/${c.endpoint}`}
                onClick={e => { e.preventDefault(); navigate(`${BASE}/${c.endpoint}`); }}
              >
                <h3 class="card-title">{c.name}</h3>
                {c.description && <p class="card-desc">{c.description}</p>}
                <span class="card-count">{t.events(c.events.length)}</span>
              </a>
            ))}
          </div>
        )}
    </>
  );
}

function CalendarDay({ day, month, year, events, focusedType, onSelect, isToday, dark }) {
  if (!day) return <div class="cal-cell empty" />;
  const d = new Date(year, month, day);
  const key = dateKey(d);
  const evts = events.filter(e => dateKey(e.date) === key)
    .sort((a, b) => (a.time || 'zz:zz').localeCompare(b.time || 'zz:zz'));
  const hasFocused = focusedType !== null;
  const matchesFocus = hasFocused && evts.some(e => e.type === focusedType);
  const dimmed = hasFocused && !matchesFocus;
  const bg = evts.length ? typeBg(evts[0].type, dark) : undefined;

  return (
    <div
      class={`cal-cell${isToday ? ' today' : ''}${evts.length ? ' has-events' : ''}${dimmed ? ' dimmed' : ''}`}
      style={bg ? { background: bg } : undefined}
      onMouseEnter={e => evts.length && onSelect(evts, e)}
      onTouchStart={e => evts.length && onSelect(evts, e)}
    >
      <span class="day-num">{day}</span>
      {evts.length > 0 && (
        <div class="event-dots">
          {evts.slice(0, 4).map((ev, i) => (
            <span key={i} class="dot" style={{ background: typeColor(ev.type) }} />
          ))}
          {evts.length > 4 && <span class="dot more">+{evts.length - 4}</span>}
        </div>
      )}
    </div>
  );
}

function Tooltip({ events, position, onClose }) {
  if (!events) return null;
  return (
    <div class="tooltip" style={{ left: position.x + 'px', top: position.y + 'px' }}>
      {events.map((ev, i) => (
        <div key={i} class="tooltip-event">
          <span class="tooltip-dot" style={{ background: typeColor(ev.type) }} />
          {ev.time && <span class="tooltip-time">{ev.time}</span>}
          <span class="tooltip-name">{ev.name}</span>
          <span class="tooltip-type">{ev.type}</span>
        </div>
      ))}
      <div class="tooltip-close" onClick={onClose}>×</div>
    </div>
  );
}

function CalendarView({ calendar, t, dark, setDark, lang, setLang, onBack }) {
  const allEvents = calendar.events;
  const eventTypes = useMemo(() => [...new Set(allEvents.map(e => e.type))].sort(), [allEvents]);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [search, setSearch] = useState('');
  const [focusedType, setFocusedType] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const selectedRef = useRef(false);

  useEffect(() => {
    if (!tooltip) { selectedRef.current = false; return; }
    const handler = (e) => {
      if (selectedRef.current && !e.target.closest('.tooltip') && !e.target.closest('.cal-cell')) {
        setTooltip(null);
        selectedRef.current = false;
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [tooltip]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allEvents.filter(e => e.name.toLowerCase().includes(q));
  }, [allEvents, search]);

  const goToEvent = useCallback((ev) => {
    setYear(ev.date.getFullYear());
    setMonth(ev.date.getMonth());
    setSearch('');
    setTooltip(null);
  }, []);

  const handleSelect = useCallback((evts, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tipW = 260;
    const tipH = evts.length * 36 + 16;
    const pos = computeTooltipPos(rect, tipW, tipH, window.innerWidth, window.innerHeight);

    selectedRef.current = true;
    setTooltip(evts);
    setTooltipPos(pos);
  }, []);

  const handleDeselect = useCallback(() => {
    setTooltip(null);
    selectedRef.current = false;
  }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const totalDays = daysInMonth(year, month);
  const firstDay = startDay(year, month);
  const todayKey = dateKey(today);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <>
      <header>
        <button class="back-btn" onClick={onBack}>&#8249; {t.back}</button>
        <h1>{calendar.name}</h1>
        <HeaderControls t={t} dark={dark} setDark={setDark} lang={lang} setLang={setLang}>
          <div class="search-wrap">
            <SearchIcon />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onInput={e => setSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div class="search-results">
                {searchResults.slice(0, 10).map((ev, i) => (
                  <div key={i} class="search-result" onClick={() => goToEvent(ev)}>
                    <span class="sr-dot" style={{ background: typeColor(ev.type) }} />
                    <span class="sr-name">{ev.name}</span>
                    <span class="sr-type">{ev.type}</span>
                    <span class="sr-date">{String(ev.date.getDate()).padStart(2,'0')}/{String(ev.date.getMonth()+1).padStart(2,'0')}/{ev.date.getFullYear()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </HeaderControls>
      </header>
      {calendar.description && <p class="cal-desc">{calendar.description}</p>}

      <div class="filters">
        {eventTypes.map(tp => (
          <button
            key={tp}
            class={`filter-btn${focusedType === tp ? ' active' : ''}`}
            style={focusedType === tp ? { background: typeColor(tp), borderColor: typeColor(tp) } : {}}
            onClick={() => setFocusedType(prev => prev === tp ? null : tp)}
          >
            <span class="filter-dot" style={{ background: focusedType === tp ? '#fff' : typeColor(tp) }} />
            {tp}
          </button>
        ))}
      </div>

      <div class="month-nav">
        <button onClick={prevMonth}>&#8249;</button>
        <h2>{t.months[month]} {year}</h2>
        <button onClick={nextMonth}>&#8250;</button>
      </div>

      <div class="cal-grid">
        {t.days.map(d => <div key={d} class="cal-header">{d}</div>)}
        {cells.map((d, i) => (
          <CalendarDay
            key={i}
            day={d}
            month={month}
            year={year}
            events={allEvents}
            focusedType={focusedType}
            onSelect={handleSelect}
            isToday={d && dateKey(new Date(year, month, d)) === todayKey}
            dark={dark}
          />
        ))}
      </div>

      <Tooltip events={tooltip} position={tooltipPos} onClose={handleDeselect} />
    </>
  );
}

export function App() {
  const raw = useMemo(() => {
    try {
      const v = import.meta.env.VITE_CALENDAR_DATA;
      return v ? JSON.parse(v) : defaultData;
    } catch { return defaultData; }
  }, []);

  const calendars = useMemo(() => parseCalendars(raw), [raw]);
  const pathname = usePathname();
  const slug = slugFromPath(pathname);
  const calendar = calendars.find(c => c.endpoint === slug);

  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [lang, setLang] = useState('es');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  }, [dark]);

  useEffect(() => {
    document.title = calendar ? `${calendar.name} – Easy Calendar` : 'Easy Calendar';
  }, [calendar]);

  const t = I18N[lang];
  const title = import.meta.env.VITE_CALENDAR_TITLE;
  const heading = title ? `Easy Calendar \u2013 ${title}` : 'Easy Calendar';

  const goHome = useCallback(() => navigate(BASE || '/'), []);

  return (
    <div class="app">
      {calendar
        ? <CalendarView
            key={calendar.endpoint}
            calendar={calendar}
            t={t}
            dark={dark}
            setDark={setDark}
            lang={lang}
            setLang={setLang}
            onBack={goHome}
          />
        : <CardBoard
            calendars={calendars}
            heading={heading}
            t={t}
            notFound={!!slug}
            dark={dark}
            setDark={setDark}
            lang={lang}
            setLang={setLang}
          />}
    </div>
  );
}
