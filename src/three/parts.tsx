import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { BrandConfig, ColorDef, HandleDef } from '../config/types';
import type { Rect } from '../configurator/layout';
import { noiseTexture, woodTexture } from './textures';

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Csillapított érték (rugózás nélkül). A demand-renderelésnél maga kér új képkockát. */
export function useDamped(target: number, lambda = 9, eps = 0.25) {
  const [v, setV] = useState(target);
  const ref = useRef(target);
  const invalidate = useThree((s) => s.invalidate);
  const reduced = useMemo(prefersReducedMotion, []);
  useEffect(() => {
    if (reduced) {
      ref.current = target;
      setV(target);
    }
    invalidate();
  }, [target, reduced, invalidate]);
  useFrame((_, dt) => {
    const cur = ref.current;
    if (cur === target) return;
    if (Math.abs(cur - target) < eps) {
      ref.current = target;
      setV(target);
      invalidate();
      return;
    }
    ref.current = THREE.MathUtils.damp(cur, target, lambda, Math.min(dt, 1 / 30));
    setV(ref.current);
    invalidate();
  });
  return v;
}

/* ---------- anyagok ---------- */

export interface FrameMats {
  outV: THREE.MeshPhysicalMaterial;
  outH: THREE.MeshPhysicalMaterial;
  inV: THREE.MeshPhysicalMaterial;
  inH: THREE.MeshPhysicalMaterial;
}

function makeFrameMat() {
  return new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.35, envMapIntensity: 1 });
}

function configure(m: THREE.MeshPhysicalMaterial, c: ColorDef, vertical: boolean) {
  const wood = c.kind === 'wood' && c.grain;
  const prevMap = m.map;
  m.map = wood ? woodTexture(c.grain![0], c.grain![1], vertical) : null;
  if (m.map) m.map.repeat.set(1 / 700, 1 / 700);
  m.bumpMap = c.kind === 'textured' || wood ? noiseTexture(256, 11, 0.6) : null;
  if (m.bumpMap) m.bumpMap.repeat.set(1 / 90, 1 / 90);
  m.bumpScale = c.kind === 'textured' ? 0.9 : 0.35;
  m.roughness = c.roughness;
  m.clearcoat = c.kind === 'smooth' ? 0.35 : c.kind === 'wood' ? 0.15 : 0.05;
  if (prevMap !== m.map) m.needsUpdate = true;
  return wood ? new THREE.Color('#ffffff') : new THREE.Color(c.base);
}

/** Keretanyagok: kívül/belül, függőleges/vízszintes (faerezet iránya). Szín csillapítva vált. */
export function useFrameMaterials(brand: BrandConfig, colorId: string, outsideOnly: boolean): FrameMats {
  const mats = useMemo(() => ({ outV: makeFrameMat(), outH: makeFrameMat(), inV: makeFrameMat(), inH: makeFrameMat() }), []);
  const targets = useRef<Record<keyof FrameMats, THREE.Color>>({ outV: new THREE.Color(), outH: new THREE.Color(), inV: new THREE.Color(), inH: new THREE.Color() });
  const invalidate = useThree((s) => s.invalidate);
  const first = useRef(true);
  useEffect(() => {
    const c = brand.colors.find((x) => x.id === colorId) ?? brand.colors[0];
    const white = brand.colors.find((x) => x.kind === 'smooth') ?? c;
    const inner = outsideOnly ? white : c;
    targets.current.outV = configure(mats.outV, c, true);
    targets.current.outH = configure(mats.outH, c, false);
    targets.current.inV = configure(mats.inV, inner, true);
    targets.current.inH = configure(mats.inH, inner, false);
    if (first.current || prefersReducedMotion()) {
      (Object.keys(mats) as (keyof FrameMats)[]).forEach((k) => mats[k].color.copy(targets.current[k]));
      first.current = false;
    }
    invalidate();
  }, [brand, colorId, outsideOnly, mats, invalidate]);
  useFrame((_, dt) => {
    let moving = false;
    (Object.keys(mats) as (keyof FrameMats)[]).forEach((k) => {
      const m = mats[k];
      const t = targets.current[k];
      const d = Math.abs(m.color.r - t.r) + Math.abs(m.color.g - t.g) + Math.abs(m.color.b - t.b);
      if (d > 0.002) {
        m.color.lerp(t, 1 - Math.exp(-8 * Math.min(dt, 1 / 30)));
        moving = true;
      }
    });
    if (moving) invalidate();
  });
  return mats;
}

export function useHandleMaterial(h: HandleDef) {
  const m = useMemo(() => new THREE.MeshPhysicalMaterial({ clearcoat: 0.4, clearcoatRoughness: 0.2 }), []);
  useEffect(() => {
    m.color.set(h.base);
    m.metalness = h.metalness;
    m.roughness = h.roughness;
  }, [h, m]);
  return m;
}

export const staticMats = {
  gasket: new THREE.MeshStandardMaterial({ color: '#2b2e30', roughness: 0.85 }),
  fuga: new THREE.MeshStandardMaterial({ color: '#3b3d3c', roughness: 0.95 }),
  alu: new THREE.MeshStandardMaterial({ color: '#a3a8ab', metalness: 0.75, roughness: 0.38 }),
  steel: new THREE.MeshStandardMaterial({ color: '#b9bec1', metalness: 1, roughness: 0.22 }),
  dark: new THREE.MeshStandardMaterial({ color: '#202426', roughness: 0.6 }),
};

