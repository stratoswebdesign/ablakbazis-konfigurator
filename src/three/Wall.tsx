import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { ColorDef, SceneTokens } from '../config/types';
import { Box } from './parts';
import { marbleTexture, noiseTexture, woodTexture } from './textures';
import { ZC } from './WindowUnit';

/**
 * Falmetszet-modell (mm): rétegrend kívülről befelé – vakolat, hőszigetelés, falazat, belső vakolat.
 * A fal véges darab, a vágott éleken látszik a rétegrend – mint egy építészeti makett.
 */
export const WALL = { T: 440, side: 420, above: 400, below: 460, joint: 10, lining: 10 };
const Z = { out: -220, render: -212, eps: -92, inner: 208, in: 220 };

export function useWallMaterials(t: SceneTokens) {
  return useMemo(() => {
    const bump = noiseTexture(256, 5, 0.8);
    bump.repeat.set(1 / 260, 1 / 260);
    const facade = new THREE.MeshStandardMaterial({ color: t.facade, roughness: 0.95, bumpMap: bump, bumpScale: 1.2 });
    const plaster = new THREE.MeshStandardMaterial({ color: t.plasterIn, roughness: 0.92, bumpMap: bump, bumpScale: 0.25 });
    const masonry = new THREE.MeshStandardMaterial({ color: t.masonry, roughness: 1 });
    const insulation = new THREE.MeshStandardMaterial({ color: t.insulation, roughness: 1 });
    const sill = new THREE.MeshPhysicalMaterial({ color: t.sillIn, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.4 });
    const fuga = new THREE.MeshStandardMaterial({ color: '#8b8882', roughness: 0.95 });
    const alu = new THREE.MeshStandardMaterial({ color: '#a7acaf', metalness: 0.7, roughness: 0.4 });
    return { facade, plaster, masonry, insulation, sill, fuga, alu };
  }, [t]);
}

export interface WallGeom {
  ox: number; // a káva felülete (fél-szélesség)
  oxs: number; // szerkezeti nyílás fél-szélesség
  yb: number; // a nyílás alja
  yt: number; // a káva felső felülete
  yts: number;
  X: number;
  Ytop: number;
  /** A falmetszet alja: ablaknál a mellvéd alatt elvágva (lebegő makett), ajtónál a padló. */
  Ybot: number;
}

export function wallGeom(W: number, H: number, boxH: number, sill: number): WallGeom {
  const ox = W / 2 + WALL.joint;
  const oxs = ox + WALL.lining;
  const yb = sill > 0 ? sill - 30 : 0;
  const yt = sill + H + boxH + WALL.joint;
  const yts = yt + WALL.lining;
  return { ox, oxs, yb, yt, yts, X: oxs + WALL.side, Ytop: yts + WALL.above, Ybot: sill > 0 ? Math.max(0, sill - WALL.below) : 0 };
}

/** Párkányanyag a kiválasztott színből (sima, márvány, fa, texturált, fém). */
export function useSillMaterial(c: ColorDef | null) {
  return useMemo(() => {
    if (!c) return null;
    const m = new THREE.MeshPhysicalMaterial({ color: c.base, roughness: c.roughness, clearcoat: 0.25, clearcoatRoughness: 0.35 });
    if (c.kind === 'wood' && c.grain) {
      m.map = woodTexture(c.grain[0], c.grain[1], false);
      m.map.repeat.set(1 / 700, 1 / 700);
      m.color.set('#ffffff');
    } else if (c.kind === 'marble' && c.grain) {
      m.map = marbleTexture(c.grain[0], c.grain[1]);
      m.map.repeat.set(1 / 900, 1 / 900);
      m.color.set('#ffffff');
      m.clearcoat = 0.6;
    } else if (c.kind === 'textured') {
      const n = noiseTexture(256, 13, 0.6);
      n.repeat.set(1 / 90, 1 / 90);
      m.bumpMap = n;
      m.bumpScale = 0.8;
    } else if (c.kind === 'metal') {
      m.metalness = 0.55;
      m.clearcoat = 0.1;
    }
    return m;
  }, [c]);
}

export interface SillSpec {
  inner: ColorDef | null;
  innerDepth: number;
  outer: ColorDef | null;
  outerDepth: number;
}

