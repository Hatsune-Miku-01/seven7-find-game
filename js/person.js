// 参数化的白色小人 SVG 生成器
// 用粗线条 + 圆形端点画出胶囊状的身体，不需要任何图片素材

const POSES = {
  standing: {
    head: [50, 20],
    shoulderL: [38, 40], handL: [30, 70],
    shoulderR: [62, 40], handR: [70, 70],
    hipL: [44, 90], footL: [38, 150],
    hipR: [56, 90], footR: [62, 150],
  },
  armsUp: {
    head: [50, 20],
    shoulderL: [38, 40], handL: [18, 8],
    shoulderR: [62, 40], handR: [82, 8],
    hipL: [44, 90], footL: [40, 150],
    hipR: [56, 90], footR: [60, 150],
  },
  starJump: {
    head: [50, 22],
    shoulderL: [36, 42], handL: [8, 20],
    shoulderR: [64, 42], handR: [92, 20],
    hipL: [42, 88], footL: [14, 150],
    hipR: [58, 88], footR: [86, 150],
  },
  tuck: {
    head: [50, 45],
    shoulderL: [40, 65], handL: [38, 85],
    shoulderR: [60, 65], handR: [62, 85],
    hipL: [42, 90], footL: [38, 115],
    hipR: [58, 90], footR: [62, 115],
  },
  reaching: {
    head: [52, 22],
    shoulderL: [40, 42], handL: [12, 60],
    shoulderR: [62, 44], handR: [66, 78],
    hipL: [44, 90], footL: [24, 150],
    hipR: [58, 90], footR: [70, 140],
  },
};

// 把十六进制颜色调暗一定比例，用来生成描边线索色
function darkenColor(hex, amount = 0.35) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

function personSVG(poseName, { color = '#ffffff', strokeWidth = 13, outline = true } = {}) {
  const pose = POSES[poseName] || POSES.standing;
  const seg = (a, b) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" />`;

  const limbs = [
    seg(pose.shoulderL, pose.handL),
    seg(pose.shoulderR, pose.handR),
    seg(pose.hipL, pose.footL),
    seg(pose.hipR, pose.footR),
    seg(pose.shoulderL, pose.hipL),
    seg(pose.shoulderR, pose.hipR),
    seg(pose.shoulderL, pose.shoulderR),
  ].join('');

  const outlineColor = darkenColor(color, 0.4);

  // 描边层：比主体颜色深一档、线更粗，垫在下面露出一圈边缘，
  // 这样身体色能融进背景，但轮廓仍留一点可辨认的线索
  const outlineLayer = outline ? `
      <g stroke="${outlineColor}" stroke-width="${strokeWidth + 6}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.55">
        ${limbs}
      </g>
      <circle cx="${pose.head[0]}" cy="${pose.head[1]}" r="18" fill="${outlineColor}" opacity="0.55" />
  ` : '';

  return `
    <svg viewBox="0 0 100 160" width="100%" height="100%"
         xmlns="http://www.w3.org/2000/svg" class="person-svg">
      ${outlineLayer}
      <g stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">
        ${limbs}
      </g>
      <circle cx="${pose.head[0]}" cy="${pose.head[1]}" r="15" fill="${color}" />
    </svg>
  `;
}

const POSE_NAMES = Object.keys(POSES);
