import type { FieldSpec, Hinge, ProductDef, ProfileStyle } from '../config/types';

/**
 * Közös geometria mm-ben: ebből rajzolódik a 2D nézetrajz ÉS a 3D modell, így a kettő mindig egyezik.
 * Origó: a tok bal alsó külső sarka, belső nézetből (x jobbra, y fel).
 * A profilméretek LÁTVÁNYMÉRETEK, nem gyártói adatok.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Profile {
  frameFace: number;
  frameDepth: number;
  sashFace: number;
  sashBottom: number;
  sashDepth: number;
  sashProud: number;
  overlap: number;
  mullion: number;
  bead: number;
  bevel: number;
}

export const PROFILES: Record<ProfileStyle, Profile> = {
  pvc: { frameFace: 66, frameDepth: 76, sashFace: 76, sashBottom: 76, sashDepth: 76, sashProud: 7, overlap: 8, mullion: 82, bead: 17, bevel: 3.4 },
  alu: { frameFace: 50, frameDepth: 75, sashFace: 58, sashBottom: 58, sashDepth: 82, sashProud: 5, overlap: 6, mullion: 64, bead: 12, bevel: 1.1 },
};

export const BOX_H = 170; // redőnytok magassága (látvány)

export interface FieldLayout {
  index: number;
  spec: FieldSpec;
  area: Rect; // szabad nyílás a tokon/osztón belül
  sash?: Rect; // nyíló szárny külső mérete
  door?: Rect; // ajtólap
  glass: Rect; // látható üvegfelület
  handle?: { x: number; y: number; side: 'left' | 'right' };
  hingeSide: 'left' | 'right';
  opens: boolean;
}

export interface UnitLayout {
  W: number;
  H: number;
  P: Profile;
  bottomFace: number;
  threshold: boolean;
  mullions: Rect[];
  fields: FieldLayout[];
  box?: Rect;
}

const inset = (r: Rect, l: number, b = l, rr = l, t = l): Rect => ({ x: r.x + l, y: r.y + b, w: r.w - l - rr, h: r.h - b - t });

export function layoutUnit(product: ProductDef, W: number, H: number, fields: FieldSpec[], shutter: boolean, panelId = 'teli', depth?: number): UnitLayout {
  const base = PROFILES[product.profile];
  // a profilrendszer beépítési mélysége (pl. 76 vagy 88 mm) állítja a tok és a szárny mélységét
  const P = depth ? { ...base, frameDepth: depth, sashDepth: depth } : base;
  const isDoorish = product.kind === 'balcony' || product.kind === 'entrance';
  const threshold = isDoorish;
  const bottomFace = threshold ? 24 : P.frameFace;
  const ff = P.frameFace;

  const innerW = W - 2 * ff;
  const n = fields.length;
  const net = innerW - (n - 1) * P.mullion;
  const total = fields.reduce((a, f) => a + f.ratio, 0);

  const mullions: Rect[] = [];
  const out: FieldLayout[] = [];
  let x = ff;
  fields.forEach((spec, i) => {
    const w = (net * spec.ratio) / total;
    const area: Rect = { x, y: bottomFace, w, h: H - bottomFace - ff };
    const hingeSide: 'left' | 'right' = (spec.hinge as Hinge) === 'jobb' ? 'right' : 'left';
    const fl: FieldLayout = { index: i, spec, area, glass: area, hingeSide, opens: false };

    if (spec.type === 'bukonyilo' || spec.type === 'nyilo') {
      const sash = inset(area, -P.overlap, threshold ? 0 : -P.overlap, -P.overlap, -P.overlap);
      const bottom = product.kind === 'balcony' ? 112 : P.sashBottom;
      fl.sash = sash;
      fl.glass = inset(sash, P.sashFace + P.bead, bottom + P.bead, P.sashFace + P.bead, P.sashFace + P.bead);
      const hy = product.kind === 'balcony' ? Math.min(1050, sash.y + sash.h * 0.55) : sash.y + sash.h / 2;
      fl.handle = hingeSide === 'left' ? { x: sash.x + sash.w - P.sashFace / 2, y: hy, side: 'right' } : { x: sash.x + P.sashFace / 2, y: hy, side: 'left' };
      fl.opens = true;
    } else if (spec.type === 'ajto') {
      const door = inset(area, -10, 0, -10, -10);
      fl.door = door;
      const strip = panelId === 'uvegcsik';
      const gx = hingeSide === 'left' ? door.x + door.w * 0.22 : door.x + door.w * 0.78 - 130;
      fl.glass = strip ? { x: gx, y: door.y + 320, w: 130, h: door.h - 640 } : { x: 0, y: 0, w: 0, h: 0 };
      const hx = hingeSide === 'left' ? door.x + door.w - 78 : door.x + 78;
      fl.handle = { x: hx, y: 1050, side: hingeSide === 'left' ? 'right' : 'left' };
      fl.opens = true;
    } else {
      fl.glass = inset(area, P.bead);
    }
    out.push(fl);
    x += w;
    if (i < n - 1) {
      mullions.push({ x, y: bottomFace, w: P.mullion, h: H - bottomFace - ff });
      x += P.mullion;
    }
  });

  return {
    W,
    H,
    P,
    bottomFace,
    threshold,
    mullions,
    fields: out,
    box: shutter ? { x: 0, y: H, w: W, h: BOX_H } : undefined,
  };
}

/** Nyitásjelölés (nézetrajz-konvenció): a háromszög csúcsa a pántoldalon. */
export function openingSymbols(f: FieldLayout): [number, number, number, number][] {
  const r = f.sash ?? f.door;
  if (!r || !f.opens) return [];
  const g = f.door ? r : f.glass;
  const lines: [number, number, number, number][] = [];
  const midY = g.y + g.h / 2;
  const hx = f.hingeSide === 'left' ? g.x : g.x + g.w;
  const ox = f.hingeSide === 'left' ? g.x + g.w : g.x;
  // nyíló: a kilincsoldali sarkokból a pántoldal közepére
  lines.push([ox, g.y + g.h, hx, midY], [ox, g.y, hx, midY]);
  if (f.spec.type === 'bukonyilo') {
    // bukó: a felső sarkokból az alsó közepére
    const mx = g.x + g.w / 2;
    lines.push([g.x, g.y + g.h, mx, g.y], [g.x + g.w, g.y + g.h, mx, g.y]);
  }
  return lines;
}
