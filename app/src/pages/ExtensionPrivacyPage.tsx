/**
 * /extension/privacy — public Privacy Policy for the PixDone Quick
 * Chrome extension. The Chrome Web Store listing requires a stable HTTPS
 * URL pointing to a policy page, and we want it to look like the same
 * product as the rest of PixDone (not a generic legal stub).
 *
 * Standalone — rendered before the auth gate in App.tsx so reviewers and
 * unauthenticated users can reach it.
 *
 * Source of truth: extensions/pixdone-quick/STORE.md §4. Keep both files
 * in sync when the extension's data flow changes.
 */
import { useEffect, useState } from 'react';
import { detectDefaultLang, type Lang } from '../lib/i18n';
import { playSound } from '../services/sound';
import './ExtensionPrivacyPage.css';

const LAST_UPDATED = '2026-05-07';
const SUPPORT_EMAIL = 'support@pixdone.akizony.com';

interface Section {
  title: string;
  body: React.ReactNode;
}

interface Copy {
  eyebrow: string;
  title: string;
  updated: string;
  back: string;
  intro: React.ReactNode;
  sections: Section[];
  contactCta: string;
  productLink: string;
}

const COPY: Record<Lang, Copy> = {
  en: {
    eyebrow: 'PixDone Quick',
    title: 'Privacy Policy',
    updated: `Last updated: ${LAST_UPDATED}`,
    back: '← BACK',
    intro: (
      <>
        PixDone Quick (“the extension”) is a Chrome extension published by
        PixDone. This policy describes what data the extension collects, how
        it is used, and the choices available to you.
      </>
    ),
    sections: [
      {
        title: 'What the extension collects',
        body: (
          <>
            <ul>
              <li>
                <strong>Account information.</strong> When you sign in, the
                extension receives your Firebase ID token, refresh token,
                signed-in email address, Firebase UID, and PixDone+
                subscription flag from the PixDone web app. These are stored
                on your device only, in <code>chrome.storage.local</code>.
              </li>
              <li>
                <strong>Tasks and lists.</strong> Tasks and lists you create,
                edit, or complete through the extension are saved into your
                own PixDone Firestore documents. The data model is identical
                to the PixDone web app — the extension is a thin client over
                the same database.
              </li>
              <li>
                <strong>Page context you choose to attach.</strong> When you
                opt in to “Capture this tab”, the extension copies the
                current tab’s title and URL into the task you are creating.
                Nothing on the page itself is read or uploaded; only the
                title and address-bar URL the browser already displays.
              </li>
              <li>
                <strong>Local preferences.</strong> The extension stores
                your interface preferences (language, sound on/off, last-
                used view, last-used list) on your device only.
              </li>
            </ul>
            <p>The extension does <strong>not</strong> collect:</p>
            <ul>
              <li>Browsing history outside of the tab(s) you actively capture.</li>
              <li>
                Page DOM, form contents, cookies, or anything you have not
                explicitly attached to a task.
              </li>
              <li>
                Telemetry, analytics, or usage metrics. There is no tracking
                pixel, GA, Sentry, or comparable third-party SDK.
              </li>
            </ul>
          </>
        ),
      },
      {
        title: 'How we use the data',
        body: (
          <ul>
            <li>
              <strong>Authenticate you</strong> with Firebase Authentication
              and refresh your session before it expires.
            </li>
            <li>
              <strong>Read and write the tasks and lists you own</strong> in
              PixDone’s Firestore database.
            </li>
            <li>
              <strong>Verify your PixDone+ entitlement</strong> so premium
              completion effects can unlock for paying subscribers.
            </li>
          </ul>
        ),
      },
      {
        title: 'Sharing and sale',
        body: (
          <p>
            We do not sell, rent, or share your data with third parties. We
            do not use your data for advertising or profiling. We do not use
            your data to train machine-learning models.
          </p>
        ),
      },
      {
        title: 'Where the data lives',
        body: (
          <ul>
            <li>
              On your device, in Chrome’s encrypted{' '}
              <code>chrome.storage.local</code> — auth token, refresh token,
              email, UID, premium flag, preferences.
            </li>
            <li>
              On Google Cloud Firestore, in the same project that powers the
              PixDone web app — your tasks and lists. Firebase processes
              data on Google’s infrastructure under{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Google’s privacy policy
              </a>{' '}
              and the{' '}
              <a
                href="https://firebase.google.com/terms/data-processing-terms"
                target="_blank"
                rel="noreferrer noopener"
              >
                Firebase data processing terms
              </a>
              .
            </li>
          </ul>
        ),
      },
      {
        title: 'Your choices',
        body: (
          <ul>
            <li>
              <strong>Delete locally stored data.</strong> Sign out from the
              panel’s account menu, or remove the extension from{' '}
              <code>chrome://extensions</code>. Either action clears every
              value the extension wrote to <code>chrome.storage.local</code>.
            </li>
            <li>
              <strong>Delete server-side data.</strong> Delete tasks and
              lists from the PixDone web app or Quick panel; closing your
              PixDone account from the web app’s account settings deletes
              the underlying Firestore documents.
            </li>
            <li>
              <strong>Stop sharing page context.</strong> Toggle off
              “Capture this tab” before saving a task — the extension will
              create the task with no URL or title attached.
            </li>
          </ul>
        ),
      },
      {
        title: 'Children',
        body: (
          <p>
            The extension is not directed to children under 13 and we do not
            knowingly collect data from them.
          </p>
        ),
      },
      {
        title: 'Changes to this policy',
        body: (
          <p>
            We may update this policy as the extension evolves. Material
            changes will be reflected in the “Last updated” date above and
            in the extension release notes.
          </p>
        ),
      },
      {
        title: 'Contact',
        body: (
          <>
            <p>Questions about this policy or your data:</p>
            <a className="epp__contact" href={`mailto:${SUPPORT_EMAIL}`}>
              ✉ {SUPPORT_EMAIL}
            </a>
          </>
        ),
      },
    ],
    contactCta: 'Email support',
    productLink: 'Back to PixDone',
  },
  ja: {
    eyebrow: 'PixDone Quick',
    title: 'プライバシーポリシー',
    updated: `最終更新日: ${LAST_UPDATED}`,
    back: '← もどる',
    intro: (
      <>
        PixDone Quick（以下「本拡張」）は PixDone が提供する Chrome 拡張機能
        です。本ポリシーでは、本拡張が収集するデータ、利用方法、ユーザーが
        取れる選択肢を説明します。
      </>
    ),
    sections: [
      {
        title: '収集する情報',
        body: (
          <>
            <ul>
              <li>
                <strong>アカウント情報。</strong>サインイン時、PixDone Web
                アプリから Firebase ID トークン、リフレッシュトークン、
                メールアドレス、Firebase UID、PixDone+ サブスクリプション
                フラグを受け取ります。これらはお使いの端末内
                （<code>chrome.storage.local</code>）にのみ保存されます。
              </li>
              <li>
                <strong>タスクとリスト。</strong>本拡張で作成・編集・完了
                したタスクとリストは、ご自身の PixDone Firestore ドキュメ
                ントに保存されます。データモデルは PixDone Web アプリと同
                一で、本拡張は同じデータベースを参照する薄いクライアント
                です。
              </li>
              <li>
                <strong>ユーザーが添付を選んだページ情報。</strong>「この
                タブを貼り付け」を有効にした場合に限り、現在のタブのタイ
                トルと URL を作成中のタスクにコピーします。ページの中身は
                読み込まず、ブラウザがすでに表示しているタイトルとアドレ
                スバーの URL のみを利用します。
              </li>
              <li>
                <strong>ローカル設定。</strong>言語、サウンド ON/OFF、最
                後に使った view、最後に選んだリストなどの UI 設定を端末内
                にのみ保存します。
              </li>
            </ul>
            <p>本拡張は以下を<strong>収集しません</strong>:</p>
            <ul>
              <li>ユーザーが明示的にキャプチャしたタブ以外の閲覧履歴。</li>
              <li>
                ページの DOM、フォーム入力、Cookie、その他ユーザーがタスク
                に添付していない情報。
              </li>
              <li>
                テレメトリ・アナリティクス・利用統計。トラッキングピクセル、
                GA、Sentry 等の第三者 SDK は組み込まれていません。
              </li>
            </ul>
          </>
        ),
      },
      {
        title: '利用目的',
        body: (
          <ul>
            <li>
              <strong>認証と Firebase 経由のセッション維持。</strong>
              トークンが期限切れになる前に自動更新します。
            </li>
            <li>
              <strong>ユーザー所有のタスク・リストの読み書き。</strong>
              PixDone の Firestore データベースに対してのみ行います。
            </li>
            <li>
              <strong>PixDone+ サブスクリプション状態の確認。</strong>
              プレミアム完了エフェクトを有料ユーザー向けに解放するために用います。
            </li>
          </ul>
        ),
      },
      {
        title: '第三者提供・販売について',
        body: (
          <p>
            データを第三者に販売・賃貸・共有することはありません。広告配信
            や行動プロファイリング、機械学習モデルの学習には利用しません。
          </p>
        ),
      },
      {
        title: 'データの保存先',
        body: (
          <ul>
            <li>
              お使いの端末の Chrome 暗号化ストア
              （<code>chrome.storage.local</code>）— 認証トークン、リフレッ
              シュトークン、メールアドレス、UID、premium フラグ、設定。
            </li>
            <li>
              Google Cloud Firestore（PixDone Web アプリと同一プロジェクト）
              — タスクとリスト。Firebase は{' '}
              <a
                href="https://policies.google.com/privacy?hl=ja"
                target="_blank"
                rel="noreferrer noopener"
              >
                Google プライバシーポリシー
              </a>{' '}
              および{' '}
              <a
                href="https://firebase.google.com/terms/data-processing-terms"
                target="_blank"
                rel="noreferrer noopener"
              >
                Firebase データ処理規約
              </a>
              に従って処理します。
            </li>
          </ul>
        ),
      },
      {
        title: 'ユーザーの選択肢',
        body: (
          <ul>
            <li>
              <strong>端末内データの削除。</strong>パネルのアカウントメ
              ニューからサインアウト、または{' '}
              <code>chrome://extensions</code> から本拡張を削除してくださ
              い。いずれの操作でも <code>chrome.storage.local</code> 内の
              本拡張のデータが消去されます。
            </li>
            <li>
              <strong>サーバー側データの削除。</strong>PixDone Web アプリ
              または Quick パネルからタスク・リストを削除できます。アカウ
              ント自体を Web アプリのアカウント設定から削除すると、関連す
              る Firestore ドキュメントも削除されます。
            </li>
            <li>
              <strong>ページ情報の添付を停止。</strong>タスク保存前に「こ
              のタブを貼り付け」を OFF にすると、URL とタイトル無しでタス
              クが作成されます。
            </li>
          </ul>
        ),
      },
      {
        title: '子どもの個人情報について',
        body: (
          <p>
            本拡張は 13 歳未満を対象としておらず、意図的にそのような情報
            を収集することはありません。
          </p>
        ),
      },
      {
        title: '本ポリシーの変更',
        body: (
          <p>
            拡張機能の進化に合わせて本ポリシーを更新する場合があります。
            重要な変更は冒頭の最終更新日とリリースノートで告知します。
          </p>
        ),
      },
      {
        title: 'お問い合わせ',
        body: (
          <>
            <p>ポリシーやデータに関するご質問:</p>
            <a className="epp__contact" href={`mailto:${SUPPORT_EMAIL}`}>
              ✉ {SUPPORT_EMAIL}
            </a>
          </>
        ),
      },
    ],
    contactCta: 'サポートに連絡',
    productLink: 'PixDone に戻る',
  },
};

export function ExtensionPrivacyPage() {
  const [lang, setLang] = useState<Lang>(() => {
    // Allow ?lang=en|ja override so we can link directly to a language from
    // the Web Store listing or other surfaces.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('lang');
      if (q === 'en' || q === 'ja') return q;
    }
    return detectDefaultLang();
  });

  // Keep <html lang> in sync so screen readers announce the right language
  // and our `[lang="ja"]` CSS overrides resolve correctly on this page.
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [lang]);

  const copy = COPY[lang];

  const changeLang = (next: Lang) => {
    if (next === lang) return;
    playSound('buttonClick');
    setLang(next);
  };

  return (
    <div className="epp">
      <div className="epp__shell">
        <div className="epp__topbar">
          <a
            className="epp__back"
            href="/"
            onClick={() => playSound('taskCancel')}
          >
            {copy.back}
          </a>
          <div className="epp__lang" role="group" aria-label="Language">
            <button
              type="button"
              className={`epp__lang-btn${lang === 'en' ? ' epp__lang-btn--active' : ''}`}
              aria-pressed={lang === 'en'}
              onClick={() => changeLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`epp__lang-btn${lang === 'ja' ? ' epp__lang-btn--active' : ''}`}
              aria-pressed={lang === 'ja'}
              onClick={() => changeLang('ja')}
            >
              JA
            </button>
          </div>
        </div>

        <header className="epp__title-block">
          <span className="epp__eyebrow">{copy.eyebrow}</span>
          <h1 className="epp__title">{copy.title}</h1>
          <span className="epp__updated">{copy.updated}</span>
        </header>

        <main className="epp__body">
          <p className="epp__intro">{copy.intro}</p>
          {copy.sections.map((section) => (
            <section key={section.title} className="epp__section">
              <h2 className="epp__section-title">{section.title}</h2>
              {section.body}
            </section>
          ))}
        </main>

        <div className="epp__footer">
          <span>PixDone Quick</span>
          <a href="/">{copy.productLink}</a>
        </div>
      </div>
    </div>
  );
}
