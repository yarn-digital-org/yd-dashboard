import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Yarn Digital Dashboard',
  description: 'Privacy Policy for the Yarn Digital Dashboard platform',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
          </Link>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ color: '#7A7A7A', marginBottom: '2rem', fontSize: '0.875rem' }}>Last updated: March 2026</p>

        <div style={{ color: '#374151', lineHeight: '1.75', fontSize: '1rem' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>1. Introduction</h2>
            <p>Yarn Digital (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use the Yarn Digital Dashboard (&quot;Service&quot;), in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>2. Data Controller</h2>
            <p>Yarn Digital is the data controller for personal data processed through the Service. For any data protection queries, contact us through the dashboard.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>3. Data We Collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Account information:</strong> Name, email address, password (hashed), profile photo</li>
              <li><strong>Business data:</strong> Contact details, project information, invoices, contracts, and other CRM data you enter</li>
              <li><strong>Usage data:</strong> Login timestamps, feature usage, browser type, IP address</li>
              <li><strong>Calendar data:</strong> Calendar events synced via Google Calendar integration (when enabled)</li>
              <li><strong>Communication data:</strong> Messages sent through the platform</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>4. Legal Basis for Processing</h2>
            <p>We process your personal data on the following legal bases:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Contract performance:</strong> Processing necessary to provide the Service you have subscribed to</li>
              <li><strong>Legitimate interests:</strong> Service improvement, security, and fraud prevention</li>
              <li><strong>Consent:</strong> Optional integrations (e.g., Google Calendar) and marketing communications</li>
              <li><strong>Legal obligation:</strong> Compliance with applicable laws and regulations</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>5. How We Use Your Data</h2>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li>To provide, maintain, and improve the Service</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To send transactional emails (password resets, account notifications)</li>
              <li>To provide customer support</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>6. Data Storage and Security</h2>
            <p>Your data is stored securely using Google Firebase/Firestore infrastructure. We implement appropriate technical and organisational measures to protect your data, including:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>Password hashing using bcrypt</li>
              <li>JWT-based authentication with secure, HTTP-only cookies</li>
              <li>Regular security reviews and updates</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>7. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Service providers:</strong> Google Cloud (hosting), Resend (email delivery) — bound by data processing agreements</li>
              <li><strong>Legal requirements:</strong> When required by law, regulation, or legal process</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>8. International Transfers</h2>
            <p>Your data may be processed in countries outside the UK. Where this occurs, we ensure appropriate safeguards are in place, including Standard Contractual Clauses or adequacy decisions.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>9. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide the Service. Upon account deletion, we will delete or anonymise your data within 30 days, except where retention is required by law.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>10. Your Rights</h2>
            <p>Under UK GDPR, you have the following rights:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Portability:</strong> Request transfer of your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent:</strong> Where processing is based on consent, you may withdraw it at any time</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>To exercise any of these rights, contact us through the dashboard. We will respond within 30 days.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>11. Cookies</h2>
            <p>We use the following cookies:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>auth_token:</strong> Essential authentication cookie (HTTP-only, secure) — required for the Service to function</li>
              <li><strong>cookie_consent:</strong> Records your cookie preferences</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>We do not use third-party tracking cookies or analytics cookies.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. The &quot;Last updated&quot; date at the top indicates when the policy was last revised.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>13. Contact & Complaints</h2>
            <p>For any privacy-related questions or to exercise your rights, contact:</p>
            <p style={{ marginTop: '0.5rem' }}>Contact us through the dashboard</p>
            <p style={{ marginTop: '0.5rem' }}>If you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk" style={{ color: '#FF3300', textDecoration: 'none' }}>ico.org.uk</a>.</p>
          </section>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #E0E0E0', margin: '2rem 0' }} />
        <p style={{ color: '#7A7A7A', fontSize: '0.875rem' }}>
          <Link href="/terms" style={{ color: '#FF3300', textDecoration: 'none' }}>Terms of Service</Link>
          {' · '}
          <Link href="/" style={{ color: '#FF3300', textDecoration: 'none' }}>Back to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
