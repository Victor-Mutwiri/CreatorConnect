import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Terms and Conditions</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
            <h3>1. Introduction</h3>
            <p>
              Welcome to Ubuni Connect. By accessing or using our platform, you agree to be bound by these Terms and Conditions. 
              If you disagree with any part of these terms, you may not access the service.
            </p>

            <h3>2. Eligibility</h3>
            <p>
              You must be at least 18 years old to use this service. By creating an account, you warrant that you are capable of entering into a binding contract 
              and that all registration information you submit is accurate and truthful.
            </p>

            <h3>3. Account Security and Fraud Prevention</h3>
            <p>
              We take the security of our community seriously. 
            </p>
            <ul>
                <li><strong>Identity Verification:</strong> You agree to provide accurate identification documents when requested.</li>
                <li><strong>Fraudulent Activity:</strong> Impersonation, creating fake profiles, or using the platform for fraudulent purposes (e.g., obtaining money by false pretenses) is strictly prohibited.</li>
                <li><strong>Consequences:</strong> Any account found engaging in fraudulent activity will be immediately suspended pending investigation. We reserve the right to report such activities to the Directorate of Criminal Investigations (DCI) and other relevant law enforcement agencies in Kenya.</li>
            </ul>

            <h3>4. User Conduct</h3>
            <p>
              Users agree not to:
            </p>
            <ul>
                <li>Harass, abuse, or harm another person.</li>
                <li>Post false, misleading, or defamatory content.</li>
                <li>Use the platform for any illegal purpose under Kenyan Law.</li>
                <li>Attempt to bypass our payment systems to avoid fees.</li>
            </ul>

            <h3>5. Payments and Contracts</h3>
            <p>
              Ubuni Connect provides a platform for Creators and Clients to agree on services. We are not a party to the contracts between users but facilitate the connection and payment processing.
            </p>

            <h3>6. Data Protection</h3>
            <p>
              We collect and process your data in accordance with the Data Protection Act, 2019 of Kenya. Your data is stored securely and is only shared with law enforcement when required by law or to prevent fraud.
            </p>

            <h3>7. Termination</h3>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h3>8. Governing Law</h3>
            <p>
              These Terms shall be governed and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions.
            </p>

            <h3>9. Changes to Terms</h3>
            <p>
              We reserve the right to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;