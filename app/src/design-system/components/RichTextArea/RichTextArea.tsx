import { useEffect, useId, useRef } from 'react';
import type { RichTextAreaProps } from './RichTextArea.types';
import './RichTextArea.css';
import {
  extractUrlFromText,
  normalizeUrl,
  richLinkElementToMarkdown,
  richLinkMarkdownToHtml,
  urlToLabel,
} from '../../utils/richLinks';

export function RichTextArea({
  label,
  value,
  helperText,
  errorText,
  disabled = false,
  placeholder,
  onChange,
  id: idProp,
  className = '',
  rows = 3,
  ...rest
}: RichTextAreaProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;
  const hasError = Boolean(errorText);
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const lastEmittedRef = useRef<string | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.dataset.empty = String(!(value ?? '').trim());
    const next = richLinkMarkdownToHtml(value ?? '');
    // Avoid resetting selection while user is editing.
    if (isFocusedRef.current && (value ?? '') === (lastEmittedRef.current ?? '')) return;
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  const minHeightPx = Math.max(80, rows * 20 + 20);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return;
    if (disabled) return;

    const paste = e.clipboardData.getData('text/plain') ?? '';
    const urlRaw = extractUrlFromText(paste);
    // Only intercept when clipboard is basically URL-only.
    if (!urlRaw || paste.trim() !== urlRaw.trim()) return;

    const host = editorRef.current;
    if (!host) return;

    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      // Use selection only when it belongs to this editor; otherwise fallback to end.
      if (host.contains(r.commonAncestorContainer)) range = r;
    }
    if (!range) {
      // Fallback: insert at end of editor
      range = document.createRange();
      range.selectNodeContents(host);
      range.collapse(false);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    e.preventDefault();
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = normalizeUrl(urlRaw);
    a.target = '_blank';
    a.rel = 'noreferrer';

    if (range.collapsed) {
      a.textContent = urlToLabel(urlRaw.trim());
      range.insertNode(a);
    } else {
      a.appendChild(range.extractContents());
      range.insertNode(a);
    }

    // Move cursor after link
    range.setStartAfter(a);
    range.collapse(true);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const el = editorRef.current;
    if (el) {
      const md = richLinkElementToMarkdown(el);
      lastEmittedRef.current = md;
      el.dataset.empty = String(!md.trim());
      onChange?.(md);
    }
  };

  return (
    <div className={`pxd-rich-text-area ${className}`.trim()}>
      {label && (
        <label id={labelId} className="pxd-rich-text-area__label">
          {label}
        </label>
      )}
      <div
        id={id}
        ref={editorRef}
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        aria-disabled={disabled}
        aria-invalid={hasError}
        aria-labelledby={label ? labelId : undefined}
        data-placeholder={placeholder ?? ''}
        className={`pxd-rich-text-area__input ${hasError ? 'pxd-rich-text-area__input--error' : ''}`}
        style={{ minHeight: `${minHeightPx}px` }}
        suppressContentEditableWarning
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onInput={() => {
          const el = editorRef.current;
          if (!el) return;
          const md = richLinkElementToMarkdown(el);
          lastEmittedRef.current = md;
          el.dataset.empty = String(!md.trim());
          onChange?.(md);
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          const el = editorRef.current;
          if (!el) return;
          const md = richLinkElementToMarkdown(el);
          lastEmittedRef.current = md;
          el.dataset.empty = String(!md.trim());
          onChange?.(md);
        }}
        onPasteCapture={handlePaste}
        {...rest}
      />
      {(helperText || errorText) && (
        <div className="pxd-rich-text-area__helper">
          {errorText && <p className="pxd-rich-text-area__helper-error" role="alert">{errorText}</p>}
          {helperText && !errorText && <p>{helperText}</p>}
        </div>
      )}
    </div>
  );
}

