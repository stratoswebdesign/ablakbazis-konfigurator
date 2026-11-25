import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { ProductDef, ViewSide } from '../config/types';
import type { FieldLayout, UnitLayout } from '../configurator/layout';
import { openingSymbols } from '../configurator/layout';
import { Box, Extruded, Member, MiterRing, prefersReducedMotion, rectPts, staticMats, useGlass, type FrameMats } from './parts';

/** A tok középsíkja a falban (mm, a fal középsíkjához képest; + = belső oldal). */
export const ZC = -70;

interface UnitProps {
  product: ProductDef;
  L: UnitLayout;
  mats: FrameMats;
  handleMat: THREE.Material;
  view: ViewSide;
  symbols: boolean;
  symbolColor: string;
  demo: number;
  demoField: number;
  screen: boolean;
}

export function WindowUnit({ product, L, mats, handleMat, view, symbols, symbolColor, demo, demoField, screen }: UnitProps) {
  const P = L.P;
  const z0 = ZC - P.frameDepth / 2;
  const z1 = ZC + P.frameDepth / 2;
  const glass = useGlass(false, screen);
  const frosted = useGlass(true);

  return (
    <group>
      {/* tok */}
      <MiterRing
        r={{ x: 0, y: 0, w: L.W, h: L.H }}
        l={P.frameFace}
        rt={P.frameFace}
        t={P.frameFace}
        b={L.bottomFace}
        z0={z0}
        z1={z1}
        bevel={P.bevel}
        mats={mats}
        bottomMat={L.threshold ? staticMats.alu : undefined}
      />
      {/* osztók */}
      {L.mullions.map((m, i) => (
        <Member key={`m${i}`} pts={rectPts(m)} z0={z0} z1={z1 - 2} bevel={P.bevel} outMat={mats.outV} inMat={mats.inV} />
      ))}
      {L.fields.map((f) => (
        <FieldMount key={`${f.index}-${f.spec.type}-${L.fields.length}`}>
          {f.sash ? (
            <Sash f={f} L={L} mats={mats} glass={glass} handleMat={handleMat} view={view} symbols={symbols} symbolColor={symbolColor} demo={demo} active={demoField === f.index} product={product} />
          ) : f.door ? (
            <DoorLeaf f={f} L={L} mats={mats} glass={frosted} handleMat={handleMat} view={view} symbols={symbols} symbolColor={symbolColor} demo={demo} active={demoField === f.index} />
          ) : (
            <FixedGlass f={f} L={L} mats={mats} glass={f.spec.type === 'oldalvilagito' ? frosted : glass} />
          )}
        </FieldMount>
      ))}
    </group>
  );
}

/** Új mező beúszása a tokba (mintha beemelnék). */
function FieldMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const z = useRef(prefersReducedMotion() ? 0 : 90);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [invalidate]);
  useFrame((_, dt) => {
    if (z.current === 0) return;
    z.current = THREE.MathUtils.damp(z.current, 0, 7, Math.min(dt, 1 / 30));
    if (z.current < 0.3) z.current = 0;
    ref.current.position.z = z.current;
    invalidate();
  });
  return (
    <group ref={ref} position-z={z.current}>
      {children}
    </group>
  );
}

function Pane({ r, z, material, grow = 10 }: { r: { x: number; y: number; w: number; h: number }; z: number; material: THREE.Material; grow?: number }) {
  return (
    <mesh position={[r.x + r.w / 2, r.y + r.h / 2, z]} material={material} renderOrder={2}>
      <boxGeometry args={[r.w + grow * 2, r.h + grow * 2, 24]} />
    </mesh>
  );
}

