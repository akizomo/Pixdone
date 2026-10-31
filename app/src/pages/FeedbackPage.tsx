import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextArea } from '../design-system';
import { SubPageHeader } from '../components/SubPageHeader';
import { playSound } from '../services/sound';
import { detectDefaultLang, type Lang } from '../lib/i18n';
import { PH_REVIEW_URL } from '../services/phReviewBanner';
import './FeedbackPage.css';

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
    <div className="feedback__col-1">
      <SubPageHeader title={isJa ? 'フィードバック' : 'FEEDBACK'} isJa={isJa} onBack={() => navigate('/')} />

      <div
        className="feedback__col-2"
      >
        <p className="feedback__text-1">
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

        <div className="feedback__box-1" />

        <section
          className="feedback__col-3"
        >
          <p
            className="feedback__text-2"
          >
            {isJa ? 'Product Hunt' : 'PRODUCT HUNT'}
          </p>
          <p className="feedback__text-3">
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
