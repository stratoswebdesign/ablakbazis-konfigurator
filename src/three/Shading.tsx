import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ShutterType } from '../config/types';
import type { UnitLayout } from '../configurator/layout';
import { Box, Member, rectPts, type FrameMats } from './parts';
import { ZC } from './WindowUnit';

const PITCH = 37;
const BAR = 46;
const RAIL = 26;

function lamellaGeometry() {
  const s = new THREE.Shape();
  // lekerekített lamellaprofil (z–y metszet), extrudálva x irányban 1 mm-re
  const h = PITCH - 1;
  const d = 9;
  const r = 3.5;
  s.moveTo(-d / 2 + r, -h / 2);
  s.lineTo(d / 2 - r, -h / 2);
  s.quadraticCurveTo(d / 2, -h / 2, d / 2, -h / 2 + r);
  s.quadraticCurveTo(d / 2 + 2.5, 0, d / 2, h / 2 - r);
  s.quadraticCurveTo(d / 2, h / 2, d / 2 - r, h / 2);
  s.lineTo(-d / 2 + r, h / 2);
  s.quadraticCurveTo(-d / 2, h / 2, -d / 2, h / 2 - r);
  s.lineTo(-d / 2, -h / 2 + r);
  s.quadraticCurveTo(-d / 2, -h / 2, -d / 2 + r, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 4 });
  g.rotateY(Math.PI / 2); // extrudálás iránya: x
  return g;
}

/** A redőny elhelyezése típusonként (a tok helyi koordinátáiban, mm). */
function shutterGeom(type: Exclude<ShutterType, 'none'>, L: UnitLayout, box: number) {
  const { W, H, P } = L;
  const fo = ZC - P.frameDepth / 2;
  const J = 12; // beépítési fuga: a káva felülete a tok szélétől
  if (type === 'raepitheto') {
    // tok a nyílászáró tetején, a nyílásban
    return { x0: 0, x1: W, top: H, bottom: 0, zl: fo - 40, box: { x0: 0, x1: W, y0: H, y1: H + box, z0: fo - 92, z1: ZC + P.frameDepth / 2 + 4 }, slot: false };
  }
  if (type === 'vakolhato') {
    // a tok a homlokzatba takarva (nem látszik), a sínek a külső kávában
    return { x0: -J, x1: W + J, top: H + J, bottom: 0, zl: fo - 40, box: null, slot: true };
  }
  // külső tokos: tok és sínek a homlokzat síkja előtt
  const zf = -220; // homlokzati sík (lásd Wall)
  return { x0: -J - RAIL, x1: W + J + RAIL, top: H + J + 18, bottom: -30, zl: zf - 34, box: { x0: -J - RAIL - 14, x1: W + J + RAIL + 14, y0: H + J + 18, y1: H + J + 18 + box, z0: zf - box, z1: zf }, slot: false };
}

export function Shutter({ L, type, box, p, mats }: { L: UnitLayout; type: ShutterType; box: number; p: number; mats: FrameMats }) {
  const geo = useMemo(lamellaGeometry, []);
  const inst = useRef<THREE.InstancedMesh>(null!);
  const max = Math.ceil(3200 / PITCH);
  const g = type === 'none' ? null : shutterGeom(type, L, box);
  const top = g?.top ?? 0;
  const bottom = g?.bottom ?? 0;
  const cx0 = (g?.x0 ?? 0) + RAIL;
  const cx1 = (g?.x1 ?? 0) - RAIL;
  const zl = g?.zl ?? 0;
  const yc = top - BAR - p * (top - bottom - BAR); // a záróléc alja
  const count = Math.max(0, Math.floor((top - yc - BAR) / PITCH));
  useLayoutEffect(() => {
    if (!inst.current) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      m.compose(new THREE.Vector3(cx0, yc + BAR + (i + 0.5) * PITCH, zl), q, new THREE.Vector3(cx1 - cx0, 1, 1));
      inst.current.setMatrixAt(i, m);
    }
    inst.current.count = count;
    inst.current.instanceMatrix.needsUpdate = true;
    inst.current.computeBoundingSphere();
  }, [count, yc, cx0, cx1, zl]);
  if (!g) return null;
  return (
    <group>
      {/* redőnytok */}
      {g.box && <Member pts={rectPts({ x: g.box.x0, y: g.box.y0, w: g.box.x1 - g.box.x0, h: g.box.y1 - g.box.y0 })} z0={g.box.z0} z1={g.box.z1} bevel={2} outMat={mats.outH} inMat={type === 'raepitheto' ? mats.inH : mats.outH} />}
      {/* vakolható: csak a tok kifutórése látszik a káva tetején */}
      {g.slot && <Box min={[g.x0, top - 3, zl - 22]} max={[g.x1, top + 1, zl + 22]} material={mats.outH} cast={false} />}
      {/* vezetősínek */}
      <Box min={[g.x0, bottom, zl - 17]} max={[g.x0 + RAIL, top, zl + 17]} material={mats.outV} />
      <Box min={[g.x1 - RAIL, bottom, zl - 17]} max={[g.x1, top, zl + 17]} material={mats.outV} />
      {/* lamellák (37 mm-es léc) */}
      <instancedMesh ref={inst} args={[geo, mats.outH, max]} castShadow receiveShadow frustumCulled={false} />
      {/* záróléc */}
      <Box min={[cx0, yc, zl - 8]} max={[cx1, yc + BAR, zl + 8]} material={mats.outH} />
    </group>
  );
}

export function Screen({ L, mats }: { L: UnitLayout; mats: FrameMats }) {
  const { W, H, P } = L;
  const fo = ZC - P.frameDepth / 2;
  const r = { x: P.frameFace - 18, y: L.bottomFace - (L.threshold ? 0 : 18), w: W - 2 * P.frameFace + 36, h: H - P.frameFace - L.bottomFace + (L.threshold ? 18 : 36) };
  const face = 22;
  // kívülről áttetsző háló; belülről az üveg sötétebb tónusa jelzi (lásd useGlass `dim`)
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2d2f', roughness: 0.95, transparent: true, opacity: 0.46, depthWrite: false, side: THREE.DoubleSide }), []);
  const inner = { x: r.x + face, y: r.y + face, w: r.w - 2 * face, h: r.h - 2 * face };
  return (
    <group>
      <Member pts={rectPts(r)} holes={[rectPts(inner)]} z0={fo - 18} z1={fo - 4} bevel={1.5} outMat={mats.outV} inMat={mats.outV} />
      <mesh position={[inner.x + inner.w / 2, inner.y + inner.h / 2, fo - 11]} material={mat} renderOrder={3}>
        <planeGeometry args={[inner.w, inner.h]} />
      </mesh>
    </group>
  );
}
