import Lenis from 'lenis';
import confetti from 'canvas-confetti';

// ==========================================================================
// CONFIGURATION & STATE
// ==========================================================================
const TOTAL_FRAMES = 300;
const loadedFrames = new Array(TOTAL_FRAMES + 1);

let currentHeroFrame = 1;
let targetHeroFrame = 1;
let lastHeroRenderedFrame = 1;

// 360 Turntable & Drag State
let isTurntableAutoSpinning = false;
let isDraggingCanvas = false;
let dragStartX = 0;
let dragStartFrame = 1;

// Sound System State
let audioCtx = null;
let isAudioEnabled = false;
let droneOsc = null;
let droneGain = null;
let lastSoundFrame = 1;

// AI Formulation State
let currentSynthesizedFormula = null;
let selectedAiBlendForOrder = null;
let activeMood = 'Late Night Coding Marathon';
let activeFizz = 'Micro-Bubble Velvet Glide';

// Speech Synthesis State
let isSommelierSpeaking = false;

// ==========================================================================
// PRELOADER & FRAME CACHE
// ==========================================================================
const preloader = document.getElementById('preloader');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressNumber = document.getElementById('progress-number');
const progressStatus = document.getElementById('progress-status');

function getFrameUrl(index) {
  const pad = String(index).padStart(3, '0');
  return `/frames/ezgif-frame-${pad}.jpg`;
}

function loadSingleFrame(index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = getFrameUrl(index);
    img.onload = () => {
      loadedFrames[index] = img;
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`Frame ${index} fallback triggered`);
      resolve(null);
    };
  });
}

async function preloadAllFrames() {
  // Step 1: Immediately load frame 1 and render initial view
  const firstFrame = await loadSingleFrame(1);
  if (firstFrame) {
    drawHeroCanvas(1);
  }

  let loadedCount = 1;
  const BATCH_SIZE = 12;
  const indices = [];
  for (let i = 2; i <= TOTAL_FRAMES; i++) {
    indices.push(i);
  }

  // Batch download remaining frames for responsive network utilization
  for (let i = 0; i < indices.length; i += BATCH_SIZE) {
    const batch = indices.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (idx) => {
        await loadSingleFrame(idx);
        loadedCount++;
        const pct = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (progressBarFill) progressBarFill.style.width = `${pct}%`;
        if (progressNumber) progressNumber.textContent = `${pct}%`;

        if (progressStatus) {
          if (pct === 30) progressStatus.textContent = 'Harmonizing Pure Amul Dairy Milk...';
          if (pct === 65) progressStatus.textContent = 'Infusing Damask Rose Bloom...';
          if (pct === 90) progressStatus.textContent = 'Connecting Neural AI Sensory Lab...';
        }
      })
    );
  }

  // All frames ready: dismiss preloader
  setTimeout(() => {
    if (preloader) preloader.classList.add('fade-out');
  }, 350);
}

// ==========================================================================
// HERO CANVAS ENGINE
// ==========================================================================
const heroCanvas = document.getElementById('hero-canvas');
const heroCtx = heroCanvas ? heroCanvas.getContext('2d', { alpha: false }) : null;
const scrollTrack = document.getElementById('scroll-track');
const trackerFill = document.getElementById('tracker-fill');
const hudFrameText = document.getElementById('hud-frame-text');

// Story phases
const phases = [
  { el: document.getElementById('phase-1'), start: 0, end: 0.18 },
  { el: document.getElementById('phase-2'), start: 0.18, end: 0.45 },
  { el: document.getElementById('phase-3'), start: 0.45, end: 0.70 },
  { el: document.getElementById('phase-4'), start: 0.70, end: 0.88 },
  { el: document.getElementById('phase-5'), start: 0.88, end: 1.00 },
];

