<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { Car } from './Car';
import { mulberry32, generatePoints, drawMap, drawCircularTrack, drawCurvedTrackJagged } from './utils';
import { setupControls } from './controls';
import type { GenerateParams } from './utils';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const inputState = reactive({ throttle: 0, steer: 0 });
function isTypingActive() {
  const ae = document.activeElement as HTMLElement | null;
  return !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
}

function onCanvasKeyDown(e: KeyboardEvent) {
  if (isTypingActive()) return;
  const k = e.key;
  if (k === 'ArrowUp' || k === 'w' || k === 'W') {
    e.preventDefault();
    inputState.throttle = 1;
  } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
    e.preventDefault();
    inputState.throttle = -1;
  } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
    e.preventDefault();
    inputState.steer = -1;
  } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
    e.preventDefault();
    inputState.steer = 1;
  } else if (k === ' ') {
    e.preventDefault();
    // space => brake (stop throttle)
    inputState.throttle = 0;
  }
}

function onCanvasKeyUp(e: KeyboardEvent) {
  const k = e.key;
  if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'ArrowDown' || k === 's' || k === 'S') {
    inputState.throttle = 0;
  } else if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'ArrowRight' || k === 'd' || k === 'D') {
    inputState.steer = 0;
  }
}
// --- Canvas top-bar PID sliders (drawn in-canvas) ---
const topBarHeight = 80;
const sliderCount = 3;
const sliderMargin = 20;
const sliderSpacing = 16;
const sliderLabelHeight = 18;
const sliderTrackHeight = 6;
const knobRadius = 8;

const baseSteeringRate = 0.04; // baseline from Car.ts
const baseAccel = 0.25;

const pidRanges = [
  { min: 0, max: 2 }, // kp
  { min: 0, max: 1 }, // ki
  { min: 0, max: 1 }, // kd
];

const pidState = reactive({ kp: 1, ki: 0, kd: 0 });

let draggingIndex = -1; // -1 = none, else 0..2

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function sliderLayout(canvasW: number) {
  const totalSpacing = sliderMargin * 2 + sliderSpacing * (sliderCount - 1);
  const sliderWidth = (canvasW - totalSpacing) / sliderCount;
  return { sliderWidth, totalSpacing };
}

function getSliderRect(index: number, canvasW: number) {
  const { sliderWidth } = sliderLayout(canvasW);
  const x = sliderMargin + index * (sliderWidth + sliderSpacing);
  const y = 8;
  const w = sliderWidth;
  const h = topBarHeight - 16;
  return { x, y, w, h };
}

function valueFromXForSlider(index: number, x: number, canvasW: number) {
  const r = getSliderRect(index, canvasW);
  const trackLeft = r.x + 12;
  const trackRight = r.x + r.w - 12;
  const t = clamp01((x - trackLeft) / (trackRight - trackLeft));
  const range = pidRanges[index];
  return range.min + t * (range.max - range.min);
}

function setPidFromX(index: number, x: number) {
  const v = valueFromXForSlider(index, x, canvas.width);
  if (index === 0) pidState.kp = v;
  else if (index === 1) pidState.ki = v;
  else if (index === 2) pidState.kd = v;
}

function onPointerDown(e: PointerEvent) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (y > topBarHeight) return;
  for (let i = 0; i < sliderCount; i++) {
    const r = getSliderRect(i, canvas.width);
    if (x >= r.x && x <= r.x + r.w) {
      draggingIndex = i;
      setPidFromX(i, x);
      e.preventDefault();
      return;
    }
  }
}

