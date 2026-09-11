export const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
export const smooth = (n: number) => { const t = clamp(n, 0, 1); return t * t * (3 - 2 * t); };

export class ElasticBody {
  stretch = 0;
  lift = 0;
  velocity = 0;
  liftVelocity = 0;
  target = 0;
  targetLift = 0;
  held = false;
  private restWidth = 1;

  pull(distance: number, lift: number, width: number) {
    this.held = true;
    this.restWidth = width;
    // Increasing resistance keeps very long pulls controllable.
    this.target = distance >= 0 ? width * 2.2 * (1 - Math.exp(-distance / (width * 2.2))) : Math.max(-width * .12, distance * .35);
    this.targetLift = clamp(lift * .65, -width * .5, width * .2);
  }

  release() { this.held = false; this.target = 0; this.targetLift = 0; }

  follow(speed: number, width: number) {
    if (this.held) return;
    this.restWidth = width;
    this.target = Math.min(width * .65, Math.abs(speed) * .38);
    this.targetLift = -this.target * .065;
  }

  step(seconds: number, reduced: boolean) {
    if (reduced) {
      this.stretch = this.target; this.lift = this.targetLift;
      this.velocity = this.liftVelocity = 0;
      return;
    }
    let remaining = Math.min(seconds, .05);
    while (remaining > 0) {
      const dt = Math.min(remaining, 1 / 120);
      const stiffness = this.held ? 160 : 105;
      const damping = this.held ? 24 : 11;
      this.velocity += ((this.target - this.stretch) * stiffness - this.velocity * damping) * dt;
      this.liftVelocity += ((this.targetLift - this.lift) * stiffness - this.liftVelocity * damping) * dt;
      this.stretch += this.velocity * dt;
      if (this.stretch < -this.restWidth * .16) {
        this.stretch = -this.restWidth * .16;
        this.velocity = Math.max(0, this.velocity);
      }
      this.lift += this.liftVelocity * dt;
      remaining -= dt;
    }
    if (!this.held && Math.abs(this.stretch) + Math.abs(this.lift) + Math.abs(this.velocity) + Math.abs(this.liftVelocity) < .04) {
      this.stretch = this.lift = this.velocity = this.liftVelocity = 0;
    }
  }
}

// Arrival steering gives chasing and stopping the same continuous velocity.
export class Pursuit {
  vx = 0;
  vy = 0;
  step(dx: number, dy: number, speed: number, seconds: number) {
    const distance = Math.hypot(dx, dy);
    const arrival = smooth((distance - 18) / 150);
    const gain = 1 - Math.exp(-Math.min(.05, seconds) * 5);
    this.vx += (dx / Math.max(1, distance) * speed * arrival - this.vx) * gain;
    this.vy += (dy / Math.max(1, distance) * speed * arrival * .7 - this.vy) * gain;
    return distance;
  }
  stop() { this.vx = this.vy = 0; }
}