function resizeHeroCanvas() {
  if (!heroCanvas || !heroCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  heroCanvas.width = window.innerWidth * dpr;
  heroCanvas.height = window.innerHeight * dpr;
  drawHeroCanvas(Math.round(currentHeroFrame));
}

function drawHeroCanvas(frameIndex) {
  if (!heroCanvas || !heroCtx) return;
  const img = loadedFrames[frameIndex] || loadedFrames[1];
  if (!img) return;

  const cw = heroCanvas.width;
  const ch = heroCanvas.height;
  
  // Fill background matching theme
  heroCtx.fillStyle = '#080309';
  heroCtx.fillRect(0, 0, cw, ch);

  const imgRatio = img.width / img.height;
  const canvasRatio = cw / ch;

  let dw, dh, dx, dy;
  if (canvasRatio > imgRatio) {
    // Canvas is wider than 16:9
    dh = ch;
    dw = ch * imgRatio;
    dx = (cw - dw) / 2;
    dy = 0;
  } else {
    // Canvas is taller than 16:9 (Portrait / Mobile)
    dw = cw;
    dh = cw / imgRatio;
    dx = 0;
    dy = (ch - dh) / 2;
  }

  heroCtx.drawImage(img, dx, dy, dw, dh);
}

function updateHeroScroll() {
  if (!scrollTrack || isDraggingCanvas || isTurntableAutoSpinning) return;
  const rect = scrollTrack.getBoundingClientRect();
  const trackHeight = rect.height - window.innerHeight;
  if (trackHeight <= 0) return;

  // Compute scroll progress from 0.0 to 1.0
  let progress = -rect.top / trackHeight;
  progress = Math.max(0, Math.min(1, progress));

  // Map progress to target frame index (1 to 300)
  targetHeroFrame = 1 + Math.round(progress * (TOTAL_FRAMES - 1));

  // Update tracker fill height
  if (trackerFill) {
    trackerFill.style.height = `${progress * 100}%`;
  }

  // Update Story Phases visibility
  phases.forEach((phase) => {
    if (!phase.el) return;
    if (progress >= phase.start && progress <= phase.end) {
      phase.el.classList.add('active');
    } else {
      phase.el.classList.remove('active');
    }
  });
}

// ==========================================================================
// 360° TURNTABLE & DIRECT DRAG CONTROLS
// ==========================================================================
const btnTurntableToggle = document.getElementById('btn-turntable-toggle');
const turntableLabel = document.getElementById('turntable-label');
const btnSparkPulse = document.getElementById('btn-spark-pulse');

if (btnTurntableToggle) {
  btnTurntableToggle.addEventListener('click', () => {
    isTurntableAutoSpinning = !isTurntableAutoSpinning;
    if (isTurntableAutoSpinning) {
      btnTurntableToggle.classList.add('active');
      if (turntableLabel) turntableLabel.textContent = 'PAUSE 360° SPIN';
      playClickSound();
    } else {
      btnTurntableToggle.classList.remove('active');
      if (turntableLabel) turntableLabel.textContent = 'AUTO 360° SPIN';
      playClickSound();
    }
  });
}

if (btnSparkPulse) {
  btnSparkPulse.addEventListener('click', () => {
    playEnergySparkSound();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#ff2d87', '#00d4ff', '#ffffff', '#ffd166'],
    });
    // Quick burst of frame scrubbing
    targetHeroFrame = ((targetHeroFrame + 25) % TOTAL_FRAMES) || 1;
  });
}

// Interactive Mouse & Touch Drag on Canvas to Orbit 360°
if (heroCanvas) {
  const onPointerDown = (clientX) => {
    isDraggingCanvas = true;
    dragStartX = clientX;
    dragStartFrame = currentHeroFrame;
    if (isTurntableAutoSpinning) {
      isTurntableAutoSpinning = false;
      if (btnTurntableToggle) btnTurntableToggle.classList.remove('active');
      if (turntableLabel) turntableLabel.textContent = 'AUTO 360° SPIN';
    }
  };

  const onPointerMove = (clientX) => {
    if (!isDraggingCanvas) return;
    const deltaX = clientX - dragStartX;
    const frameDelta = Math.round((deltaX / window.innerWidth) * TOTAL_FRAMES * 1.5);
    let newFrame = dragStartFrame + frameDelta;
    
    // Wrap around smoothly 1 to 300
    while (newFrame < 1) newFrame += TOTAL_FRAMES;
    while (newFrame > TOTAL_FRAMES) newFrame -= TOTAL_FRAMES;
    
    targetHeroFrame = newFrame;
  };

  const onPointerUp = () => {
    isDraggingCanvas = false;
  };

  heroCanvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX));
  window.addEventListener('mousemove', (e) => onPointerMove(e.clientX));
  window.addEventListener('mouseup', onPointerUp);

  heroCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) onPointerDown(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) onPointerMove(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', onPointerUp);
}

// ==========================================================================
// SOUND FX ENGINE (WEB AUDIO API SYNTHESIZER)
// ==========================================================================
const soundToggle = document.getElementById('sound-toggle');
const soundIconOn = document.getElementById('sound-icon-on');
const soundIconOff = document.getElementById('sound-icon-off');
const soundLabel = document.getElementById('sound-label');

function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  // Low subtle velvety drone
  droneOsc = audioCtx.createOscillator();
  droneOsc.type = 'sine';
  droneOsc.frequency.setValueAtTime(65.41, audioCtx.currentTime);

  droneGain = audioCtx.createGain();
  droneGain.gain.setValueAtTime(0, audioCtx.currentTime);

  droneOsc.connect(droneGain);
  droneGain.connect(audioCtx.destination);
  droneOsc.start();
}

