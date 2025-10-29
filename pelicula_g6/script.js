const $=s=>document.querySelector(s); const $$=s=>Array.from(document.querySelectorAll(s));

/* ⚙️ Config */
const OMDB_API_KEY = "a22fb87a"; // ← poné tu key gratuita de omdbapi.com
const TERMS = ["halloween", "friday the 13th", "nightmare on elm street", "scream", "the conjuring", "annabelle", "insidious", "paranormal activity", "evil dead",  "the exorcist", "saw", "texas chainsaw massacre", "it", "chucky", "the ring", "the grudge", "hereditary",   "midsommar",  "the purge",  "the nun"];
const HINT_STEP = 15;      
const MAX_POINTS = 5;      
const MIN_POINTS = 1;      
const HINT_PENALTY = 1;    

/* 🔊 Sonidos */
const sndCorrect = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sndWrong   = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");

/* 📊 Estado */
let state = {score:0, round:1, total:10, locked:false, reveal:15, hints:0, roundValue:MAX_POINTS, current:null};

/* 🔎 OMDb helpers */
function pick(arr,n){ const a=[...arr],out=[]; while(out.length<n && a.length){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return out; }
async function searchBatch(term){
  const url=`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(term)}&type=movie`;
  const r=await fetch(url); const d=await r.json();
  if(d.Response==='True') return d.Search.filter(x=>x.Poster && x.Poster!=='N/A');
  return [];
}
async function getRoundData(){
  let results=[];
  for(let i=0;i<6 && results.length<6;i++){
    const t=TERMS[Math.floor(Math.random()*TERMS.length)];
    const batch=await searchBatch(t);
    results=[...results,...batch];
    results=[...new Map(results.map(o=>[o.imdbID,o])).values()];
  }
  if(results.length<4) throw new Error('Insuficientes resultados OMDb');
  const [correct,...rest]=pick(results,4);
  return {correct, distractors:rest};
}

/* 🧩 UI */
function renderOptions(correctTitle, distractors){
  const names=[correctTitle, ...distractors.map(d=>d.Title)];
  const opts=[...new Set(names)].slice(0,4).sort(()=>Math.random()-0.5);
  const box=$('#answers'); box.innerHTML='';
  opts.forEach(t=>{
    const b=document.createElement('button'); b.className='btn'; b.textContent=t;
    b.onclick=()=>choose(t);
    box.appendChild(b);
  });
}
function lock(sel){
  state.locked=true; const correct=state.current.correctTitle;
  $$('#answers .btn').forEach(b=>{
    if(b.textContent===correct) b.classList.add('correct');
    if(sel && b.textContent===sel && sel!==correct) b.classList.add('wrong');
    b.disabled=true;
  });
  $('#next').disabled=false;
}
function revealFull(){
  const cover=$('#posterCover');
  cover.style.setProperty('--rev','120%'); 
  cover.style.opacity='0';
}

/* 🔄 Ronda */
async function nextRound(){
  $('#next').disabled=true; $('#status').textContent='Buscando póster…';
  state.locked=false; state.reveal=15; state.hints=0; state.roundValue=MAX_POINTS;
  $('#roundValue').textContent = state.roundValue;

  const cover=$('#posterCover'); cover.style.opacity='5'; cover.style.setProperty('--rev', state.reveal+'%');

  try{
    const {correct,distractors}=await getRoundData();

    const posterBase = $('#posterBase');
    const posterCover = $('#posterCover');

    // Set temporary status while image loads
    $('#status').textContent = 'Cargando imagen…';

    // Función auxiliar para cargar la imagen y manejar errores
    function trySetPoster(posterUrl) {
      return new Promise((resolve, reject) => {
        posterBase.onload = () => resolve(true);
        posterBase.onerror = () => reject('Error cargando imagen base');
        posterBase.src = posterUrl;

        // También cargamos la cubierta
        posterCover.src = posterUrl;
      });
    }

    try {
      await trySetPoster(correct.Poster);

      state.current = { correctTitle: correct.Title, poster: correct.Poster };
      renderOptions(correct.Title, distractors);
      $('#status').textContent = 'Listo';
      $('#hint').disabled = false;

    } catch (imgErr) {
      console.warn('Póster fallido, intentando con otro…', imgErr);
      await nextRound(); // Retry with a new round
    }

  }catch(e){
    console.error(e); $('#status').textContent='Error cargando datos. Revisá tu OMDb key.';
  }
}

/* ✅ Elección */
function choose(title){
  if(state.locked) return;
  revealFull();
  if(title===state.current.correctTitle){
    state.score += state.roundValue;
    $('#score').textContent = state.score;
    sndCorrect.play();
  } else sndWrong.play();
  lock(title);
}

/* 🕵️ Ayuda */
$('#hint').addEventListener('click', ()=>{
  if(state.locked) return;
  state.reveal = Math.min(state.reveal + HINT_STEP, 100);
  $('#posterCover').style.setProperty('--rev', state.reveal + '%');
  state.hints++;
  state.roundValue = Math.max(MIN_POINTS, MAX_POINTS - state.hints * HINT_PENALTY);
  $('#roundValue').textContent = state.roundValue;
  if(state.reveal>=100){ $('#hint').disabled=true; }
});

/* ⏭ Siguiente */
$('#next').addEventListener('click', ()=>{
  state.round++;
  if(state.round<=state.total){ $('#round').textContent=state.round; nextRound(); }
  else{
    revealFull();
    $('#status').textContent = `Finalizado: ${state.score} puntos`;
    $('#answers').innerHTML=''; $('#posterBase').src=''; $('#posterCover').src='';
    $('#next').disabled=true; $('#hint').disabled=true;
  }
});

/* ▶️ Init */
(function init(){
  $('#round').textContent=state.round; $('#total').textContent=state.total;
  $('#score').textContent=state.score; $('#roundValue').textContent=state.roundValue;
  nextRound();
})();
