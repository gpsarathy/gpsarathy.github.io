<script scoped>
const canvas = document.getElementById('pidCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const baseRadius = Math.min(canvas.width, canvas.height) / 2.5;
const trackWidth = 80;
const points = 16;
const angleStep = (2 * Math.PI) / points;

class Car {
  x: number;
  y: number;
  angle: number; // in radians
  speed: number; // pixels per frame
  length: number = 40;
  width: number = 20;

  constructor(x: number, y: number, angle: number = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 2;
  }

  update(steeringAngle: number) {
    this.angle += steeringAngle;
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = 'red';
    ctx.fillRect(-this.length/2, -this.width/2, this.length, this.width); // Simple rectangle as car
    // draw square headlights
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.length/2 - 5, -this.width/2 + 1, 5, 5);
    ctx.fillRect(this.length/2 - 5, this.width/2 - 6, 5, 5);
    // draw square taillights
    ctx.fillStyle = 'darkred';
    ctx.fillRect(-this.length/2, -this.width/2 + 2, 5, 5);
    ctx.fillRect(-this.length/2, this.width/2 - 7, 5, 5);
    ctx.restore();


    // draw direction arrow with head
    // Fade in/out arrow over time using alpha
    const time = performance.now() / 1000;
    // Arrow will fade in and out every 2 seconds (sinusoidal)
    const alpha = 0.5 + 0.5 * Math.sin(time * Math.PI);

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(this.x + this.length * Math.cos(this.angle), this.y + this.length * Math.sin(this.angle));
    ctx.lineTo(this.x + 80 * Math.cos(this.angle), this.y + 80 * Math.sin(this.angle));
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x + 80 * Math.cos(this.angle), this.y + 80 * Math.sin(this.angle));
    ctx.lineTo(this.x + 68 * Math.cos(this.angle + Math.PI / 14), this.y + 68 * Math.sin(this.angle + Math.PI / 14));
    ctx.lineTo(this.x + 68 * Math.cos(this.angle - Math.PI / 14), this.y + 68 * Math.sin(this.angle - Math.PI / 14));
    ctx.closePath();
    ctx.fillStyle = '#00ff00';
    ctx.fill();

    ctx.restore();
  }
}

// Generate track points once
const outer: [number, number][] = [];
const inner: [number, number][] = [];
function generatePoints( type : "CIRCLE" | "ELLIPSE" | "DUMBBELL" ) {

  switch(type) {
    case "CIRCLE":
      generateCirclePoints();
      break;
    case "ELLIPSE":
      generateEllipsePoints();
      break;
  }
  
}
function generateCirclePoints(){
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const radiusOffset = Math.random() * 100 - 20;
    const rOuter = baseRadius + radiusOffset;
    const rInner = rOuter - trackWidth;
    outer.push([
      centerX + rOuter * Math.cos(angle),
      centerY + rOuter * Math.sin(angle),
    ]);
    inner.push([
      centerX + rInner * Math.cos(angle),
      centerY + rInner * Math.sin(angle),
    ]);
  }
}

function generateEllipsePoints() {
  const ellipseA = baseRadius + 40; // major axis
  const ellipseB = baseRadius - 40; // minor axis
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const aOffset = Math.random() * 60 - 20;
    const bOffset = Math.random() * 60 - 20;
    const rOuterA = ellipseA + aOffset;
    const rOuterB = ellipseB + bOffset;
    const rInnerA = rOuterA - trackWidth;
    const rInnerB = rOuterB - trackWidth;
    outer.push([
      centerX + rOuterA * Math.cos(angle),
      centerY + rOuterB * Math.sin(angle),
    ]);
    inner.push([
      centerX + rInnerA * Math.cos(angle),
      centerY + rInnerB * Math.sin(angle),
    ]);
  }
}

