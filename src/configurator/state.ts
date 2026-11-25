import type { BrandConfig, FieldSpec, FieldType, Hinge, ProductDef, ProfileSystem, ShutterType, ViewSide } from '../config/types';

export type StepId = 'termek' | 'meret' | 'osztas' | 'szin' | 'parkany' | 'arnyekolas' | 'osszegzes' | 'ajanlat';

export const STEP_LABELS: Record<StepId, string> = {
  termek: 'Termék',
  meret: 'Méret',
  osztas: 'Osztás',
  szin: 'Szín',
  parkany: 'Párkány',
  arnyekolas: 'Redőny',
  osszegzes: 'Összegzés',
  ajanlat: 'Ajánlatkérés',
};

export interface Contact {
  name: string;
  email: string;
  phone: string;
  region: string;
  city: string;
  note: string;
  consent: boolean;
}

export interface State {
  productId: string;
  systemId: string;
  glazing: '2' | '3';
  width: number;
  height: number;
  sizeTouched: boolean;
  fields: FieldSpec[];
  selectedField: number;
  colorId: string;
  colorOutsideOnly: boolean;
  handleId: string;
  panelId: string;
  shutterType: ShutterType;
  shutterPos: number;
  screen: boolean;
  sillIn: string; // 'none' | szín-id
  sillInDepth: number;
  sillOut: string;
  sillOutDepth: number;
  view: ViewSide;
  showSymbols: boolean;
  showDims: boolean;
  step: StepId;
  stepDir: 1 | -1;
  demo: number;
  contact: Contact;
  sheetOpen: boolean;
  refId: string;
}

export type Action =
  | { type: 'product'; id: string }
  | { type: 'system'; id: string }
  | { type: 'glazing'; value: '2' | '3' }
  | { type: 'size'; width?: number; height?: number }
  | { type: 'fieldCount'; count: number }
  | { type: 'selectField'; index: number }
  | { type: 'fieldType'; index: number; fieldType: FieldType }
  | { type: 'hinge'; index: number; hinge: Hinge }
  | { type: 'color'; id: string }
  | { type: 'colorOutsideOnly'; value: boolean }
  | { type: 'handle'; id: string }
  | { type: 'panel'; id: string }
  | { type: 'shutterType'; value: ShutterType }
  | { type: 'shutterPos'; value: number }
  | { type: 'screen'; value: boolean }
  | { type: 'sillIn'; id: string }
  | { type: 'sillInDepth'; value: number }
  | { type: 'sillOut'; id: string }
  | { type: 'sillOutDepth'; value: number }
  | { type: 'view'; value: ViewSide }
  | { type: 'symbols'; value: boolean }
  | { type: 'dims'; value: boolean }
  | { type: 'step'; step: StepId }
  | { type: 'demo' }
  | { type: 'contact'; patch: Partial<Contact> }
  | { type: 'submit' }
  | { type: 'closeSheet' }
  | { type: 'restart' };

