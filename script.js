/* Plain JavaScript: the exhibition also works directly from index.html. */
'use strict';
const { groups, events, leaders, locations } = window.EXHIBIT;
const all = selector => [...document.querySelectorAll(selector)];
const sourceLabels = { class: 'Class timeline', un: 'UN News, 2025', eddins: 'Eddins 277–81', bnf: 'Gaillard-Pourchet', state: 'Office of the Historian', shen: 'Shen, “Upheavals”', power: 'Shen, “Louverture”', embassy: 'Embassy of Haiti' };
function citations(ids) { return '<span class="citation">' + ids.map(id => `<a href="#source-${id}">(${sourceLabels[id]})</a>`).join(' ') + '</span>'; }
function press(selector, value, attribute) { all(selector).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[attribute] === String(value)))); }
all('[data-group]').forEach(button => button.addEventListener('click', () => {
    const group = groups[Number(button.dataset.group)];
    press('[data-group]', button.dataset.group, 'group');
    document.querySelector('#group-panel h4').textContent = group.question;
    document.getElementById('group-goal').textContent = group.goal;
    document.getElementById('group-conflict').textContent = group.conflict;
}));
function showLocation(id) {
    const index = locations.findIndex(location => location.id === id);
    if (index < 0) return;
    const location = locations[index];
    press('[data-location]', id, 'location');
    all('.pin').forEach(pin => pin.classList.toggle('active', pin.dataset.location === id));
    // Text is local, trusted exhibit data; create text nodes for the historical prose.
    const panel = document.getElementById('map-panel');
    panel.replaceChildren();
    const label = document.createElement('p'); label.className = 'eyebrow'; label.textContent = `LOCATION / ${String(index + 1).padStart(2, '0')}`;
    const heading = document.createElement('h4'); heading.textContent = location.name;
    const text = document.createElement('p'); text.textContent = location.text;
    panel.append(label, heading, text);
    panel.insertAdjacentHTML('beforeend', citations(location.source));
}
all('[data-location]').forEach(button => button.addEventListener('click', () => showLocation(button.dataset.location)));
let currentEvent = 0;
function showEvent(index, scrollButton = false) {
    if (index < 0 || index >= events.length) return;
    currentEvent = index;
    all('.event-record').forEach((record, i) => { record.hidden = i !== index; });
    press('[data-event]', index, 'event');
    document.getElementById('event-count').textContent = String(index + 1).padStart(2, '0');
    document.getElementById('event-position').textContent = `${index + 1} / ${events.length}`;
    document.getElementById('previous-event').disabled = index === 0;
    document.getElementById('next-event').disabled = index === events.length - 1;
    if (events[index].map) showLocation(events[index].map);
    if (scrollButton) { const button = document.querySelector(`[data-event="${index}"]`); const strip = document.querySelector('.timeline-strip'); strip.scrollTo({ left: button.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + button.offsetWidth / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
}
all('[data-event]').forEach(button => button.addEventListener('click', () => showEvent(Number(button.dataset.event))));
document.getElementById('previous-event').addEventListener('click', () => showEvent(currentEvent - 1, true));
document.getElementById('next-event').addEventListener('click', () => showEvent(currentEvent + 1, true));
// Arrow keys move between timeline dates. Tab navigation remains available everywhere.
document.querySelector('.timeline-strip').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? events.length - 1 : Math.max(0, Math.min(events.length - 1, currentEvent + (event.key === 'ArrowRight' ? 1 : -1)));
    event.preventDefault(); showEvent(next, true); document.querySelector(`[data-event="${next}"]`).focus({ preventScroll: true });
});
all('[data-leader]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.leader); press('[data-leader]', index, 'leader');
    all('.leader-profile').forEach((profile, i) => { profile.hidden = i !== index; });
}));
const navLinks = all('.nav-links a');
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { navLinks.forEach(link => { const selected = link.hash === '#' + entry.target.id; link.classList.toggle('active', selected); if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); } }); }, { rootMargin: '-10% 0px -65% 0px' });
    all('.exhibit').forEach(section => observer.observe(section));
}
let scrollQueued = false;
function updateProgress() { const total = document.documentElement.scrollHeight - innerHeight; document.querySelector('.reading-progress').style.width = `${total > 0 ? scrollY / total * 100 : 0}%`; scrollQueued = false; }
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); } }, { passive: true });
addEventListener('resize', updateProgress); updateProgress();
// Keep the full research readable when scripts are disabled or the exhibit is printed.
addEventListener('beforeprint', () => all('details').forEach(detail => { detail.dataset.wasOpen = String(detail.open); detail.open = true; }));
addEventListener('afterprint', () => all('details').forEach(detail => { detail.open = detail.dataset.wasOpen === 'true'; }));
