import type { ReactNode } from 'react';

type Props = {
  name: string;
  value: string;
  bg?: string;
  showTextOnBg?: boolean;
  border?: string;
  size?: 's' | 'm' | 'l';
  children?: ReactNode;
};

const sizeMap = { s: 56, m: 80, l: 112 };

export function ColorSwatch({
  name,
  value,
  bg = value,
  showTextOnBg = false,
  border,
  size = 'm',
  children,
}: Props) {
  const px = sizeMap[size];
  const textColor = showTextOnBg ? '#fff' : undefined;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        minWidth: px + 24,
      }}
    >
      <div
        style={{
          width: px,
          height: px,
          background: bg,
          border: border ? `2px solid ${border}` : '1px solid rgba(0,0,0,0.08)',
          borderRadius: 6,
          boxSizing: 'border-box',
          color: textColor,
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 4,
        }}
      >
        {children}
      </div>
      <div style={{ textAlign: 'center', maxWidth: px + 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pxd-color-text-primary, #191D24)' }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--pxd-color-text-secondary, #4C5160)', fontFamily: 'monospace' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export function ColorSwatchRow({
  items,
  size = 'm',
  darkBg = false,
}: {
  items: Array<{ name: string; value: string; showText?: boolean }>;
  size?: 's' | 'm' | 'l';
  darkBg?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        padding: darkBg ? 16 : 0,
        background: darkBg ? '#202124' : undefined,
        borderRadius: 8,
      }}
    >
      {items.map((item) => (
        <ColorSwatch
          key={item.name}
          name={item.name}
          value={item.value}
          showTextOnBg={item.showText}
          size={size}
        />
      ))}
    </div>
  );
}
