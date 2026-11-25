import { useId } from 'react';
import type { BrandConfig, ColorDef, FieldType, ShutterType } from '../config/types';
import { Icon } from '../site/ui';
import { Elevation, elevationBox } from './Elevation';
import { layoutUnit } from './layout';
import { clamp, fmtArea, fmtMm, productOf, sizeRangeOf, STEP_LABELS, stepsFor, systemOf, type Action, type State, type StepId } from './state';

export interface StepProps {
  brand: BrandConfig;
  s: State;
  dispatch: React.Dispatch<Action>;
}

export const STEP_COPY: Record<StepId, { title: string; lead: string }> = {
  termek: { title: 'Mit szeretnél?', lead: 'Válassz terméket, majd a Kömmerling-rendszert és az üvegezést.' },
  meret: { title: 'Mekkora legyen?', lead: 'Add meg a tokméretet milliméterben. A modell valós arányban követi.' },
  osztas: { title: 'Hogyan nyíljon?', lead: 'Válaszd ki a mezők számát, majd jelölj ki egy mezőt, és állítsd be.' },
  szin: { title: 'Milyen színben?', lead: 'A tok és a szárny színe. Színes változatnál kérheted úgy is, hogy belül fehér maradjon.' },
  parkany: { title: 'Milyen párkány kell?', lead: 'Belső és külső párkány – anyag, szín és mélység. A modell ráközelít, hogy jól lásd.' },
  arnyekolas: { title: 'Kell redőny?', lead: 'Külső tokos, vakolható vagy ráépíthető – és szúnyogháló, ha kéred.' },
  osszegzes: { title: 'Így néz ki.', lead: 'Nézd át. Bármelyik sort módosíthatod, mielőtt ajánlatot kérsz.' },
  ajanlat: { title: 'Kinek küldjük az ajánlatot?', lead: 'Az összeállításodat és ezeket az adatokat kapja meg a kollégánk.' },
};

export function StepBody(props: StepProps) {
  switch (props.s.step) {
    case 'termek':
      return <ProductStep {...props} />;
    case 'meret':
      return <SizeStep {...props} />;
    case 'osztas':
      return <DivisionStep {...props} />;
    case 'szin':
      return <ColorStep {...props} />;
    case 'parkany':
      return <SillStep {...props} />;
    case 'arnyekolas':
      return <ShadingStep {...props} />;
    case 'osszegzes':
      return <SummaryStep {...props} />;
    case 'ajanlat':
      return <RequestStep {...props} />;
  }
}

function Corners() {
  return (
    <span className="check-badge" aria-hidden="true">
      <Icon name="check" size={14} />
    </span>
  );
}

/* ---------------- Termék ---------------- */

