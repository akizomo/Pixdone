import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { playSound } from '../services/sound';

type Lang = 'en' | 'ja';
function detectLang(): Lang {
  try { return (localStorage.getItem('pixdone-lang') as Lang) ?? 'en'; } catch { return 'en'; }
}

const MAX_CHARS = 300;

export function EffectRequestPage() {
  const navigate = useNavigate();
  const goBack = () => navigate('/');
  const { isPremium } = useThemeEntitlements();
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = detectLang();
  const isJa = lang === 'ja';

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    playSound('taskComplete');
    try {
      const resp = await fetch('/api/effect-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ description: description.trim() }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({})) as { message?: string };
        setError(data.message ?? (isJa ? '送信に失敗しました' : 'Submission failed'));
        return;
      }
      setSubmitted(true);
    } catch {
      setError(isJa ? '通信に失敗しました' : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Sub-page nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0 8px' }}>
        <button
          type="button"
          onClick={() => { playSound('taskCancel'); goBack(); }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.75rem',
            color: 'var(--pd-color-text-secondary)',
            letterSpacing: '1px',
            padding: '4px 0',
          }}
        >
          ← {isJa ? 'もどる' : 'BACK'}
        </button>
        <span style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: '0.875rem',
          color: 'var(--pd-color-text-primary)',
          letterSpacing: '2px',
        }}>
          {isJa ? 'エフェクトリクエスト' : 'EFFECT REQUEST'}
        </span>
      </div>

      <div style={{
        flex: 1,
        maxWidth: '560px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Not premium gate */}
        {!isPremium ? (
          <div style={{
            border: '2px solid var(--pd-color-border-default)',
            padding: '32px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <p style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              margin: 0,
              color: 'var(--pd-color-text-primary)',
            }}>
              {isJa ? 'PixDone+ 限定機能です' : 'PIXDONE+ EXCLUSIVE'}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)', margin: 0 }}>
              {isJa
                ? 'エフェクトリクエストは PixDone+ 会員限定です。月1回、欲しいエフェクトをリクエストできます。'
                : 'Effect requests are available to PixDone+ members. Submit one request per month.'}
            </p>
            <button
              type="button"
              onClick={() => { playSound('buttonClick'); navigate('/pricing'); }}
              style={{
                padding: '10px 24px',
                background: 'var(--pd-color-accent-default)',
                border: 'none',
                borderRadius: 0,
                cursor: 'pointer',
                fontFamily: 'var(--pd-font-brand)',
                fontSize: '0.75rem',
                color: 'var(--pd-color-background-default)',
                letterSpacing: '1px',
              }}
            >
              {isJa ? 'PixDone+ にアップグレード' : 'UPGRADE TO PIXDONE+'}
            </button>
          </div>
        ) : submitted ? (
          /* Success state */
          <div style={{
            border: '2px solid var(--pd-color-accent-default)',
            padding: '32px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              margin: 0,
              color: 'var(--pd-color-accent-default)',
            }}>
              {isJa ? '✓ リクエストを送信しました' : '✓ REQUEST SUBMITTED'}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)', margin: 0 }}>
              {isJa
                ? 'ありがとうございます！次回のアップデートで検討します。'
                : 'Thank you! We will consider your request in an upcoming update.'}
            </p>
            <button
              type="button"
              onClick={() => { playSound('buttonClick'); goBack(); }}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                border: '2px solid var(--pd-color-accent-default)',
                borderRadius: 0,
                cursor: 'pointer',
                fontFamily: 'var(--pd-font-brand)',
                fontSize: '0.7rem',
                color: 'var(--pd-color-accent-default)',
                letterSpacing: '1px',
              }}
            >
              {isJa ? 'もどる' : 'BACK'}
            </button>
          </div>
        ) : (
          /* Form */
          <>
            <div>
              <p style={{
                fontFamily: 'var(--pd-font-brand)',
                fontSize: '0.875rem',
                letterSpacing: '1px',
                margin: '0 0 8px',
              }}>
                {isJa ? 'リクエスト内容' : 'DESCRIBE YOUR EFFECT'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)', margin: '0 0 16px' }}>
                {isJa
                  ? 'どんなエフェクトが欲しいか自由に書いてください。参考にするエフェクト名や、テーマ、動き・色のイメージも書くと嬉しいです。'
                  : 'Describe the effect you\'d like to see. Feel free to mention a reference effect, theme, movement, or color ideas.'}
              </p>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, MAX_CHARS))}
                  placeholder={isJa
                    ? '例）Synthwave テーマに合う、ネオンカラーの稲妻が走るようなエフェクトが欲しいです。'
                    : 'e.g. A neon lightning strike effect that fits the Synthwave theme.'}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--pd-color-background-elevated)',
                    border: '2px solid var(--pd-color-border-default)',
                    borderRadius: 0,
                    color: 'var(--pd-color-text-primary)',
                    fontFamily: 'var(--pd-font-body)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--pd-color-accent-default)'; }}
                  onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--pd-color-border-default)'; }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '10px',
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.5625rem',
                  letterSpacing: '1px',
                  color: description.length >= MAX_CHARS
                    ? 'var(--pd-color-error, #f44336)'
                    : 'var(--pd-color-text-secondary)',
                }}>
                  {description.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--pd-color-error, #f44336)' }}>
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={loading || !description.trim()}
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '12px',
                background: loading || !description.trim()
                  ? 'var(--pd-color-border-default)'
                  : 'var(--pd-color-accent-default)',
                border: 'none',
                borderRadius: 0,
                cursor: loading || !description.trim() ? 'default' : 'pointer',
                fontFamily: 'var(--pd-font-brand)',
                fontSize: '0.75rem',
                color: 'var(--pd-color-background-default)',
                letterSpacing: '1px',
                transition: 'background 0.15s',
              }}
            >
              {loading
                ? (isJa ? '送信中...' : 'SENDING...')
                : (isJa ? 'リクエストを送信' : 'SUBMIT REQUEST')}
            </button>

            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--pd-color-text-secondary)', textAlign: 'center' }}>
              {isJa ? '月1回まで送信できます' : '1 request per month'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