function FixedGlass({ f, L, mats, glass }: { f: FieldLayout; L: UnitLayout; mats: FrameMats; glass: THREE.Material }) {
  const P = L.P;
  const a = f.area;
  const zi = ZC + P.frameDepth / 2;
  return (
    <group>
      <Pane r={a} z={ZC} material={glass} grow={8} />
      {/* üvegléc (belül) + tömítés */}
      <MiterRing r={a} l={P.bead} b={P.bead} rt={P.bead} t={P.bead} z0={ZC + 13} z1={zi - 3} bevel={Math.min(P.bevel, 2)} mats={{ ...mats, outV: mats.inV, outH: mats.inH }} />
      <Gasket r={{ x: a.x + P.bead, y: a.y + P.bead, w: a.w - 2 * P.bead, h: a.h - 2 * P.bead }} z0={ZC + 12} z1={ZC + 16} />
      <Gasket r={a} z0={ZC - P.frameDepth / 2 + 6} z1={ZC - 12} w={5} />
    </group>
  );
}

function Gasket({ r, z0, z1, w = 3 }: { r: { x: number; y: number; w: number; h: number }; z0: number; z1: number; w?: number }) {
  return (
    <>
      <Box min={[r.x, r.y, z0]} max={[r.x + r.w, r.y + w, z1]} material={staticMats.gasket} cast={false} />
      <Box min={[r.x, r.y + r.h - w, z0]} max={[r.x + r.w, r.y + r.h, z1]} material={staticMats.gasket} cast={false} />
      <Box min={[r.x, r.y, z0]} max={[r.x + w, r.y + r.h, z1]} material={staticMats.gasket} cast={false} />
      <Box min={[r.x + r.w - w, r.y, z0]} max={[r.x + r.w, r.y + r.h, z1]} material={staticMats.gasket} cast={false} />
    </>
  );
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function seg(t: number, a: number, b: number) {
  return ease(THREE.MathUtils.clamp((t - a) / (b - a), 0, 1));
}

/** Nyitásbemutató idővonal: [kilincs, bukó, nyíló] szögek. */
function demoPose(type: string, t: number, side: 'left' | 'right'): [number, number, number, boolean] {
  const s = side === 'right' ? -1 : 1; // kilincs forgásiránya
  if (type === 'bukonyilo') {
    const hUp = seg(t, 0, 0.35) - seg(t, 1.9, 2.25) * 0.5 - seg(t, 4.6, 4.9) * 0.5;
    const tilt = seg(t, 0.35, 1.15) - seg(t, 1.6, 2.3);
    const turn = seg(t, 2.4, 3.4) - seg(t, 3.9, 4.6);
    return [hUp * Math.PI * s, tilt * 0.17, turn * 0.62, t < 5.1];
  }
  if (type === 'nyilo') {
    const h = seg(t, 0, 0.3) - seg(t, 2.6, 2.9);
    const turn = seg(t, 0.3, 1.3) - seg(t, 1.8, 2.6);
    return [h * Math.PI * 0.5 * s, 0, turn * 0.62, t < 3.0];
  }
  // ajtó: kilincs lenyomása, nyitás
  const press = seg(t, 0, 0.25) - seg(t, 0.55, 0.8);
  const turn = seg(t, 0.25, 1.35) - seg(t, 1.95, 3.0);
  return [press * -0.55 * s, 0, turn * 0.55, t < 3.1];
}

function useDemo(demo: number, active: boolean, type: string, side: 'left' | 'right') {
  const start = useRef<number | null>(null);
  const pose = useRef<[number, number, number]>([0, 0, 0]);
  const clock = useThree((s) => s.clock);
  const invalidate = useThree((s) => s.invalidate);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!active || prefersReducedMotion()) return;
    start.current = clock.getElapsedTime();
    invalidate();
  }, [demo, active, clock, invalidate]);
  useFrame(() => {
    if (start.current === null) return;
    const t = clock.getElapsedTime() - start.current;
    const [h, tilt, turn, running] = demoPose(type, t, side);
    pose.current = [h, tilt, turn];
    if (!running) {
      start.current = null;
      pose.current = [0, 0, 0];
    }
    invalidate();
  });
  return pose;
}

interface SashProps {
  f: FieldLayout;
  L: UnitLayout;
  mats: FrameMats;
  glass: THREE.Material;
  handleMat: THREE.Material;
  view: ViewSide;
  symbols: boolean;
  symbolColor: string;
  demo: number;
  active: boolean;
  product?: ProductDef;
}

