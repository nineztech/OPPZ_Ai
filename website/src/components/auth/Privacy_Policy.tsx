import React from 'react';
import Footer from '../Footer/Footer';
const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen">
      <header className="bg-slate-900 text-white py-8 text-center">
        <h1 className="text-3xl font-bold">Privacy Policy for OPPZ AI Auto Apply</h1>
        <p className="mt-2 font-medium">Last Updated: [14-7-2025]</p>
      </header>

      <main className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
        <section>
          <h2 className="text-xl font-semibold border-b pb-2 border-gray-200">Overview</h2>
          <p className="mt-4">OPPZ AI is committed to protecting your privacy. This Privacy Policy explains how our AI-powered job application extension collects, uses, and protects your information when you use our service to automate job applications on LinkedIn and other job platforms.</p>
        </section>

        <Section title="Data Collection">
          <SubSection title="Personal Information" items={[
            'Name, email address, phone number, location',
            'Resume content, work experience, education, skills',
            'Cover letters, application responses',
            'Prompts, responses, and AI-generated content',
          ]} />

          <SubSection title="Usage Data" items={[
            'Job application activity and AI feature usage',
            'Extension settings and performance data',
          ]} />

          <SubSection title="Technical Data" items={[
            'Browser and OS details',
            'Extension version and job platform interaction',
          ]} />
        </Section>

        <Section title="Data Storage and Processing">
          <p className="mt-4"><strong>Local Storage:</strong> All your data is stored and encrypted locally on your device. No cloud storage is used.</p>
          <p className="mt-2"><strong>AI Processing:</strong> Minimal and temporary processing with strict data minimization policies. No retention after use.</p>
        </Section>

        <Section title="Data Usage">
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Automated form filling for job applications</li>
            <li>AI-generated content like cover letters</li>
            <li>Tracking your application progress</li>
            <li>Personalizing your experience</li>
          </ul>
        </Section>

        <Section title="Data Sharing and Third Parties">
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>No data selling</strong> or renting</li>
            <li>Limited sharing with job platforms and AI providers</li>
            <li>All transmission uses encryption and secure APIs</li>
          </ul>
        </Section>

        <Section title="AI and Machine Learning">
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>AI generates job content and optimizes applications</li>
            <li>Smart matching for job recommendations</li>
            <li>Data is not used for training, and not retained</li>
          </ul>
        </Section>

        <Section title="User Rights and Control">
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>View, edit, export, or delete your data</li>
            <li>Opt-out of AI features anytime</li>
            <li>Select platforms and control sharing</li>
          </ul>
        </Section>

        <Section title="Data Retention">
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Stored locally until you delete or uninstall</li>
            <li>AI processing is temporary</li>
            <li>Analytics are anonymized</li>
          </ul>
        </Section>

        <Section title="Security Measures">
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>End-to-end encryption and local encryption</li>
            <li>Secure API connections</li>
            <li>Regular security patches and audits</li>
          </ul>
        </Section>

        <Section title="Children's Privacy">
          <p>This extension is not intended for users under 18. We do not knowingly collect data from children.</p>
        </Section>

        <Section title="International Data Transfers">
          <p>Your data may be processed in countries with different laws. We use safeguards to protect it.</p>
        </Section>

        <Section title="Changes to This Privacy Policy">
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>We'll notify users of significant updates</li>
            <li>Changes are effective 30 days after posting</li>
            <li>Old versions available upon request</li>
          </ul>
        </Section>

        <Section title="Compliance">
          <p>This policy is compliant with:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>GDPR</li>
            <li>CCPA</li>
            <li>Other applicable laws</li>
          </ul>
        </Section>

        <Section title="Contact Information">
          <p><strong>Email:</strong> [support@oppzai.com]</p>
           
          <h3 className="mt-4 font-semibold text-lg">Data Protection Officer (DPO)</h3>
          <p><strong>Email:</strong> [support@oppzai.com]</p>
        </Section>

        <Section title="Your Rights Summary">
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              '✅ Access your data',
              '✅ Correct inaccuracies',
              '✅ Delete data',
              '✅ Restrict processing',
              '✅ Data portability',
              '✅ Object to processing',
              '✅ Withdraw consent',
            ].map((item, idx) => (
              <span
                key={idx}
                className="bg-slate-200 px-4 py-2 rounded-lg text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </Section>

        <section className="mt-6">
          <p className="font-medium">
            By using OPPZ AI, you acknowledge that you have read and understood this
            Privacy Policy and agree to the collection and use of your information as
            described herein.
          </p>
        </section>
      </main>

      <footer className="text-center my-6 text-gray-500 text-sm">
        &copy; 2025 OPPZ AI. All rights reserved.
      </footer>
      <Footer />
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-xl font-semibold border-b pb-2 border-gray-200">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

const SubSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="mt-6">
    <h3 className="text-lg font-medium text-slate-700 mb-2">{title}</h3>
    <ul className="list-disc pl-6 space-y-1">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </div>

);

export default PrivacyPolicy;