function ProductStep({ brand, s, dispatch }: StepProps) {
  const p = productOf(brand, s.productId);
  const sys = systemOf(p, s.systemId);
  return (
    <div className="stack">
      <div className="options options--products" role="radiogroup" aria-label="Termék">
        {brand.products.map((pr) => {
          const n = pr.fieldCounts.includes(2) ? 2 : pr.fieldCounts[0];
          const size = pr.defaultSize[n] ?? Object.values(pr.defaultSize)[0];
          const sel = s.productId === pr.id;
          return (
            <button key={pr.id} type="button" role="radio" aria-checked={sel} className={`option option--product${sel ? ' is-selected' : ''}`} onClick={() => dispatch({ type: 'product', id: pr.id })}>
              <span className="option__figure">
                <Elevation product={pr} width={size.w} height={size.h} fields={pr.defaultFields[n]} detail="icon" sill={pr.kind === 'sill'} symbols={pr.kind !== 'sill'} />
              </span>
              <span className="option__text">
                <span className="option__name">{pr.name}</span>
                <span className="option__desc">{pr.short}</span>
              </span>
              <Corners />
            </button>
          );
        })}
      </div>

      {p.systems.length > 0 && (
        <fieldset className="fieldset">
          <legend className="field-label">Profilrendszer</legend>
          <div className="options options--systems" role="radiogroup" aria-label="Profilrendszer">
            {p.systems.map((x) => {
              const sel = sys?.id === x.id;
              return (
                <button key={x.id} type="button" role="radio" aria-checked={sel} className={`option option--system${sel ? ' is-selected' : ''}`} onClick={() => dispatch({ type: 'system', id: x.id })}>
                  <span className="option__name">{x.name}</span>
                  <span className="option__facts">
                    {x.facts.map((f) => (
                      <span key={f}>{f}</span>
                    ))}
                  </span>
                  <Corners />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {sys && (
        <fieldset className="fieldset">
          <legend className="field-label">Üvegezés</legend>
          <div className="segmented">
            {(['2', '3'] as const).map((g) => (
              <button key={g} type="button" className="segmented__btn" aria-pressed={s.glazing === g} disabled={!sys.glazing.includes(g)} onClick={() => dispatch({ type: 'glazing', value: g })}>
                {g} rétegű
              </button>
            ))}
          </div>
          {sys.glazing.length === 1 && <p className="hint hint--gap">A {sys.name} ennél a terméknél háromrétegű üvegezéssel készül.</p>}
        </fieldset>
      )}
    </div>
  );
}

/* ---------------- Méret ---------------- */

function SizeStep({ brand, s, dispatch }: StepProps) {
  const p = productOf(brand, s.productId);
  const r = sizeRangeOf(p, s.systemId);
  const sys = systemOf(p, s.systemId);
  if (p.kind === 'sill') {
    return (
      <div className="stack">
        <DimInput label="Nyílás szélessége" value={s.width} range={r.w} onChange={(v) => dispatch({ type: 'size', width: v })} />
        <p className="hint">A párkány hossza ehhez igazodik, a két végén a falba nyúló füllel. A mélységet a következő lépésben adod meg.</p>
      </div>
    );
  }
  return (
    <div className="stack">
      <DimInput label="Szélesség" value={s.width} range={r.w} onChange={(v) => dispatch({ type: 'size', width: v })} />
      <DimInput label="Magasság" value={s.height} range={r.h} onChange={(v) => dispatch({ type: 'size', height: v })} />
      <p className="readout">
        <span className="readout__label">Felület</span>
        <span className="readout__value">{fmtArea(s.width, s.height)} m²</span>
      </p>
      {sys?.sizeRange && (
        <p className="hint">
          A {sys.name} {p.name.toLowerCase()} tokkülmérete {fmtMm(r.w[0] / 10)}–{fmtMm(r.w[1] / 10)} cm széles és {fmtMm(r.h[0] / 10)}–{fmtMm(r.h[1] / 10)} cm magas lehet.
        </p>
      )}
      <p className="hint">Ha még nincs pontos méreted, írj közelítőt – az ajánlatkérésben jelezheted.</p>
    </div>
  );
}

function DimInput({ label, value, range, onChange, step = 10 }: { label: string; value: number; range: [number, number]; onChange: (v: number) => void; step?: number }) {
  const id = useId();
  return (
    <div className="dim-input">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="dim-input__row">
        <button type="button" className="icon-btn" aria-label={`${label} csökkentése ${step} mm-rel`} onClick={() => onChange(clamp(value - step, range[0], range[1]))}>
          <Icon name="minus" />
        </button>
        <div className="dim-input__field">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={range[0]}
            max={range[1]}
            step={1}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v) && v >= range[0] && v <= range[1]) onChange(v);
            }}
            onBlur={(e) => onChange(clamp(Number(e.target.value) || range[0], range[0], range[1]))}
          />
          <span className="dim-input__unit" aria-hidden="true">
            mm
          </span>
        </div>
        <button type="button" className="icon-btn" aria-label={`${label} növelése ${step} mm-rel`} onClick={() => onChange(clamp(value + step, range[0], range[1]))}>
          <Icon name="plus" />
        </button>
      </div>
      <input
        type="range"
        className="slider"
        aria-label={`${label} csúszkával`}
        min={range[0]}
        max={range[1]}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as string]: `${((value - range[0]) / (range[1] - range[0])) * 100}%` }}
      />
      <div className="slider__scale" aria-hidden="true">
        <span>{fmtMm(range[0])}</span>
        <span>{fmtMm(range[1])}</span>
      </div>
    </div>
  );
}

