import type { BrandConfig, FieldSpec, ProfileSystem } from '../types';

/**
 * Ablakbázis – konfigurátor az ablakbazis.hu arculatával.
 *
 * Forrás: az ablakbazis.hu élő oldalai (2026-11-25): színek, betűk (Space Grotesk + Manrope),
 * termékkategóriák, Kömmerling-rendszerek és jellemzőik, redőnytípusok határai, régiók, telefonszám.
 * Ami NEM az oldalukról jön, az jelölve van: a párkányok és a keretszínek választéka mintakínálat,
 * a végleges kínálattal egyeztetni kell.
 */

const f = (type: FieldSpec['type'], hinge: FieldSpec['hinge'] = 'bal', ratio = 1): FieldSpec => ({ type, hinge, ratio });

// ablakbazis.hu/muanyag-ablakok
const windowSystems: ProfileSystem[] = [
  { id: 'k76ad', name: 'Kömmerling 76 AD', depth: 76, facts: ['76 mm beépítési mélység', '5 légkamra', 'széltömítés'], glazing: ['2', '3'] },
  { id: 'k76md', name: 'Kömmerling 76 MD', depth: 76, facts: ['76 mm beépítési mélység', '6 légkamra', 'középtömítés'], glazing: ['2', '3'] },
  { id: 'k88md', name: 'Kömmerling 88 MD', depth: 88, facts: ['88 mm beépítési mélység', '7 légkamra', 'középtömítés'], glazing: ['2', '3'] },
];

// ablakbazis.hu/erkelyajtok
const balconySystems: ProfileSystem[] = [
  { id: 'k76ad', name: 'Kömmerling 76 AD', depth: 76, facts: ['76 mm, 5 kamrás profil', 'Uw akár 1,1 W/m²K'], sizeRange: { w: [800, 1400], h: [2000, 2400] }, glazing: ['2', '3'] },
  { id: 'k76md', name: 'Kömmerling 76 MD', depth: 76, facts: ['76 mm, 6 kamrás profil', 'Uw akár 0,95 W/m²K'], sizeRange: { w: [800, 1400], h: [2000, 2400] }, glazing: ['2', '3'] },
  { id: 'k88md', name: 'Kömmerling 88 MD', depth: 88, facts: ['88 mm, 6 kamrás profil', 'Uw akár 0,75 W/m²K'], sizeRange: { w: [800, 1500], h: [2000, 2500] }, glazing: ['3'] },
];

// ablakbazis.hu/bejarati-ajtok
const doorSystems: ProfileSystem[] = [
  { id: 'k76ad', name: 'Kömmerling 76 AD', depth: 76, facts: ['76 mm beépítési mélység', '5 légkamra', 'hőhídmentes küszöb'], glazing: ['2', '3'] },
  { id: 'k88md', name: 'Kömmerling 88 MD', depth: 88, facts: ['88 mm beépítési mélység', '7 légkamra', 'hőhídmentes küszöb'], glazing: ['3'] },
];

