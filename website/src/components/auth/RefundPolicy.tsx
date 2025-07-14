import React from 'react';
import Footer from '../Footer/Footer';
const RefundPolicy: React.FC = () => {
  return (
    <div className='w-full'>
    <div className="min-h-screen bg-white text-gray-800 px-4 py-10 md:px-20 lg:px-40">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Refund Policy</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">A Legal Disclaimer</h2>
          <p className="text-sm leading-relaxed">
            OPPZ Ai provides digital services designed to streamline and automate job application processes.
            By purchasing a subscription, you agree to the terms of this refund policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">1. General Policy</h2>
          <p className="text-sm leading-relaxed">
            All purchases are final. Refunds are issued only under specific conditions outlined below.
            Due to the nature of digital services, where access is granted immediately upon purchase, we do not
            provide pro-rated or partial refunds.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">2. Refund Eligibility</h2>
          <p className="text-sm leading-relaxed mb-4">A refund may be considered if one of the following conditions is met:</p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>You were charged more than once for the same subscription.</li>
            <li>
              You encountered a critical technical issue that prevented use of the service, and our support team
              was unable to resolve it within a reasonable timeframe.
            </li>
            <li>
              You submitted a valid cancellation request before your renewal date and did not access the platform
              thereafter.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">3. Non-Refundable Scenarios</h2>
          <p className="text-sm leading-relaxed mb-4">Refunds will not be granted under the following circumstances:</p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>The subscription was canceled after the renewal charge was processed.</li>
            <li>There is evidence of continued use of the service after the renewal date.</li>
            <li>Failure to use the service does not constitute grounds for a refund.</li>
            <li>
              The user did not follow the proper cancellation procedure through their account dashboard or by
              contacting support at least 24 hours before the renewal.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">4. Account Activity & Dispute Handling</h2>
          <p className="text-sm leading-relaxed">
            In the event of a chargeback or payment dispute, OPPZ Ai reserves the right to provide platform usage
            logs as evidence of continued service access. This includes, but is not limited to, logins, application
            submissions, feature interactions, and API usage. Continued use of the service constitutes acceptance
            of the renewed billing cycle.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. How to Request a Refund</h2>
          <p className="text-sm leading-relaxed mb-4">
            To request a refund, users must contact <span className="font-medium">support@oppzai.com</span> within 7 days
            of the charge, including the following details:
          </p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Full name and email used on the account</li>
            <li>Date of the charge</li>
            <li>Reason for the refund request</li>
          </ul>
          <p className="text-sm mt-4">
            All refund decisions are made at the sole discretion of OPPZ Ai and are considered final.
          </p>
        </section>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
