import * as THREE from 'three';

/** Minden textúra kódból készül (CanvasTexture) – nincs letöltött kép a modellben. */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const cache = new Map<string, THREE.Texture>();

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function finish(t: THREE.Texture, srgb: boolean, repeat = 1) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}

/** Egyenes szálú faerezet (fóliadekor jelleg). `vertical`: az erezet iránya. */
export function woodTexture(dark: string, light: string, vertical: boolean): THREE.Texture {
  const key = `wood:${dark}:${light}:${vertical}`;
  if (cache.has(key)) return cache.get(key)!;
  const S = 1024;
  const [c, g] = canvas(S, S);
  const r = rng(7);
  const grad = g.createLinearGradient(0, 0, S, 0);
  grad.addColorStop(0, light);
  grad.addColorStop(0.5, mix(light, dark, 0.25));
  grad.addColorStop(1, light);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  // évgyűrű-sávok
  for (let i = 0; i < 70; i++) {
    const x0 = r() * S;
    const w = 2 + r() * 18;
    const a = 0.05 + r() * 0.18;
    g.strokeStyle = hexA(dark, a);
    g.lineWidth = w;
    g.beginPath();
    const amp = 4 + r() * 16;
    const freq = 0.002 + r() * 0.006;
    const ph = r() * 6.28;
    for (let y = -10; y <= S + 10; y += 8) {
      const x = x0 + Math.sin(y * freq + ph) * amp + Math.sin(y * freq * 3.1 + ph) * amp * 0.2;
      if (y === -10) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    // a csempézhetőséghez a széleken átfordul
    if (x0 < 40 || x0 > S - 40) {
      g.save();
      g.translate(x0 < 40 ? S : -S, 0);
      g.stroke();
      g.restore();
    }
  }
  // finom pórusok
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = hexA(dark, 0.06 + r() * 0.12);
    g.fillRect(r() * S, r() * S, 1, 2 + r() * 10);
  }
  const t = new THREE.CanvasTexture(c);
  finish(t, true);
  if (!vertical) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
  }
  cache.set(key, t);
  return t;
}

/** Szürke zaj: dombornyomás (antracit fólia, vakolat). */
export function noiseTexture(size = 256, seed = 3, soft = 1): THREE.Texture {
  const key = `noise:${size}:${seed}:${soft}`;
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(size, size);
  const r = rng(seed);
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (r() - 0.5) * 255;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  if (soft > 0) {
    g.filter = `blur(${soft}px)`;
    g.drawImage(c, 0, 0);
  }
  const t = finish(new THREE.CanvasTexture(c), false);
  cache.set(key, t);
  return t;
}

/** Szúnyogháló-szövet: sötét rács átlátszó alapon. */
export function meshTexture(): THREE.Texture {
  const key = 'screen';
  if (cache.has(key)) return cache.get(key)!;
  const S = 64;
  const [c, g] = canvas(S, S);
  g.clearRect(0, 0, S, S);
  g.fillStyle = 'rgba(30,33,35,0.95)';
  for (let i = 0; i < S; i += 8) {
    g.fillRect(i, 0, 2, S);
    g.fillRect(0, i, S, 2);
  }
  const t = finish(new THREE.CanvasTexture(c), true);
  cache.set(key, t);
  return t;
}

function mix(a: string, b: string, t: number) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, t).getHexString();
}
function hexA(hex: string, a: number) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

/** Elmosott „kilátás” az üveg mögé (belső nézethez): égbolt, távoli fasor, gyep. Kódból rajzolva. */
export function outsideViewTexture(): THREE.Texture {
  const key = 'view:out';
  if (cache.has(key)) return cache.get(key)!;
  const W = 1024;
  const H = 1024;
  const [c, g] = canvas(W, H);
  const sky = g.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, '#cfdbe0');
  sky.addColorStop(1, '#eef1ee');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const r = rng(21);
  // távoli fasor
  for (let i = 0; i < 46; i++) {
    const x = r() * W;
    const rad = 40 + r() * 110;
    const y = H * 0.6 - r() * 90;
    g.fillStyle = ['#8fa08a', '#7d8f7a', '#a3b19c', '#6f8270'][i % 4];
    g.beginPath();
    g.ellipse(x, y, rad, rad * (0.9 + r() * 0.5), 0, 0, Math.PI * 2);
    g.fill();
  }
  // gyep
  const lawn = g.createLinearGradient(0, H * 0.64, 0, H);
  lawn.addColorStop(0, '#b4bf9e');
  lawn.addColorStop(1, '#9caa86');
  g.fillStyle = lawn;
  g.fillRect(0, H * 0.64, W, H * 0.36);
  // mélységélesség: erős elmosás
  const [c2, g2] = canvas(W, H);
  g2.filter = 'blur(18px)';
  g2.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c2);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** Elmosott, félhomályos szobabelső az üveg mögé (külső nézethez). */
export function insideViewTexture(): THREE.Texture {
  const key = 'view:in';
  if (cache.has(key)) return cache.get(key)!;
  const W = 512;
  const H = 512;
  const [c, g] = canvas(W, H);
  g.fillStyle = '#2f2d2a';
  g.fillRect(0, 0, W, H);
  // távoli belső fény (egy szemközti ablak / lámpa derengése)
  const glow = g.createRadialGradient(W * 0.68, H * 0.38, 10, W * 0.68, H * 0.38, W * 0.5);
  glow.addColorStop(0, 'rgba(170,150,120,0.55)');
  glow.addColorStop(1, 'rgba(170,150,120,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  // függöny/fal sávok
  g.fillStyle = 'rgba(80,74,66,0.55)';
  g.fillRect(W * 0.08, 0, W * 0.12, H);
  g.fillStyle = 'rgba(20,19,18,0.6)';
  g.fillRect(0, H * 0.78, W, H * 0.22);
  const [c2, g2] = canvas(W, H);
  g2.filter = 'blur(14px)';
  g2.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c2);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** Márvány hatású felület: világos alap, elmosott erezet. Kódból rajzolva. */
export function marbleTexture(dark: string, light: string): THREE.Texture {
  const key = `marble:${dark}:${light}`;
  if (cache.has(key)) return cache.get(key)!;
  const S = 1024;
  const [c, g] = canvas(S, S);
  g.fillStyle = light;
  g.fillRect(0, 0, S, S);
  const r = rng(31);
  for (let k = 0; k < 26; k++) {
    let x = r() * S;
    let y = r() * S;
    let a = r() * Math.PI * 2;
    g.strokeStyle = hexA(dark, 0.08 + r() * 0.22);
    g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath();
    g.moveTo(x, y);
    for (let i = 0; i < 90; i++) {
      a += (r() - 0.5) * 0.5;
      x += Math.cos(a) * 14;
      y += Math.sin(a) * 14;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const [c2, g2] = canvas(S, S);
  g2.drawImage(c, 0, 0);
  g2.filter = 'blur(1.2px)';
  g2.globalAlpha = 0.7;
  g2.drawImage(c, 0, 0);
  const t = finish(new THREE.CanvasTexture(c2), true);
  cache.set(key, t);
  return t;
}
