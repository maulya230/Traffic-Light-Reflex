(function(){
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const introScreen = document.getElementById('introScreen');
  const gameScreen = document.getElementById('gameScreen');
  const endScreen = document.getElementById('endScreen');
  const startBtn = document.getElementById('startBtn');
  const replayBtn = document.getElementById('replayBtn');
  const goBtn = document.getElementById('goBtn');
  const statusLine = document.getElementById('statusLine');

  const roundNum = document.getElementById('roundNum');
  const roundTotal = document.getElementById('roundTotal');
  const bestNum = document.getElementById('bestNum');
  const avgNum = document.getElementById('avgNum');

  const endTitle = document.getElementById('endTitle');
  const endSummary = document.getElementById('endSummary');
  const endIcon = document.getElementById('endIcon');
  const endAvg = document.getElementById('endAvg');
  const endBest = document.getElementById('endBest');
  const endFaults = document.getElementById('endFaults');

  const ROUNDS = 5;
  const STOP_X = 160;
  const ROAD_Y = 190;
  const LAUNCH_DURATION = 900;

  let round = 0;
  let results = []; // reaction times in ms, or null for false start
  let lightState = 'red'; // red | green | yellow
  let phase = 'idle'; // idle | waiting | go | launching | fault | roundEnd
  let goTimestamp = 0;
  let launchStart = 0;
  let faultStart = 0;
  let roundTimer = null;
  let carX = STOP_X;
  let dashOffset = 0;
  let idleBob = 0;

  function fmt(ms){ return (ms/1000).toFixed(3) + 's'; }

  function updateHud(){
    roundNum.textContent = Math.min(round + 1, ROUNDS);
    roundTotal.textContent = ROUNDS;
    const valid = results.filter(r => r !== null);
    bestNum.textContent = valid.length ? fmt(Math.min(...valid)) : '—';
    avgNum.textContent = valid.length ? fmt(valid.reduce((a,b)=>a+b,0)/valid.length) : '—';
  }

  function showScreen(el){
    [introScreen, gameScreen, endScreen].forEach(s=>s.classList.add('hidden'));
    el.classList.remove('hidden');
  }

  function setStatus(text, cls){
    statusLine.textContent = text;
    statusLine.className = 'status-line ' + cls;
  }

  function startGame(){
    round = 0;
    results = [];
    updateHud();
    showScreen(gameScreen);
    nextRound();
  }

  function nextRound(){
    if(round >= ROUNDS){ return endGame(); }
    carX = STOP_X;
    lightState = 'red';
    phase = 'waiting';
    setStatus('Wait for green…', 'wait');
    updateHud();
    const delay = 1300 + Math.random() * 3000;
    clearTimeout(roundTimer);
    roundTimer = setTimeout(()=>{
      if(phase !== 'waiting') return;
      lightState = 'green';
      phase = 'go';
      goTimestamp = performance.now();
      setStatus('GO!', 'go');
    }, delay);
  }

  function attemptGo(){
    if(phase === 'waiting'){
      // false start
      phase = 'fault';
      lightState = 'red';
      faultStart = performance.now();
      results.push(null);
      setStatus('Jumped the gun!', 'fault');
      clearTimeout(roundTimer);
      updateHud();
      setTimeout(()=>{ round++; nextRound(); }, 1100);
      return;
    }
    if(phase === 'go'){
      const reaction = performance.now() - goTimestamp;
      results.push(reaction);
      phase = 'launching';
      lightState = 'yellow';
      launchStart = performance.now();
      setStatus(fmt(reaction) + ' reaction', 'result');
      updateHud();
      setTimeout(()=>{
        lightState = 'red';
        round++;
        setTimeout(()=>nextRound(), 500);
      }, LAUNCH_DURATION + 200);
      return;
    }
  }

  function endGame(){
    showScreen(endScreen);
    const valid = results.filter(r => r !== null);
    const faults = results.length - valid.length;
    const avg = valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 999999;
    const best = valid.length ? Math.min(...valid) : 0;

    endAvg.textContent = valid.length ? fmt(avg) : '—';
    endBest.textContent = valid.length ? fmt(best) : '—';
    endFaults.textContent = faults;

    let title, icon;
    if(faults >= 3){ title = 'A little trigger-happy 😅'; icon = '🚨'; }
    else if(avg < 250){ title = 'Lightning reflexes! ⚡'; icon = '🏎️'; }
    else if(avg < 350){ title = 'Sharp reaction time'; icon = '🚦'; }
    else if(avg < 500){ title = 'Solid — room to sharpen up'; icon = '🚗'; }
    else { title = 'Maybe let the car behind honk first'; icon = '🐢'; }

    endTitle.textContent = title;
    endIcon.textContent = icon;
    endSummary.textContent = valid.length
      ? ('Average reaction ' + fmt(avg) + ' across ' + valid.length + ' clean start' + (valid.length===1?'':'s') + (faults ? ', with ' + faults + ' false start' + (faults===1?'':'s') + '.' : '.'))
      : 'Every round was a false start — give it another go!';
  }

  // ---- Rendering ----
  function drawRoad(){
    // sky
    const sky = ctx.createLinearGradient(0,0,0,ROAD_Y);
    sky.addColorStop(0, '#141b24');
    sky.addColorStop(1, '#1a2129');
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,W,ROAD_Y);

    // road
    ctx.fillStyle = '#20262E';
    ctx.fillRect(0, ROAD_Y, W, H-ROAD_Y);

    // lane dashes
    ctx.strokeStyle = 'rgba(237,241,245,0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    ctx.moveTo(0, ROAD_Y + (H-ROAD_Y)/2);
    ctx.lineTo(W, ROAD_Y + (H-ROAD_Y)/2);
    ctx.stroke();
    ctx.setLineDash([]);

    // stop line
    ctx.fillStyle = 'rgba(237,241,245,0.7)';
    ctx.fillRect(STOP_X - 4, ROAD_Y, 4, H-ROAD_Y);
  }

  function drawLight(){
    const poleX = STOP_X - 46;
    const poleTopY = 40;
    // pole
    ctx.fillStyle = '#2A323C';
    ctx.fillRect(poleX-3, poleTopY+70, 6, ROAD_Y-poleTopY-70);
    // housing
    ctx.fillStyle = '#161C24';
    roundRect(poleX-16, poleTopY, 32, 96, 8);
    ctx.fill();

    const lamps = [
      { y: poleTopY+18, color:'#E4685D', active: lightState==='red' },
      { y: poleTopY+48, color:'#FFB454', active: lightState==='yellow' },
      { y: poleTopY+78, color:'#4ADE9C', active: lightState==='green' }
    ];
    lamps.forEach(l=>{
      if(l.active){
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.fillStyle = l.color;
        ctx.arc(poleX, l.y, 20, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.fillStyle = l.active ? l.color : 'rgba(237,241,245,0.08)';
      ctx.arc(poleX, l.y, 9, 0, Math.PI*2);
      ctx.fill();
    });
  }

  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function drawCar(x, bob){
    const y = ROAD_Y + (H-ROAD_Y)/2 + bob;
    // trail when launching
    if(phase === 'launching'){
      for(let i=1;i<=3;i++){
        ctx.save();
        ctx.globalAlpha = 0.12 * (4-i);
        drawCarShape(x - i*16, y);
        ctx.restore();
      }
    }
    drawCarShape(x, y);
  }

  function drawCarShape(x, y){
    ctx.save();
    ctx.translate(x, y);
    // body
    ctx.fillStyle = '#6C8CFF';
    roundRect(-34, -14, 68, 26, 8);
    ctx.fill();
    // cabin
    ctx.fillStyle = '#8FA6FF';
    roundRect(-16, -24, 34, 16, 6);
    ctx.fill();
    // windows
    ctx.fillStyle = 'rgba(13,18,24,0.6)';
    roundRect(-12, -21, 26, 10, 3);
    ctx.fill();
    // wheels
    ctx.fillStyle = '#0D1218';
    ctx.beginPath(); ctx.arc(-20, 13, 7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 13, 7, 0, Math.PI*2); ctx.fill();
    // headlight
    ctx.fillStyle = '#FFE9C7';
    ctx.beginPath(); ctx.arc(32, -2, 3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function render(t){
    const now = t;
    ctx.clearRect(0,0,W,H);

    let bob = 0;
    if(phase === 'waiting' || phase === 'go'){
      idleBob = Math.sin(now * 0.006) * 1.2;
      bob = idleBob;
    }
    if(phase === 'fault'){
      const el = now - faultStart;
      bob = Math.sin(el * 0.08) * 4 * Math.max(0, 1 - el/400);
    }

    if(phase === 'launching'){
      const el = now - launchStart;
      const progress = Math.min(el / LAUNCH_DURATION, 1);
      const eased = progress * progress;
      carX = STOP_X + eased * (W - STOP_X + 90);
      dashOffset += 6 * eased + 1;
    } else {
      carX = STOP_X;
    }

    drawRoad();
    drawLight();
    drawCar(carX, bob);

    requestAnimationFrame(render);
  }

  // ---- Events ----
  startBtn.addEventListener('click', startGame);
  replayBtn.addEventListener('click', startGame);
  goBtn.addEventListener('click', attemptGo);
  window.addEventListener('keydown', (e)=>{
    if(e.code === 'Space' && !gameScreen.classList.contains('hidden')){
      e.preventDefault();
      attemptGo();
    }
  });

  requestAnimationFrame(render);
})();
