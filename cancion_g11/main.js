const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const TERMS = [
  'coldplay','taylor swift','shakira','queen','bruno mars','dua lipa',
  'beatles','adele','ed sheeran','michael jackson','madonna','rihanna',
  'maroon 5','bts','avicii','the weeknd','imagine dragons'
];

let state = {score:0, round:1, total:10, current:null, locked:false};

function pick(arr, n=1){
  const a=[...arr]; const out=[];
  while(out.length<n && a.length){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); }
  return out;
}

async function fetchSongs(){
  const term = TERMS[Math.floor(Math.random()*TERMS.length)];
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=50`;
  $('#status').textContent = 'Buscando canciones…';
  const res = await fetch(url);
  const data = await res.json();
  $('#status').textContent = 'Listo';
  return data.results.filter(x => x.previewUrl && x.trackName);
}

function renderOptions(correctTitle, candidates){
  const opts = [...candidates.map(x=>x.trackName)];
  if(!opts.includes(correctTitle)) opts.splice(Math.floor(Math.random()*opts.length), 0, correctTitle);
  const shuffled = [...new Set(opts)].slice(0,4).sort(()=>Math.random()-0.5);
  const box = $('#answers'); box.innerHTML = '';
  shuffled.forEach(t=>{
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = t;
    btn.onclick = ()=> choose(t);
    box.appendChild(btn);
  });
}

function lock(selectedTitle){
  state.locked = true;
  const correct = state.current.correct;
  $$('#answers .btn').forEach(b=>{
    if(b.textContent === correct) b.classList.add('correct');
    if(selectedTitle && b.textContent === selectedTitle && selectedTitle !== correct) b.classList.add('wrong');
    b.disabled = true;
  });
  $('#next').disabled = false;
}

function choose(title){
  if(state.locked) return;
  if(title === state.current.correct){ state.score++; $('#score').textContent = state.score; }
  lock(title);
}

async function nextRound(offline=false){
  $('#next').disabled = true;
  state.locked = false;
  if(state.round > state.total){
    $('#status').textContent = `Finalizado: ${state.score}/${state.total} puntos`;
    return;
  }
  const results = await fetchSongs();
  if(results.length < 4){ return nextRound(); }

  // elijo una canción + 3 distractores
  const [correct, ...rest] = pick(results, 4);
  const distractors = rest;
  state.current = { correct: correct.trackName };

  // audio + cover
  const player = $('#player');
  player.src = correct.previewUrl;
  player.play().catch(()=>{ /* autoplay puede fallar, el usuario puede darle play */ });

  $('#cover').src = correct.artworkUrl100 || '';

  // opciones (títulos)
  renderOptions(correct.trackName, distractors);

  // HUD
  $('#round').textContent = state.round;
  $('#total').textContent = state.total;
  $('#status').textContent = 'Listo';
}

$('#next').addEventListener('click', ()=>{
  state.round++;
  if(state.round <= state.total){ nextRound(); }
  else {
    $('#status').textContent = `Finalizado: ${state.score}/${state.total} puntos`;
    $('#answers').innerHTML = '';
    $('#player').src = '';
    $('#next').disabled = true;
    showFinalScreen();
  }
});

// --- efectos de sonido ---
const audioCorrect = new Audio("https://cdn.pixabay.com/download/audio/2021/09/13/audio_b2c0eadd3a.mp3?filename=success-1-6297.mp3");
const audioWrong = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_2dbe0d95a9.mp3?filename=error-126627.mp3");

// reproducir sonido al elegir
function choose(title){
  if(state.locked) return;
  if(title === state.current.correct){
    state.score++;
    $('#score').textContent = state.score;
    audioCorrect.currentTime = 0; audioCorrect.play();
  } else {
    audioWrong.currentTime = 0; audioWrong.play();
  }
  lock(title);
}

// esto es como unas ondas musicales animadas
const waveBox = document.createElement('div');
waveBox.className = 'wave';
for(let i=0;i<5;i++){
  const bar=document.createElement('div');
  bar.className='bar';
  waveBox.appendChild(bar);
}
document.querySelector('.audioBox').appendChild(waveBox);

// pausamos la animación según el audio
const player = $('#player');
player.addEventListener('play',()=>waveBox.style.visibility='visible');
player.addEventListener('pause',()=>waveBox.style.visibility='hidden');
waveBox.style.visibility='hidden';

// Función para mostrar pantalla final
function showFinalScreen() {
  document.getElementById('finalScore').textContent = state.score;
  document.getElementById('finalScreen').style.display = 'block';
  document.querySelector('.app')?.classList.add('hidden'); // opcional: ocultar juego
}

// Botón reiniciar
document.getElementById('retryBtn').addEventListener('click', function(){
  state = {score:0, round:1, total:10, current:null, locked:false};
  document.getElementById('score').textContent = 0;
  document.getElementById('finalScreen').style.display = 'none';
  document.querySelector('.app')?.classList.remove('hidden'); // mostrar juego
  nextRound(); // reiniciar juego
});

// primera carga
nextRound();