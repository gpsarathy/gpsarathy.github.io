export function mulberry32(a: number) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Point = [number, number];

export interface GenerateParams {
  centerX: number;
  centerY: number;
  baseRadius: number;
  trackWidth: number;
  points: number;
  angleStep: number;
  rng: () => number;
}

export function generatePoints(type: 'CIRCLE' | 'ELLIPSE' | 'DUMBBELL', params: GenerateParams): { outer: Point[]; inner: Point[] } {
  switch (type) {
    case 'CIRCLE':
      return generateCirclePoints(params);
    case 'ELLIPSE':
      return generateEllipsePoints(params);
    default:
      return generateCirclePoints(params);
  }
}

function generateCirclePoints({ centerX, centerY, baseRadius, trackWidth, points, angleStep, rng }: GenerateParams) {
  const outer: Point[] = [];
  const inner: Point[] = [];
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const radiusOffset = rng() * 100 - 20;
    const rOuter = baseRadius + radiusOffset;
    const rInner = rOuter - trackWidth;
    outer.push([centerX + rOuter * Math.cos(angle), centerY + rOuter * Math.sin(angle)]);
    inner.push([centerX + rInner * Math.cos(angle), centerY + rInner * Math.sin(angle)]);
  }
  return { outer, inner };
}

function generateEllipsePoints({ centerX, centerY, baseRadius, trackWidth, points, angleStep, rng }: GenerateParams) {
  const outer: Point[] = [];
  const inner: Point[] = [];
  const ellipseA = baseRadius + 40;
  const ellipseB = baseRadius - 40;
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    const aOffset = rng() * 60 - 20;
    const bOffset = rng() * 60 - 20;
    const rOuterA = ellipseA + aOffset;
    const rOuterB = ellipseB + bOffset;
    const rInnerA = rOuterA - trackWidth;
    const rInnerB = rOuterB - trackWidth;
    outer.push([centerX + rOuterA * Math.cos(angle), centerY + rOuterB * Math.sin(angle)]);
    inner.push([centerX + rInnerA * Math.cos(angle), centerY + rInnerB * Math.sin(angle)]);
  }
  return { outer, inner };
}

// --- Drawing helpers ---
export function drawMap(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'darkgreen';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawMedianLine(
  ctx: CanvasRenderingContext2D,
  outer: Point[],
  inner: Point[],
  points: number
) {
  ctx.save();
  ctx.beginPath();

  const midpoints: Point[] = [];
  for (let i = 0; i < points; i++) {
    midpoints.push([(outer[i][0] + inner[i][0]) / 2, (outer[i][1] + inner[i][1]) / 2]);
  }

  ctx.moveTo(midpoints[0][0], midpoints[0][1]);
  for (let i = 0; i < points; i++) {
    const next = midpoints[(i + 1) % points];
    const cp = [(midpoints[i][0] + next[0]) / 2, (midpoints[i][1] + next[1]) / 2];
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

export function drawCheckeredFlag(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, squares: number) {
  const flagWidth = size;
  const flagHeight = size / 2;
  const squareWidth = flagWidth / squares;
  const squareHeight = flagHeight / (squares / 2);

  for (let row = 0; row < squares / 2; row++) {
    for (let col = 0; col < squares; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? 'white' : 'black';
      ctx.fillRect(x + col * squareWidth, y + row * squareHeight, squareWidth, squareHeight);
    }
  }
  ctx.fillStyle = 'darkgray';
  ctx.fillRect(x - 5, y, 5, flagHeight + 30);
}

export function drawStartFinishLine(ctx: CanvasRenderingContext2D, inner: Point[], outer: Point[]) {
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

export function drawCircularTrack(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, outer: Point[], inner: Point[], points: number) {
  // outer
  ctx.beginPath();
  ctx.moveTo(outer[0][0], outer[0][1]);
  for (let i = 0; i < points; i++) {
    const next = outer[(i + 1) % points];
    const cp = [(outer[i][0] + next[0]) / 2, (outer[i][1] + next[1]) / 2];
    ctx.quadraticCurveTo(outer[i][0], outer[i][1], cp[0], cp[1]);
  }
  ctx.closePath();
  ctx.fillStyle = '#222';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  drawMedianLine(ctx, outer, inner, points);

  // inner
  ctx.beginPath();
  ctx.moveTo(inner[0][0], inner[0][1]);
  for (let i = 0; i < points; i++) {
    const next = inner[(i + 1) % points];
    const cp = [(inner[i][0] + next[0]) / 2, (inner[i][1] + next[1]) / 2];
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

export function drawCurvedTrackJagged(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, outer: Point[], inner: Point[], points: number) {
  ctx.beginPath();
  ctx.moveTo(outer[0][0], outer[0][1]);
  for (let i = 1; i < points; i++) {
    ctx.lineTo(outer[i][0], outer[i][1]);
  }
  ctx.closePath();
  drawMedianLine(ctx, outer, inner, points);
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
