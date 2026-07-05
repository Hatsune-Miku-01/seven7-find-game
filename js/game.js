// 动态关卡：图片可以是自动预加载的，也可以是用户上传的
// 小人的位置、姿势、颜色都是自动/随机生成，颜色取自图片对应坐标的局部平均色

const LEVELS = [];
let currentLevel = -1;
let foundCount = 0;

// 小人基准宽度，相对画布宽度的百分比；乘以每个小人的 scale 得到实际宽度
// 用百分比而不是固定像素，这样全屏/窗口变化时比例都能跟着画布走
const FIGURE_BASE_WIDTH_PERCENT = 9;

const stage = document.getElementById('stage');
const counterEl = document.getElementById('counter');
const levelNameEl = document.getElementById('level-name');
const winMsgEl = document.getElementById('win-message');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const bgUpload = document.getElementById('bg-upload');
const figCountInput = document.getElementById('fig-count');
const regenerateBtn = document.getElementById('regenerate-btn');
const penaltyOverlay = document.getElementById('penalty-overlay');
const penaltyText = document.getElementById('penalty-text');
const penaltyConfirm = document.getElementById('penalty-confirm');

const PENALTY_MESSAGES = ['我是钢板', '我是AA', '我没有FF'];

function showPenalty() {
  const msg = PENALTY_MESSAGES[Math.floor(Math.random() * PENALTY_MESSAGES.length)];
  penaltyText.textContent = msg;
  penaltyOverlay.classList.remove('hidden');
}

penaltyConfirm.addEventListener('click', () => {
  penaltyOverlay.classList.add('hidden');
});

stage.addEventListener('click', (e) => {
  if (!e.target.closest('.figure')) {
    showPenalty();
  }
});

const fullscreenBtn = document.getElementById('fullscreen-btn');
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    stage.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

const sampleCanvas = document.createElement('canvas');
const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// 取某个百分比坐标附近一小块区域的平均颜色，作为小人的融合色
function sampleColor(img, xPercent, yPercent) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  sampleCanvas.width = w;
  sampleCanvas.height = h;
  sampleCtx.drawImage(img, 0, 0);

  const px = Math.min(w - 1, Math.max(0, Math.round((xPercent / 100) * w)));
  const py = Math.min(h - 1, Math.max(0, Math.round((yPercent / 100) * h)));
  const half = 24;
  const x0 = Math.max(0, px - half);
  const y0 = Math.max(0, py - half);
  const bw = Math.min(w - x0, half * 2);
  const bh = Math.min(h - y0, half * 2);

  const data = sampleCtx.getImageData(x0, y0, bw, bh).data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
    count++;
  }
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function randomFigures(img, count) {
  const figures = [];
  let attempts = 0;
  while (figures.length < count && attempts < count * 40) {
    attempts++;
    const x = 12 + Math.random() * 76;
    const y = 18 + Math.random() * 68;
    const tooClose = figures.some((f) => Math.hypot(f.x - x, f.y - y) < 16);
    if (tooClose) continue;

    const pose = POSE_NAMES[Math.floor(Math.random() * POSE_NAMES.length)];
    const scale = 0.55 + Math.random() * 0.5;
    const rotate = Math.round(-15 + Math.random() * 30);
    const tint = sampleColor(img, x, y);
    figures.push({ pose, x, y, scale, rotate, tint });
  }
  return figures;
}

async function addLevelFromURL(url, name) {
  const img = await loadImage(url);
  const count = Math.max(2, Math.min(10, Number(figCountInput.value) || 4));
  const level = { name, url, img, figures: randomFigures(img, count) };
  LEVELS.push(level);
  if (currentLevel === -1) {
    currentLevel = 0;
    loadLevel(currentLevel);
  } else {
    updateHeader();
  }
}

function updateHeader() {
  const level = LEVELS[currentLevel];
  levelNameEl.textContent = `${level.name} (${currentLevel + 1}/${LEVELS.length})`;
  updateNav();
}

function loadLevel(index) {
  const level = LEVELS[index];
  currentLevel = index;
  foundCount = 0;
  stage.innerHTML = '';
  stage.style.backgroundImage = `url('${level.url}')`;
  winMsgEl.classList.add('hidden');
  counterEl.textContent = `0 / ${level.figures.length}`;

  level.figures.forEach((fig) => {
    const el = document.createElement('div');
    el.className = 'figure';
    el.style.left = `${fig.x}%`;
    el.style.top = `${fig.y}%`;
    el.style.width = `${FIGURE_BASE_WIDTH_PERCENT * fig.scale}%`;
    el.style.transform = `translate(-50%, -50%) rotate(${fig.rotate}deg)`;
    el.innerHTML = personSVG(fig.pose, { color: fig.tint });
    el.addEventListener('click', () => onFigureClick(el, level.figures.length));
    stage.appendChild(el);
  });

  updateHeader();
}

function onFigureClick(el, total) {
  if (el.classList.contains('found')) return;
  el.classList.add('found');
  foundCount += 1;
  counterEl.textContent = `${foundCount} / ${total}`;

  if (foundCount === total) {
    winMsgEl.classList.remove('hidden');
    winMsgEl.textContent = currentLevel < LEVELS.length - 1 ? '过关！' : '全部关卡通过，恭喜！';
  }
}

function updateNav() {
  prevBtn.classList.toggle('hidden', currentLevel <= 0);
  nextBtn.classList.toggle('hidden', currentLevel >= LEVELS.length - 1);
}

prevBtn.addEventListener('click', () => {
  if (currentLevel > 0) loadLevel(currentLevel - 1);
});

nextBtn.addEventListener('click', () => {
  if (currentLevel < LEVELS.length - 1) loadLevel(currentLevel + 1);
});

regenerateBtn.addEventListener('click', () => {
  if (currentLevel === -1) return;
  const level = LEVELS[currentLevel];
  const count = Math.max(2, Math.min(10, Number(figCountInput.value) || 4));
  level.figures = randomFigures(level.img, count);
  loadLevel(currentLevel);
});

bgUpload.addEventListener('change', (e) => {
  [...e.target.files].forEach((file, i) => {
    const url = URL.createObjectURL(file);
    addLevelFromURL(url, file.name.replace(/\.[^.]+$/, '') || `自定义关卡${i + 1}`);
  });
  bgUpload.value = '';
});

// 页面加载时自动把预设的三关按顺序加载进来
(async () => {
  await addLevelFromURL('background/stage1.jpg', '第一关');
  await addLevelFromURL('background/stage2.PNG', '第二关');
  await addLevelFromURL('background/stage3.png', '第三关');
})();
