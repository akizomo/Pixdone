import type { ReactNode } from 'react';

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"']+)/gi;
const TRAIL_PUNCT_RE = /[),.?!:;"']+$/;
const MD_LINK_RE = /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^)\s<>"']+)\)/g;

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  const withoutTrail = trimmed.replace(TRAIL_PUNCT_RE, (m) => (m ? '' : m));
  const href = withoutTrail.startsWith('www.') ? `https://${withoutTrail}` : withoutTrail;
  const trailing = trimmed.slice(withoutTrail.length);
  return { href, label: withoutTrail, trailing };
}

function renderPlainTextWithLinks(text: string, keyPrefix: string): ReactNode[] {
  if (!text) return [''];

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_RE)) {
    const idx = match.index ?? -1;
    if (idx < 0) continue;

    const raw = match[1] ?? match[0] ?? '';
    if (!raw) continue;

    if (idx > lastIndex) {
      nodes.push(text.slice(lastIndex, idx));
    }

    const { href, label, trailing } = normalizeUrl(raw);

    nodes.push(
      <a
        key={`${keyPrefix}-link-${idx}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{
          color: 'var(--pd-color-accent-default)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
          wordBreak: 'break-word',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </a>,
    );

    if (trailing) nodes.push(trailing);

    lastIndex = idx + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

/**
 * Render text that may include Markdown-style links: [label](https://example.com)
 * Also auto-linkifies plain URLs.
 */
export function renderTextWithLinks(text: string): ReactNode[] {
  if (!text) return [''];

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MD_LINK_RE)) {
    const idx = match.index ?? -1;
    if (idx < 0) continue;

    const label = match[1] ?? '';
    const rawUrl = match[2] ?? '';
    if (!rawUrl) continue;

    if (idx > lastIndex) {
      nodes.push(...renderPlainTextWithLinks(text.slice(lastIndex, idx), `pre-${idx}`));
    }

    const { href } = normalizeUrl(rawUrl);
    nodes.push(
      <a
        key={`md-${idx}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{
          color: 'var(--pd-color-accent-default)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
          wordBreak: 'break-word',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {label || href}
      </a>,
    );

    lastIndex = idx + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderPlainTextWithLinks(text.slice(lastIndex), `post-${lastIndex}`));
  }

  return nodes.length ? nodes : [text];
}