export function Wall({ W, H, boxH, sill, frameDepth, tokens, sills }: { W: number; H: number; boxH: number; sill: number; frameDepth: number; tokens: SceneTokens; sills: SillSpec }) {
  const m = useWallMaterials(tokens);
  const g = wallGeom(W, H, boxH, sill);
  const { ox, oxs, yb, yt, yts, X, Ytop, Ybot } = g;
  const fo = ZC - frameDepth / 2; // a tok külső síkja
  const fi = ZC + frameDepth / 2; // a tok belső síkja
  const isWindow = sill > 0;
  const inMat = useSillMaterial(sills.inner);
  const outMat = useSillMaterial(sills.outer);
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a4d50', roughness: 0.6 }), []);
  const inZ1 = fi - 4 + sills.innerDepth; // a belső párkány eleje
  const outZ1 = fo + 2 - sills.outerDepth; // a külső párkány eleje (vízorr)
  const layers: [number, number, THREE.Material][] = [
    [Z.out, Z.render, m.facade],
    [Z.render, Z.eps, m.insulation],
    [Z.eps, Z.inner, m.masonry],
    [Z.inner, Z.in, m.plaster],
  ];

  return (
    <group>
      {layers.map(([za, zb, mat], i) => (
        <group key={i}>
          <Box min={[-X, Ybot, za]} max={[-oxs, Ytop, zb]} material={mat} />
          <Box min={[oxs, Ybot, za]} max={[X, Ytop, zb]} material={mat} />
          <Box min={[-oxs, yts, za]} max={[oxs, Ytop, zb]} material={mat} />
          {isWindow && <Box min={[-oxs, Ybot, za]} max={[oxs, yb, zb]} material={mat} />}
        </group>
      ))}
      {/* káva: belül vakolat, kívül homlokzati vakolat */}
      <Box min={[-oxs, yb, fi]} max={[-ox, yts, Z.in]} material={m.plaster} />
      <Box min={[ox, yb, fi]} max={[oxs, yts, Z.in]} material={m.plaster} />
      <Box min={[-oxs, yt, fi]} max={[oxs, yts, Z.in]} material={m.plaster} />
      <Box min={[-oxs, yb, Z.out]} max={[-ox, yts, fo]} material={m.facade} />
      <Box min={[ox, yb, Z.out]} max={[oxs, yts, fo]} material={m.facade} />
      <Box min={[-oxs, yt, Z.out]} max={[oxs, yts, fo]} material={m.facade} />
      {/* beépítési fuga a tok körül */}
      <Box min={[-ox, yb, fo]} max={[-W / 2, yt, fi]} material={m.fuga} cast={false} />
      <Box min={[W / 2, yb, fo]} max={[ox, yt, fi]} material={m.fuga} cast={false} />
      <Box min={[-ox, sill + H + boxH, fo]} max={[ox, yt, fi]} material={m.fuga} cast={false} />
      {isWindow && (
        <>
          <Box min={[-ox, yb, fo]} max={[ox, sill, fi]} material={m.fuga} cast={false} />
          {/* belső párkány (a választott anyagból és mélységgel) – nélküle vakolt káva */}
          {inMat ? (
            <RoundedBox
              args={[2 * ox + 68, 25, inZ1 - (fi - 4)]}
              radius={4}
              smoothness={3}
              position={[0, sill - 17.5, (fi - 4 + inZ1) / 2]}
              material={inMat}
              castShadow
              receiveShadow
            />
          ) : (
            <Box min={[-ox, yb, fi]} max={[ox, yb + 14, Z.in]} material={m.plaster} />
          )}
          {/* külső párkány: hajlított lemez vízorral és véglezárókkal – nélküle vakolt káva */}
          {outMat ? (
            <>
              <Box min={[-ox - 22, sill - 34, outZ1]} max={[ox + 22, sill - 16, fo + 2]} material={outMat} />
              <Box min={[-ox - 22, sill - 66, outZ1 - 4]} max={[ox + 22, sill - 16, outZ1 + 2]} material={outMat} />
              <Box min={[-ox - 30, sill - 40, outZ1 - 4]} max={[-ox - 22, sill - 8, fo + 2]} material={capMat} />
              <Box min={[ox + 22, sill - 40, outZ1 - 4]} max={[ox + 30, sill - 8, fo + 2]} material={capMat} />
            </>
          ) : (
            <Box min={[-ox, yb, Z.out]} max={[ox, yb + 14, fo]} material={m.facade} />
          )}
        </>
      )}
    </group>
  );
}