export function stepsFor(p: ProductDef): StepId[] {
  if (p.kind === 'sill') return ['termek', 'meret', 'parkany', 'osszegzes', 'ajanlat'];
  const s: StepId[] = ['termek', 'meret', 'osztas', 'szin'];
  if (p.sills) s.push('parkany');
  if (p.shading) s.push('arnyekolas');
  s.push('osszegzes', 'ajanlat');
  return s;
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function productOf(brand: BrandConfig, id: string): ProductDef {
  return brand.products.find((p) => p.id === id) ?? brand.products[0];
}

export function systemOf(p: ProductDef, id: string): ProfileSystem | undefined {
  return p.systems.find((x) => x.id === id) ?? p.systems[0];
}

/** A méretcsúszkák tartománya: a profilrendszer saját tartománya, ha van, különben a terméké. */
export function sizeRangeOf(p: ProductDef, systemId: string) {
  return systemOf(p, systemId)?.sizeRange ?? p.sizeRange;
}

function cloneFields(f: FieldSpec[]) {
  return f.map((x) => ({ ...x }));
}

function makeRef(prefix: string) {
  const d = new Date();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${n}`;
}

function defaultCount(p: ProductDef) {
  return p.fieldCounts.includes(2) ? 2 : p.fieldCounts[0];
}

function productDefaults(brand: BrandConfig, p: ProductDef, prev?: State) {
  const count = prev && p.fieldCounts.includes(prev.fields.length) ? prev.fields.length : defaultCount(p);
  const sys = (prev && p.systems.find((x) => x.id === prev.systemId)) ?? p.systems[0];
  const glazing: '2' | '3' = sys ? (sys.glazing.includes('3') ? '3' : sys.glazing[0]) : '3';
  const size = p.defaultSize[count] ?? Object.values(p.defaultSize)[0];
  return {
    productId: p.id,
    systemId: sys?.id ?? '',
    glazing,
    width: size.w,
    height: size.h,
    sizeTouched: false,
    fields: cloneFields(p.defaultFields[count]),
    selectedField: 0,
    colorId: p.defaultColor,
    handleId: p.defaultHandle ?? prev?.handleId ?? brand.handles[0].id,
    panelId: p.panels?.[0].id ?? prev?.panelId ?? 'teli',
    view: p.defaultView,
    shutterType: p.shading ? (prev?.shutterType ?? 'none') : ('none' as ShutterType),
    screen: p.shading ? (prev?.screen ?? false) : false,
    sillIn: p.sills ? (prev && prev.sillIn !== 'none' ? prev.sillIn : brand.sills.inner[0].id) : 'none',
    sillOut: p.sills ? (prev && prev.sillOut !== 'none' ? prev.sillOut : brand.sills.outer[0].id) : 'none',
  };
}

export function initialState(brand: BrandConfig): State {
  const p = brand.products[0];
  const base: State = {
    ...productDefaults(brand, p),
    colorOutsideOnly: false,
    shutterPos: 0.38,
    sillInDepth: brand.sills.innerDepth.default,
    sillOutDepth: brand.sills.outerDepth.default,
    showSymbols: true,
    showDims: true,
    step: 'termek',
    stepDir: 1,
    demo: 0,
    contact: { name: '', email: '', phone: '', region: '', city: '', note: '', consent: false },
    sheetOpen: false,
    refId: makeRef(brand.refPrefix),
  };
  return fromUrl(brand, base);
}

/** Bemutatóhoz és képernyőképekhez: az állapot URL-ből is beállítható. */
function fromUrl(brand: BrandConfig, s: State): State {
  if (typeof window === 'undefined') return s;
  const q = new URLSearchParams(window.location.search);
  const R = reducerFor(brand);
  let st = s;
  const prod = q.get('product');
  if (prod) st = R(st, { type: 'product', id: prod });
  const sys = q.get('system');
  if (sys) st = R(st, { type: 'system', id: sys });
  const gl = q.get('glazing');
  if (gl === '2' || gl === '3') st = { ...st, glazing: gl };
  const fc = q.get('fields');
  if (fc) {
    const p = productOf(brand, st.productId);
    const parts = fc.split(',');
    if (p.fieldCounts.includes(parts.length)) {
      st = R(st, { type: 'fieldCount', count: parts.length });
      const map: Record<string, FieldType> = { bn: 'bukonyilo', n: 'nyilo', f: 'fix', a: 'ajto', o: 'oldalvilagito' };
      parts.forEach((code, i) => {
        const [t, h] = code.split('-');
        const hinge: Hinge | undefined = h === 'j' ? 'jobb' : h === 'b' ? 'bal' : undefined;
        if (map[t]) st = { ...st, fields: st.fields.map((fl, j) => (j === i ? { ...fl, type: map[t], hinge: hinge ?? fl.hinge } : fl)) };
      });
    }
  }
  const w = Number(q.get('w'));
  const h = Number(q.get('h'));
  if (w || h) st = R(st, { type: 'size', width: w || undefined, height: h || undefined });
  const color = q.get('color');
  if (color) st = { ...st, colorId: color };
  if (q.get('outsideOnly') === '1') st = { ...st, colorOutsideOnly: true };
  const handle = q.get('handle');
  if (handle) st = { ...st, handleId: handle };
  const panel = q.get('panel');
  if (panel) st = { ...st, panelId: panel };
  const sh = q.get('shutter') as ShutterType | null;
  if (sh) st = { ...st, shutterType: sh };
  const sp = q.get('shutterPos');
  if (sp) st = { ...st, shutterPos: clamp(Number(sp), 0, 1) };
  if (q.get('screen') === '1') st = { ...st, screen: true };
  const si = q.get('sillIn');
  if (si) st = { ...st, sillIn: si };
  const so = q.get('sillOut');
  if (so) st = { ...st, sillOut: so };
  const sid = Number(q.get('sillInDepth'));
  if (sid) st = { ...st, sillInDepth: sid };
  const sod = Number(q.get('sillOutDepth'));
  if (sod) st = { ...st, sillOutDepth: sod };
  const view = q.get('view');
  if (view === 'inside' || view === 'outside') st = { ...st, view };
  if (q.get('symbols') === '0') st = { ...st, showSymbols: false };
  if (q.get('dims') === '0') st = { ...st, showDims: false };
  const step = q.get('step') as StepId | null;
  if (step && step in STEP_LABELS) st = { ...st, step };
  if (q.get('sheet') === '1') st = { ...st, step: 'ajanlat', sheetOpen: true };
  const sel = q.get('sel');
  if (sel) st = { ...st, selectedField: clamp(Number(sel), 0, st.fields.length - 1) };
  return st;
}

export function reducerFor(brand: BrandConfig) {
  return function reducer(s: State, a: Action): State {
    switch (a.type) {
      case 'product': {
        const p = productOf(brand, a.id);
        if (p.id === s.productId) return s;
        return { ...s, ...productDefaults(brand, p, s) };
      }
      case 'system': {
        const p = productOf(brand, s.productId);
        const sys = systemOf(p, a.id);
        if (!sys) return s;
        const r = sizeRangeOf(p, sys.id);
        return {
          ...s,
          systemId: sys.id,
          glazing: sys.glazing.includes(s.glazing) ? s.glazing : sys.glazing[0],
          width: clamp(s.width, r.w[0], r.w[1]),
          height: clamp(s.height, r.h[0], r.h[1]),
        };
      }
      case 'glazing':
        return { ...s, glazing: a.value };
      case 'size': {
        const r = sizeRangeOf(productOf(brand, s.productId), s.systemId);
        return {
          ...s,
          width: a.width !== undefined ? clamp(Math.round(a.width), r.w[0], r.w[1]) : s.width,
          height: a.height !== undefined ? clamp(Math.round(a.height), r.h[0], r.h[1]) : s.height,
          sizeTouched: true,
        };
      }
      case 'fieldCount': {
        const p = productOf(brand, s.productId);
        if (!p.fieldCounts.includes(a.count)) return s;
        const size = s.sizeTouched ? { w: s.width, h: s.height } : (p.defaultSize[a.count] ?? { w: s.width, h: s.height });
        return { ...s, fields: cloneFields(p.defaultFields[a.count]), selectedField: 0, width: size.w, height: size.h };
      }
      case 'selectField':
        return { ...s, selectedField: clamp(a.index, 0, s.fields.length - 1) };
      case 'fieldType': {
        const fields = s.fields.map((f, i) => (i === a.index ? { ...f, type: a.fieldType } : f));
        return { ...s, fields, demo: a.fieldType === 'fix' || a.fieldType === 'oldalvilagito' ? s.demo : s.demo + 1 };
      }
      case 'hinge':
        return { ...s, fields: s.fields.map((f, i) => (i === a.index ? { ...f, hinge: a.hinge } : f)), demo: s.demo + 1 };
      case 'color':
        return { ...s, colorId: a.id };
      case 'colorOutsideOnly':
        return { ...s, colorOutsideOnly: a.value, view: a.value ? 'outside' : s.view };
      case 'handle':
        return { ...s, handleId: a.id };
      case 'panel':
        return { ...s, panelId: a.id };
      case 'shutterType':
        return { ...s, shutterType: a.value, view: a.value !== 'none' ? 'outside' : s.view };
      case 'shutterPos':
        return { ...s, shutterPos: clamp(a.value, 0, 1) };
      case 'screen':
        return { ...s, screen: a.value, view: a.value ? 'outside' : s.view };
      case 'sillIn':
        return { ...s, sillIn: a.id, view: a.id !== 'none' ? 'inside' : s.view };
      case 'sillInDepth':
        return { ...s, sillInDepth: clamp(Math.round(a.value), brand.sills.innerDepth.range[0], brand.sills.innerDepth.range[1]), view: 'inside' };
      case 'sillOut':
        return { ...s, sillOut: a.id, view: a.id !== 'none' ? 'outside' : s.view };
      case 'sillOutDepth':
        return { ...s, sillOutDepth: clamp(Math.round(a.value), brand.sills.outerDepth.range[0], brand.sills.outerDepth.range[1]), view: 'outside' };
      case 'view':
        return { ...s, view: a.value };
      case 'symbols':
        return { ...s, showSymbols: a.value };
      case 'dims':
        return { ...s, showDims: a.value };
      case 'step': {
        const steps = stepsFor(productOf(brand, s.productId));
        const dir = steps.indexOf(a.step) >= steps.indexOf(s.step) ? 1 : -1;
        return { ...s, step: a.step, stepDir: dir };
      }
      case 'demo':
        return { ...s, demo: s.demo + 1 };
      case 'contact':
        return { ...s, contact: { ...s.contact, ...a.patch } };
      case 'submit':
        return { ...s, sheetOpen: true };
      case 'closeSheet':
        return { ...s, sheetOpen: false };
      case 'restart': {
        const fresh = initialState(brand);
        return { ...fresh, step: 'termek', sheetOpen: false, stepDir: -1 };
      }
    }
  };
}

export const fmtMm = (v: number) => Math.round(v).toLocaleString('hu-HU').replace(/ /g, ' ');
export const fmtArea = (w: number, h: number) => ((w * h) / 1e6).toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
