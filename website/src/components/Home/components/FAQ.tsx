import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is OPPZ Ai?',
    answer:
      'OPPZ Ai is a Chrome extension that automates job applications using the latest AI models. It is trained on your resume and personalized details to tailor each application and save you time by handling the entire process.',
  },
  {
    question: 'How does OPPZ Ai work?',
    answer:
      'OPPZ Ai scans job listings, extracts relevant fields, and automatically fills out application forms based on your uploaded resume and preferences. It personalizes each application and submits it on your behalf — completely hands-free.',
  },
  {
    question: 'Is there a trial or demo available for OPPZ Ai?',
    answer:
      'Yes! OPPZ Ai offers a free trial so you can test the platform and experience how it automates job applications on selected portals before subscribing.',
  },
  {
    question: 'How do I get started with OPPZ Ai?',
    answer:
      '1. Install the OPPZ Ai Chrome Extension.\n2. Sign up and upload your resume.\n3. Configure your preferences and filters.\n4. Start browsing jobs — OPPZ Ai will take care of the rest.',
  },
  {
    question: 'What kind of support does OPPZ Ai offer?',
    answer:
      'You can contact us any time of the day 24/7 \nSend us a chat message or email us at support@oppzai.com \nWe are even willing to get on a call with you to resolve your issue!',
  },
  {
    question: 'Does OPPZ Ai work on mobile devices?',
    answer:
      'Coming Soon!',
  },
   {
    question: 'Does my data safe with OPPZ Ai?',
    answer:
      'Yes, OPPZ Ai never saves or shares your data, ensuring your information remains secure and confidential.',
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className='bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white py-12 px-4'>
    <div className="max-w-3xl bg-gradient-to-br   from-blue-600 via-purple-600 to-pink-500 rounded-2xl mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-center text-gray-100 mb-10">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-xl overflow-hidden shadow-sm"
          >
            <button
              className="w-full flex justify-between items-center px-6 py-4 text-left text-lg font-medium text-gray-800 hover:bg-gray-50 focus:outline-none"
              onClick={() => toggleFAQ(index)}
            >
              <span>{faq.question}</span>
              {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-gray-700 bg-white whitespace-pre-line">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default FAQ;