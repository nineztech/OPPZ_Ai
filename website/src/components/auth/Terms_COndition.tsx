import React from 'react';
import Footer from '../Footer/Footer';
const TermsAndConditions: React.FC = () => {
  return (
    <div className='w-full'>
    <div className="min-h-screen bg-white text-gray-800 px-4 py-10 md:px-20 lg:px-40">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Terms & Conditions</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Legal Disclaimer</h2>
          <p className="text-sm leading-relaxed">
            The explanations and information provided on this page are only general and high-level explanations and information on how to write your own document of Terms &amp; Conditions. You should not rely on this article as legal advice or as recommendations regarding what you should actually do, because we cannot know in advance what are the specific terms you wish to establish between your business and your customers and visitors. We recommend that you seek legal advice to help you understand and to assist you in the creation of your own Terms &amp; Conditions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Terms & Conditions – The Basics</h2>
          <p className="text-sm leading-relaxed">
            Having said that, Terms and Conditions (“T&amp;C”) are a set of legally binding terms defined by you, as the owner of this website. The T&amp;C set forth the legal boundaries governing the activities of the website visitors, or your customers, while they visit or engage with this website. The T&amp;C are meant to establish the legal relationship between the site visitors and you as the website owner.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">T&C Based on Site Type</h2>
          <p className="text-sm leading-relaxed">
            T&amp;C should be defined according to the specific needs and nature of each website. For example, a website offering products to customers in e-commerce transactions requires T&amp;C that are different from the T&amp;C of a website only providing information (like a blog, a landing page, and so on).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Legal Protection</h2>
          <p className="text-sm leading-relaxed">
            T&amp;C provide you as the website owner the ability to protect yourself from potential legal exposure, but this may differ from jurisdiction to jurisdiction, so make sure to receive local legal advice if you are trying to protect yourself from legal exposure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">What to Include in the T&amp;C Document</h2>
          <p className="text-sm leading-relaxed mb-4">
            Generally speaking, T&amp;C often address these types of issues:
          </p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Who is allowed to use the website</li>
            <li>The possible payment methods</li>
            <li>A declaration that the website owner may change their offerings in the future</li>
            <li>The types of warranties the website owner gives their customers</li>
            <li>Intellectual property or copyright clauses</li>
            <li>The website owner’s right to suspend or cancel a user’s account</li>
            <li>And other relevant terms based on the nature of the business</li>
          </ul>
        </section>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
