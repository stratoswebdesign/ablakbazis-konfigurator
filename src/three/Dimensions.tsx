import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { ViewSide } from '../config/types';
import { fmtMm } from '../configurator/state';
import { wallGeom } from './Wall';
import { ZC } from './WindowUnit';

export interface SillDims {
  inDepth: number | null;
  outDepth: number | null;
  frameDepth: number;
}

/** Élő méretvonalak a fal síkján, 45°-os jelölővel – a nézetrajz nyelve 3D-ben. */
export function Dimensions({ W, H, boxH, sill, view, color, hideHeight = false, sillDims }: { W: number; H: number; boxH: number; sill: number; view: ViewSide; color: string; hideHeight?: boolean; sillDims?: SillDims }) {
  const g = wallGeom(W, H, boxH, sill);
  const z = view === 'inside' ? 223 : -223;
  const sx = view === 'inside' ? -1 : 1; // a néző bal oldala
  const t = 26;
  const yd = g.yts + 170;
  const xd = sx * (g.oxs + 170);
  const tick = (x: number, y: number): [number, number, number][] =>
    view === 'inside'
      ? [
          [x - t, y - t, z],
          [x + t, y + t, z],
        ]
      : [
          [x + t, y - t, z],
          [x - t, y + t, z],
        ];
  const lw = 1.25;
  // párkány mélysége: vízszintes méretvonal a párkány tetején, a bal fül közelében
  const fi = ZC + (sillDims?.frameDepth ?? 76) / 2;
  const fo = ZC - (sillDims?.frameDepth ?? 76) / 2;
  const sd =
    sillDims && view === 'inside' && sillDims.inDepth
      ? { x: -(g.ox + 34) + 46, y: sill - 2, z0: fi - 4, z1: fi - 4 + sillDims.inDepth, v: sillDims.inDepth }
      : sillDims && view === 'outside' && sillDims.outDepth
        ? { x: -(g.ox + 22) + 40, y: sill - 13, z0: fo + 2, z1: fo + 2 - sillDims.outDepth, v: sillDims.outDepth }
        : null;
  const tz = 18;
  return (
    <group>
      {sd && (
        <>
          <Line points={[[sd.x, sd.y, sd.z0], [sd.x, sd.y, sd.z1]]} color={color} lineWidth={1.6} />
          <Line points={[[sd.x - tz, sd.y, sd.z0 - tz], [sd.x + tz, sd.y, sd.z0 + tz]]} color={color} lineWidth={2.2} />
          <Line points={[[sd.x - tz, sd.y, sd.z1 - tz], [sd.x + tz, sd.y, sd.z1 + tz]]} color={color} lineWidth={2.2} />
          <ScreenLabel position={[sd.x + 70, sd.y + 30, (sd.z0 + sd.z1) / 2]} text={fmtMm(sd.v)} />
        </>
      )}
      {/* szélesség */}
      <Line points={[[-W / 2, g.yts + 40, z], [-W / 2, yd + 60, z]]} color={color} lineWidth={0.9} transparent opacity={0.75} />
      <Line points={[[W / 2, g.yts + 40, z], [W / 2, yd + 60, z]]} color={color} lineWidth={0.9} transparent opacity={0.75} />
      <Line points={[[-W / 2 - 60, yd, z], [W / 2 + 60, yd, z]]} color={color} lineWidth={lw} />
      <Line points={tick(-W / 2, yd)} color={color} lineWidth={2} />
      <Line points={tick(W / 2, yd)} color={color} lineWidth={2} />
      <ScreenLabel position={[0, yd, z]} text={fmtMm(W)} />
      {/* magasság */}
      {!hideHeight && (
        <>
      <Line points={[[sx * (g.oxs + 40), sill, z], [xd + sx * 60, sill, z]]} color={color} lineWidth={0.9} transparent opacity={0.75} />
      <Line points={[[sx * (g.oxs + 40), sill + H, z], [xd + sx * 60, sill + H, z]]} color={color} lineWidth={0.9} transparent opacity={0.75} />
      <Line points={[[xd, sill - 60, z], [xd, sill + H + 60, z]]} color={color} lineWidth={lw} />
      <Line points={tick(xd, sill)} color={color} lineWidth={2} />
      <Line points={tick(xd, sill + H)} color={color} lineWidth={2} />
      <ScreenLabel position={[xd, sill + H / 2, z]} text={fmtMm(H)} vertical />
        </>
      )}
    </group>
  );
}

/** Képernyőre vetített DOM-címke (éles betű a 3D fölött). */
function ScreenLabel({ position, text, vertical }: { position: [number, number, number]; text: string; vertical?: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  const el = useMemo(() => {
    const d = document.createElement('div');
    d.className = 'dim-anchor';
    d.setAttribute('aria-hidden', 'true');
    return d;
  }, []);
  useEffect(() => {
    const host = gl.domElement.parentElement?.parentElement;
    host?.appendChild(el);
    return () => el.remove();
  }, [gl, el]);
  useEffect(() => {
    el.innerHTML = `<span class="dim-label${vertical ? ' dim-label--v' : ''}">${text}<small>mm</small></span>`;
  }, [el, text, vertical]);
  useFrame(() => {
    ref.current.getWorldPosition(v);
    v.project(camera);
    el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px, 0)`;
    el.style.visibility = v.z > 1 ? 'hidden' : 'visible';
  });
  return <group ref={ref} position={position} />;
}
