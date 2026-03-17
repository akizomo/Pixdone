function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Markdown links: [label](https://example.com)
const MD_LINK_RE = /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^)\s<>"']+)\)/g;

function normalizeHref(raw: string) {
  const trimmed = raw.trim();
  return trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed;
}

/**
 * Convert markdown-ish details into safe HTML for contentEditable display.
 * - Renders [label](url) as <a href="...">label</a>
 * - Keeps newlines as <br/>
 */
export function richLinkMarkdownToHtml(md: string) {
  const safe = escapeHtml(md);
  const linked = safe.replace(MD_LINK_RE, (_m, label, url) => {
    const href = normalizeHref(String(url));
    const safeLabel = String(label);
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${safeLabel}</a>`;
  });
  return linked.replaceAll('\n', '<br/>');
}

/**
 * Serialize contentEditable DOM back to markdown-ish text.
 * - <a href="...">label</a> => [label](href)
 * - <br> => \n
 */
export function richLinkElementToMarkdown(root: HTMLElement) {
  const parts: string[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.nodeValue ?? '');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'br') {
      parts.push('\n');
      return;
    }

    if (tag === 'a') {
      const href = (el.getAttribute('href') ?? '').trim();
      const text = el.textContent ?? '';
      if (href) {
        parts.push(`[${text}](${href})`);
      } else {
        parts.push(text);
      }
      return;
    }

    const isBlock = tag === 'div' || tag === 'p';
    if (isBlock && parts.length && !parts[parts.length - 1]?.endsWith('\n')) parts.push('\n');

    Array.from(el.childNodes).forEach(walk);

    if (isBlock && parts.length && !parts[parts.length - 1]?.endsWith('\n')) parts.push('\n');
  }

  Array.from(root.childNodes).forEach(walk);

  return parts
    .join('')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

export function extractUrlFromText(text: string) {
  const trimmed = text.trim();
  // URL-only clipboard expected (include trailing "/" etc.)
  return /^(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)$/.test(trimmed) ? trimmed : undefined;
}

export function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  return trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed;
}

export function urlToLabel(raw: string) {
  const href = normalizeUrl(raw);
  try {
    const u = new URL(href);
    const host = u.host;
    const path = u.pathname === '/' ? '' : u.pathname;
    const label = `${host}${path}`.replace(/\/+$/, '');
    return label || href;
  } catch {
    // Fallback: strip scheme + trailing slash
    return href.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

