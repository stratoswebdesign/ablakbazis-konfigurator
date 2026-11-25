import type { FieldSpec, ProductDef } from '../config/types';
import { fmtMm } from './state';
import { layoutUnit, openingSymbols, type Rect } from './layout';

/**
 * Nézetrajz (belső nézet) a műszaki rajz konvencióival: tok, osztó, szárny, üveg,
 * nyitásjelölés, méretvonal 45°-os jelölővel. Ugyanez a rajz a termékikon, a hero,
 * az osztás-választó és az értékesítői adatlap.
 */
export interface ElevationProps {
  product: ProductDef;
  width: number;
  height: number;
  fields: FieldSpec[];
  shutter?: boolean;
  /** Belső párkány a nézetrajzon. */
  sill?: boolean;
  panelId?: string;
  dims?: boolean;
  symbols?: boolean;
  detail?: 'icon' | 'full';
  /** Vonalrajz-animáció (hero). Ekkor a vonalvastagság rajzi egységben értendő. */
  draw?: boolean;
  /** Közelítő megjelenítési szélesség px-ben (a `draw` módú vonalvastagsághoz). */
  renderPx?: number;
  highlight?: number;
  className?: string;
  title?: string;
}

export function elevationBox(_product: ProductDef, width: number, height: number, shutter: boolean, dims: boolean) {
  const totalH = height + (shutter ? 170 : 0);
  const m = Math.max(width, totalH);
  const pad = dims ? m * 0.12 + 150 : m * 0.035;
  const padTop = dims ? m * 0.05 : m * 0.035;
  return { x: -pad, y: -padTop, w: width + pad + (dims ? m * 0.05 : pad), h: totalH + padTop + pad, totalH, m };
}

export function Elevation({ product, width, height, fields, shutter = false, sill = false, panelId = 'teli', dims = false, symbols = true, detail = 'full', draw = false, renderPx = 480, highlight, className, title }: ElevationProps) {
  const L = layoutUnit(product, width, height, fields, shutter, panelId);
  const vb0 = elevationBox(product, width, height, shutter, dims);
  // párkánnyal a rajz alja lejjebb nyúlik (a méretvonal is lejjebb kerül)
  const vb = sill ? { ...vb0, h: vb0.h + (dims ? 80 : 60) } : vb0;
  const top = vb.totalH; // y-tükrözés: rajzi y = top - y
  const sy = (y: number) => top - y;
  const R = (r: Rect) => ({ x: r.x, y: sy(r.y + r.h), width: Math.max(0, r.w), height: Math.max(0, r.h) });
  const sw = draw ? (vb.w / renderPx) * 1.35 : undefined;
  const fs = vb.m * 0.042;
  let i = 0;
  const d = () => (draw ? { pathLength: 1, className: 'draw', style: { ['--i' as string]: i++ } } : {});
  const ns = draw ? {} : { vectorEffect: 'non-scaling-stroke' as const };
  const icon = detail === 'icon';

  return (
    <svg
      className={['elevation', icon ? 'is-icon' : '', className].filter(Boolean).join(' ')}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={sw ? ({ ['--sw' as string]: sw } as React.CSSProperties) : undefined}
    >
      {/* üveg */}
      {L.fields.map((f) =>
        f.glass.w > 0 ? <rect key={`g${f.index}`} {...R(f.glass)} className={`el-glass${f.spec.type === 'oldalvilagito' ? ' is-frosted' : ''}${highlight === f.index ? ' is-hl' : ''}`} /> : null,
      )}
      {/* ajtólap */}
      {L.fields.map((f) => (f.door ? <rect key={`d${f.index}`} {...R(f.door)} className="el-door" {...ns} {...d()} /> : null))}
      {L.fields.map((f) => (f.door && f.glass.w > 0 ? <rect key={`dg${f.index}`} {...R(f.glass)} className="el-line" {...ns} {...d()} /> : null))}
      {/* tok */}
      <rect {...R({ x: 0, y: 0, w: width, h: height })} className="el-frame" {...ns} {...d()} />
      {!icon && <rect {...R({ x: L.P.frameFace, y: L.bottomFace, w: width - 2 * L.P.frameFace, h: height - L.bottomFace - L.P.frameFace })} className="el-line" {...ns} {...d()} />}
      {L.mullions.map((m, k) => (
        <rect key={`m${k}`} {...R(m)} className="el-line" {...ns} {...d()} />
      ))}
      {/* szárnyak */}
      {L.fields.map((f) =>
        f.sash ? (
          <g key={`s${f.index}`}>
            <rect {...R(f.sash)} className="el-frame" {...ns} {...d()} />
            {!icon && <rect {...R(f.glass)} className="el-line" {...ns} {...d()} />}
          </g>
        ) : null,
      )}
      {/* belső párkány (a nézetrajzon a tok alatt, fülekkel) */}
      {sill && <rect {...R({ x: -70, y: -46, w: width + 140, h: 34 })} rx={4} className="el-sill" {...ns} {...d()} />}
      {/* redőnytok */}
      {L.box && <rect {...R(L.box)} className="el-frame" {...ns} {...d()} />}
      {L.box && !icon && <line x1={0} x2={width} y1={sy(L.box.y + 40)} y2={sy(L.box.y + 40)} className="el-line" {...ns} {...d()} />}
      {/* nyitásjelölés */}
      {symbols &&
        L.fields.flatMap((f) =>
          openingSymbols(f).map(([x1, y1, x2, y2], k) => <line key={`y${f.index}-${k}`} x1={x1} y1={sy(y1)} x2={x2} y2={sy(y2)} className="el-sym" {...ns} {...d()} />),
        )}
      {/* kilincs */}
      {L.fields.map((f) => {
        if (!f.handle) return null;
        const h = f.handle;
        const isDoor = !!f.door;
        const r: Rect = isDoor
          ? { x: h.side === 'right' ? h.x - 150 : h.x, y: h.y - 12, w: 150, h: 24 }
          : { x: h.x - 11, y: h.y - 125, w: 22, h: 150 };
        return <rect key={`h${f.index}`} {...R(r)} rx={8} className="el-handle" {...ns} />;
      })}
      {/* méretvonalak */}
      {dims && (
        <g className="el-dims">
          <DimLine x1={0} y1={sy(0) + vb.m * 0.07 + (sill ? 70 : 0)} x2={width} y2={sy(0) + vb.m * 0.07 + (sill ? 70 : 0)} ext={[sy(0) + vb.m * 0.015 + (sill ? 60 : 0), sy(0) + vb.m * 0.09 + (sill ? 70 : 0)]} horizontal value={width} fs={fs} draw={draw} d={d} ns={ns} />
          <DimLine x1={-vb.m * 0.07} y1={sy(0)} x2={-vb.m * 0.07} y2={sy(height)} ext={[-vb.m * 0.015, -vb.m * 0.09]} value={height} fs={fs} draw={draw} d={d} ns={ns} />
        </g>
      )}
    </svg>
  );
}

