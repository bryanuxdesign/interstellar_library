/**
 * Simplified Sun + 8-planet velocity Verlet n-body (AU, days, M☉).
 * Moons stay Keplerian around their parents — not integrated here.
 */

import * as THREE from 'three';
import {
  G_AU,
  NBODY_PLANET_IDS,
  PLANET_ELEMENTS,
  auToScene,
  daysSinceJ2000,
  keplerPositionAu,
  keplerVelocityAuPerDay,
  type NBodyPlanetId,
} from '@/solar/ephemeris';

export const SIM_SPAN_YEARS = 10;
export const DAYS_PER_YEAR = 365.25;

interface BodyState {
  id: NBodyPlanetId;
  mass: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ax: number;
  ay: number;
  az: number;
}

export class NBodySim {
  private bodies: BodyState[] = [];
  private sunMass = 1;
  /** Softening length² (AU²) — prevents close-encounter spikes. */
  private soft2 = 1e-8;
  /** Days integrated from the live epoch. */
  private tDays = 0;
  private scratch = new THREE.Vector3();

  /** Seed from Keplerian state at `epoch`. */
  resetFromEpoch(epoch: Date) {
    const days = daysSinceJ2000(epoch);
    this.tDays = 0;
    this.bodies = NBODY_PLANET_IDS.map((id) => {
      const el = PLANET_ELEMENTS[id];
      const p = keplerPositionAu(el, days);
      const v = keplerVelocityAuPerDay(el, days);
      return {
        id,
        mass: el.mass,
        x: p.x,
        y: p.y,
        z: p.z,
        vx: v.x,
        vy: v.y,
        vz: v.z,
        ax: 0,
        ay: 0,
        az: 0,
      };
    });
    this.computeAccels();
  }

  get daysElapsed() {
    return this.tDays;
  }

  get yearsElapsed() {
    return this.tDays / DAYS_PER_YEAR;
  }

  private computeAccels() {
    const bodies = this.bodies;
    const n = bodies.length;
    for (let i = 0; i < n; i++) {
      bodies[i].ax = 0;
      bodies[i].ay = 0;
      bodies[i].az = 0;
    }
    // Sun gravity
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      const r2 = b.x * b.x + b.y * b.y + b.z * b.z + this.soft2;
      const invR = 1 / Math.sqrt(r2);
      const invR3 = invR * invR * invR;
      const f = -G_AU * this.sunMass * invR3;
      b.ax += f * b.x;
      b.ay += f * b.y;
      b.az += f * b.z;
    }
    // Planet–planet
    for (let i = 0; i < n; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < n; j++) {
        const b = bodies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const r2 = dx * dx + dy * dy + dz * dz + this.soft2;
        const invR = 1 / Math.sqrt(r2);
        const invR3 = invR * invR * invR;
        const fA = G_AU * b.mass * invR3;
        const fB = G_AU * a.mass * invR3;
        a.ax += fA * dx;
        a.ay += fA * dy;
        a.az += fA * dz;
        b.ax -= fB * dx;
        b.ay -= fB * dy;
        b.az -= fB * dz;
      }
    }
  }

  /** Single velocity-Verlet step (dt in days). */
  step(dt: number) {
    const bodies = this.bodies;
    const half = 0.5 * dt;
    for (const b of bodies) {
      b.vx += b.ax * half;
      b.vy += b.ay * half;
      b.vz += b.az * half;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
    }
    this.computeAccels();
    for (const b of bodies) {
      b.vx += b.ax * half;
      b.vy += b.ay * half;
      b.vz += b.az * half;
    }
    this.tDays += dt;
  }

  /**
   * Advance to `targetYears` from epoch (0…SIM_SPAN_YEARS).
   * Rewinds by full re-seed when going backward.
   */
  advanceToYears(targetYears: number, epoch: Date) {
    const target = Math.max(0, Math.min(SIM_SPAN_YEARS, targetYears));
    const targetDays = target * DAYS_PER_YEAR;
    if (targetDays + 1e-6 < this.tDays || this.bodies.length === 0) {
      this.resetFromEpoch(epoch);
    }
    // Adaptive dt: finer near Mercury, coarser outer — fixed soft step is fine for v1.
    const dt = 0.5; // half-day steps
    let guard = 0;
    const maxSteps = Math.ceil((SIM_SPAN_YEARS * DAYS_PER_YEAR) / dt) + 8;
    while (this.tDays + dt * 0.5 < targetDays && guard++ < maxSteps) {
      const remain = targetDays - this.tDays;
      this.step(Math.min(dt, remain));
    }
  }

  /** Scene-space position for a planet (compressed AU). */
  writeScenePosition(id: string, out: THREE.Vector3): boolean {
    const b = this.bodies.find((x) => x.id === id);
    if (!b) return false;
    this.scratch.set(b.x, b.y, b.z);
    const au = this.scratch.length();
    if (au < 1e-9) {
      out.set(0, 0, 0);
      return true;
    }
    out.copy(this.scratch).multiplyScalar(auToScene(au) / au);
    return true;
  }

  planetCount() {
    return this.bodies.length;
  }
}
