<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Car } from './Car';
import { mulberry32, generatePoints, drawMap, drawCircularTrack, drawCurvedTrackJagged } from './utils';
import type { GenerateParams } from './utils';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx!: CanvasRenderingContext2D;
let canvas!: HTMLCanvasElement;
onMounted(() => {
  canvas = canvasRef.value!;
  ctx = canvas.getContext('2d')!;

  // compute canvas-dependent values lazily after canvas is available
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
  baseRadius = Math.min(canvas.width, canvas.height) / 2.5;

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

  // hook up select after DOM is ready
  const select = document.getElementById('trackTypeSelect') as HTMLSelectElement | null;
  if (select) {
    select.addEventListener('change', () => {
      // regenerate track and reposition the car to the new start
      resetTrackAndReposition(select.value as "CIRCLE" | "ELLIPSE");
    });
  }

  // seed input and randomize button
  const seedInput = document.getElementById('seedInput') as HTMLInputElement | null;
  const randomizeBtn = document.getElementById('randomizeSeedBtn') as HTMLButtonElement | null;
  if (seedInput) {
    seedInput.value = String(seed);
    seedInput.addEventListener('change', () => {
      const parsed = parseInt(seedInput.value, 10);
      if (!isNaN(parsed)) {
        seed = parsed;
        rng = mulberry32(seed);
        // regenerate and reposition using the new seed
        resetTrackAndReposition(select ? (select.value as "CIRCLE" | "ELLIPSE") : "CIRCLE");
      }
    });
  }
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', () => {
      seed = Math.floor(Math.random() * 2147483646) + 1;
      rng = mulberry32(seed);
      if (seedInput) seedInput.value = String(seed);
      resetTrackAndReposition(select ? (select.value as "CIRCLE" | "ELLIPSE") : "CIRCLE");
    });
  }

  draw();
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

function draw() {
  // drawCurvedTrack(ctx, canvas, outer, inner);
  drawMap(ctx, canvas);
  drawCircularTrack(ctx, canvas, outer, inner, points);
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
    <div style="position: absolute; left: 12px; top: 12px; background: rgba(255,255,255,0.95); padding: 6px; border-radius: 6px; display:flex; gap:8px; align-items:center; color: #111;">
      <label for="trackTypeSelect" style="font-size:12px; margin-right:6px; color: #111;">Track:</label>
      <select id="trackTypeSelect" style="color:#111; background:#fff; border:1px solid #ccc; padding:4px 6px; border-radius:4px;">
        <option value="CIRCLE">Circle</option>
        <option value="ELLIPSE">Ellipse</option>
      </select>
      <label for="seedInput" style="font-size:12px; margin-left:6px; color: #111;">Seed:</label>
      <input id="seedInput" type="number" style="width:110px; font-size:12px; padding:4px 6px; border:1px solid #ccc; border-radius:4px; color:#111; background:#fff;" />
      <button id="randomizeSeedBtn" style="font-size:12px; padding:6px 8px; background:#eee; border:1px solid #bbb; border-radius:4px; color:#111; cursor:pointer;">Randomize</button>
    </div>
  </div>
</template>