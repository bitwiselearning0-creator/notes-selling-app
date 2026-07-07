import React from 'react';
import { ShieldCheck, Receipt, Scale, Mail, Globe } from 'lucide-react';

interface PoliciesProps {
  policyType: 'terms' | 'refund' | 'privacy' | 'contact';
}

export const Policies: React.FC<PoliciesProps> = ({ policyType }) => {
  
  const renderTerms = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }} className="blue-accent">Terms & Conditions</h2>
      <p style={{ color: 'var(--color-muted)', marginBottom: '16px' }}>Effective Date: July 7, 2026</p>
      
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>1. Acceptance of Terms</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            By accessing or using the Bitwise Learning website and mobile application, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not access or use our services.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>2. Intellectual Property Rights</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            All study notes,Previous Year Question (PYQ) solutions, and course descriptions available on Bitwise Learning are protected by intellectual property laws. Users are granted a non-exclusive, non-transferable license to read and download notes inside the application for personal, academic use only. Redistribution, copying, commercial selling, or extraction of PDFs outside the app sandbox is strictly prohibited.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>3. User Conduct</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            You agree to provide true, accurate, and current registration information. Any attempt to modify, bypass security components, take unauthorized screen captures, or decompile the application will lead to instant account termination without refund.
          </p>
        </section>
      </div>
    </div>
  );

  const renderRefund = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }} className="yellow-accent">Cancellation & Refund Policy</h2>
      <p style={{ color: 'var(--color-muted)', marginBottom: '16px' }}>Effective Date: July 7, 2026</p>
      
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>1. No Cancellations</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            Once an order is placed and payment is processed, it cannot be cancelled or modified under any circumstances. Please double-check your selection before completing your payment.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>2. All Sales are Final</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            Due to the digital nature of study notes and course materials, all transactions are final. We do not support refunds, exchanges, or store credits once access is provisioned.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>3. Technical Exceptions</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            If you did not receive access to unlocked notes due to a server error or a banking network mismatch despite a successful transaction, please contact our support desk at <strong>bitwiselearning0@gmail.com</strong> within 24 hours. Verified technical errors will be resolved immediately with manual unlocking.
          </p>
        </section>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }} className="blue-accent">Privacy Policy</h2>
      <p style={{ color: 'var(--color-muted)', marginBottom: '16px' }}>Effective Date: July 7, 2026</p>
      
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>1. Information Collection</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            We collect basic account registration details such as Name, Email Address, and Phone Number. These details are used to set up your personal library registry, sync payment invoices, and prevent account sharing.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>2. Data Encryption & Storage</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            User information and session tokens are encrypted using Secure Socket Layers (SSL). Handshake tokens are kept locally in secure system caches. We do not sell or lease user contact numbers to third-party advertisers.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>3. Play Store Security Compliances</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            For Android app compliance, we implement standard sandbox isolation protocols. If a user deletes their account, all personal data is purged from our cloud databases within 30 business days.
          </p>
        </section>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }} className="yellow-accent">Contact Support Desk</h2>
      <p style={{ color: 'var(--color-muted)', marginBottom: '30px' }}>Have questions about notes, payments, or access issues? Reach out to us directly.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', textAlign: 'left' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(251,191,36,0.1)', padding: '12px', borderRadius: '12px', color: 'var(--color-yellow)' }}>
            <Mail size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>Email Support</h4>
            <a href="mailto:bitwiselearning0@gmail.com" className="yellow-accent" style={{ fontWeight: '600', textDecoration: 'none' }}>
              bitwiselearning0@gmail.com
            </a>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(37,99,235,0.1)', padding: '12px', borderRadius: '12px', color: 'var(--color-blue-light)' }}>
            <Globe size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>GitHub Portal</h4>
            <a href="https://github.com/bitwiselearning0-creator" target="_blank" rel="noopener noreferrer" className="blue-accent" style={{ fontWeight: '600', textDecoration: 'none' }}>
              bitwiselearning0-creator
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const getIcon = () => {
    switch (policyType) {
      case 'terms': return <Scale size={42} className="blue-accent" />;
      case 'refund': return <Receipt size={42} className="yellow-accent" />;
      case 'privacy': return <ShieldCheck size={42} className="blue-accent" />;
      default: return <Mail size={42} className="yellow-accent" />;
    }
  };

  return (
    <div className="container section-padding fade-in" style={{ paddingBottom: '80px', flexGrow: 1 }}>
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '40px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            {getIcon()}
          </div>
          {policyType === 'terms' && renderTerms()}
          {policyType === 'refund' && renderRefund()}
          {policyType === 'privacy' && renderPrivacy()}
          {policyType === 'contact' && renderContact()}
        </div>
      </div>
    </div>
  );
};
