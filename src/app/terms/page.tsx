import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Yarn Digital Dashboard',
  description: 'Terms of Service for the Yarn Digital Dashboard platform',
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
          </Link>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.5rem' }}>Terms of Service</h1>
        <p style={{ color: '#7A7A7A', marginBottom: '2rem', fontSize: '0.875rem' }}>Last updated: March 2026</p>

        <div style={{ color: '#374151', lineHeight: '1.75', fontSize: '1rem' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>1. Acceptance of Terms</h2>
            <p>By accessing or using the Yarn Digital Dashboard (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>2. Description of Service</h2>
            <p>Yarn Digital Dashboard is a customer relationship management (CRM) and business management platform that provides tools for managing contacts, projects, invoices, contracts, calendar scheduling, form building, and workflow automation.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>3. User Accounts</h2>
            <p>You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Upload or transmit viruses, malware, or other harmful code</li>
              <li>Attempt to gain unauthorised access to any part of the Service</li>
              <li>Use the Service to send unsolicited communications (spam)</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Reverse-engineer, decompile, or otherwise attempt to extract the source code of the Service</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>5. Data Ownership</h2>
            <p>You retain all rights to the data you submit to the Service. We do not claim ownership over your content. You grant us a limited licence to use, store, and process your data solely for the purpose of providing the Service to you.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>6. Privacy</h2>
            <p>Your use of the Service is also governed by our <Link href="/privacy" style={{ color: '#FF3300', textDecoration: 'none' }}>Privacy Policy</Link>, which describes how we collect, use, and protect your personal information.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>7. Service Availability</h2>
            <p>We strive to maintain high availability of the Service but do not guarantee uninterrupted access. We may perform maintenance, updates, or experience downtime. We will endeavour to provide advance notice of planned maintenance where possible.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Yarn Digital and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>9. Termination</h2>
            <p>We may suspend or terminate your access to the Service at any time for violation of these Terms. You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will cease, and we may delete your data after a reasonable retention period.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>10. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use of the Service after such changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', marginBottom: '0.75rem' }}>12. Contact</h2>
            <p>If you have any questions about these Terms, please contact us at support@yarndigital.co.uk.</p>
          </section>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #E0E0E0', margin: '2rem 0' }} />
        <p style={{ color: '#7A7A7A', fontSize: '0.875rem' }}>
          <Link href="/privacy" style={{ color: '#FF3300', textDecoration: 'none' }}>Privacy Policy</Link>
          {' · '}
          <Link href="/" style={{ color: '#FF3300', textDecoration: 'none' }}>Back to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
