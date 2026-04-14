import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextArea } from '../design-system';
import { playSound } from '../services/sound';
import { detectDefaultLang, type Lang } from '../lib/i18n';
import { PH_REVIEW_URL } from '../services/phReviewBanner';

const FEEDBACK_EMAIL = 'contact@akizony.com';

export function FeedbackPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  const lang: Lang = detectDefaultLang();
  const isJa = lang === 'ja';

  const handleSend = () => {
    const body = feedback.trim();
    if (!body) return;
    playSound('taskComplete');
    const subject = encodeURIComponent(isJa ? 'PixDone フィードバック' : 'PixDone Feedback');
    const mailtoBody = encodeURIComponent(body);
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${mailtoBody}`;
    setFeedback('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0 8px' }}>
        <Button variant="ghost" size="sm" soundKey="taskCancel" onClick={() => navigate('/')}>
          ← {isJa ? 'もどる' : 'BACK'}
        </Button>
        <span
          style={{
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.875rem',
            color: 'var(--pd-color-text-primary)',
            letterSpacing: '2px',
          }}
        >
          {isJa ? 'フィードバック' : 'FEEDBACK'}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--pd-color-text-secondary)', lineHeight: 1.6 }}>
          {isJa
            ? '感想・バグ報告・機能リクエストをお気軽にどうぞ。すべて開発者が読みます。'
            : 'Share impressions, bugs, or feature requests. Every message is read by the developer.'}
        </p>

        <TextArea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={isJa ? 'ここに入力…' : 'Type here…'}
          rows={8}
        />

        <Button
          variant="primary"
          size="lg"
          soundKey="taskComplete"
          disabled={feedback.trim().length === 0}
          onClick={handleSend}
        >
          {isJa ? '送信する' : 'SEND'}
        </Button>

        <div style={{ borderTop: '1px solid var(--pd-color-border-default)', marginTop: '8px' }} />

        <section
          style={{
            padding: '16px',
            border: '2px solid var(--pd-color-border-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.625rem',
              letterSpacing: '1px',
              color: 'var(--pd-color-text-muted)',
              margin: 0,
            }}
          >
            {isJa ? 'Product Hunt' : 'PRODUCT HUNT'}
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)', lineHeight: 1.6 }}>
            {isJa
              ? 'Product Hunt でレビューを書いてくれると、開発を続ける大きな力になります！'
              : 'A review on Product Hunt would mean the world and help us keep building!'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            soundKey="buttonClick"
            onClick={() => window.open(PH_REVIEW_URL, '_blank', 'noopener,noreferrer')}
          >
            {isJa ? 'Product Hunt でレビューを書く' : 'REVIEW ON PRODUCT HUNT'}
          </Button>
        </section>
      </div>
    </div>
  );
}
