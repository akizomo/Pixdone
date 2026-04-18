import type { CSSProperties } from 'react';
import type { ThemeKey } from '../design-system/themes/themeRegistry';
import './AgentIcon.css';

const AGENT_SPRITES: Partial<Record<ThemeKey, string>> = {
  arcade: '/world/arcade/sprites/agent-arcade-0001.png',
  // synthwave and forestbit will be added when assets are available
};

const FALLBACK_SPRITE = AGENT_SPRITES.arcade!;

export interface AgentIconProps {
  themeKey: ThemeKey;
  isPremium?: boolean;
  size?: number;
  /** Show only the face (top crop), flipped horizontally — for menus/profiles */
  faceOnly?: boolean;
  className?: string;
}

export function AgentIcon({
  themeKey,
  isPremium = false,
  size = 32,
  faceOnly = false,
  className = '',
}: AgentIconProps) {
  const src = AGENT_SPRITES[themeKey] ?? FALLBACK_SPRITE;

  const wrapperStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const imgClass = [
    'pd-agent-icon__img',
    faceOnly ? 'pd-agent-icon__img--face' : '',
  ].filter(Boolean).join(' ');

  return (
    <span
      className={`pd-agent-icon ${className}`.trim()}
      style={wrapperStyle}
    >
      <img
        src={src}
        alt="Agent"
        style={{ imageRendering: 'pixelated' }}
        className={imgClass}
      />
      {isPremium && (
        <span className="pd-agent-icon__badge">+</span>
      )}
    </span>
  );
}
