const natasha = document.querySelector("#natasha");
const belly = document.querySelector("#belly");
const bubble = document.querySelector("#bubble");
const babyArea = document.querySelector("#babyArea");
const throwBtn = document.querySelector("#throwBtn");
const waterBtn = document.querySelector("#waterBtn");
const petBtn = document.querySelector("#petBtn");
const patBtn = document.querySelector("#patBtn");
const resetBtn = document.querySelector("#resetBtn");
const resetTop = document.querySelector("#resetTop");
const soundToggle = document.querySelector("#soundToggle");
const notice = document.querySelector("#notice");
const noticeClose = document.querySelector("#noticeClose");
const coach = document.querySelector("#coach");
const tagline = document.querySelector("#tagline");
const THROW_SOUND_URLS = [
  "./throw-sound.mp3",
  "file:///D:/2718075060/Desk/rw%E6%AF%95%E4%B8%9A/audio_1781024297127.mp3"
];

const IDLE_LINES = [
  "我叫娜塔莎，潮汕话 = 垃圾桶哦～",
  "蔡大伯的中非混血女儿来啦！",
  "丑萌也是萌，解压就捏我！",
  "垃圾桶女孩，装下所有不开心～",
  "妈妈别摔我，我超听话的！"
];

const LINES = {
  pinch: [
    "别捏我！我是有尊严的垃圾桶！",
    "哎呀～轻点捏，脸都变形啦！",
    "蔡大伯救我！有人欺负女儿啦！"
  ],
  pat: [
    "别打我！我是蔡大伯的宝贝女儿！",
    "疼疼疼！再打我就找妈妈告状啦！",
    "养娃不如捏娃？过分咯！"
  ],
  pet: [
    "摸头杀～好温柔呀～",
    "蔡大伯都没这么温柔过～",
    "垃圾桶也需要被爱呀～"
  ],
  water: [
    "喝饱啦！肚子圆得像皮球～",
    "别灌啦！再灌要生宝宝咯！",
    "我是垃圾桶，可不是水桶呀！"
  ],
  taglines: [
    "蔡大伯同款・可捏可玩・垃圾桶女孩",
    "软胶回弹・装下所有不开心",
    "丑萌治愈・沙雕解压・纯娱乐"
  ]
};

const state = {
  mood: "idle",
  activePointer: null,
  startPoint: null,
  bubbleTimer: 0,
  resetTimer: 0,
  waterTimer: 0,
  idleTimer: 0,
  throwLockedUntil: 0,
  patLockedUntil: 0,
  waterLevel: 0,
  muted: false,
  audioContext: null,
  throwAudio: null,
  throwAudioIndex: 0,
  throwAudioReady: false,
  petStreak: 0,
  patStreak: 0,
  lastPetAt: 0,
  lastPatAt: 0
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    return false;
  }
  return true;
}

function now() {
  return performance.now();
}

function speak(text, duration = 2000) {
  window.clearTimeout(state.bubbleTimer);
  bubble.textContent = text;
  bubble.classList.add("show");
  state.bubbleTimer = window.setTimeout(() => bubble.classList.remove("show"), duration);
  scheduleIdleLine();
}

function scheduleIdleLine() {
  window.clearTimeout(state.idleTimer);
  state.idleTimer = window.setTimeout(() => {
    if (state.mood === "idle" && !notice.classList.contains("show")) {
      speak(pick(IDLE_LINES));
    }
  }, 5200 + Math.random() * 2600);
}

function setMood(mood, duration = 3000) {
  state.mood = mood;
  natasha.classList.remove("idle", "pinch", "hit", "pet", "birth");
  natasha.classList.add(mood);
  window.Natasha3D?.setMood(mood);
  window.clearTimeout(state.resetTimer);

  if (mood !== "idle" && mood !== "watered") {
    state.resetTimer = window.setTimeout(() => {
      if (state.mood === mood) returnToIdle();
    }, duration);
  }
}

function returnToIdle() {
  state.mood = "idle";
  natasha.classList.remove("pinch", "hit", "pet", "birth");
  natasha.classList.add("idle");
  natasha.style.removeProperty("transform");
  clearStretch();
  window.Natasha3D?.setMood("idle");
  scheduleIdleLine();
}