function playClickSound() {
  if (!isAudioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(540, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

function triggerTickSound() {
  if (!isAudioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800 + Math.random() * 200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.02);

  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.02);
}

function playCanCrackSound() {
  if (!isAudioEnabled || !audioCtx) return;
  // Synthesize authentic can crack + fizz
  const bufferSize = audioCtx.sampleRate * 0.4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1600, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.35);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}

function playEnergySparkSound() {
  if (!isAudioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.18);
}

function toggleSound() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isAudioEnabled = !isAudioEnabled;
  if (isAudioEnabled) {
    if (soundIconOn) soundIconOn.classList.remove('hidden');
    if (soundIconOff) soundIconOff.classList.add('hidden');
    if (soundLabel) soundLabel.textContent = 'AUDIO ON';
    if (droneGain) droneGain.gain.setTargetAtTime(0.035, audioCtx.currentTime, 0.2);
    playClickSound();
  } else {
    if (soundIconOn) soundIconOn.classList.add('hidden');
    if (soundIconOff) soundIconOff.classList.remove('hidden');
    if (soundLabel) soundLabel.textContent = 'AUDIO OFF';
    if (droneGain) droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
  }
}

if (soundToggle) {
  soundToggle.addEventListener('click', toggleSound);
}

// ==========================================================================
// AI SENSORY TASTE LAB INTERACTIVITY
// ==========================================================================
const moodChips = document.querySelectorAll('.mood-chip');
const inputCaffeine = document.getElementById('input-caffeine');
const valCaffeine = document.getElementById('val-caffeine');
const inputDairy = document.getElementById('input-dairy');
const valDairy = document.getElementById('val-dairy');
const inputRose = document.getElementById('input-rose');
const valRose = document.getElementById('val-rose');
const inputChill = document.getElementById('input-chill');
const valChill = document.getElementById('val-chill');
const fizzChips = document.querySelectorAll('.fizz-chip');
const customPromptInput = document.getElementById('ai-custom-prompt');
const btnSynthesizeAi = document.getElementById('btn-synthesize-ai');
const btnSynthText = document.getElementById('btn-synth-text');
const synthSpinner = document.getElementById('synth-spinner');

// Output elements
const aiFormulaId = document.getElementById('ai-formula-id');
const aiCanBadgeText = document.getElementById('ai-can-badge-text');
const resCaffeineMg = document.getElementById('res-caffeine-mg');
const resDairyPct = document.getElementById('res-dairy-pct');
const resChillDeg = document.getElementById('res-chill-deg');
const resEditionName = document.getElementById('res-edition-name');
const resTagline = document.getElementById('res-tagline');
const resFlavorChips = document.getElementById('res-flavor-chips');
const resTopNote = document.getElementById('res-top-note');
const resHeartHarmony = document.getElementById('res-heart-harmony');
const resFinish = document.getElementById('res-finish');
const resSommelier = document.getElementById('res-sommelier');
const resIdealMoment = document.getElementById('res-ideal-moment');
const hologramGlowRing = document.getElementById('hologram-glow-ring');
const btnPlayVoice = document.getElementById('btn-play-voice');
const voicePlayIcon = document.getElementById('voice-play-icon');
const voicePlayText = document.getElementById('voice-play-text');
const btnLockAiOrder = document.getElementById('btn-lock-ai-order');
const aiOrderBanner = document.getElementById('ai-order-banner');
const aiBannerEditionName = document.getElementById('ai-banner-edition-name');
const btnRemoveAiBlend = document.getElementById('btn-remove-ai-blend');

// 1. Mood Selection
moodChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    moodChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeMood = chip.dataset.mood;
    playClickSound();
  });
});

// 2. Sliders
if (inputCaffeine && valCaffeine) {
  inputCaffeine.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    const approxMg = Math.round(50 + (val / 100) * 55);
    valCaffeine.textContent = `${val}% (${approxMg}mg)`;
  });
}

if (inputDairy && valDairy) {
  inputDairy.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valDairy.textContent = `${val}% (${val > 80 ? 'Ultra-Velvet' : 'Balanced Silk'})`;
  });
}

if (inputRose && valRose) {
  inputRose.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valRose.textContent = `${val}% (${val > 80 ? 'Deep Floral' : 'Gentle Petal'})`;
  });
}

if (inputChill && valChill) {
  inputChill.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valChill.textContent = `${val}°C (${val <= 4 ? 'Optimal Peak' : 'Cellar Temp'})`;
  });
}