export function useGlass(frosted = false, dim = false) {
  const m = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: frosted ? 0.42 : 0.015,
        transmission: 1,
        thickness: 44,
        ior: 1.5,
        // háromrétegű üveg enyhén zöldes tónusa
        attenuationColor: new THREE.Color('#a9c6bc'),
        attenuationDistance: 0.3,
        specularIntensity: 1,
        clearcoat: 1,
        clearcoatRoughness: frosted ? 0.4 : 0.02,
        envMapIntensity: 2.4,
      }),
    [frosted],
  );
  // szúnyogháló mögött az üveg sötétebbnek látszik
  useEffect(() => {
    m.color.set(dim ? '#9a9e9c' : '#ffffff');
  }, [m, dim]);
  return m;
}

/* ---------- geometria (mm) ---------- */

type Pt = [number, number];

export function useExtrude(pts: Pt[], depth: number, bevel: number, holes: Pt[][] = []) {
  const key = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(';') + '|' + holes.map((h) => h.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(';')).join('/') + `|${depth.toFixed(1)}|${bevel}`;
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    holes.forEach((h) => {
      const p = new THREE.Path();
      h.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
      p.closePath();
      s.holes.push(p);
    });
    const b = Math.max(0, Math.min(bevel, depth / 2 - 0.2));
    const g = new THREE.ExtrudeGeometry(s, {
      depth: Math.max(0.1, depth - 2 * b),
      bevelEnabled: b > 0.05,
      bevelThickness: b,
      bevelSize: b,
      bevelOffset: -b,
      bevelSegments: 2,
      curveSegments: 1,
    });
    g.translate(0, 0, b);
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

interface ExtrudedProps {
  pts: Pt[];
  z0: number;
  z1: number;
  bevel: number;
  material: THREE.Material;
  holes?: Pt[][];
  cast?: boolean;
}

export function Extruded({ pts, z0, z1, bevel, material, holes, cast = true }: ExtrudedProps) {
  const geo = useExtrude(pts, z1 - z0, bevel, holes);
  return <mesh geometry={geo} material={material} position-z={z0} castShadow={cast} receiveShadow />;
}

/** Egy tag kívül/belül eltérő anyaggal (pl. kívül fa-dekor, belül fehér). */
export function Member({ pts, z0, z1, bevel, outMat, inMat, holes }: { pts: Pt[]; z0: number; z1: number; bevel: number; outMat: THREE.Material; inMat: THREE.Material; holes?: Pt[][] }) {
  if (outMat === inMat) return <Extruded pts={pts} z0={z0} z1={z1} bevel={bevel} material={outMat} holes={holes} />;
  const zm = (z0 + z1) / 2;
  return (
    <>
      <Extruded pts={pts} z0={z0} z1={zm} bevel={bevel} material={outMat} holes={holes} />
      <Extruded pts={pts} z0={zm} z1={z1} bevel={bevel} material={inMat} holes={holes} />
    </>
  );
}

export const rectPts = (r: Rect): Pt[] => [
  [r.x, r.y],
  [r.x + r.w, r.y],
  [r.x + r.w, r.y + r.h],
  [r.x, r.y + r.h],
];

/** Gérbe vágott keret négy tagból (a sarkokban valódi gérvonal). */
export function MiterRing({ r, l, b, rt, t, z0, z1, bevel, mats, bottomMat }: { r: Rect; l: number; b: number; rt: number; t: number; z0: number; z1: number; bevel: number; mats: FrameMats; bottomMat?: THREE.Material }) {
  const x0 = r.x;
  const y0 = r.y;
  const x1 = r.x + r.w;
  const y1 = r.y + r.h;
  const bottom: Pt[] = [
    [x0, y0],
    [x1, y0],
    [x1 - rt, y0 + b],
    [x0 + l, y0 + b],
  ];
  const top: Pt[] = [
    [x0, y1],
    [x0 + l, y1 - t],
    [x1 - rt, y1 - t],
    [x1, y1],
  ];
  const left: Pt[] = [
    [x0, y0],
    [x0 + l, y0 + b],
    [x0 + l, y1 - t],
    [x0, y1],
  ];
  const right: Pt[] = [
    [x1, y0],
    [x1, y1],
    [x1 - rt, y1 - t],
    [x1 - rt, y0 + b],
  ];
  return (
    <>
      {bottomMat ? <Extruded pts={bottom} z0={z0} z1={z1} bevel={bevel} material={bottomMat} /> : <Member pts={bottom} z0={z0} z1={z1} bevel={bevel} outMat={mats.outH} inMat={mats.inH} />}
      <Member pts={top} z0={z0} z1={z1} bevel={bevel} outMat={mats.outH} inMat={mats.inH} />
      <Member pts={left} z0={z0} z1={z1} bevel={bevel} outMat={mats.outV} inMat={mats.inV} />
      <Member pts={right} z0={z0} z1={z1} bevel={bevel} outMat={mats.outV} inMat={mats.inV} />
    </>
  );
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);

/** Tengelyhez igazított doboz két sarokpontból (mm). */
export function Box({ min, max, material, cast = true, receive = true }: { min: [number, number, number]; max: [number, number, number]; material: THREE.Material; cast?: boolean; receive?: boolean }) {
  const sx = max[0] - min[0];
  const sy = max[1] - min[1];
  const sz = max[2] - min[2];
  if (sx <= 0.01 || sy <= 0.01 || sz <= 0.01) return null;
  return (
    <mesh
      geometry={unitBox}
      material={material}
      position={[(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]}
      scale={[sx, sy, sz]}
      castShadow={cast}
      receiveShadow={receive}
    />
  );
}
