'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  var router = useRouter();
  var [dark, setDark] = useState(true);

  var serif = "'Instrument Serif', Georgia, serif";
  var sans = "'DM Sans', system-ui, sans-serif";
  var bg = dark ? '#0a0a0a' : '#ffffff';
  var tx = dark ? '#f0eff4' : '#111111';
  var txDim = dark ? '#9896a6' : '#555555';
  var txMut = dark ? '#5f5d6e' : '#888888';
  var bdr = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  var bgCard = dark ? '#141414' : '#f8f8fb';
  var navBg = dark ? 'rgba(10,10,10,0.82)' : 'rgba(255,255,255,0.82)';
  var accent = '#C9A84C';

  var sections = [
    {
      title: 'Information We Collect',
      content: 'PathForge collects the following types of information:\n\n• Account Information: When you create an account, we collect your name and email address.\n\n• Usage Data: We collect information about how you use PathForge, including the schools and careers you search for, roadmaps you generate, and features you interact with.\n\n• Device Information: We may collect basic technical information such as your browser type, device type, and IP address for security and performance purposes.\n\n• Payment Information: If you subscribe to a paid plan, payment is processed by Stripe. PathForge does not store your credit card number or full payment details.\n\n• Communications: If you contact us by email, we retain that correspondence to respond to your inquiry.'
    },
    {
      title: 'How We Use Your Information',
      content: 'We use the information we collect to:\n\n• Provide, maintain, and improve the PathForge service\n• Personalize your roadmap and academic planning experience\n• Process payments and manage your subscription\n• Send you product updates, tips, and relevant communications (you can opt out at any time)\n• Respond to your questions and support requests\n• Monitor and analyze usage patterns to improve our product\n• Detect and prevent fraud, abuse, or security incidents\n\nWe do not sell your personal information to third parties. We do not use your data to train AI models or share it with advertisers.'
    },
    {
      title: 'Data Storage and Security',
      content: 'PathForge uses Firebase (by Google) for authentication and user data storage, and Vercel for hosting. Your data is stored on secure cloud infrastructure with industry-standard encryption in transit and at rest.\n\nWe take reasonable technical and organizational measures to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.\n\nWe retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or legitimate business reasons.'
    },
    {
      title: 'Cookies and Tracking',
      content: 'PathForge uses essential cookies and browser storage (localStorage) to keep you logged in and remember your preferences such as light/dark mode. We do not use third-party advertising cookies or tracking pixels.\n\nWe may use basic analytics tools to understand how users interact with the platform in aggregate. This data is not tied to individually identifiable information.'
    },
    {
      title: 'Third-Party Services',
      content: 'PathForge uses the following third-party services to operate:\n\n• Firebase (Google) — authentication and database\n• Vercel — hosting and deployment\n• Stripe — payment processing\n• Anthropic / Google Gemini — AI-generated roadmap content\n\nEach of these services has its own privacy policy governing how they handle data. We encourage you to review their policies if you have specific concerns.'
    },
    {
      title: 'Children\'s Privacy',
      content: 'PathForge is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child under 13 has created an account, please contact us at the email below and we will delete the account promptly.\n\nFor users between 13 and 18, we recommend parental awareness of their use of the platform.'
    },
    {
      title: 'Your Rights and Choices',
      content: 'You have the following rights regarding your personal information:\n\n• Access: You can view the information associated with your account at any time.\n• Correction: You can update your name and email through your account settings.\n• Deletion: You can request deletion of your account and associated data by emailing us.\n• Opt-out: You can unsubscribe from marketing emails at any time using the unsubscribe link in any email we send.\n• Data portability: You can request a copy of your data in a portable format.\n\nTo exercise any of these rights, contact us at the email address listed below.'
    },
    {
      title: 'Changes to This Policy',
      content: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by posting a notice on the PathForge website. Your continued use of PathForge after any changes constitutes your acceptance of the updated policy.\n\nWe encourage you to review this policy periodically.'
    },
    {
      title: 'Contact Us',
      content: 'If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us at:\n\npathforgeapp@gmail.com\n\nWe will respond to all privacy-related inquiries within 5 business days.'
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: sans, transition: 'background 0.3s' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)', background: navBg, borderBottom: '1px solid ' + bdr }}>
        <button onClick={function() { router.push('/'); }} style={{ fontFamily: serif, fontSize: 20, color: tx, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: -0.3 }}>PathForge</button>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={function() { router.back(); }} style={{ background: 'none', border: '1px solid ' + bdr, color: txMut, padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: sans }}>← Back</button>
          <button onClick={function() { setDark(!dark); }} style={{ padding: '6px 12px', height: 32, borderRadius: 8, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dark ? 'Light mode' : 'Dark mode'}</button>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: accent, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: -1, color: tx, margin: '0 0 16px' }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: txMut, margin: 0 }}>Last updated: April 2026</p>
          <p style={{ fontSize: 15, color: txDim, lineHeight: 1.7, marginTop: 20 }}>
            PathForge ("we", "us", or "our") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your data. By using PathForge, you agree to the practices described here.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sections.map(function(s, i) {
            return (
              <div key={i} style={{ background: bgCard, borderRadius: 14, padding: '28px 32px', border: '1px solid ' + bdr }}>
                <h2 style={{ fontFamily: serif, fontSize: 22, color: tx, margin: '0 0 14px', letterSpacing: -0.3 }}>{s.title}</h2>
                <div style={{ fontSize: 14, color: txDim, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{s.content}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid ' + bdr, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
            <a href="/terms" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Terms of Service</a>
            <a href="/privacy" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/pricing" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Pricing</a>
            <a href="/waitlist" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Waitlist</a>
            <a href="/contact" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Contact</a>
          </div>
          <p style={{ fontSize: 13, color: txMut }}>© 2026 PathForge · Built with AI, designed for ambition.</p>
        </div>
      </div>
    </div>
  );
}
