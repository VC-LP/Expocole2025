/* ============================
   Ahorcado Final v2
   - streak bubble fixed top-right inside gameCard (number only)
   - win => automatic next word (streak++)
   - lose => return to menu (streak reset)
   - exit button returns to menu
   - confetti colorful, pastel background
   - keyboard cells, walker animation
   ============================ */

(() => {
  // short selectors
const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const stripAccents = s => s && s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g,'') : (s||'');
  const onlyLetters = s => (s||'').toLowerCase().replace(/[^a-zñáéíóúü]/gi,'');
  const appRoot = $('#appRoot');

  // UI
  const startOverlay = $('#startOverlay');
  const btnStart = $('#btnStart');
  const cfgDifficulty = $('#cfgDifficulty');
  const cfgConfetti = $('#cfgConfetti');
  const cfgLang = $('#cfgLang');
  const cfgTheme = $('#cfgTheme');

  const confettiCanvas = $('#confettiCanvas');
  const confCtx = confettiCanvas.getContext('2d');

  const walker = $('#walker');
  const walkerSVG = $('#walkerSVG');

  const hangSVG = $('#hangSVG');
  const partsIds = ['part-head','part-body','part-larm','part-rarm','part-lleg','part-rleg'];
  const lettersBox = $('#letters');
  const wordEl = $('#word');
  const statusEl = $('#status');
  const hintEl = $('#hint');

  const streakBubble = $('#streakBubble');
  const exitMenuBtn = $('#exitMenu');

  // state
  let lang = 'es';
  let difficulty = 2;
  let confettiOn = true;
  let theme = 'general';
  let secretRaw = '', secretNorm = '', display = [], ended = false;
  const MAX_PARTS = 6;

  // streak persistent
  const LS_KEY = 'ahorcado_final_v2_prefs';
  let streak = 0;
  function loadPrefs(){
    try{
      const j = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {};
      confettiOn = j.confetti !== undefined ? j.confetti : true;
      streak = j.streak || 0;
    }catch{ confettiOn = true; streak = 0; }
    updateStreakBubble();
    cfgConfetti.value = confettiOn ? 'on' : 'off';
  }
  function savePrefs(){ localStorage.setItem(LS_KEY, JSON.stringify({ confetti: confettiOn, streak })); }

  loadPrefs();

  // word pools
  const WORDS = {
    general: ["escuela","biblioteca","computadora","puente","ciudad","museo","programacion","algoritmo","energia","familia","amigo","viaje","ventana","puerta","jardin"],
    animales: ["perro","gato","jirafa","elefante","caballo","conejo","leon","tigre","zorro","oso","delfin","tortuga","panda"],
    comidas: ["pizza","empanada","chocolate","helado","fideos","ensalada","manzana","sandwich","tomate","limon","banana"],
    tecnologia: ["robot","internet","pantalla","teclado","algoritmo","variable","pixel","software","servidor","hardware"],
    paises: ["argentina","uruguay","chile","brasil","españa","mexico","colombia","peru","italia","francia"]
  };

  const ALPHABET_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split('');
  const ALPHABET_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

  /* ===== Confetti engine (centered to app) ===== */
  function resizeConfetti(){
    const r = appRoot.getBoundingClientRect();
    confettiCanvas.width = Math.round(r.width * devicePixelRatio);
    confettiCanvas.height = Math.round(r.height * devicePixelRatio);
    confettiCanvas.style.width = r.width + 'px';
    confettiCanvas.style.height = r.height + 'px';
    confCtx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  window.addEventListener('resize', resizeConfetti);

  const confettiEngine = (() => {
    let pieces = [], raf = null;
    function make(n=80){
      pieces = [];
      const W = confettiCanvas.clientWidth, H = confettiCanvas.clientHeight;
      for(let i=0;i<n;i++){
        pieces.push({
          x: Math.random()*W,
          y: -Math.random()*H,
          r: 6 + Math.random()*10,
          vx: -1 + Math.random()*2,
          vy: 2 + Math.random()*4,
          rot: Math.random()*360,
          vr: -6 + Math.random()*12,
          col: ['#ff4d6d','#ffd166','#6be4c9','#7aa2ff','#d78bff'][Math.floor(Math.random()*5)]
        });
      }
    }
    function step(){
      confCtx.clearRect(0,0,confettiCanvas.clientWidth, confettiCanvas.clientHeight);
      for(const p of pieces){
        confCtx.save();
        confCtx.translate(p.x, p.y);
        confCtx.rotate(p.rot*Math.PI/180);
        confCtx.fillStyle = p.col;
        confCtx.fillRect(-p.r/2, -p.r/2, p.r, p.r*0.6);
        confCtx.restore();
        p.x += p.vx; p.y += p.vy; p.rot += p.vr*0.4;
        if(p.y > confettiCanvas.clientHeight + 30){
          p.y = -20;
          p.x = Math.random()*confettiCanvas.clientWidth;
        }
      }
      raf = requestAnimationFrame(step);
    }
    return {
      start(){ if(!confettiOn) return; cancelAnimationFrame(raf); make(80); resizeConfetti(); step(); },
      stop(){ cancelAnimationFrame(raf); confCtx.clearRect(0,0,confettiCanvas.clientWidth, confettiCanvas.clientHeight); }
    };
  })();

  /* ===== Walker animation (simple) ===== */
  function showWalkerWalkIn(onComplete){
    walker.style.opacity = 1;
    walker.style.pointerEvents = 'none';
    walker.style.justifyContent = 'flex-start';
    walker.style.transform = 'translateX(-40%)';
    walker.style.transition = 'transform 1000ms cubic-bezier(.2,.9,.2,1), opacity 400ms';
    requestAnimationFrame(()=> walker.style.transform = 'translateX(8%)');
    const leg1 = walkerSVG.querySelector('#w-leg1');
    const leg2 = walkerSVG.querySelector('#w-leg2');
    let t=0; const int = setInterval(()=> {
      leg1.setAttribute('transform', `rotate(${Math.sin(t/6)*12} 32 34)`);
      leg2.setAttribute('transform', `rotate(${Math.cos(t/6)*12} 32 34)`);
      t++;
    }, 90);
    setTimeout(()=>{ clearInterval(int); if(onComplete) onComplete(); }, 1100);
  }
  function showWalkerWalkOut(onComplete){
    walker.style.opacity = 1;
    walker.style.transform = 'translateX(8%)';
    walker.style.transition = 'transform 900ms cubic-bezier(.2,.9,.2,1), opacity 400ms';
    requestAnimationFrame(()=> walker.style.transform = 'translateX(140%)');
    const leg1 = walkerSVG.querySelector('#w-leg1');
    const leg2 = walkerSVG.querySelector('#w-leg2');
    let t=0; const int = setInterval(()=> {
      leg1.setAttribute('transform', `rotate(${Math.sin(t/6)*12} 32 34)`);
      leg2.setAttribute('transform', `rotate(${Math.cos(t/6)*12} 32 34)`);
      t++;
    }, 90);
    setTimeout(()=>{ clearInterval(int); walker.style.opacity = 0; if(onComplete) onComplete(); }, 900);
  }

  /* ===== Hangman SVG prepare and animations ===== */
  function prepareHangSVG(){
    partsIds.forEach(id => {
      const el = document.getElementById(id);
      if(!el || !el.getTotalLength) return;
      const len = el.getTotalLength();
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      el.style.transition = 'stroke-dashoffset .55s cubic-bezier(.2,1.1,.3,1), transform .45s ease, opacity .25s';
      el.style.opacity = 1;
      el.style.transform = 'scale(0.98)';
    });
  }

  function revealPart(index){
    const id = partsIds[index];
    const el = document.getElementById(id);
    if(!el || !el.getTotalLength) return;
    el.style.strokeDashoffset = 0;
    el.style.transform = 'scale(1.06)';
    setTimeout(()=> el.style.transform = 'scale(1)', 420);
    if(/arm|leg/.test(id)){
      el.style.transformOrigin = 'center';
      el.style.transform = 'rotate(-8deg) scale(1.02)';
      setTimeout(()=>{ el.style.transform = 'rotate(6deg) scale(1)'; setTimeout(()=> el.style.transform='rotate(0deg) scale(1)',260); }, 260);
    }
  }

  function resetHangSVG(){
    partsIds.forEach(id => {
      const el = document.getElementById(id);
      if(!el || !el.getTotalLength) return;
      el.style.strokeDashoffset = el.getTotalLength();
      el.style.transform = 'scale(0.98)';
      el.style.opacity = 1;
    });
    hangSVG.classList.remove('swing','bounce');
  }

  /* ===== Build keyboard cells ===== */
  function buildKeyboard(){
    lettersBox.innerHTML = '';
    const letters = (lang === 'es') ? ALPHABET_ES : ALPHABET_EN;
    letters.forEach(ch => {
      const cell = document.createElement('div');
      cell.className = 'keyCell';
      cell.tabIndex = 0;
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch;
      cell.appendChild(span);
      cell.addEventListener('click', ()=> onGuess((ch==='Ñ'?'N':ch).toLowerCase(), cell));
      cell.addEventListener('keydown', (e)=> { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGuess((ch==='Ñ'?'N':ch).toLowerCase(), cell); } });
      lettersBox.appendChild(cell);
    });
  }

  /* ===== Pick word by difficulty (length) & theme ===== */
  function pickWord(){
    const pool = WORDS[theme] && WORDS[theme].length ? WORDS[theme] : WORDS['general'];
    let candidates = [];
    if(difficulty === 1){
      candidates = pool.filter(w => w.length <= 5);
    } else if(difficulty === 2){
      candidates = pool.filter(w => w.length >= 5 && w.length <= 8);
    } else {
      candidates = pool.filter(w => w.length >= 8);
    }
    if(!candidates.length) candidates = pool;
    const chosen = candidates[Math.floor(Math.random()*candidates.length)];
    return chosen;
  }

  /* ===== Streak UI ===== */
  function updateStreakBubble(){
    streakBubble.textContent = String(Math.max(0, streak));
  }

  /* ===== Start round & flow ===== */
  async function startRound(){
    ended = false;
    resetHangSVG();
    confettiEngine.stop();
    // build keyboard anew
    buildKeyboard();

    // pick word (use english API attempt if lang='en')
    let chosen = pickWord();
    if(lang === 'en'){
      try{
        const lenMap = {1:4,2:6,3:8};
        const len = lenMap[difficulty] || 6;
        const resp = await fetch(`https://random-word-api.herokuapp.com/word?number=1&length=${len}`);
        const j = await resp.json();
        if(j && j[0]) chosen = j[0].toLowerCase();
      }catch(e){}
    }

    secretRaw = onlyLetters(chosen);
    if(!secretRaw || secretRaw.length < 2) secretRaw = 'escuela';
    display = secretRaw.split('').map(ch => /[a-záéíóúüñ]/i.test(ch) ? '_' : ch);
    drawWord();
    setStatus(lang === 'es' ? 'Listo' : 'Ready');
  }

  function drawWord(){ wordEl.textContent = display.join(' '); }

  function setStatus(t){ statusEl.textContent = t; }

  /* ===== Guess handling & round end behavior ===== */
  function onGuess(letter, cellEl){
    if(ended) return;
    if(cellEl && cellEl.classList.contains('disabled')) return;
    const L = stripAccents(letter).toLowerCase();
    let hit = false;
    secretRaw.split('').forEach((ch,i) => {
      if(stripAccents(ch).toLowerCase() === L){
        display[i] = ch.toUpperCase();
        hit = true;
      }
    });
    if(hit){
      if(cellEl){ cellEl.classList.add('correct'); setTimeout(()=> cellEl.classList.remove('correct'),700); }
      playSound('correct');
    } else {
      if(cellEl){ cellEl.classList.add('wrong'); setTimeout(()=> cellEl.classList.add('disabled'),300); }
      const shown = getShownPartsCount();
      revealPart(shown);
      playSound('error');
      // if now full, lose
      if(getShownPartsCount() >= MAX_PARTS){
        // reveal word and handle loss
        display = secretRaw.split('').map(ch => /[a-záéíóúüñ]/i.test(ch) ? ch.toUpperCase() : ch);
        drawWord();
        setTimeout(()=> handleLoss(), 700);
        return;
      }
    }
    drawWord();
    if(display.join('').toLowerCase() === secretRaw.toUpperCase().toLowerCase()){
      // win: increment streak, show confetti, then automatically next word
      handleWin();
    }
  }

  function getShownPartsCount(){
    let c=0;
    partsIds.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      const offset = el.style.strokeDashoffset;
      if(offset === '' || Number(offset) === 0) c++;
    });
    return c;
  }

  function handleWin(){
    if(ended) return;
    ended = true;
    hangSVG.classList.add('bounce');
    playSound('win');
    if(confettiOn) confettiEngine.start();
    streak = (streak || 0) + 1;
    updateStreakBubble();
    savePrefs();
    // after short delay, stop confetti and go to next word automatically
    setTimeout(()=> {
      confettiEngine.stop();
      hangSVG.classList.remove('bounce');
      // next round
      startRound();
    }, 1200);
  }

  function handleLoss(){
    if(ended) return;
    ended = true;
    hangSVG.classList.add('swing');
    playSound('error');
    // reset streak
    streak = 0;
    updateStreakBubble();
    savePrefs();
    // after short delay, walker walks out and menu returns
    setTimeout(()=> {
      showWalkerWalkOut(()=> {
        resetHangSVG();
        confettiEngine.stop();
        startOverlay.classList.remove('hidden');
        startOverlay.style.display = 'grid';
      });
    }, 1000);
  }

  /* ===== Sounds (simple) ===== */
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  function ensureAudio(){ if(!audioCtx && AudioCtx) audioCtx = new AudioCtx(); return audioCtx; }
  function playBeep(freq=440,type='sine',dur=0.08,gain=0.06){
    if(!ensureAudio()) return;
    const ctx = audioCtx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(ctx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur); o.stop(ctx.currentTime + dur + 0.02);
  }
  function playSound(kind){
    if(kind === 'correct') playBeep(640,'sine',0.08,0.05);
    if(kind === 'error') playBeep(220,'square',0.09,0.06);
    if(kind === 'win') { playBeep(880,'sine',0.06,0.06); setTimeout(()=>playBeep(1100,'triangle',0.06,0.05),80); }
  }

  /* ===== UI events wiring ===== */
  btnStart.addEventListener('click', ()=> {
    // collect settings
    lang = cfgLang.value || 'es';
    difficulty = parseInt(cfgDifficulty.value,10) || 2;
    confettiOn = cfgConfetti.value === 'on';
    theme = cfgTheme.value || 'general';
    // hide overlay and walker in then start round
    startOverlay.classList.add('hidden');
    resizeConfetti();
    savePrefs();
    showWalkerWalkIn(()=> {
      startRound();
    });
  });

  // exit menu button
  exitMenuBtn.addEventListener('click', ()=> {
    // stop round, return to menu (walker walks out)
    // reset hangman & keyboard
    resetHangSVG();
    confettiEngine.stop();
    showWalkerWalkOut(()=> {
      startOverlay.classList.remove('hidden');
      startOverlay.style.display = 'grid';
    });
  });

  // keyboard physical input
  window.addEventListener('keydown', (e) => {
    if(ended) return;
    let k = e.key.toUpperCase();
    if(/[A-ZÑ]/.test(k)){
      const normalized = (k === 'Ñ' ? 'N' : k).toLowerCase();
      const cell = [...$$('.keyCell')].find(c => c.textContent.trim().toUpperCase() === k);
      if(cell && !cell.classList.contains('disabled')) onGuess(normalized, cell);
    }
  });

  // initial prepare
  resizeConfetti();
  prepareHangSVG();
  buildKeyboard();
  walker.style.opacity = 0;
  walker.style.transition = 'transform 800ms ease, opacity 300ms';
  updateStreakBubble();

  // expose debug if needed
  window._AHfinalv2 = { startRound, revealPart: (i)=> revealPart(i), resetHangSVG };
})();