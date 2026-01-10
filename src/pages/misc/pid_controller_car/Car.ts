export class Car {
  x: number;
  y: number;
  angle: number; // in radians
  speed: number; // pixels per frame
  length: number = 40;
  width: number = 20;
  // simple tuning parameters
  maxSpeed: number = 8;
  accel: number = 0.25;
  steeringRate: number = 0.04; // radians per frame for full steer input
  friction: number = 0.98;
  private pendingSteering: number = 0;

  constructor(x: number, y: number, angle: number = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 2;
  }

  // update position and heading. If steeringAngle is provided it is used,
  // otherwise any pending steering set via applySteering() is consumed.
  update(steeringAngle?: number) {
    const sa = typeof steeringAngle === 'number' ? steeringAngle : this.pendingSteering;
    this.angle += sa;
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
    this.pendingSteering = 0;
  }

  // Set an absolute speed value (clamped)
  setSpeed(v: number) {
    this.speed = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, v));
  }

  // amount in range [-1, 1]; positive accelerates forward, negative brakes/reverses
  applyThrottle(amount: number) {
    if (!amount) {
      // natural friction when no throttle
      this.speed *= this.friction;
    } else {
      this.speed += amount * this.accel;
    }
    // clamp speed
    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    if (this.speed < -this.maxSpeed) this.speed = -this.maxSpeed;
  }

  // direction in [-1, 1] where -1 = full left, +1 = full right
  applySteering(direction: number) {
    this.pendingSteering = direction * this.steeringRate;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = 'red';
    ctx.fillRect(-this.length / 2, -this.width / 2, this.length, this.width); // Simple rectangle as car
    // draw square headlights
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.length / 2 - 5, -this.width / 2 + 1, 5, 5);
    ctx.fillRect(this.length / 2 - 5, this.width / 2 - 6, 5, 5);
    // draw square taillights
    ctx.fillStyle = 'darkred';
    ctx.fillRect(-this.length / 2, -this.width / 2 + 2, 5, 5);
    ctx.fillRect(-this.length / 2, this.width / 2 - 7, 5, 5);
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