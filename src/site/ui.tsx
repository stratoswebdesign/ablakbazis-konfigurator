import type { BrandConfig } from '../config/types';

/** Az Ablakbázis szöveges szóvédjegye („Ablak” + narancs „bázis”), az oldal betűjével szedve. */
export function Wordmark({ brand, as: Tag = 'span' }: { brand: BrandConfig; note?: boolean; as?: 'span' | 'div' }) {
  return (
    <Tag className="wordmark" aria-label={brand.name}>
      <span className="wordmark__a" aria-hidden="true">
        {brand.wordmark[0]}
      </span>
      <span className="wordmark__b" aria-hidden="true">
        {brand.wordmark[1]}
      </span>
    </Tag>
  );
}

type IconName = 'arrow-right' | 'arrow-left' | 'arrow-down' | 'check' | 'rotate' | 'play' | 'minus' | 'plus' | 'print' | 'close' | 'menu' | 'edit' | 'phone';

/** Saját vonalikonok 1.5 px vonallal – ugyanaz a vonalvastagság, mint a nézetrajzon. */
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const };
  const paths: Record<IconName, React.ReactNode> = {
    'arrow-right': <path d="M4 10h11M11 5.5 15.5 10 11 14.5" {...p} />,
    'arrow-left': <path d="M16 10H5M9 5.5 4.5 10 9 14.5" {...p} />,
    'arrow-down': <path d="M10 4v11M5.5 11 10 15.5 14.5 11" {...p} />,
    check: <path d="M4.5 10.5 8.5 14.5 15.5 6" {...p} />,
    rotate: (
      <>
        <path d="M15.5 8.5A6 6 0 1 0 16 12" {...p} />
        <path d="M16 4v4.5h-4.5" {...p} />
      </>
    ),
    play: <path d="M6.5 4.5v11l9-5.5z" {...p} />,
    minus: <path d="M5 10h10" {...p} />,
    plus: <path d="M5 10h10M10 5v10" {...p} />,
    print: (
      <>
        <path d="M6 7.5V3.5h8v4M6 13H3.5V7.5h13V13H14" {...p} />
        <path d="M6 11h8v5.5H6z" {...p} />
      </>
    ),
    close: <path d="M5 5l10 10M15 5 5 15" {...p} />,
    menu: <path d="M3.5 6.5h13M3.5 10h13M3.5 13.5h13" {...p} />,
    edit: <path d="M4 16h3.5L16 7.5 12.5 4 4 12.5z" {...p} />,
    phone: <path d="M5 3.5h3l1.5 4-2 1.3a9 9 0 0 0 3.7 3.7l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A13.5 13.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z" {...p} strokeLinejoin="round" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="icon">
      {paths[name]}
    </svg>
  );
}
