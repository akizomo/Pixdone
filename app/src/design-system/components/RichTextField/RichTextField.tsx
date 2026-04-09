import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import type { RichTextFieldProps } from './RichTextField.types';
import './RichTextField.css';
import {
  extractUrlFromText,
  normalizeUrl,
  richLinkElementToMarkdown,
  richLinkMarkdownToHtml,
  urlToLabel,
} from '../../utils/richLinks';

export const RichTextField = forwardRef<HTMLDivElement, RichTextFieldProps>(function RichTextField({
  label,
  value,
  helperText,
  errorText,
  disabled = false,
  required = false,
  placeholder,
  onChange,
  id: idProp,
  className = '',
  maxLength,
  size = 'md',
  ...rest
}: RichTextFieldProps, ref) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;
  const hasError = Boolean(errorText);
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const lastEmittedRef = useRef<string | null>(null);

  useImperativeHandle(ref, () => editorRef.current as HTMLDivElement);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.dataset.empty = String(!(value ?? '').trim());
    const next = richLinkMarkdownToHtml(value ?? '');
    if (isFocusedRef.current && (value ?? '') === (lastEmittedRef.current ?? '')) return;
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    let md = richLinkElementToMarkdown(el).replaceAll('\n', ' ');
    if (typeof maxLength === 'number' && maxLength >= 0) {
      md = md.slice(0, maxLength);
      const nextHtml = richLinkMarkdownToHtml(md);
      if (el.innerHTML !== nextHtml) el.innerHTML = nextHtml;
    }
    lastEmittedRef.current = md;
    el.dataset.empty = String(!md.trim());
    onChange?.(md);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return;
    if (disabled) return;

    const paste = e.clipboardData.getData('text/plain') ?? '';
    const urlRaw = extractUrlFromText(paste);
    if (!urlRaw) return;

    const host = editorRef.current;
    if (!host) return;

    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (host.contains(r.commonAncestorContainer)) range = r;
    }
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(host);
      range.collapse(false);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    // URL-only paste => insert link (no raw URL text)
    if (paste.trim() === urlRaw.trim()) {
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
      range.setStartAfter(a);
      range.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      emit();
      return;
    }

    // Mixed paste: keep default behavior
  };

  return (
    <div className={`pxd-rich-text-field pxd-rich-text-field--${size} ${className}`.trim()}>
      {label && (
        <label id={labelId} className="pxd-rich-text-field__label">
          {label}
          {required && <span className="pxd-rich-text-field__required" aria-hidden> *</span>}
        </label>
      )}
      <div
        id={id}
        ref={editorRef}
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="false"
        aria-disabled={disabled}
        aria-invalid={hasError}
        aria-labelledby={label ? labelId : undefined}
        data-placeholder={placeholder ?? ''}
        className={`pxd-rich-text-field__input ${hasError ? 'pxd-rich-text-field__input--error' : ''}`}
        suppressContentEditableWarning
        onFocus={() => { isFocusedRef.current = true; }}
        onBlur={() => { isFocusedRef.current = false; emit(); }}
        onInput={emit}
        onPasteCapture={handlePaste}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // Keep it single-line; do not submit/save.
            e.preventDefault();
          }
        }}
        {...rest}
      />
      {(helperText || errorText) && (
        <div className="pxd-rich-text-field__helper">
          {errorText && <p className="pxd-rich-text-field__helper-error" role="alert">{errorText}</p>}
          {helperText && !errorText && <p>{helperText}</p>}
        </div>
      )}
    </div>
  );
});

