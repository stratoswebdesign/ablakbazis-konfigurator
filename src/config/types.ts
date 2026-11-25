/**
 * Márkafüggetlen típusok. Minden ügyfélspecifikus adat a `src/config/brands/<id>.ts` fájlban van.
 */

export type FieldType = 'bukonyilo' | 'nyilo' | 'fix' | 'ajto' | 'oldalvilagito';
export type Hinge = 'bal' | 'jobb';
export type ProductKind = 'window' | 'balcony' | 'entrance' | 'sill';
export type ProfileStyle = 'pvc' | 'alu';
export type ViewSide = 'inside' | 'outside';
export type ShutterType = 'none' | 'kulso-tokos' | 'vakolhato' | 'raepitheto';

export interface FieldSpec {
  type: FieldType;
  hinge: Hinge;
  /** Relatív szélesség (a mezők arányai). */
  ratio: number;
}

/** Profilrendszer (pl. Kömmerling 76 AD). Az adatok az ügyfél saját oldaláról származnak. */
export interface ProfileSystem {
  id: string;
  name: string;
  /** Beépítési mélység mm-ben – a 3D tok mélysége ehhez igazodik. */
  depth: number;
  /** Rövid, az ügyfél oldalán szereplő jellemzők. */
  facts: string[];
  /** Ha a rendszernek saját mérettartománya van (mm). */
  sizeRange?: { w: [number, number]; h: [number, number] };
  glazing: ('2' | '3')[];
}

export interface ProductDef {
  id: string;
  name: string;
  short: string;
  kind: ProductKind;
  profile: ProfileStyle;
  defaultSize: Record<number, { w: number; h: number }>;
  /** A csúszkák tartománya (mm). */
  sizeRange: { w: [number, number]; h: [number, number] };
  fieldCounts: number[];
  fieldTypes: FieldType[];
  defaultFields: Record<number, FieldSpec[]>;
  defaultColor: string;
  defaultHandle?: string;
  shading: boolean;
  sills: boolean;
  defaultView: ViewSide;
  systems: ProfileSystem[];
  panels?: { id: string; name: string }[];
}

export interface ColorDef {
  id: string;
  name: string;
  kind: 'smooth' | 'textured' | 'wood' | 'marble' | 'metal';
  base: string;
  grain?: [string, string];
  roughness: number;
}

export interface HandleDef {
  id: string;
  name: string;
  base: string;
  metalness: number;
  roughness: number;
}

export interface ShutterDef {
  id: Exclude<ShutterType, 'none'>;
  name: string;
  short: string;
  /** Az ügyfél oldalán közölt határok (mm, m²) – figyelmeztetéshez. */
  max: { w: number; h: number; area: number };
  /** Tokméret a 3D-hez (mm). */
  box: number;
}

export interface SillOptions {
  inner: ColorDef[];
  outer: ColorDef[];
  innerDepth: { range: [number, number]; default: number };
  outerDepth: { range: [number, number]; default: number };
}

export interface SceneTokens {
  background: string;
  sun: string;
  sunIntensity: number;
  envIntensity: number;
  roomLight: string;
  plasterIn: string;
  facade: string;
  masonry: string;
  insulation: string;
  sillIn: string;
  dimension: string;
  symbol: string;
}

export interface BrandTokens {
  color: {
    paper: string;
    surface: string;
    ink: string;
    graphite: string;
    muted: string;
    line: string;
    lineStrong: string;
    accent: string;
    accentText: string;
    accentInk: string;
    accentSoft: string;
    accentFrom: string;
    accentTo: string;
    blue: string;
    blueSoft: string;
  };
  font: {
    googleHref: string;
    display: string;
    body: string;
    mono: string;
    displayStretch: string;
    displayWeight: number;
    wordmarkStretch: string;
    wordmarkWeight: number;
    monoStretch: string;
  };
  radius: { control: string; panel: string };
  motion: { ease: string; fast: string; base: string };
  scene: SceneTokens;
}

export interface BrandConfig {
  id: string;
  name: string;
  /** Szóvédjegy két része (pl. „Ablak” + „bázis”). */
  wordmark: [string, string];
  legalName: string;
  phone: string;
  website: string;
  regions: string[];
  tokens: BrandTokens;
  nav: { label: string; href: string }[];
  hero: { title: string; lead: string; primary: string; secondary: string; tags: string[] };
  products: ProductDef[];
  colors: ColorDef[];
  handles: HandleDef[];
  shutters: ShutterDef[];
  sills: SillOptions;
  fieldTypeLabels: Record<FieldType, string>;
  placeholders: { uValue: string; price: string };
  privacyUrl: string;
  disclaimer: string;
  credit: string;
  refPrefix: string;
}