function clearStretch() {
  natasha.classList.remove("stretching", "stretch-head", "stretch-body", "stretch-limb", "snapback");
  natasha.style.removeProperty("--pull-x");
  natasha.style.removeProperty("--pull-y");
  natasha.style.removeProperty("--pull-abs-x");
  natasha.style.removeProperty("--pull-abs-y");
  natasha.style.removeProperty("--pull-angle");
  natasha.style.removeProperty("--body-angle");
  natasha.style.removeProperty("--leg-angle");
  natasha.style.removeProperty("--limb-left");
  natasha.style.removeProperty("--limb-right");
  natasha.style.removeProperty("--leg-left");
  natasha.style.removeProperty("--leg-right");
  window.Natasha3D?.clearStretch();
}

function ensureAudio() {
  if (state.muted) return null;
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === "suspended") state.audioContext.resume();
  return state.audioContext;
}

function ensureThrowAudio() {
  if (state.muted) return null;
  if (!state.throwAudio) {
    state.throwAudio = new Audio(THROW_SOUND_URLS[state.throwAudioIndex]);
    state.throwAudio.preload = "auto";
    state.throwAudio.volume = 0.9;
    state.throwAudio.addEventListener("canplaythrough", () => {
      state.throwAudioReady = true;
    });
    state.throwAudio.addEventListener("error", () => {
      state.throwAudioReady = false;
      if (state.throwAudioIndex < THROW_SOUND_URLS.length - 1) {
        state.throwAudioIndex += 1;
        state.throwAudio = null;
      }
    });
  }
  return state.throwAudio;
}

function playThrowSound() {
  const audio = ensureThrowAudio();
  if (!audio) return false;
  audio.currentTime = 0;
  audio.playbackRate = 0.92;
  const playResult = audio.play();
  if (playResult && typeof playResult.catch === "function") {
    playResult.catch(() => {
      state.throwAudioReady = false;
      playTone("throw");
    });
  }
  return true;
}

function tone(freq, length, wave = "sine", volume = 0.08, delay = 0, endFreq = freq * 1.2) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + length + 0.04);
}

function playTone(type) {
  if (type === "pinch") {
    tone(190 + Math.random() * 45, 0.18, "sine", 0.075, 0, 270);
    tone(115, 0.13, "triangle", 0.04, 0.045, 88);
    return;
  }

  if (type === "pat") {
    tone(92, 0.055, "square", 0.1, 0, 62);
    tone(240, 0.08, "triangle", 0.045, 0.018, 160);
    return;
  }

  if (type === "pet") {
    tone(330, 0.24, "sine", 0.052, 0, 470);
    tone(520, 0.34, "sine", 0.035, 0.08, 680);
    return;
  }

  if (type === "water") {
    for (let i = 0; i < 6; i += 1) {
      tone(145 + i * 18, 0.14, "triangle", 0.045, i * 0.075, 115 + i * 22);
    }
    return;
  }

  if (type === "throw") {
    tone(150, 0.42, "sawtooth", 0.055, 0, 420);
    tone(86, 0.28, "square", 0.11, 0.58, 48);
    tone(130, 0.24, "triangle", 0.065, 0.86, 210);
    return;
  }

  if (type === "splat") {
    tone(72, 0.2, "square", 0.12, 0, 38);
    tone(118, 0.16, "sawtooth", 0.08, 0.04, 64);
    tone(230, 0.1, "triangle", 0.045, 0.12, 160);
    return;
  }

  if (type === "baby") {
    tone(440, 0.22, "sine", 0.075, 0, 650);
    tone(620, 0.24, "sine", 0.058, 0.2, 420);
    return;
  }

  if (type === "chirp") {
    tone(620, 0.12, "sine", 0.07, 0, 880);
  }
}

function spawnParticles(x, y, type = "star", count = 8) {
  const symbols = {
    heart: ["♥", "♡"],
    star: ["✦", "✧", "★"],
    cloud: ["☁"]
  }[type];

  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement("span");
    spark.className = `spark ${type}`;
    spark.dataset.shape = symbols[Math.floor(Math.random() * symbols.length)];
    spark.style.setProperty("--x", `${x + (Math.random() - 0.5) * 24}px`);
    spark.style.setProperty("--y", `${y + (Math.random() - 0.5) * 20}px`);
    spark.style.setProperty("--dx", `${(Math.random() - 0.5) * 82}px`);
    spark.style.setProperty("--life", type === "cloud" ? "820ms" : "520ms");
    document.body.append(spark);
    spark.addEventListener("animationend", () => spark.remove(), { once: true });
  }
}