// 3. Fizz Selection
fizzChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    fizzChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeFizz = chip.dataset.fizz;
    playClickSound();
  });
});

// 4. Synthesize Formula via Backend API
if (btnSynthesizeAi) {
  btnSynthesizeAi.addEventListener('click', async () => {
    initAudio();
    playEnergySparkSound();

    if (btnSynthText) btnSynthText.textContent = 'ANALYZING NEURAL BIO-MATRIX...';
    if (synthSpinner) synthSpinner.classList.remove('hidden');
    btnSynthesizeAi.disabled = true;

    const payload = {
      mood: activeMood,
      caffeine: parseInt(inputCaffeine?.value || 75, 10),
      dairy: parseInt(inputDairy?.value || 85, 10),
      rose: parseInt(inputRose?.value || 90, 10),
      chill: parseInt(inputChill?.value || 4, 10),
      fizz: activeFizz,
      customPrompt: customPromptInput?.value?.trim() || '',
    };

    try {
      const response = await fetch('/api/ai/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data && data.creation) {
        currentSynthesizedFormula = data.creation;
        applySynthesizedFormula(data.creation);
        playCanCrackSound();

        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.7 },
          colors: ['#ff2d87', '#ffa2c6', '#ffd166', '#ffffff'],
        });
      }
    } catch (err) {
      console.error('Synthesis error:', err);
      // Client-side graceful fallback if server unreachable
      const fallbackFormula = {
        id: `AMUL-AI-${Math.floor(100 + Math.random() * 900)}`,
        editionName: `Amul × Sting: ${activeMood} Reserve`,
        tagline: 'An audacious balance where electrifying energy meets silken Anand dairy milk.',
        caffeineMg: Math.round(50 + (payload.caffeine / 100) * 55),
        colorGlow: '#ff2d87',
        sensoryProfile: {
          topNote: `Crisp effervescence carrying aromatic Damask rose florals.`,
          heartHarmony: `Enveloped in ${payload.dairy}% rich Amul dairy silk for smooth throat glide.`,
          finish: `Zero-crash sustained focus at ${payload.chill}°C serving peak.`
        },
        flavorNotes: ['Damask Rose Petals', 'Pure Anand Toned Milk', 'Electro Caffeine', 'Micro-Bubbles'],
        sommelierReview: `A masterclass in beverage architecture. The dairy solids create a protective lipid layer that softens the caffeine kick into sustained stamina.`,
        idealMoment: `${activeMood} Readiness`,
      };
      currentSynthesizedFormula = fallbackFormula;
      applySynthesizedFormula(fallbackFormula);
    } finally {
      if (btnSynthText) btnSynthText.textContent = 'SYNTHESIZE FORMULA WITH AI LAB';
      if (synthSpinner) synthSpinner.classList.add('hidden');
      btnSynthesizeAi.disabled = false;
    }
  });
}

function applySynthesizedFormula(formula) {
  if (aiFormulaId) aiFormulaId.textContent = `BATCH: ${formula.id}`;
  if (aiCanBadgeText) aiCanBadgeText.textContent = formula.editionName.split(':')[1]?.trim() || 'CUSTOM BLEND';
  if (resCaffeineMg) resCaffeineMg.textContent = `${formula.caffeineMg} mg`;
  if (resDairyPct) resDairyPct.textContent = `${formula.dairy || 85}%`;
  if (resChillDeg) resChillDeg.textContent = `${formula.chill || 4}°C`;
  if (resEditionName) resEditionName.textContent = formula.editionName;
  if (resTagline) resTagline.textContent = `"${formula.tagline}"`;

  // Render flavor chips
  if (resFlavorChips && formula.flavorNotes) {
    resFlavorChips.innerHTML = formula.flavorNotes
      .map((n) => `<span class="flavor-chip">${n}</span>`)
      .join('');
  }

  // Sensory profile
  if (resTopNote && formula.sensoryProfile?.topNote) resTopNote.textContent = formula.sensoryProfile.topNote;
  if (resHeartHarmony && formula.sensoryProfile?.heartHarmony) resHeartHarmony.textContent = formula.sensoryProfile.heartHarmony;
  if (resFinish && formula.sensoryProfile?.finish) resFinish.textContent = formula.sensoryProfile.finish;

  // Sommelier & moment
  if (resSommelier && formula.sommelierReview) resSommelier.textContent = `"${formula.sommelierReview}"`;
  if (resIdealMoment && formula.idealMoment) resIdealMoment.textContent = formula.idealMoment;

  // Update hologram glow ring color
  if (hologramGlowRing && formula.colorGlow) {
    hologramGlowRing.style.background = `radial-gradient(circle, ${formula.colorGlow}88 0%, transparent 70%)`;
  }
}

