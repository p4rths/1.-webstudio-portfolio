const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- Header & mobile nav ----------
const header = $('#header'), burger = $('#burger'), navLinks = $('#navLinks');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 30);
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => { navLinks.classList.remove('open'); burger.classList.remove('open'); }));

// ---------- Review slider ----------
const slides = $$('.slide'), dotsWrap = $('#dots');
let current = 0, timer;
slides.forEach((_, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', `Review ${i + 1}`);
  b.addEventListener('click', () => go(i));
  dotsWrap.appendChild(b);
});
function go(i) {
  current = (i + slides.length) % slides.length;
  slides.forEach((s, j) => s.classList.toggle('active', j === current));
  $$('button', dotsWrap).forEach((d, j) => d.classList.toggle('active', j === current));
  clearInterval(timer); timer = setInterval(() => go(current + 1), 6000);
}
$('#prev').addEventListener('click', () => go(current - 1));
$('#next').addEventListener('click', () => go(current + 1));
go(0);

// ---------- Booking ----------
const OPEN = { 0: null, 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [8, 17] }; // day -> [open, close]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const booking = { barber: 'Any', date: null, time: null };

// ---------- Form sending ----------
// To make bookings email the shop: get a free access key at https://web3forms.com
// (enter the shop's email, the key arrives by email) and paste it below.
// With no key, booking runs in demo mode (it validates and confirms but sends nothing).
const FORM_KEY = '21521aab-cf28-4564-8185-65b5e9c673b5';
const toFormData = obj => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, v)); return fd; };
async function sendForm(subject, data) {
  if (!FORM_KEY) { console.info('[demo mode] would send:', subject, data); await new Promise(r => setTimeout(r, 700)); return true; }
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { Accept: 'application/json' }, // FormData = no CORS preflight, works even from file://
    body: toFormData({ access_key: FORM_KEY, subject, from_name: 'Ipsum Barber Co. website', ...data }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || 'Send failed');
  return true;
}

// Bookings made in this browser are remembered so the same slot can't be booked twice.
// (Live availability across all customers needs a booking backend, e.g. Calendly/Square/Fresha.)
const STORE = 'ipsum-barber-bookings';
const loadBooked = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
const saveBooked = obj => { try { localStorage.setItem(STORE, JSON.stringify(obj)); } catch { } };
const slotKey = (date, barber) => `${date.toDateString()}|${barber}`;
const isBookedHere = (date, barber, time) => {
  const b = loadBooked();
  // "Any" is blocked if any barber has the slot; a named barber is blocked by their own or an "Any" booking
  return Object.entries(b).some(([k, times]) => {
    const [d, who] = k.split('|');
    return d === date.toDateString() && times.includes(time) && (barber === 'Any' || who === barber || who === 'Any');
  });
};

// Fake "already booked" slots so the picker feels real (deterministic per date)
const taken = (date, slot) => ((date.getDate() * 7 + slot * 13) % 5) === 0;

// Barber chips
$$('#barberChips .chip').forEach(chip => chip.addEventListener('click', () => {
  $$('#barberChips .chip').forEach(c => c.classList.toggle('active', c === chip));
  booking.barber = chip.dataset.v;
  if (booking.date) renderTimes(booking.date);
}));

// Next 7 days
const daysWrap = $('#days');
for (let i = 0; i < 7; i++) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'day';
  b.innerHTML = `<small>${i === 0 ? 'Today' : DAY_NAMES[d.getDay()]}</small><b>${d.getDate()}</b>`;
  if (!OPEN[d.getDay()]) b.disabled = true;
  b.addEventListener('click', () => {
    $$('.day').forEach(x => x.classList.toggle('active', x === b));
    booking.date = d; booking.time = null;
    renderTimes(d);
  });
  daysWrap.appendChild(b);
}

function renderTimes(date) {
  const wrap = $('#times'); wrap.innerHTML = ''; wrap.classList.remove('error');
  const [open, close] = OPEN[date.getDay()];
  const now = new Date();
  const seed = booking.barber.length; // different barbers -> different availability
  for (let h = open, slot = 0; h < close; h += .5, slot++) {
    const t = new Date(date); t.setHours(Math.floor(h), (h % 1) * 60);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'slot';
    b.textContent = t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (t < now || taken(date, slot + seed) || isBookedHere(date, booking.barber, b.textContent)) b.disabled = true;
    b.addEventListener('click', () => {
      $$('.slot', wrap).forEach(x => x.classList.toggle('active', x === b));
      booking.time = b.textContent;
      wrap.classList.remove('error');
    });
    wrap.appendChild(b);
  }
  if (!$$('.slot:not(:disabled)', wrap).length) wrap.innerHTML = '<p style="font-size:.85rem">Fully booked, please try another day or barber.</p>';
}
$('#times').innerHTML = '<p style="font-size:.85rem">Pick a day first.</p>';

$('#bookForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#bookMsg');
  const btn = $('#bookForm button[type=submit]');
  const fields = [$('#service'), $('#bname'), $('#bphone')];
  let ok = true;
  fields.forEach(f => {
    const bad = f.id === 'bphone' ? f.value.replace(/\D/g, '').length < 7 : !f.value.trim();
    f.classList.toggle('error', bad); if (bad) ok = false;
  });
  if (!booking.date) { ok = false; daysWrap.classList.add('error'); } else daysWrap.classList.remove('error');
  if (!booking.time) { ok = false; $('#times').classList.add('error'); }
  if (!ok) { msg.className = 'form-msg err'; msg.textContent = 'Almost there, fill in the highlighted steps.'; return; }

  const day = booking.date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const service = $('#service').value;
  const name = $('#bname').value.trim();
  const barber = booking.barber === 'Any' ? 'the next free barber' : booking.barber;

  btn.disabled = true; btn.textContent = 'Booking…'; msg.textContent = '';
  try {
    await sendForm(`New booking: ${name}, ${day} at ${booking.time}`, {
      name, phone: $('#bphone').value.trim(), service, barber: booking.barber, date: day, time: booking.time,
    });
    // remember the slot so it shows as taken
    const all = loadBooked(), k = slotKey(booking.date, booking.barber);
    (all[k] = all[k] || []).push(booking.time); saveBooked(all);

    msg.className = 'form-msg ok';
    msg.textContent = `You're booked, ${name.split(' ')[0]}! ${service.split(' —')[0]} with ${barber} on ${day} at ${booking.time}. We'll text you a confirmation.`;
    $('#bookForm').reset();
    booking.time = null;
    renderTimes(booking.date);
  } catch (err) {
    msg.className = 'form-msg err';
    msg.textContent = 'Sorry, that didn\'t go through. Please call us on (555) 010-4050.';
  } finally {
    btn.disabled = false; btn.textContent = 'Confirm booking';
  }
});
$$('#bookForm input, #bookForm select').forEach(f => f.addEventListener('input', () => f.classList.remove('error')));

// ---------- Scroll reveal ----------
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
}), { threshold: .1 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(el); });

$('#year').textContent = new Date().getFullYear();