function clearParticles() {
  document.querySelectorAll(".spark").forEach((spark) => spark.remove());
}

function pinch(part, x, y, fromMove = false) {
  playTone("pinch");
  setMood("pinch", fromMove ? 800 : 3000);
  spawnParticles(x, y, "star", fromMove ? 3 : 8);
  if (!fromMove) speak(pick(LINES.pinch));
}

function applyStretch(part, dx, dy) {
  const pullX = Math.max(-1, Math.min(1, dx / 150));
  const pullY = Math.max(-1.25, Math.min(1.25, dy / 150));
  const absX = Math.min(1, Math.abs(dx) / 170);
  const absY = Math.min(1.25, Math.abs(dy) / 170);
  const angle = Math.max(-18, Math.min(18, dx / 9));
  const bodyAngle = angle * 0.45;
  const legAngle = angle * 0.35;

  natasha.classList.add("stretching");
  natasha.classList.toggle("stretch-head", part === "head");
  natasha.classList.toggle("stretch-body", part === "body" || part === "belly");
  const isLimb = part !== "head" && part !== "body" && part !== "belly";
  natasha.classList.toggle("stretch-limb", isLimb);
  natasha.style.setProperty("--pull-x", pullX.toFixed(3));
  natasha.style.setProperty("--pull-y", pullY.toFixed(3));
  natasha.style.setProperty("--pull-abs-x", absX.toFixed(3));
  natasha.style.setProperty("--pull-abs-y", absY.toFixed(3));
  natasha.style.setProperty("--pull-angle", `${angle.toFixed(1)}deg`);
  natasha.style.setProperty("--body-angle", `${bodyAngle.toFixed(1)}deg`);
  natasha.style.setProperty("--leg-angle", `${legAngle.toFixed(1)}deg`);

  if (part === "body" || part === "belly") {
    natasha.style.setProperty("--limb-left", `${Math.max(-26, Math.min(14, dx / 7))}deg`);
    natasha.style.setProperty("--limb-right", `${Math.max(-14, Math.min(26, dx / 7))}deg`);
    natasha.style.setProperty("--leg-left", `${Math.max(-10, Math.min(18, dy / 10))}deg`);
    natasha.style.setProperty("--leg-right", `${Math.max(-18, Math.min(10, -dy / 10))}deg`);
  }
  window.Natasha3D?.applyStretch(part, dx, dy);
}

function springBack() {
  natasha.classList.remove("stretching", "stretch-head", "stretch-body", "stretch-limb");
  natasha.classList.add("snapback");
  window.setTimeout(() => {
    natasha.classList.remove("snapback");
    clearStretch();
  }, 620);
}

function pet(x, y, fromMove = false) {
  const t = now();
  if (!fromMove) {
    state.petStreak = t - state.lastPetAt < 1600 ? state.petStreak + 1 : 1;
    state.lastPetAt = t;
  }

  playTone("pet");
  setMood("pet", 3000);
  spawnParticles(x, y, "heart", fromMove ? 4 : 10);

  if (state.petStreak >= 5) {
    state.petStreak = 0;
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, "heart", 46);
    speak("呜～娜塔莎被宠成小公主啦！");
    return;
  }

  if (!fromMove) speak(pick(LINES.pet));
}

function pat(x, y, source = "native") {
  const t = now();
  if (t < state.patLockedUntil) return;
  state.patLockedUntil = t + 2000;
  state.patStreak = t - state.lastPatAt < 4200 ? state.patStreak + 1 : 1;
  state.lastPatAt = t;

  playTone("pat");
  setMood("hit", 300);
  spawnParticles(x, y, "star", 10);

  if (state.patStreak >= 3) {
    state.patStreak = 0;
    speak("别连拍啦！垃圾桶女孩申请休息三秒！");
    return;
  }

  speak(source === "button" ? "轻轻拍拍就好，主打搞笑形变～" : pick(LINES.pat));
}