/* ---------------- Osztás ---------------- */

function DivisionStep({ brand, s, dispatch }: StepProps) {
  const p = productOf(brand, s.productId);
  const L = layoutUnit(p, s.width, s.height, s.fields, false, s.panelId);
  const vb = elevationBox(p, s.width, s.height, false, false);
  const f = s.fields[s.selectedField];
  const entrance = p.kind === 'entrance';
  const countLabel = (n: number) => (entrance ? ['Csak ajtó', 'Ajtó + oldalvilágító', 'Két oldalvilágító'][n - 1] : `${n} mező`);
  const opens = f.type !== 'fix' && f.type !== 'oldalvilagito';
  return (
    <div className="stack">
      <fieldset className="fieldset">
        <legend className="field-label">{entrance ? 'Kialakítás' : 'Mezők száma'}</legend>
        <div className="segmented">
          {p.fieldCounts.map((n) => (
            <button key={n} type="button" aria-pressed={s.fields.length === n} className="segmented__btn" onClick={() => dispatch({ type: 'fieldCount', count: n })}>
              {countLabel(n)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field-picker">
        <p className="field-label" id="field-picker-label">
          Kijelölt mező
        </p>
        <div className="field-picker__drawing" style={{ aspectRatio: `${vb.w} / ${vb.h}`, width: `min(100%, ${(220 * vb.w) / vb.h}px)` }}>
          <Elevation product={p} width={s.width} height={s.height} fields={s.fields} panelId={s.panelId} highlight={s.selectedField} />
          <div className="field-picker__hits" role="group" aria-labelledby="field-picker-label">
            {L.fields.map((fl) => (
              <button
                key={fl.index}
                type="button"
                className="field-hit"
                aria-pressed={s.selectedField === fl.index}
                aria-label={`${fl.index + 1}. mező: ${brand.fieldTypeLabels[fl.spec.type]}`}
                style={{
                  left: `${((fl.area.x - vb.x) / vb.w) * 100}%`,
                  width: `${(fl.area.w / vb.w) * 100}%`,
                  top: `${((vb.totalH - fl.area.y - fl.area.h - vb.y) / vb.h) * 100}%`,
                  height: `${(fl.area.h / vb.h) * 100}%`,
                }}
                onClick={() => dispatch({ type: 'selectField', index: fl.index })}
              >
                <span className="field-hit__tag">{fl.index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <fieldset className="fieldset">
        <legend className="field-label">{s.fields.length > 1 ? `${s.selectedField + 1}. mező típusa` : 'Típus'}</legend>
        <div className="segmented">
          {p.fieldTypes.map((t: FieldType) => (
            <button key={t} type="button" aria-pressed={f.type === t} className="segmented__btn" onClick={() => dispatch({ type: 'fieldType', index: s.selectedField, fieldType: t })}>
              {brand.fieldTypeLabels[t]}
            </button>
          ))}
        </div>
      </fieldset>

      {opens && (
        <fieldset className="fieldset">
          <legend className="field-label">Pántoldal (belülről nézve)</legend>
          <div className="segmented">
            {(['bal', 'jobb'] as const).map((h) => (
              <button key={h} type="button" aria-pressed={f.hinge === h} className="segmented__btn" onClick={() => dispatch({ type: 'hinge', index: s.selectedField, hinge: h })}>
                {h === 'bal' ? 'Bal' : 'Jobb'}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {entrance && p.panels && (
        <fieldset className="fieldset">
          <legend className="field-label">Ajtópanel</legend>
          <div className="segmented">
            {p.panels.map((pn) => (
              <button key={pn.id} type="button" aria-pressed={s.panelId === pn.id} className="segmented__btn" onClick={() => dispatch({ type: 'panel', id: pn.id })}>
                {pn.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {opens && (
        <button type="button" className="btn btn--ghost btn--inline" onClick={() => dispatch({ type: 'demo' })}>
          <Icon name="play" />
          Nyitás bemutatása a modellen
        </button>
      )}
    </div>
  );
}

/* ---------------- Szín ---------------- */

function Swatch({ c }: { c: ColorDef }) {
  return <span className={`swatch swatch--${c.kind}`} style={{ ['--sw-base' as string]: c.base, ['--sw-a' as string]: c.grain?.[0] ?? c.base, ['--sw-b' as string]: c.grain?.[1] ?? c.base }} />;
}

function ColorStep({ brand, s, dispatch }: StepProps) {
  const p = productOf(brand, s.productId);
  const color = brand.colors.find((c) => c.id === s.colorId) ?? brand.colors[0];
  const canSplit = color.kind !== 'smooth';
  return (
    <div className="stack">
      <div className="options options--swatches" role="radiogroup" aria-label="Szín">
        {brand.colors.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={s.colorId === c.id} className={`option option--swatch${s.colorId === c.id ? ' is-selected' : ''}`} onClick={() => dispatch({ type: 'color', id: c.id })}>
            <Swatch c={c} />
            <span className="option__name">{c.name}</span>
            <Corners />
          </button>
        ))}
      </div>
      {canSplit && (
        <fieldset className="fieldset">
          <legend className="field-label">Hol legyen {color.name.toLowerCase()}?</legend>
          <div className="segmented">
            <button type="button" className="segmented__btn" aria-pressed={!s.colorOutsideOnly} onClick={() => dispatch({ type: 'colorOutsideOnly', value: false })}>
              Kívül és belül
            </button>
            <button type="button" className="segmented__btn" aria-pressed={s.colorOutsideOnly} onClick={() => dispatch({ type: 'colorOutsideOnly', value: true })}>
              Csak kívül
            </button>
          </div>
        </fieldset>
      )}
      <fieldset className="fieldset">
        <legend className="field-label">{p.kind === 'entrance' ? 'Kilincs és fogantyú' : 'Kilincs'}</legend>
        <div className="segmented">
          {brand.handles.map((h) => (
            <button key={h.id} type="button" className="segmented__btn segmented__btn--dot" aria-pressed={s.handleId === h.id} onClick={() => dispatch({ type: 'handle', id: h.id })}>
              <span className="dot" style={{ background: h.base }} aria-hidden="true" />
              {h.name}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/* ---------------- Párkány ---------------- */

function SillPicker({ legend, options, value, onPick }: { legend: string; options: ColorDef[]; value: string; onPick: (id: string) => void }) {
  return (
    <div className="options options--sills" role="radiogroup" aria-label={legend}>
      <button type="button" role="radio" aria-checked={value === 'none'} className={`option option--swatch${value === 'none' ? ' is-selected' : ''}`} onClick={() => onPick('none')}>
        <span className="swatch swatch--none" />
        <span className="option__name">Nem kérek</span>
        <Corners />
      </button>
      {options.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={value === c.id} className={`option option--swatch${value === c.id ? ' is-selected' : ''}`} onClick={() => onPick(c.id)}>
          <Swatch c={c} />
          <span className="option__name">{c.name}</span>
          <Corners />
        </button>
      ))}
    </div>
  );
}

function SillStep({ brand, s, dispatch }: StepProps) {
  const p = productOf(brand, s.productId);
  const len = s.width + 2 * (12 + 34);
  return (
    <div className="stack">
      <section className="sill-block" aria-labelledby="sill-in">
        <div className="sill-block__head">
          <h4 id="sill-in" className="sill-block__title">
            Belső párkány
          </h4>
          <button type="button" className="chip-link" onClick={() => dispatch({ type: 'view', value: 'inside' })} aria-pressed={s.view === 'inside'}>
            Mutasd belülről
          </button>
        </div>
        <SillPicker legend="Belső párkány anyaga" options={brand.sills.inner} value={s.sillIn} onPick={(id) => dispatch({ type: 'sillIn', id })} />
        {s.sillIn !== 'none' && <DimInput label="Mélység" value={s.sillInDepth} range={brand.sills.innerDepth.range} step={10} onChange={(v) => dispatch({ type: 'sillInDepth', value: v })} />}
      </section>

      <section className="sill-block" aria-labelledby="sill-out">
        <div className="sill-block__head">
          <h4 id="sill-out" className="sill-block__title">
            Külső párkány
          </h4>
          <button type="button" className="chip-link" onClick={() => dispatch({ type: 'view', value: 'outside' })} aria-pressed={s.view === 'outside'}>
            Mutasd kívülről
          </button>
        </div>
        <SillPicker legend="Külső párkány színe" options={brand.sills.outer} value={s.sillOut} onPick={(id) => dispatch({ type: 'sillOut', id })} />
        {s.sillOut !== 'none' && <DimInput label="Mélység" value={s.sillOutDepth} range={brand.sills.outerDepth.range} step={10} onChange={(v) => dispatch({ type: 'sillOutDepth', value: v })} />}
        {s.sillOut !== 'none' && <p className="hint">Alumínium párkány vízorral, a két végén véglezáróval.</p>}
      </section>

      {(s.sillIn !== 'none' || s.sillOut !== 'none') && (
        <p className="readout">
          <span className="readout__label">Párkányhossz {p.kind === 'sill' ? '' : '(a nyíláshoz)'}</span>
          <span className="readout__value">≈ {fmtMm(len)} mm</span>
        </p>
      )}
    </div>
  );
}

/* ---------------- Redőny ---------------- */

export function shutterWarning(brand: BrandConfig, s: State) {
  const def = brand.shutters.find((x) => x.id === s.shutterType);
  if (!def) return null;
  const over = s.width > def.max.w || s.height > def.max.h || (s.width * s.height) / 1e6 > def.max.area;
  if (!over) return null;
  return `A ${def.name.toLowerCase()} redőny legfeljebb ${def.max.w / 10} cm széles, ${def.max.h / 10} cm magas és ${String(def.max.area).replace('.', ',')} m² lehet. Ennél a méretnél az ajánlatban egyeztetjük a megoldást.`;
}

function ShadingStep({ brand, s, dispatch }: StepProps) {
  const warning = shutterWarning(brand, s);
  const opts: { id: ShutterType; name: string; short: string }[] = [{ id: 'none', name: 'Nem kérek', short: 'Redőny nélkül.' }, ...brand.shutters];
  return (
    <div className="stack">
      <div className="options options--shutters" role="radiogroup" aria-label="Redőny">
        {opts.map((o) => {
          const sel = s.shutterType === o.id;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={sel} className={`option option--row${sel ? ' is-selected' : ''}`} onClick={() => dispatch({ type: 'shutterType', value: o.id })}>
              <span className="option__name">{o.name}</span>
              <span className="option__desc">{o.short}</span>
              <Corners />
            </button>
          );
        })}
      </div>
      {warning && (
        <p className="notice" role="status">
          {warning}
        </p>
      )}
      {s.shutterType !== 'none' && (
        <div className="dim-input">
          <label className="field-label" htmlFor="shutter-pos">
            Redőny állása a modellen
          </label>
          <input
            id="shutter-pos"
            type="range"
            className="slider"
            min={0}
            max={100}
            step={1}
            value={Math.round(s.shutterPos * 100)}
            onChange={(e) => dispatch({ type: 'shutterPos', value: Number(e.target.value) / 100 })}
            style={{ ['--fill' as string]: `${s.shutterPos * 100}%` }}
          />
          <div className="slider__scale" aria-hidden="true">
            <span>Felhúzva</span>
            <span>Leengedve</span>
          </div>
        </div>
      )}
      <Toggle label="Szúnyogháló" desc="Keretes háló a tok külső oldalán." checked={s.screen} onChange={(v) => dispatch({ type: 'screen', value: v })} />
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className={`toggle${checked ? ' is-on' : ''}`}>
      <input id={id} type="checkbox" className="toggle__input" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id} className="toggle__label">
        <span className="toggle__text">
          <span className="option__name">{label}</span>
          <span className="option__desc">{desc}</span>
        </span>
        <span className="toggle__switch" aria-hidden="true">
          <span />
        </span>
      </label>
    </div>
  );
}

/* ---------------- Összegzés ---------------- */

export function summaryRows(brand: BrandConfig, s: State) {
  const p = productOf(brand, s.productId);
  const sys = systemOf(p, s.systemId);
  const color = brand.colors.find((c) => c.id === s.colorId) ?? brand.colors[0];
  const handle = brand.handles.find((h) => h.id === s.handleId) ?? brand.handles[0];
  const white = brand.colors.find((c) => c.kind === 'smooth');
  const sillIn = brand.sills.inner.find((c) => c.id === s.sillIn);
  const sillOut = brand.sills.outer.find((c) => c.id === s.sillOut);
  const rows: { step: StepId; label: string; value: string }[] = [{ step: 'termek', label: 'Termék', value: p.name }];
  if (sys) {
    rows.push({ step: 'termek', label: 'Rendszer', value: sys.name });
    rows.push({ step: 'termek', label: 'Üvegezés', value: `${s.glazing} rétegű` });
  }
  if (p.kind === 'sill') {
    rows.push({ step: 'meret', label: 'Nyílás', value: `${fmtMm(s.width)} mm széles` });
  } else {
    const fields = s.fields
      .map((f, i) => {
        const opens = f.type !== 'fix' && f.type !== 'oldalvilagito';
        return `${s.fields.length > 1 ? `${i + 1}. ` : ''}${brand.fieldTypeLabels[f.type]}${opens ? ` (${f.hinge} pánt)` : ''}`;
      })
      .join(', ');
    rows.push(
      { step: 'meret', label: 'Tokméret', value: `${fmtMm(s.width)} × ${fmtMm(s.height)} mm · ${fmtArea(s.width, s.height)} m²` },
      { step: 'osztas', label: p.kind === 'entrance' ? 'Kialakítás' : 'Osztás', value: fields + (p.kind === 'entrance' ? ` · ${p.panels?.find((x) => x.id === s.panelId)?.name ?? ''}` : '') },
      { step: 'szin', label: 'Szín', value: s.colorOutsideOnly && color.kind !== 'smooth' ? `${color.name} kívül, ${white?.name.toLowerCase()} belül` : color.name },
      { step: 'szin', label: 'Kilincs', value: handle.name },
    );
  }
  if (p.sills) {
    rows.push({ step: 'parkany', label: 'Belső párkány', value: sillIn ? `${sillIn.name}, ${fmtMm(s.sillInDepth)} mm mély` : 'Nem kér' });
    rows.push({ step: 'parkany', label: 'Külső párkány', value: sillOut ? `${sillOut.name} alumínium, ${fmtMm(s.sillOutDepth)} mm mély` : 'Nem kér' });
  }
  if (p.shading) {
    const def = brand.shutters.find((x) => x.id === s.shutterType);
    const sh = [def ? `${def.name} redőny` : '', s.screen ? 'szúnyogháló' : ''].filter(Boolean).join(', ');
    rows.push({ step: 'arnyekolas', label: 'Árnyékolás', value: sh || 'Nincs' });
  }
  return rows;
}

function SummaryStep({ brand, s, dispatch }: StepProps) {
  const p = productOf(brand, s.productId);
  const rows = summaryRows(brand, s);
  const warning = shutterWarning(brand, s);
  return (
    <div className="stack">
      <figure className="summary-figure">
        <Elevation
          product={p}
          width={s.width}
          height={s.height}
          fields={s.fields}
          shutter={s.shutterType === 'raepitheto'}
          sill={p.sills && s.sillIn !== 'none'}
          symbols={p.kind !== 'sill'}
          panelId={s.panelId}
          dims
          title={`Nézetrajz belülről: ${p.name}, ${fmtMm(s.width)} × ${fmtMm(s.height)} mm`}
        />
        <figcaption className="caption">Nézetrajz, belső nézet</figcaption>
      </figure>
      <dl className="spec-list">
        {rows.map((r) => (
          <div key={r.label} className="spec-list__row">
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
            <button type="button" className="text-btn" onClick={() => dispatch({ type: 'step', step: r.step })} aria-label={`${r.label} módosítása`}>
              Módosítom
            </button>
          </div>
        ))}
      </dl>
      {warning && <p className="notice">{warning}</p>}
    </div>
  );
}

/* ---------------- Ajánlatkérés ---------------- */

function RequestStep({ brand, s, dispatch }: StepProps) {
  const set = (patch: Partial<State['contact']>) => dispatch({ type: 'contact', patch });
  const regionId = useId();
  return (
    <form
      id="request-form"
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        dispatch({ type: 'submit' });
      }}
    >
      <TextField label="Név" autoComplete="name" value={s.contact.name} onChange={(v) => set({ name: v })} />
      <div className="form__row">
        <TextField label="E-mail" type="email" autoComplete="email" value={s.contact.email} onChange={(v) => set({ email: v })} />
        <TextField label="Telefon" type="tel" autoComplete="tel" value={s.contact.phone} onChange={(v) => set({ phone: v })} />
      </div>
      <div className="form__row">
        <div className="text-field">
          <label htmlFor={regionId} className="field-label">
            Régió
          </label>
          <select id={regionId} value={s.contact.region} onChange={(e) => set({ region: e.target.value })}>
            <option value="">Válassz régiót</option>
            {brand.regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Település" autoComplete="address-level2" value={s.contact.city} onChange={(v) => set({ city: v })} />
      </div>
      <TextField label="Üzenet" multiline value={s.contact.note} onChange={(v) => set({ note: v })} hint="Például: felújítás vagy új építés, hány darab, mikorra kellene." />
      <div className="check">
        <input id="consent" type="checkbox" checked={s.contact.consent} onChange={(e) => set({ consent: e.target.checked })} />
        <label htmlFor="consent">
          Elfogadom az{' '}
          <a href={brand.privacyUrl} target="_blank" rel="noreferrer">
            adatkezelési tájékoztatót
          </a>
          , és hozzájárulok, hogy az {brand.legalName} az ajánlat miatt felvegye velem a kapcsolatot.
        </label>
      </div>
      <p className="hint">Bemutató változat: az űrlap nem küld adatot.</p>
    </form>
  );
}

function TextField({ label, value, onChange, type = 'text', autoComplete, multiline, hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; autoComplete?: string; multiline?: boolean; hint?: string }) {
  const id = useId();
  return (
    <div className="text-field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-h` : undefined} />
      ) : (
        <input id={id} type={type} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && (
        <span id={`${id}-h`} className="hint">
          {hint}
        </span>
      )}
    </div>
  );
}

export function nextLabel(brand: BrandConfig, s: State) {
  const steps = stepsFor(productOf(brand, s.productId));
  const i = steps.indexOf(s.step);
  if (s.step === 'osszegzes' || s.step === 'ajanlat') return 'Ajánlatot kérek';
  return `Tovább: ${STEP_LABELS[steps[i + 1]]}`;
}