// 5. AI Sommelier Voiceover using Web Speech API
if (btnPlayVoice) {
  btnPlayVoice.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSommelierSpeaking) {
      window.speechSynthesis.cancel();
      isSommelierSpeaking = false;
      if (voicePlayIcon) voicePlayIcon.textContent = '▶';
      if (voicePlayText) voicePlayText.textContent = 'Hear AI Sommelier Narration';
      btnPlayVoice.classList.remove('playing');
      return;
    }

    const currentReview = resSommelier?.textContent || 'A magnificent harmony of Anand dairy silk and electrifying vital energy.';
    const currentName = resEditionName?.textContent || 'Amul Sting Velvet Bloom';
    const speechText = `Presenting the bespoke ${currentName}. ${currentReview} Best experienced for ${resIdealMoment?.textContent || 'optimal vitality'}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find((v) => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      isSommelierSpeaking = true;
      if (voicePlayIcon) voicePlayIcon.textContent = '⏸';
      if (voicePlayText) voicePlayText.textContent = 'Speaking... (Click to Pause)';
      btnPlayVoice.classList.add('playing');
    };

    utterance.onend = utterance.onerror = () => {
      isSommelierSpeaking = false;
      if (voicePlayIcon) voicePlayIcon.textContent = '▶';
      if (voicePlayText) voicePlayText.textContent = 'Hear AI Sommelier Narration';
      btnPlayVoice.classList.remove('playing');
    };

    window.speechSynthesis.speak(utterance);
  });
}

// 6. Connect Custom AI Formula to Order Section
if (btnLockAiOrder) {
  btnLockAiOrder.addEventListener('click', () => {
    playClickSound();
    selectedAiBlendForOrder = currentSynthesizedFormula || {
      id: 'AMUL-AI-DEFAULT',
      editionName: resEditionName?.textContent || 'Amul × Sting Custom AI Edition',
    };

    if (aiOrderBanner) {
      aiOrderBanner.classList.remove('hidden');
      if (aiBannerEditionName) aiBannerEditionName.textContent = selectedAiBlendForOrder.editionName;
    }

    // Smooth scroll down to order section
    const orderSection = document.getElementById('order-section');
    if (orderSection) {
      lenis.scrollTo(orderSection);
    }
  });
}

if (btnRemoveAiBlend) {
  btnRemoveAiBlend.addEventListener('click', () => {
    selectedAiBlendForOrder = null;
    if (aiOrderBanner) aiOrderBanner.classList.add('hidden');
    playClickSound();
  });
}

// ==========================================================================
// LIVE COLD-CHAIN IOT TELEMETRY & BACKEND PING
// ==========================================================================
const telemVatTemp = document.getElementById('telem-vat-temp');
const telemVatStatus = document.getElementById('telem-vat-status');
const telemPressure = document.getElementById('telem-pressure');
const telemFat = document.getElementById('telem-fat');
const telemTrucks = document.getElementById('telem-trucks');
const dispatchTickerText = document.getElementById('dispatch-ticker-text');
const statusText = document.getElementById('status-text');

async function pollColdChainTelemetry() {
  try {
    const res = await fetch('/api/coldchain/telemetry');
    if (res.ok) {
      const data = await res.json();
      if (data && data.telemetry) {
        const t = data.telemetry;
        if (telemVatTemp) telemVatTemp.textContent = t.vatTemperature;
        if (telemVatStatus) telemVatStatus.textContent = t.vatStatus;
        if (telemPressure) telemPressure.textContent = t.microCarbonationPressure;
        if (telemFat) telemFat.textContent = t.milkFatContent.split(' ')[0] || '3.15%';
        if (telemTrucks) telemTrucks.textContent = `${t.activeReeferTrucks} FLEET`;
        
        if (statusText) statusText.textContent = 'AI SERVER ONLINE';
      }
    }
  } catch (err) {
    // Silent catch, retry on next interval
  }
}

// Poll telemetry every 4.5 seconds
setInterval(pollColdChainTelemetry, 4500);
pollColdChainTelemetry();

// ==========================================================================
// INTERACTIVE PACK SELECTOR & CHECKOUT
// ==========================================================================
const packCards = document.querySelectorAll('.pack-card');
const selectedPackName = document.getElementById('selected-pack-name');
const selectedPackPrice = document.getElementById('selected-pack-price');
const totalPriceDisplay = document.getElementById('total-price-display');
const orderForm = document.getElementById('order-form');
const orderModal = document.getElementById('order-modal');
const modalDescText = document.getElementById('modal-desc-text');
const modalReceiptContent = document.getElementById('modal-receipt-content');
const modalCloseBtn = document.getElementById('modal-close-btn');

let currentPack = {
  name: 'Single 120ml Can',
  price: 20,
};

packCards.forEach((card) => {
  card.addEventListener('click', () => {
    packCards.forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    
    currentPack.name = card.dataset.name;
    currentPack.price = parseInt(card.dataset.price, 10);

    if (selectedPackName) selectedPackName.textContent = currentPack.name;
    if (selectedPackPrice) selectedPackPrice.textContent = `₹${currentPack.price}`;
    if (totalPriceDisplay) totalPriceDisplay.textContent = `₹${currentPack.price}`;
    playClickSound();
  });
});

if (orderForm) {
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    initAudio();
    playCanCrackSound();

    const custName = document.getElementById('cust-name')?.value.trim() || 'Valued Customer';
    const custAddress = document.getElementById('cust-address')?.value.trim() || 'Priority Cold-Chain Destination';

    // Submit order to Backend API
    let orderResult = null;
    try {
      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custName,
          custAddress,
          packName: currentPack.name,
          packPrice: currentPack.price,
          customFormulaId: selectedAiBlendForOrder ? selectedAiBlendForOrder.id : null,
        }),
      });
      if (resp.ok) {
        const json = await resp.json();
        orderResult = json.order;
      }
    } catch (err) {
      console.warn('Backend order placement offline, using local verification fallback:', err);
    }

    const orderId = orderResult ? orderResult.orderId : `AMUL-STG-${Math.floor(100000 + Math.random() * 900000)}`;
    const dispatchCode = orderResult ? orderResult.dispatchCode : `CND-4C-9481A`;

    // Confetti celebration
    confetti({
      particleCount: 140,
      spread: 85,
      origin: { y: 0.6 },
      colors: ['#ff2d87', '#ffa2c6', '#ffffff', '#ffd166', '#10b981'],
    });

    // Populate modal receipt with Amul GCMMF authentication & AI formula attachment
    if (modalDescText) {
      modalDescText.textContent = `Thank you, ${custName}! Your allocation has been officially registered with GCMMF Amul Anand Logistics.`;
    }
    if (modalReceiptContent) {
      modalReceiptContent.innerHTML = `
        <div><strong>ORDER ID:</strong> ${orderId}</div>
        <div><strong>DISPATCH HASH:</strong> ${dispatchCode}</div>
        <div><strong>BATCH ALLOCATION:</strong> ${currentPack.name}</div>
        ${selectedAiBlendForOrder ? `<div style="color: #ff2d87;"><strong>AI FORMULA:</strong> ${selectedAiBlendForOrder.editionName}</div>` : ''}
        <div><strong>TOTAL AMOUNT:</strong> ₹${currentPack.price} (Cash on Delivery / UPI)</div>
        <div><strong>DELIVERY DESTINATION:</strong> ${custAddress}</div>
        <div style="color: #10b981; margin-top: 8px;"><strong>COLD-CHAIN TELEMETRY:</strong> 3.8°C VERIFIED (ANAND COMPLEX PLANT #4)</div>
        <div style="color: #9ca3af; font-size: 0.75rem; margin-top: 4px;">FSSAI Central Lic. No. 10012021000071 • 100% Pure Vegetarian Certified</div>
      `;
    }

    if (orderModal) orderModal.showModal();

    // Immediately refresh the Orders Ledger drawer so the new order appears
    fetchAndRenderOrders(activeOrderFilter);
  });
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => {
    if (orderModal) orderModal.close();
    playClickSound();
  });
}

// ==========================================================================
// ORDERS SIDE DRAWER & GCMMF DISPATCH LEDGER
// ==========================================================================
const btnOpenOrdersNav = document.getElementById('btn-open-orders-nav');
const btnOpenOrdersSide = document.getElementById('btn-open-orders-side');
const btnCloseOrdersDrawer = document.getElementById('btn-close-orders-drawer');
const ordersDrawerBackdrop = document.getElementById('orders-drawer-backdrop');
const ordersDrawer = document.getElementById('orders-drawer');
const navOrdersBadge = document.getElementById('nav-orders-badge');
const sideOrdersBadge = document.getElementById('side-orders-badge');
const drawerTotalCount = document.getElementById('drawer-total-count');
const drawerTotalRevenue = document.getElementById('drawer-total-revenue');
const drawerOrdersList = document.getElementById('drawer-orders-list');
const btnRefreshOrders = document.getElementById('btn-refresh-orders');
const drawerFilterChips = document.querySelectorAll('.drawer-filter-chip');
const btnDrawerNewOrder = document.getElementById('btn-drawer-new-order');

let currentOrdersData = [];
let activeOrderFilter = 'all';

function openOrdersDrawer() {
  if (ordersDrawer) {
    ordersDrawer.classList.add('open');
    ordersDrawer.setAttribute('aria-hidden', 'false');
  }
  if (ordersDrawerBackdrop) {
    ordersDrawerBackdrop.classList.add('active');
  }
  playClickSound();
  fetchAndRenderOrders(activeOrderFilter);
}

function closeOrdersDrawer() {
  if (ordersDrawer) {
    ordersDrawer.classList.remove('open');
    ordersDrawer.setAttribute('aria-hidden', 'true');
  }
  if (ordersDrawerBackdrop) {
    ordersDrawerBackdrop.classList.remove('active');
  }
  playClickSound();
}

if (btnOpenOrdersNav) btnOpenOrdersNav.addEventListener('click', openOrdersDrawer);
if (btnOpenOrdersSide) btnOpenOrdersSide.addEventListener('click', openOrdersDrawer);
if (btnCloseOrdersDrawer) btnCloseOrdersDrawer.addEventListener('click', closeOrdersDrawer);
if (ordersDrawerBackdrop) ordersDrawerBackdrop.addEventListener('click', closeOrdersDrawer);

if (btnDrawerNewOrder) {
  btnDrawerNewOrder.addEventListener('click', (e) => {
    e.preventDefault();
    closeOrdersDrawer();
    const target = document.getElementById('order-section');
    if (target) lenis.scrollTo(target);
  });
}

// Filter chips
drawerFilterChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    drawerFilterChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeOrderFilter = chip.dataset.filter;
    playClickSound();
    renderOrdersCards(currentOrdersData, activeOrderFilter);
  });
});

if (btnRefreshOrders) {
  btnRefreshOrders.addEventListener('click', () => {
    btnRefreshOrders.textContent = 'Syncing...';
    playClickSound();
    fetchAndRenderOrders(activeOrderFilter).finally(() => {
      btnRefreshOrders.textContent = '⟳ Sync';
    });
  });
}

async function fetchAndRenderOrders(filter = 'all') {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      currentOrdersData = data.orders || [];
      
      // Update badges & stats
      const total = data.totalOrders || currentOrdersData.length;
      if (navOrdersBadge) navOrdersBadge.textContent = total;
      if (sideOrdersBadge) sideOrdersBadge.textContent = total;
      if (drawerTotalCount) drawerTotalCount.textContent = total;
      if (drawerTotalRevenue) drawerTotalRevenue.textContent = `₹${data.totalRevenue || 0}`;

      renderOrdersCards(currentOrdersData, filter);
    }
  } catch (err) {
    console.warn('Orders ledger fetch error:', err);
  }
}

function renderOrdersCards(orders, filter) {
  if (!drawerOrdersList) return;

  let filtered = [...orders];
  if (filter === 'transit') {
    filtered = filtered.filter((o) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'EN_ROUTE_REEFER');
  } else if (filter === 'ai') {
    filtered = filtered.filter((o) => o.customFormulaName && !o.customFormulaName.includes('Standard'));
  }

  if (filtered.length === 0) {
    drawerOrdersList.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
        <p style="font-size: 0.85rem; font-weight: 600;">No orders matching this filter.</p>
        <p style="font-size: 0.72rem; margin-top: 0.35rem;">Placed pre-orders will appear here with live Anand dispatch hashes.</p>
      </div>
    `;
    return;
  }

  drawerOrdersList.innerHTML = filtered.map((ord) => {
    const isAi = ord.customFormulaName && !ord.customFormulaName.includes('Standard');
    const timeFormatted = new Date(ord.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="drawer-order-card" data-order-id="${ord.orderId}">
        <div class="order-card-header">
          <span class="order-id-txt">${ord.orderId}</span>
          <span class="order-dispatch-hash">${ord.dispatchCode || 'CND-4C-ANAND'}</span>
        </div>
        
        <div class="order-cust-line">👤 ${escapeHtml(ord.custName)}</div>
        <div class="order-addr-line">📍 ${escapeHtml(ord.custAddress)} • ${timeFormatted}</div>

        <div class="order-pack-strip">
          <span class="order-pack-name">${escapeHtml(ord.packName)}</span>
          <span class="order-pack-price">₹${ord.packPrice}</span>
        </div>

        ${isAi ? `
          <div class="order-ai-tag">
            <span>✦</span>
            <span>AI BLEND: ${escapeHtml(ord.customFormulaName)}</span>
          </div>
        ` : ''}

        <div class="order-cold-indicator">
          <span>❄️ ${ord.coldChainTemp || '3.8°C'} • ${escapeHtml(ord.carrier || 'Amul Anand Reefer')}</span>
          <span style="font-size: 0.65rem; color: #10b981;">● ${ord.status.replace(/_/g, ' ')}</span>
        </div>

        <div class="order-actions-row">
          <button type="button" class="btn-view-digital-receipt" onclick="window.viewOrderReceipt('${ord.orderId}')">
            View Official GCMMF Receipt ↗
          </button>
          <button type="button" class="btn-cancel-order" onclick="window.cancelOrder('${ord.orderId}')" title="Retract this order">
            Retract
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Global hooks for receipt view and order cancel
window.viewOrderReceipt = (orderId) => {
  const ord = currentOrdersData.find((o) => o.orderId === orderId);
  if (!ord) return;
  if (modalDescText) {
    modalDescText.textContent = `Verified GCMMF Anand Logistics Record for ${ord.custName}`;
  }
  if (modalReceiptContent) {
    modalReceiptContent.innerHTML = `
      <div><strong>ORDER ID:</strong> ${ord.orderId}</div>
      <div><strong>DISPATCH HASH:</strong> ${ord.dispatchCode}</div>
      <div><strong>BATCH ALLOCATION:</strong> ${ord.packName}</div>
      ${ord.customFormulaName ? `<div style="color: #ff2d87;"><strong>AI FORMULA:</strong> ${ord.customFormulaName}</div>` : ''}
      <div><strong>TOTAL AMOUNT:</strong> ₹${ord.packPrice} (Cash on Delivery / UPI)</div>
      <div><strong>DESTINATION:</strong> ${ord.custAddress}</div>
      <div style="color: #10b981; margin-top: 8px;"><strong>LOGISTICS CARRIER:</strong> ${ord.carrier} (${ord.coldChainTemp})</div>
      <div style="color: #9ca3af; font-size: 0.75rem; margin-top: 4px;">FSSAI Central Lic. No. 10012021000071 • 100% Pure Vegetarian Certified</div>
      <div style="margin-top: 14px;">
        <a href="/api/orders/${ord.orderId}/invoice" target="_blank" rel="noopener" class="btn btn-secondary btn-block btn-sm" style="display: block; text-align: center; text-decoration: none; padding: 8px 12px; font-size: 0.78rem;">
          🖨️ View & Print Official Tax Invoice (GST Verified) ↗
        </a>
      </div>
    `;
  }
  if (orderModal) orderModal.showModal();
  playClickSound();
};

window.cancelOrder = async (orderId) => {
  if (!confirm(`Are you sure you want to retract order ${orderId}?`)) return;
  try {
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (res.ok) {
      playClickSound();
      fetchAndRenderOrders(activeOrderFilter);
    }
  } catch (err) {
    console.error('Cancel order error:', err);
  }
};

// ==========================================================================
// NAVBAR SCROLL OBSERVER
// ==========================================================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (!navbar) return;
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// ==========================================================================
// SMOOTH SCROLL (LENIS) & MAIN RAF ANIMATION LOOP
// ==========================================================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

function rafLoop(time) {
  lenis.raf(time);

  // Auto 360 Turntable rotation mode
  if (isTurntableAutoSpinning) {
    targetHeroFrame = (targetHeroFrame % TOTAL_FRAMES) + 1;
  }

  // Smooth lerping of Hero Frame
  const frameDiff = targetHeroFrame - currentHeroFrame;
  currentHeroFrame += frameDiff * 0.14;
  const roundedHero = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(currentHeroFrame)));

  if (roundedHero !== lastHeroRenderedFrame) {
    lastHeroRenderedFrame = roundedHero;
    drawHeroCanvas(roundedHero);
    if (hudFrameText) {
      hudFrameText.textContent = `FRAME ${String(roundedHero).padStart(3, '0')} / 300`;
    }
    // Modulate audio on fast frame movement
    if (Math.abs(roundedHero - lastSoundFrame) >= 2) {
      triggerTickSound();
      lastSoundFrame = roundedHero;
    }
  }

  requestAnimationFrame(rafLoop);
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
window.addEventListener('resize', () => {
  resizeHeroCanvas();
});

window.addEventListener('scroll', updateHeroScroll, { passive: true });

// Start everything
resizeHeroCanvas();
updateHeroScroll();
preloadAllFrames();
fetchAndRenderOrders();
requestAnimationFrame(rafLoop);
