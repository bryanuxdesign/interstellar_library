#!/usr/bin/env python3
"""Build public/data/artemis2/trajectory.json from JPL Horizons OEM vectors.

Regenerate:
  curl Horizons Artemis II + Moon vectors into public/data/artemis2/*_raw.txt
  python3 scripts/build-artemis2-traj.py
"""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public/data/artemis2"
EARTH_R_KM = 6371.0
GLOBE_R = 2.0
LUNA_VISUAL_R = 28.0
NEAR_R = 8.0


def parse_horizons(path: Path):
    t = path.read_text(errors="replace")
    body = t.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    rows = []
    for line in body.splitlines():
        line = line.strip()
        if not line or line.startswith("$$"):
            continue
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 8:
            continue
        try:
            jd = float(parts[0])
            x, y, z = float(parts[2]), float(parts[3]), float(parts[4])
        except ValueError:
            continue
        rows.append((jd, parts[1].strip(), x, y, z))
    return rows


def icrf_to_scene(x: float, y: float, z: float):
    return (x, z, -y)


def r_earth_radii(x: float, y: float, z: float) -> float:
    return math.sqrt(x * x + y * y + z * z) / EARTH_R_KM


def to_scene(x: float, y: float, z: float, moon_er: float):
    sx, sy, sz = icrf_to_scene(x, y, z)
    r = math.sqrt(sx * sx + sy * sy + sz * sz)
    if r < 1e-6:
        return [0.0, 0.0, 0.0]
    er = r / EARTH_R_KM
    far_den = max(1e-3, moon_er - NEAR_R)
    far_scale = (LUNA_VISUAL_R - NEAR_R) / far_den
    er_c = er if er <= NEAR_R else NEAR_R + (er - NEAR_R) * far_scale
    s = (er_c * GLOBE_R) / r
    return [sx * s, sy * s, sz * s]


def main() -> None:
    orion = parse_horizons(DATA / "horizons_raw.txt")
    moon = parse_horizons(DATA / "moon_raw.txt")
    if len(orion) != len(moon):
        raise SystemExit(f"length mismatch orion={len(orion)} moon={len(moon)}")

    min_d = 1e99
    min_i = 0
    for i, (o, m) in enumerate(zip(orion, moon)):
        d = math.dist(o[2:5], m[2:5])
        if d < min_d:
            min_d, min_i = d, i

    o_pts, m_pts, times = [], [], []
    for o, m in zip(orion, moon):
        mer = r_earth_radii(m[2], m[3], m[4])
        o_pts.append(to_scene(o[2], o[3], o[4], mer))
        m_pts.append(to_scene(m[2], m[3], m[4], mer))
        times.append(o[0])

    cum = [0.0]
    for i in range(1, len(o_pts)):
        cum.append(cum[-1] + math.dist(o_pts[i], o_pts[i - 1]))

    out = {
        "source": "NASA/JPL Horizons Artemis II (-1024), Earth-centered ICRF vectors",
        "note": "Starts after ICPS separation. Radial compression maps lunar distance to archive Luna SMA (28 R⊕).",
        "earthRadiusKm": EARTH_R_KM,
        "globeRadius": GLOBE_R,
        "lunaVisualEarthRadii": LUNA_VISUAL_R,
        "nearLinearEarthRadii": NEAR_R,
        "closestApproachIndex": min_i,
        "closestApproachKm": min_d,
        "jdtdb": times,
        "orion": o_pts,
        "moon": m_pts,
        "arcLength": cum,
    }
    path = DATA / "trajectory.json"
    path.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {path} ({path.stat().st_size} bytes), samples={len(o_pts)}, CA={min_d:.1f} km")


if __name__ == "__main__":
    main()