function DimLine({ x1, y1, x2, y2, ext, horizontal, value, fs, d, ns }: { x1: number; y1: number; x2: number; y2: number; ext: [number, number]; horizontal?: boolean; value: number; fs: number; draw: boolean; d: () => object; ns: object }) {
  const t = fs * 0.32;
  const label = fmtMm(value);
  return (
    <g>
      {horizontal ? (
        <>
          <line x1={x1} y1={ext[0]} x2={x1} y2={ext[1]} className="el-ext" {...ns} {...d()} />
          <line x1={x2} y1={ext[0]} x2={x2} y2={ext[1]} className="el-ext" {...ns} {...d()} />
        </>
      ) : (
        <>
          <line x1={ext[0]} y1={y1} x2={ext[1]} y2={y1} className="el-ext" {...ns} {...d()} />
          <line x1={ext[0]} y1={y2} x2={ext[1]} y2={y2} className="el-ext" {...ns} {...d()} />
        </>
      )}
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="el-dim" {...ns} {...d()} />
      <line x1={x1 - t} y1={y1 + t} x2={x1 + t} y2={y1 - t} className="el-tick" {...ns} {...d()} />
      <line x1={x2 - t} y1={y2 + t} x2={x2 + t} y2={y2 - t} className="el-tick" {...ns} {...d()} />
      {horizontal ? (
        <text x={(x1 + x2) / 2} y={y1 - fs * 0.45} fontSize={fs} textAnchor="middle" className="el-text">
          {label}
        </text>
      ) : (
        <text x={x1 - fs * 0.45} y={(y1 + y2) / 2} fontSize={fs} textAnchor="middle" className="el-text" transform={`rotate(-90 ${x1 - fs * 0.45} ${(y1 + y2) / 2})`}>
          {label}
        </text>
      )}
    </g>
  );
}