function onPointerMove(e: PointerEvent) {
  if (draggingIndex < 0 || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  setPidFromX(draggingIndex, x);
  e.preventDefault();
}

function onPointerUp() {
  draggingIndex = -1;
}
let ctx!: CanvasRenderingContext2D;
let canvas!: HTMLCanvasElement;
let controlsCleanup: (() => void) | null = null;
onMounted(() => {
  canvas = canvasRef.value!;
  ctx = canvas.getContext('2d')!;

  // make canvas focusable and capture keyboard events on it
  canvas.tabIndex = 0;
  canvas.addEventListener('click', () => canvas.focus());
  canvas.addEventListener('keydown', onCanvasKeyDown as EventListener);
  canvas.addEventListener('keyup', onCanvasKeyUp as EventListener);

  // compute canvas-dependent values lazily after canvas is available
  centerX = canvas.width / 2;
  // shift center down to account for top bar
  centerY = canvas.height / 2 + topBarHeight / 2;
  baseRadius = Math.min(canvas.width, canvas.height - topBarHeight) / 2.5;

  // generate track, create car and start drawing
  ({ outer, inner } = generatePoints("CIRCLE", {
    centerX,
    centerY,
    baseRadius,
    trackWidth,
    points,
    angleStep,
    rng,
  } as GenerateParams));
  const angleOuter = Math.atan2(outer[1][1] - outer[0][1], outer[1][0] - outer[0][0]);
  const angleInner = Math.atan2(inner[1][1] - inner[0][1], inner[1][0] - inner[0][0]);
  const initCarAngle = (angleOuter + angleInner) / 2;
  car = new Car(inner[0][0] + trackWidth / 2, inner[0][1], initCarAngle);

  // wire external UI controls via setupControls (moved out of component)
  controlsCleanup = setupControls({
    initialSeed: seed,
    onSeedOrRandomize: (newSeed, type) => {
      seed = newSeed;
      rng = mulberry32(seed);
      resetTrackAndReposition(type);
    },
    onTrackChange: (type) => resetTrackAndReposition(type),
  });

  // pointer events for sliders
  canvas.addEventListener('pointerdown', onPointerDown as EventListener);
  window.addEventListener('pointermove', onPointerMove as EventListener);
  window.addEventListener('pointerup', onPointerUp as EventListener);

  draw();
});

onUnmounted(() => {
  try {
    if (canvas) {
      canvas.removeEventListener('keydown', onCanvasKeyDown as EventListener);
      canvas.removeEventListener('keyup', onCanvasKeyUp as EventListener);
      canvas.removeEventListener('pointerdown', onPointerDown as EventListener);
    }
    window.removeEventListener('pointermove', onPointerMove as EventListener);
    window.removeEventListener('pointerup', onPointerUp as EventListener);
    controlsCleanup?.();
  } catch (e) {
    // ignore
  }
});

let centerX = 0;
let centerY = 0;
let baseRadius = 0;
const trackWidth = 80;
const points = 16;
const angleStep = (2 * Math.PI) / points;

// seeded RNG for deterministic tracks
let seed = Date.now() % 2147483647;
let rng = mulberry32(seed);

// track data (populated via generatePoints)
let outer: [number, number][] = [];
let inner: [number, number][] = [];

// car will be created in onMounted after track points are generated
let car!: Car;

function drawStartFinishLine(ctx: CanvasRenderingContext2D, inner: [number, number][], outer: [number, number][]) {
  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(inner[0][0], inner[0][1]);
  ctx.lineTo(outer[0][0], outer[0][1]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// draw top bar with sliders
function drawTopBar(ctx: CanvasRenderingContext2D) {
  ctx.save();
  // background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, topBarHeight);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, topBarHeight - 2, canvas.width, 2);

  const labels = ['Kp', 'Ki', 'Kd'];
  for (let i = 0; i < sliderCount; i++) {
    const r = getSliderRect(i, canvas.width);
    // label
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.textBaseline = 'top';
    const valText = i === 0 ? pidState.kp.toFixed(2) : i === 1 ? pidState.ki.toFixed(3) : pidState.kd.toFixed(3);
    ctx.fillText(`${labels[i]}: ${valText}`, r.x, r.y);

    // track
    const trackY = r.y + sliderLabelHeight + 8;
    const trackLeft = r.x + 12;
    const trackRight = r.x + r.w - 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(trackLeft, trackY, trackRight - trackLeft, sliderTrackHeight);

    // fill portion
    const range = pidRanges[i];
    const valNorm = (i === 0 ? pidState.kp : i === 1 ? pidState.ki : pidState.kd - range.min) / (range.max - range.min);
    const fillW = (trackRight - trackLeft) * clamp01(valNorm);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(trackLeft, trackY, fillW, sliderTrackHeight);

    // knob
    const knobX = trackLeft + fillW;
    const knobY = trackY + sliderTrackHeight / 2;
    ctx.beginPath();
    ctx.fillStyle = draggingIndex === i ? '#ff9800' : '#fff';
    ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

function draw() {
  // draw background and top bar
  drawMap(ctx, canvas);
  drawTopBar(ctx);

  // draw track / map below top bar
  drawCircularTrack(ctx, canvas, outer, inner, points);

  // apply controls -> update -> draw
  try {
    if (car) {
      // map Kp to steeringRate and accel for responsiveness
      car.steeringRate = baseSteeringRate * pidState.kp;
      car.accel = baseAccel * pidState.kp;
    }

    car.applyThrottle?.(inputState.throttle);
    car.applySteering?.(inputState.steer);
    car.update();
  } catch (e) {
    // car might not be initialized yet
  }
  car.draw(ctx);
  requestAnimationFrame(draw);
}


// Re-generate track and reposition the car to the new start when called at runtime
function resetTrackAndReposition(type: "CIRCLE" | "ELLIPSE") {
  outer.length = 0;
  inner.length = 0;
  ({ outer, inner } = generatePoints(type, { centerX, centerY, baseRadius, trackWidth, points, angleStep, rng } as GenerateParams));

  // compute initial angle from first two points
  const angleOuter = Math.atan2(outer[1][1] - outer[0][1], outer[1][0] - outer[0][0]);
  const angleInner = Math.atan2(inner[1][1] - inner[0][1], inner[1][0] - inner[0][0]);
  const initCarAngle = (angleOuter + angleInner) / 2;

  // place car on the inner edge + half track width
  if (!car) {
    car = new Car(inner[0][0] + trackWidth / 2, inner[0][1], initCarAngle);
  } else {
    car.x = inner[0][0] + trackWidth / 2;
    car.y = inner[0][1];
    car.angle = initCarAngle;
  }
}

</script>
<template>
  <div style="position: relative; display: inline-block;">
    <canvas id="pidCanvas" width="800" height="600" ref="canvasRef"></canvas>
  </div>
</template>