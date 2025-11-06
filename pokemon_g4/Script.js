const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const titleCase = s => (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const capitalize = s => s ? s[0].toUpperCase() + s.slice(1) : s;

/* sonidos */
const sndCorrect = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sndWrong = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");

/* ranking */
function saveRanking(name, score) {
  let r = JSON.parse(localStorage.getItem("poke_ranking") || "[]");
  r.push({ name, score });
  r.sort((a, b) => b.score - a.score);
  r = r.slice(0, 5);
  localStorage.setItem("poke_ranking", JSON.stringify(r));
}
function renderRanking() {
  let r = JSON.parse(localStorage.getItem("poke_ranking") || "[]");
  if (!r.length) { $('#ranking').innerHTML = ''; return; }
  let h = "<h2>🏆 Ranking</h2><table><tr><th>Jugador</th><th>Puntos</th></tr>";
  r.forEach(x => h += `<tr><td>${x.name}</td><td>${x.score}</td></tr>`);
  h += "</table>";
  $('#ranking').innerHTML = h;
}

/* pokedex */
let POKEDEX = [];
async function loadDex() {
  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=500');
  const data = await res.json();
  POKEDEX = data.results.map(r => {
    const m = r.url.match(/\/pokemon\/(\d+)\//);
    return { name: r.name, id: m ? parseInt(m[1]) : null };
  }).filter(p => p.id);
}
async function getDetail(id) {
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const d = await r.json();
  const img = d?.sprites?.other?.['official-artwork']?.front_default;
  const types = (d.types || []).map(t => t.type.name);
  return { id: d.id, name: d.name, img, types };
}

/* estado */
let state = { score: 0, round: 1, total: 10, locked: false, hints: 0, current: null };

function buildOptions(correct) {
  const pool = POKEDEX.filter(p => p.name !== correct);
  const picks = [];
  while (picks.length < 3) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (!picks.find(x => x.name === r.name)) picks.push(r);
  }
  return [correct, ...picks.map(p => p.name)].map(titleCase).sort(() => Math.random() - 0.5);
}
function renderOptions(opts) {
  const box = $('#answers');
  box.innerHTML = '';
  opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = o;
    b.onclick = () => choose(o);
    box.appendChild(b);
  });
}
function revealFull() {
  const m = $('#pokeMask');
  m.style.setProperty('--rev', '120%');
  setTimeout(() => { m.style.opacity = '0'; }, 200);
}
function lock(sel) {
  state.locked = true;
  const correct = titleCase(state.current.name);
  $$('#answers .btn').forEach(b => {
    if (b.textContent === correct) b.classList.add('correct');
    if (sel && b.textContent === sel && sel !== correct) b.classList.add('wrong');
    b.disabled = true;
  });
  $('#next').disabled = false;
}
function showExtra() {
  const { id, types, name } = state.current;
  const chips = types.map(t => `<span class="chip">${capitalize(t)}</span>`).join('');
  $('#extra').innerHTML = `#${id} — <b>${titleCase(name)}</b> ${chips}`;
}

async function nextRound() {
  $('#next').disabled = true;
  $('#extra').textContent = '';
  $('#status').textContent = 'Cargando…';
  state.locked = false;
  state.hints = 0;
  const m = $('#pokeMask');
  m.style.opacity = '1';
  m.style.setProperty('--rev', '0%');
  let detail = null, tries = 0;
  while (!detail && tries < 6) {
    const r = POKEDEX[Math.floor(Math.random() * POKEDEX.length)];
    try { const d = await getDetail(r.id); if (d.img) detail = d; } catch { }
    tries++;
  }
  if (!detail) { $('#status').textContent = "Error cargando."; return; }
  state.current = detail;
  $('#pokeBase').src = detail.img;
  $('#pokeMask').src = detail.img;
  renderOptions(buildOptions(detail.name));
  $('#status').textContent = 'Listo';
}

function choose(opt) {
  if (state.locked) return;
  revealFull();
  showExtra();
  if (opt === titleCase(state.current.name)) {
    state.score++;
    $('#score').textContent = state.score;
    sndCorrect.play();
  } else sndWrong.play();
  lock(opt);
}

/* Ayuda */
$('#hint').addEventListener('click', () => {
  if (state.locked) return;
  state.hints++;
  const perc = Math.min(state.hints * 20, 100);
  $('#pokeMask').style.setProperty('--rev', perc + '%');
  if (perc >= 100) $('#hint').disabled = true;
});

$('#next').addEventListener('click', () => {
state.round++;
if (state.round <= state.total) {
$('#round').textContent = state.round;
$('#hint').disabled = false;
nextRound();
} else {
    revealFull(); 
    showExtra();

  
    document.querySelector('.app').classList.add('game-over'); 

    // Pedir nombre y guardar ranking
const name = prompt("Fin del juego 🎉\nIngresá tu nombre para el ranking:", "Jugador");
if (name) saveRanking(name, state.score);
renderRanking();

   
    const finalScoreMsg = `Juego terminado: ${state.score}/${state.total} puntos`;

   
    $('#controls').innerHTML = `
        <span id="final-status" class="muted">${finalScoreMsg}</span>
        <button id="restart-game" class="btnSm">Volver a Jugar</button>
    `;

 
$('#restart-game').addEventListener('click', () => {
 location.reload(); 
    });
    
    
$('#hint').disabled = true;

   
$('#answers').innerHTML = '';
$('#pokeBase').src = '';
$('#pokeMask').src = '';
   
}
});

/* teclado 1–4 */
window.addEventListener('keydown', e => {
  if (state.locked) return;
  if (['1', '2', '3', '4'].includes(e.key)) {
    const i = parseInt(e.key, 10) - 1;
    const b = $$('#answers .btn')[i];
    if (b) b.click();
  }
});

/* init */
(async function init() {
  await loadDex();
  renderRanking();
  $('#round').textContent = state.round;
  $('#total').textContent = state.total;
  nextRound();
})();

