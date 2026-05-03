import { describe, it, expect } from 'vitest';
import { isValidElement, type ReactElement } from 'react';
import { formatDescription, makeSiteLink } from './description';

function isLinkElement(
  node: unknown,
): node is ReactElement<{ href: string; children: string }> {
  return isValidElement(node) && (node as ReactElement).type === 'a';
}

describe('makeSiteLink', () => {
  it('formats as markdown-style link', () => {
    expect(makeSiteLink('Example', 'https://example.com')).toBe(
      '[Example](https://example.com)',
    );
  });

  it('handles empty label gracefully', () => {
    expect(makeSiteLink('', 'https://example.com')).toBe('[](https://example.com)');
  });

  it('preserves query strings and fragments in URL', () => {
    const url = 'https://example.com/path?q=1#section';
    expect(makeSiteLink('Example', url)).toBe(`[Example](${url})`);
  });
});

describe('formatDescription', () => {
  it('returns plain text unchanged when no links are present', () => {
    const out = formatDescription('hello world');
    expect(out).toEqual(['hello world']);
  });

  it('extracts a single [label](url) pattern into an <a> node', () => {
    const out = formatDescription('see [Example](https://example.com) for more');
    expect(out).toHaveLength(3);
    expect(out[0]).toBe('see ');
    const linkNode = out[1];
    if (!isLinkElement(linkNode)) throw new Error('expected <a> element');
    expect(linkNode.props.href).toBe('https://example.com');
    expect(linkNode.props.children).toBe('Example');
    expect(out[2]).toBe(' for more');
  });

  it('handles multiple links in one string', () => {
    const out = formatDescription('[A](https://a.test) and [B](https://b.test)');
    const hrefs = out.filter(isLinkElement).map((p) => p.props.href);
    expect(hrefs).toEqual(['https://a.test', 'https://b.test']);
  });

  it('returns empty-style array when input is empty', () => {
    expect(formatDescription('')).toEqual([]);
  });

  it('does not mis-parse unmatched brackets', () => {
    const out = formatDescription('[unclosed link(no close');
    expect(out).toEqual(['[unclosed link(no close']);
  });

  it('is re-entrant: calling twice gives the same shape', () => {
    const first = formatDescription('hi [X](https://x.test)');
    const second = formatDescription('hi [X](https://x.test)');
    expect(first.length).toBe(second.length);
  });
});