function throwNatasha() {
  const t = now();
  if (t < state.throwLockedUntil) return;
  state.throwLockedUntil = t + 3300;

  if (!playThrowSound()) playTone("throw");
  speak("我的娜塔莎！你怎么掉地上啦！");
  natasha.classList.add("thrown");
  window.Natasha3D?.throw();
  spawnParticles(window.innerWidth / 2, window.innerHeight * 0.72, "cloud", 24);
  window.setTimeout(() => {
    playTone("splat");
    spawnParticles(window.innerWidth / 2, window.innerHeight * 0.74, "cloud", 34);
  }, 1950);
  window.setTimeout(() => {
    natasha.classList.remove("thrown");
    returnToIdle();
  }, 3100);
}

function waterNatasha() {
  state.waterLevel = Math.min(3, state.waterLevel + 1);
  const level = state.waterLevel;
  const bodyScale = 1 + level * 0.11;
  const bellyPop = 1 + level * 0.25;
  const headScale = 1 + level * 0.07;

  playTone("water");
  setMood("watered", 0);
  natasha.classList.add("watered");
  natasha.style.setProperty("--belly-scale", bodyScale.toFixed(2));
  natasha.style.setProperty("--head-water-scale", headScale.toFixed(2));
  belly.style.setProperty("--belly-pop", bellyPop.toFixed(2));
  window.Natasha3D?.water(level);
  spawnParticles(window.innerWidth / 2, window.innerHeight * 0.58, "star", 9);
  speak(level < 3 ? `注水 ${level}/3：娜塔莎又圆了一圈～` : pick(LINES.water));

  window.clearTimeout(state.waterTimer);
  state.waterTimer = window.setTimeout(deflateWater, 5000);
}

function deflateWater() {
  state.waterLevel = 0;
  natasha.classList.remove("watered", "birth");
  natasha.style.removeProperty("--belly-scale");
  natasha.style.removeProperty("--head-water-scale");
  belly.style.removeProperty("--belly-pop");
  window.Natasha3D?.water(0);
  returnToIdle();
}

function birthBaby() {
  if (state.waterLevel <= 0) {
    speak("先注水膨胀，再点圆滚滚的肚子哦～");
    return;
  }

  playTone("baby");
  setMood("birth", 3000);
  natasha.classList.add("birth");
  spawnParticles(window.innerWidth * 0.58, window.innerHeight * 0.66, "heart", 18);
  speak("娜塔莎生宝宝啦！喜提外孙女！");
  createBaby();
  window.clearTimeout(state.waterTimer);
  state.waterTimer = window.setTimeout(deflateWater, 3000);
}

function createBaby() {
  const baby = document.createElement("button");
  baby.type = "button";
  baby.className = "mini";
  baby.setAttribute("aria-label", "迷你娜塔莎");

  const babyHead = document.createElement("span");
  const babyBody = document.createElement("span");
  const babyMouth = document.createElement("span");
  const babyPants = document.createElement("span");
  babyHead.className = "mini-head";
  babyBody.className = "mini-body";
  babyMouth.className = "mini-mouth";
  babyPants.className = "mini-pants";

  for (let i = 0; i < 2; i += 1) {
    const eye = document.createElement("span");
    eye.className = "mini-eye";
    babyHead.append(eye);
  }

  babyHead.append(babyMouth);
  babyBody.append(babyPants);
  baby.append(babyHead, babyBody);
  baby.style.left = `${46 + Math.random() * 30}%`;
  babyArea.append(baby);

  while (babyArea.children.length > 3) {
    babyArea.firstElementChild.remove();
  }
}

function resetGame() {
  window.clearTimeout(state.bubbleTimer);
  window.clearTimeout(state.resetTimer);
  window.clearTimeout(state.waterTimer);
  clearParticles();
  babyArea.replaceChildren();
  bubble.classList.remove("show");
  natasha.className = "natasha idle";
  natasha.style.removeProperty("transform");
  natasha.style.removeProperty("--belly-scale");
  natasha.style.removeProperty("--head-water-scale");
  belly.style.removeProperty("--belly-pop");
  state.mood = "idle";
  state.waterLevel = 0;
  state.petStreak = 0;
  state.patStreak = 0;
  window.Natasha3D?.reset();
  speak("状态已重置，娜塔莎又软萌上线啦～");
}