console.log(outer);
console.log(inner);

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'darkgreen';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCurvedTrackJagged(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, outer: [number, number][], inner: [number, number][]) {


  ctx.beginPath();
  ctx.moveTo(outer[0][0], outer[0][1]);
  for (let i = 1; i < points; i++) {
    ctx.lineTo(outer[i][0], outer[i][1]);
  }
  ctx.closePath();
drawMedianLine(ctx, outer, inner);
  for (let i = points - 1; i >= 0; i--) {
    ctx.lineTo(inner[i][0], inner[i][1]);
  }
  ctx.closePath();

  ctx.fillStyle = '#444';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

function drawMedianLine(
  ctx: CanvasRenderingContext2D,
  outer: [number, number][],
  inner: [number, number][]
) {
  ctx.save();
  ctx.beginPath();

  // Compute all midpoints first
  const midpoints: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    midpoints.push([
      (outer[i][0] + inner[i][0]) / 2,
      (outer[i][1] + inner[i][1]) / 2
    ]);
  }

  ctx.moveTo(midpoints[0][0], midpoints[0][1]);
  for (let i = 0; i < points; i++) {
    const next = midpoints[(i + 1) % points];
    const cp = [
      (midpoints[i][0] + next[0]) / 2,
      (midpoints[i][1] + next[1]) / 2
    ];
    ctx.quadraticCurveTo(midpoints[i][0], midpoints[i][1], cp[0], cp[1]);
  }
  ctx.closePath();
  ctx.setLineDash([16, 16]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'darkgray';
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawCheckeredFlag(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, squares: number) {
  const flagWidth = size;
  const flagHeight = size / 2;
  const squareWidth = flagWidth / squares;
  const squareHeight = flagHeight / (squares / 2);

  for (let row = 0; row < squares / 2; row++) {
    for (let col = 0; col < squares; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? 'white' : 'black';
      ctx.fillRect(
        x + col * squareWidth,
        y + row * squareHeight,
        squareWidth,
        squareHeight
      );
    }
  }
  // Flagpole
  ctx.fillStyle = 'darkgray';
  ctx.fillRect(x - 5, y, 5, flagHeight + 30);
}

function drawCicrularTrack(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, outer: [number, number][], inner: [number, number][]) {

  
  // Draw outer curve
  ctx.beginPath();
  ctx.moveTo(outer[0][0], outer[0][1]);
  for (let i = 0; i < points; i++) {
    const next = outer[(i + 1) % points];
    const cp = [
      (outer[i][0] + next[0]) / 2,
      (outer[i][1] + next[1]) / 2
    ];
    ctx.quadraticCurveTo(outer[i][0], outer[i][1], cp[0], cp[1]);
  }
  ctx.closePath();
  ctx.fillStyle = '#222';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  drawMedianLine(ctx, outer, inner);
  
  // Draw inner curve
  ctx.beginPath();
  ctx.moveTo(inner[0][0], inner[0][1]);
  for (let i = 0; i < points; i++) {
    const next = inner[(i + 1) % points];
    const cp = [
      (inner[i][0] + next[0]) / 2,
      (inner[i][1] + next[1]) / 2
    ];
    ctx.quadraticCurveTo(inner[i][0], inner[i][1], cp[0], cp[1]);
  }
  ctx.closePath();
  ctx.fillStyle = 'darkgreen';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  
  drawStartFinishLine(ctx, inner, outer);

  drawCheckeredFlag(ctx, inner[0][0] - 60, inner[0][1] - 60, 60, 12);
}

generatePoints("CIRCLE");
const angleOuter = Math.atan2(outer[1][1] - outer[0][1], outer[1][0] - outer[0][0]);
const angleInner = Math.atan2(inner[1][1] - inner[0][1], inner[1][0] - inner[0][0]);
const initCarAngle = (angleOuter + angleInner) / 2;

const car = new Car(inner[0][0] + trackWidth /2, inner[0][1], initCarAngle);

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
  drawMap();
  drawCicrularTrack(ctx, canvas, outer, inner);
  car.draw(ctx);
  requestAnimationFrame(draw);
}

draw();


function resetTrack(type: "CIRCLE" | "ELLIPSE") {
  outer.length = 0;
  inner.length = 0;
  generatePoints(type);
}

const select = document.getElementById('trackTypeSelect') as HTMLSelectElement;
select.addEventListener('change', () => {
  resetTrack(select.value as "CIRCLE" | "ELLIPSE");
});


</script>
<template>
  <canvas id="pidCanvas" width="800" height="600"></canvas>
</template>