function Sash({ f, L, mats, glass, handleMat, view, symbols, symbolColor, demo, active, product }: SashProps) {
  const P = L.P;
  const s = f.sash!;
  const zs0 = ZC - 28;
  const zs1 = ZC + P.frameDepth / 2 + P.sashProud;
  const bottom = product?.kind === 'balcony' ? 112 : P.sashBottom;
  const inner = { x: s.x + P.sashFace, y: s.y + bottom, w: s.w - 2 * P.sashFace, h: s.h - bottom - P.sashFace };
  const zg = (zs0 + zs1) / 2 - 6;
  const hingeX = f.hingeSide === 'left' ? s.x : s.x + s.w;
  const pose = useDemo(demo, active, f.spec.type, f.handle!.side);
  const tiltRef = useRef<THREE.Group>(null!);
  const turnRef = useRef<THREE.Group>(null!);
  const leverRef = useRef<THREE.Group>(null!);
  useFrame(() => {
    const [h, tilt, turn] = pose.current;
    tiltRef.current.rotation.x = tilt;
    turnRef.current.rotation.y = f.hingeSide === 'left' ? -turn : turn;
    leverRef.current.rotation.z = h;
  });
  const symZ = view === 'inside' ? zg + 14 : zg - 14;
  const lines = useMemo(() => openingSymbols(f), [f]);

  return (
    <group position={[0, s.y, zs1]}>
      <group ref={tiltRef}>
        <group position={[hingeX, -s.y, 0]}>
          <group ref={turnRef}>
            <group position={[-hingeX, 0, -zs1]}>
              <MiterRing r={s} l={P.sashFace} rt={P.sashFace} t={P.sashFace} b={bottom} z0={zs0} z1={zs1} bevel={P.bevel} mats={mats} />
              <Pane r={inner} z={zg} material={glass} grow={10} />
              <MiterRing r={inner} l={P.bead} b={P.bead} rt={P.bead} t={P.bead} z0={zg + 13} z1={zs1 - 4} bevel={Math.min(P.bevel, 2)} mats={{ ...mats, outV: mats.inV, outH: mats.inH }} />
              <Gasket r={{ x: inner.x + P.bead, y: inner.y + P.bead, w: inner.w - 2 * P.bead, h: inner.h - 2 * P.bead }} z0={zg + 12} z1={zg + 16} />
              <Gasket r={inner} z0={zs0 + 4} z1={zg - 12} w={4} />
              {symbols &&
                lines.map(([x1, y1, x2, y2], i) => (
                  <Line key={i} points={[[x1, y1, symZ], [x2, y2, symZ]]} color={symbolColor} lineWidth={1.3} dashed dashSize={38} gapSize={22} transparent opacity={0.9} />
                ))}
              <group position={[f.handle!.x, f.handle!.y, zs1]}>
                <WindowHandle leverRef={leverRef} material={handleMat} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function WindowHandle({ leverRef, material }: { leverRef: React.RefObject<THREE.Group>; material: THREE.Material }) {
  return (
    <group>
      <RoundedBox args={[30, 80, 12]} radius={5} smoothness={3} position={[0, -6, 6]} material={material} castShadow />
      <group ref={leverRef} position={[0, 4, 12]}>
        <mesh material={material} rotation-x={Math.PI / 2} position={[0, 0, 11]} castShadow>
          <cylinderGeometry args={[9, 10, 22, 20]} />
        </mesh>
        <RoundedBox args={[21, 122, 17]} radius={8} smoothness={3} position={[0, -52, 26]} material={material} castShadow />
      </group>
    </group>
  );
}

function DoorLeaf({ f, L, mats, glass, handleMat, view, symbols, symbolColor, demo, active }: SashProps) {
  const d = f.door!;
  const zd0 = ZC - 36;
  const zd1 = ZC + L.P.frameDepth / 2 + 8;
  const hingeX = f.hingeSide === 'left' ? d.x : d.x + d.w;
  const strip = f.glass.w > 0;
  const g = f.glass;
  const hole: [number, number][] = strip
    ? [
        [g.x, g.y],
        [g.x + g.w, g.y],
        [g.x + g.w, g.y + g.h],
        [g.x, g.y + g.h],
      ]
    : [];
  const pose = useDemo(demo, active, 'ajto', f.handle!.side);
  const turnRef = useRef<THREE.Group>(null!);
  const leverIn = useRef<THREE.Group>(null!);
  useFrame(() => {
    const [h, , turn] = pose.current;
    turnRef.current.rotation.y = f.hingeSide === 'left' ? -turn : turn;
    leverIn.current.rotation.z = h;
  });
  const side = f.handle!.side;
  const dir = side === 'right' ? -1 : 1; // a kilincs a pánt felé mutat
  const lines = useMemo(() => openingSymbols(f), [f]);
  const symZ = view === 'inside' ? zd1 + 1.5 : zd0 - 1.5;
  const grooves = !strip ? [0.36, 0.64] : [];

  return (
    <group position={[hingeX, 0, zd1]}>
      <group ref={turnRef}>
        <group position={[-hingeX, 0, -zd1]}>
          <Extruded pts={rectPts(d)} holes={strip ? [hole] : []} z0={zd0} z1={(zd0 + zd1) / 2} bevel={2.5} material={mats.outV} />
          <Extruded pts={rectPts(d)} holes={strip ? [hole] : []} z0={(zd0 + zd1) / 2} z1={zd1} bevel={2.5} material={mats.inV} />
          {grooves.map((k) => (
            <group key={k}>
              <Box min={[d.x + 70, d.y + d.h * k - 2, zd0 - 0.6]} max={[d.x + d.w - 70, d.y + d.h * k + 2, zd0 + 1]} material={staticMats.dark} cast={false} />
            </group>
          ))}
          {strip && (
            <>
              <Pane r={g} z={(zd0 + zd1) / 2} material={glass} grow={6} />
              <Gasket r={g} z0={zd0 - 1} z1={zd0 + 6} w={6} />
              <Gasket r={g} z0={zd1 - 6} z1={zd1 + 1} w={6} />
            </>
          )}
          {symbols &&
            lines.map(([x1, y1, x2, y2], i) => (
              <Line key={i} points={[[x1, y1, symZ], [x2, y2, symZ]]} color={symbolColor} lineWidth={1.3} dashed dashSize={38} gapSize={22} transparent opacity={0.9} />
            ))}
          {/* belső kilincs */}
          <group position={[f.handle!.x, f.handle!.y, zd1]}>
            <RoundedBox args={[44, 210, 10]} radius={4} smoothness={3} position={[0, -52, 5]} material={handleMat} castShadow />
            <mesh position={[0, -118, 11]} rotation-x={Math.PI / 2} material={staticMats.dark}>
              <cylinderGeometry args={[9, 9, 4, 20]} />
            </mesh>
            <group ref={leverIn} position={[0, 0, 10]}>
              <mesh material={handleMat} rotation-x={Math.PI / 2} position={[0, 0, 12]} castShadow>
                <cylinderGeometry args={[10, 11, 24, 20]} />
              </mesh>
              <RoundedBox args={[140, 20, 18]} radius={8} smoothness={3} position={[dir * 62, 0, 30]} material={handleMat} castShadow />
            </group>
          </group>
          {/* külső fogantyúrúd */}
          <group position={[f.handle!.x + dir * -6, 0, zd0]}>
            {[d.y + d.h * 0.3, d.y + d.h * 0.3 + Math.min(1100, d.h * 0.48)].map((y, i) => (
              <mesh key={i} position={[0, y, -36]} rotation-x={Math.PI / 2} material={handleMat} castShadow>
                <cylinderGeometry args={[9, 9, 72, 16]} />
              </mesh>
            ))}
            <mesh position={[0, d.y + d.h * 0.3 + Math.min(1100, d.h * 0.48) / 2, -72]} material={handleMat} castShadow>
              <cylinderGeometry args={[16, 16, Math.min(1100, d.h * 0.48) + 160, 28]} />
            </mesh>
            <mesh position={[dir * -0, f.handle!.y - 118, -1]} rotation-x={Math.PI / 2} material={staticMats.steel}>
              <cylinderGeometry args={[14, 14, 4, 24]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