export const ablakbazis: BrandConfig = {
  id: 'ablakbazis',
  name: 'Ablakbázis',
  wordmark: ['Ablak', 'bázis'],
  legalName: 'Ablakbázis',
  phone: '+36 30 6300 700',
  website: 'https://ablakbazis.hu',
  regions: ['Budapest', 'Győr-Moson-Sopron', 'Pest megye'],
  tokens: {
    color: {
      paper: '#FAF8F5',
      surface: '#FFFFFF',
      ink: '#1C1A19',
      graphite: '#2B2826',
      muted: '#55524F', // 7,3:1 a papíron
      line: '#ECE6DC',
      lineStrong: '#8C8170', // UI-keret 3,6:1
      accent: '#D14F35', // grafika, méretvonal (4,1:1)
      accentText: '#BF4129', // narancs szöveg (4,9:1 a papíron)
      accentInk: '#FFFFFF',
      accentSoft: '#FFF3EE',
      // az oldal gombja #FF8A5C→#D14F35; fehér szöveggel 2,3:1 – itt egy árnyalattal sötétebb
      accentFrom: '#E8673A',
      accentTo: '#BF4129',
      blue: '#216693',
      blueSoft: '#EFF8FC',
    },
    font: {
      googleHref: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400..700&family=Manrope:wght@400..800&display=swap',
      display: "'Space Grotesk', 'Manrope', system-ui, sans-serif",
      body: "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif",
      mono: "'Space Grotesk', 'Manrope', system-ui, sans-serif",
      displayStretch: '100%',
      displayWeight: 600,
      wordmarkStretch: '100%',
      wordmarkWeight: 700,
      monoStretch: '100%',
    },
    radius: { control: '12px', panel: '22px' },
    motion: { ease: 'cubic-bezier(.2,.8,.2,1)', fast: '160ms', base: '300ms' },
    scene: {
      background: '#F4F1EB',
      sun: '#FFF1E2',
      sunIntensity: 2.6,
      envIntensity: 0.95,
      roomLight: '#FFFFFF',
      plasterIn: '#F6F3EE',
      facade: '#E2DACD',
      masonry: '#BBA893',
      insulation: '#EFEBE3',
      sillIn: '#F2F2EF',
      dimension: '#D14F35',
      symbol: '#D14F35',
    },
  },
  nav: [
    { label: 'Főoldal', href: 'https://ablakbazis.hu/' },
    { label: 'Műanyag ablakok', href: 'https://ablakbazis.hu/muanyag-ablakok' },
    { label: 'Redőnyök', href: 'https://ablakbazis.hu/redonyok' },
    { label: 'Kapcsolat', href: 'https://ablakbazis.hu/kapcsolat' },
  ],
  hero: {
    title: 'Állítsd össze az ablakod – párkánnyal együtt',
    lead: 'Add meg a méretet, a Kömmerling-rendszert, az osztást, a színt és a párkányt. A modell élőben mutatja, hogyan áll a falban, az összeállítást pedig ajánlatkérésként küldheted el.',
    primary: 'Összeállítás indítása',
    secondary: 'Csak párkányt keresek',
    tags: ['Egyedi méretre', 'Kömmerling rendszerek', 'Párkánnyal együtt'],
  },
  products: [
    {
      id: 'muanyag-ablak',
      name: 'Műanyag ablak',
      short: 'Kömmerling 76 AD, 76 MD vagy 88 MD rendszerben.',
      kind: 'window',
      profile: 'pvc',
      defaultSize: { 1: { w: 900, h: 1200 }, 2: { w: 1230, h: 1480 }, 3: { w: 1980, h: 1480 } },
      sizeRange: { w: [400, 2600], h: [400, 2400] },
      fieldCounts: [1, 2, 3],
      fieldTypes: ['bukonyilo', 'nyilo', 'fix'],
      defaultFields: {
        1: [f('bukonyilo', 'bal')],
        2: [f('nyilo', 'bal'), f('bukonyilo', 'jobb')],
        3: [f('bukonyilo', 'bal'), f('fix'), f('bukonyilo', 'jobb')],
      },
      defaultColor: 'feher',
      shading: true,
      sills: true,
      defaultView: 'inside',
      systems: windowSystems,
    },
    {
      id: 'erkelyajto',
      name: 'Erkélyajtó',
      short: 'Kilépés teraszra, erkélyre – az ablakokkal egységesen.',
      kind: 'balcony',
      profile: 'pvc',
      defaultSize: { 1: { w: 900, h: 2180 }, 2: { w: 1400, h: 2180 } },
      sizeRange: { w: [800, 1500], h: [2000, 2500] },
      fieldCounts: [1, 2],
      fieldTypes: ['bukonyilo', 'nyilo', 'fix'],
      defaultFields: {
        1: [f('bukonyilo', 'bal')],
        2: [f('nyilo', 'bal'), f('bukonyilo', 'jobb')],
      },
      defaultColor: 'feher',
      shading: true,
      sills: false,
      defaultView: 'inside',
      systems: balconySystems,
    },
    {
      id: 'bejarati-ajto',
      name: 'Bejárati ajtó',
      short: 'Biztonságos zárás, hőhídmentes küszöb.',
      kind: 'entrance',
      profile: 'pvc',
      defaultSize: { 1: { w: 1000, h: 2100 }, 2: { w: 1450, h: 2100 }, 3: { w: 1900, h: 2100 } },
      sizeRange: { w: [850, 2600], h: [1950, 2500] },
      fieldCounts: [1, 2, 3],
      fieldTypes: ['ajto', 'oldalvilagito'],
      defaultFields: {
        1: [f('ajto', 'bal')],
        2: [f('ajto', 'bal', 0.7), f('oldalvilagito', 'bal', 0.3)],
        3: [f('oldalvilagito', 'bal', 0.24), f('ajto', 'bal', 0.52), f('oldalvilagito', 'bal', 0.24)],
      },
      defaultColor: 'antracit',
      defaultHandle: 'ezust',
      shading: false,
      sills: false,
      defaultView: 'outside',
      systems: doorSystems,
      panels: [
        { id: 'teli', name: 'Teli panel' },
        { id: 'uvegcsik', name: 'Üvegcsíkkal' },
      ],
    },
    {
      id: 'parkany',
      name: 'Párkány',
      short: 'Belső és külső párkány a nyílás méretére.',
      kind: 'sill',
      profile: 'pvc',
      defaultSize: { 2: { w: 1230, h: 1200 } },
      sizeRange: { w: [400, 3000], h: [1200, 1200] },
      fieldCounts: [2],
      fieldTypes: ['nyilo', 'bukonyilo', 'fix'],
      defaultFields: { 2: [f('nyilo', 'bal'), f('bukonyilo', 'jobb')] },
      defaultColor: 'feher',
      shading: false,
      sills: true,
      defaultView: 'inside',
      systems: [],
    },
  ],
  // keretszínek – MINTAKÍNÁLAT, a valós Kömmerling-színpalettával egyeztetendő
  colors: [
    { id: 'feher', name: 'Fehér', kind: 'smooth', base: '#F3F3F0', roughness: 0.42 },
    { id: 'antracit', name: 'Antracit', kind: 'textured', base: '#3A4044', roughness: 0.62 },
    { id: 'aranytolgy', name: 'Aranytölgy', kind: 'wood', base: '#9A6336', grain: ['#6E4122', '#B9824E'], roughness: 0.55 },
  ],
  handles: [
    { id: 'feher', name: 'Fehér', base: '#F1F1EE', metalness: 0, roughness: 0.38 },
    { id: 'ezust', name: 'Ezüst', base: '#C9CDD0', metalness: 1, roughness: 0.28 },
    { id: 'fekete', name: 'Fekete', base: '#1C1F21', metalness: 0.4, roughness: 0.45 },
  ],
  // ablakbazis.hu/redonyok – a határok az oldalon közölt adatok
  shutters: [
    { id: 'kulso-tokos', name: 'Külső tokos', short: 'Meglévő épülethez, ablakcseréhez, utólagos árnyékoláshoz.', max: { w: 1800, h: 3000, area: 3 }, box: 165 },
    { id: 'vakolhato', name: 'Vakolható', short: 'A tok a homlokzatba takarható – új építéshez, homlokzati felújításhoz.', max: { w: 1800, h: 2100, area: 3 }, box: 165 },
    { id: 'raepitheto', name: 'Ráépíthető', short: 'Az új ablakkal együtt, a tokra építve.', max: { w: 1800, h: 2500, area: 3 }, box: 210 },
  ],
  // párkányok – MINTAKÍNÁLAT a készülő párkányos oldalhoz, a valós kínálattal egyeztetendő
  sills: {
    inner: [
      { id: 'feher', name: 'Fehér', kind: 'smooth', base: '#F4F4F1', roughness: 0.35 },
      { id: 'marvany', name: 'Márvány hatású', kind: 'marble', base: '#EDEBE6', grain: ['#9C9A95', '#D9D6CF'], roughness: 0.22 },
      { id: 'aranytolgy', name: 'Aranytölgy', kind: 'wood', base: '#9A6336', grain: ['#6E4122', '#B9824E'], roughness: 0.5 },
      { id: 'antracit', name: 'Antracit', kind: 'textured', base: '#3A4044', roughness: 0.55 },
    ],
    outer: [
      { id: 'feher', name: 'Fehér', kind: 'metal', base: '#ECECEA', roughness: 0.45 },
      { id: 'barna', name: 'Barna', kind: 'metal', base: '#5A3E2B', roughness: 0.45 },
      { id: 'antracit', name: 'Antracit', kind: 'metal', base: '#383D41', roughness: 0.45 },
      { id: 'ezust', name: 'Ezüst', kind: 'metal', base: '#B8BDC1', roughness: 0.32 },
    ],
    innerDepth: { range: [150, 600], default: 300 },
    outerDepth: { range: [100, 400], default: 180 },
  },
  fieldTypeLabels: {
    bukonyilo: 'Bukó-nyíló',
    nyilo: 'Nyíló',
    fix: 'Fix',
    ajto: 'Ajtószárny',
    oldalvilagito: 'Oldalvilágító',
  },
  placeholders: { uValue: '[U-ÉRTÉK]', price: '[ÁRAZÁS AZ ÉRTÉKESÍTŐNÉL]' },
  privacyUrl: 'https://ablakbazis.hu/adatvedelem',
  disclaimer: 'Látványterv: illusztráció – a végleges méretet, műszaki tartalmat és árat az ajánlat rögzíti',
  credit: 'Konfigurátor: Stratos Webdesign',
  refPrefix: 'AB',
};
