// ---------- Data (swap with the client's real menu & hours) ----------
const MENU = {
  bread: [
    { name: 'Lorem Sourdough', desc: 'Dolor sit amet, 24-hour ferment', price: '$8', tag: 'Bestseller' },
    { name: 'Ipsum Baguette', desc: 'Consectetur crust, airy crumb', price: '$4' },
    { name: 'Seeded Rye', desc: 'Adipiscing elit, sunflower & flax', price: '$7' },
    { name: 'Brioche Loaf', desc: 'Sed do eiusmod, butter-rich', price: '$9' },
    { name: 'Focaccia', desc: 'Tempor incididunt, rosemary & sea salt', price: '$6', tag: 'Vegan' },
    { name: 'Country Wheat', desc: 'Ut labore et dolore magna', price: '$7' },
  ],
  pastry: [
    { name: 'Butter Croissant', desc: 'Lorem ipsum, 81 flaky layers', price: '$4', tag: 'Bestseller' },
    { name: 'Pain au Chocolat', desc: 'Dolor sit amet, dark chocolate', price: '$4.5' },
    { name: 'Cardamom Bun', desc: 'Consectetur knot, sugar crust', price: '$5' },
    { name: 'Almond Danish', desc: 'Adipiscing frangipane', price: '$5' },
    { name: 'Lemon Tart', desc: 'Sed do eiusmod, torched meringue', price: '$6' },
    { name: 'Seasonal Galette', desc: 'Tempor fruit, rotating weekly', price: '$6', tag: 'New' },
  ],
  coffee: [
    { name: 'Espresso', desc: 'Lorem house blend', price: '$3' },
    { name: 'Flat White', desc: 'Ipsum velvet milk', price: '$4.5' },
    { name: 'Oat Latte', desc: 'Dolor oat, any syrup', price: '$5', tag: 'Vegan' },
    { name: 'Cold Brew', desc: 'Sit amet, 18-hour steep', price: '$4.5' },
    { name: 'Chai', desc: 'Consectetur spice blend', price: '$4.5' },
    { name: 'Hot Chocolate', desc: 'Adipiscing 70% cacao', price: '$4' },
  ],
  lunch: [
    { name: 'Lorem Club', desc: 'Ipsum turkey, bacon, sourdough', price: '$12' },
    { name: 'Garden Toast', desc: 'Dolor avocado, chilli, lime', price: '$10', tag: 'Vegan' },
    { name: 'Croque Monsieur', desc: 'Sit amet gruyère, béchamel', price: '$12' },
    { name: 'Soup of the Day', desc: 'Consectetur, with bread', price: '$8' },
    { name: 'Quiche Slice', desc: 'Adipiscing, side salad', price: '$9' },
    { name: 'Grain Bowl', desc: 'Sed do eiusmod greens', price: '$11' },
  ],
};

// [day index 0=Sun ... 6=Sat] -> [open, close] in 24h, null = closed
const HOURS = [
  [8, 14],   // Sun
  null,      // Mon
  [6.5, 17], // Tue
  [6.5, 17], // Wed
  [6.5, 17], // Thu
  [6.5, 18], // Fri
  [7, 18],   // Sat
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- Header & mobile nav ----------
const header = $('#header');
const burger = $('#burger');
const navLinks = $('#navLinks');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 10), { passive: true });
burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open'); burger.classList.remove('open'); burger.setAttribute('aria-expanded', false);
}));

// ---------- Menu tabs ----------
function renderMenu(key) {
  $('#menuGrid').innerHTML = MENU[key].map((item, i) => `
    <div class="menu-item" style="animation-delay:${i * 50}ms">
      <div>
        <h3>${item.name}${item.tag ? `<span class="tag">${item.tag}</span>` : ''}</h3>
        <p>${item.desc}</p>
      </div>
      <span class="price">${item.price}</span>
    </div>`).join('');
}
$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.tab').forEach(t => t.classList.toggle('active', t === tab));
  renderMenu(tab.dataset.tab);
}));
renderMenu('bread');

