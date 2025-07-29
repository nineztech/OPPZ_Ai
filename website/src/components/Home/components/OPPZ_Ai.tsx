import React from "react";
 

const HowItWorks = () => {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* LEFT: Steps Content */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How OPPZ AI Works?</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-purple-600">O – Opportunity Identification</h3>
              <p className="text-gray-700">
                Our AI scans thousands of listings across platforms like LinkedIn, Indeed, and more to find the best-fit jobs for your profile.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-600">P – Profile Processing</h3>
              <p className="text-gray-700">
                AI analyzes your resume, skills, and preferences to understand your strengths and job fit.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-green-600">P – Precision Positioning</h3>
              <p className="text-gray-700">
                OPPZ AI customizes each application using AI-driven personalization to align with job requirements.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-pink-600">Z – Zero-Touch Application</h3>
              <p className="text-gray-700">
                Sit back while OPPZ AI submits applications for you — no forms, no repetition, and no manual errors.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className="flex w-full h-full justify-center md:justify-end">
          <img
            src="/Image2.jpeg"
            alt="How OPPZ AI Works"
            className="w-full   max-w-md rounded-xl shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