function handleNativeInteraction(part, x, y, fromMove = false) {
  if (part === "belly" && state.waterLevel > 0 && !fromMove) {
    birthBaby();
    return;
  }

  if (fromMove && part === "head") {
    pet(x, y, true);
    return;
  }

  if (!fromMove && (part === "head" || part === "belly")) {
    pat(x, y);
    return;
  }

  pinch(part, x, y, fromMove);
}

natasha.addEventListener("pointerdown", (event) => {
  const target = event.target.closest(".hit-zone");
  if (!target) return;
  state.activePointer = event.pointerId;
  state.startPoint = { x: event.clientX, y: event.clientY, part: target.dataset.part };
  natasha.setPointerCapture(event.pointerId);
  natasha.classList.add("dragging");
});

natasha.addEventListener("pointermove", (event) => {
  if (event.pointerId !== state.activePointer || !state.startPoint) return;
  const dx = event.clientX - state.startPoint.x;
  const dy = event.clientY - state.startPoint.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 10) return;

  if (state.startPoint.part === "head") {
    natasha.style.transform = `translate(${Math.sin(distance / 18) * 5}px, 0) rotate(${Math.sin(distance / 18) * 2}deg)`;
  } else {
    const scaleX = Math.max(0.72, Math.min(1.24, 1 + dx / 230));
    const scaleY = Math.max(0.74, Math.min(1.22, 1 + dy / 260));
    natasha.style.transform = `translate(${dx * 0.08}px, ${dy * 0.05}px) scale(${scaleX}, ${scaleY})`;
  }

  applyStretch(state.startPoint.part, dx, dy);
  handleNativeInteraction(state.startPoint.part, event.clientX, event.clientY, true);
});

function endPointer(event) {
  if (event.pointerId !== state.activePointer || !state.startPoint) return;
  const dx = event.clientX - state.startPoint.x;
  const dy = event.clientY - state.startPoint.y;
  const distance = Math.hypot(dx, dy);
  const part = state.startPoint.part;

  natasha.classList.remove("dragging");
  natasha.style.removeProperty("transform");
  springBack();

  if (distance < 10) {
    handleNativeInteraction(part, event.clientX, event.clientY, false);
  }

  state.activePointer = null;
  state.startPoint = null;
}

natasha.addEventListener("pointerup", endPointer);
natasha.addEventListener("pointercancel", endPointer);

babyArea.addEventListener("click", (event) => {
  const mini = event.target.closest(".mini");
  if (!mini) return;
  mini.classList.remove("bounce");
  mini.offsetHeight;
  mini.classList.add("bounce");
  playTone("chirp");
  spawnParticles(event.clientX, event.clientY, "heart", 8);
});

throwBtn.addEventListener("click", throwNatasha);
waterBtn.addEventListener("click", waterNatasha);
petBtn.addEventListener("click", () => pet(window.innerWidth / 2, window.innerHeight * 0.35));
patBtn.addEventListener("click", () => pat(window.innerWidth / 2, window.innerHeight * 0.48, "button"));
resetBtn.addEventListener("click", resetGame);
resetTop.addEventListener("click", resetGame);

soundToggle.addEventListener("click", () => {
  state.muted = !state.muted;
  soundToggle.textContent = state.muted ? "×" : "♪";
  soundToggle.setAttribute("aria-label", state.muted ? "开启音效" : "关闭音效");
  speak(state.muted ? "已静音，只保留画面反馈～" : "音效已开启，咕噜咕噜回来啦～");
});

noticeClose.addEventListener("click", () => {
  notice.classList.remove("show");
  storageSet("natashaNoticeAccepted", "1");
  coach.classList.add("show");
  window.setTimeout(() => coach.classList.remove("show"), 2000);
  speak("我叫娜塔莎，装得下所有不开心～");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.audioContext) state.audioContext.suspend();
});

let taglineIndex = 0;
window.setInterval(() => {
  taglineIndex = (taglineIndex + 1) % LINES.taglines.length;
  tagline.textContent = LINES.taglines[taglineIndex];
}, 3600);

if (!storageGet("natashaNoticeAccepted")) {
  notice.classList.add("show");
} else {
  coach.classList.add("show");
  window.setTimeout(() => coach.classList.remove("show"), 2000);
  speak("我叫娜塔莎，装得下所有不开心～");
}

scheduleIdleLine();