// ---------- Hours & open-now badge ----------
const fmt = h => {
  const hr = Math.floor(h), min = Math.round((h - hr) * 60);
  const ampm = hr >= 12 ? 'pm' : 'am';
  return `${((hr + 11) % 12) + 1}${min ? ':' + String(min).padStart(2, '0') : ''}${ampm}`;
};
const now = new Date();
const today = now.getDay();
$('#hoursList').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => `
  <li class="${d === today ? 'today' : ''}"><span>${DAYS[d]}</span><span>${HOURS[d] ? fmt(HOURS[d][0]) + ' – ' + fmt(HOURS[d][1]) : 'Closed'}</span></li>`).join('');

(function updateStatus() {
  const el = $('#openStatus');
  const h = now.getHours() + now.getMinutes() / 60;
  const t = HOURS[today];
  const isOpen = t && h >= t[0] && h < t[1];
  el.classList.add(isOpen ? 'open' : 'closed');
  let msg;
  if (isOpen) msg = `Open now · until ${fmt(t[1])}`;
  else {
    // find next opening
    for (let i = 0; i < 7; i++) {
      const d = (today + i) % 7, slot = HOURS[d];
      if (slot && (i > 0 || h < slot[0])) { msg = `Closed · opens ${i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAYS[d]} ${fmt(slot[0])}`; break; }
    }
  }
  $('.status-text', el).textContent = msg;
})();

// ---------- Form sending ----------
// To make forms email the business: get a free access key at https://web3forms.com
// (enter the business email, the key arrives by email) and paste it below.
// With no key, forms run in demo mode (they validate and confirm but send nothing).
const FORM_KEY = '21521aab-cf28-4564-8185-65b5e9c673b5';
const toFormData = obj => { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, v)); return fd; };
async function sendForm(subject, data) {
  if (!FORM_KEY) { console.info('[demo mode] would send:', subject, data); await new Promise(r => setTimeout(r, 700)); return true; }
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { Accept: 'application/json' }, // FormData = no CORS preflight, works even from file://
    body: toFormData({ access_key: FORM_KEY, subject, from_name: 'Maison Lorem website', ...data }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || 'Send failed');
  return true;
}

// ---------- Order form ----------
const form = $('#orderForm');
const dateInput = $('#date');
const tomorrow = new Date(Date.now() + 864e5);
dateInput.min = tomorrow.toISOString().split('T')[0];

form.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#orderMsg');
  const btn = $('button[type=submit]', form);
  let valid = true;
  $$('[required]', form).forEach(input => {
    let bad = !input.value.trim();
    if (input.id === 'phone') bad = input.value.replace(/\D/g, '').length < 7;
    if (input.id === 'date') bad = !input.value || input.value < input.min || HOURS[new Date(input.value + 'T12:00').getDay()] === null;
    input.closest('.field').classList.toggle('error', bad);
    if (bad) valid = false;
  });
  if (!valid) {
    msg.className = 'form-msg err';
    msg.textContent = $('#date').closest('.field').classList.contains('error') && $('#date').value
      ? 'We\'re closed that day, please pick another pickup date.'
      : 'Please fill in every field.';
    return;
  }
  const data = {
    name: $('#name').value.trim(),
    phone: $('#phone').value.trim(),
    pickup_date: new Date($('#date').value + 'T12:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
    order: $('#items').value.trim(),
  };
  btn.disabled = true; btn.textContent = 'Sending…'; msg.textContent = '';
  try {
    await sendForm(`New pickup order: ${data.name} (${data.pickup_date})`, data);
    msg.className = 'form-msg ok';
    msg.textContent = `Thanks, ${data.name.split(' ')[0]}! Your order for ${data.pickup_date} is in. We'll text you to confirm.`;
    form.reset();
  } catch (err) {
    msg.className = 'form-msg err';
    msg.textContent = 'Sorry, that didn\'t go through. Please call us on (555) 010-2030.';
  } finally {
    btn.disabled = false; btn.textContent = 'Send order';
  }
});
$$('input, textarea', form).forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('error')));

// ---------- Scroll reveal ----------
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
}), { threshold: .12 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });

$('#year').textContent = new Date().getFullYear();
