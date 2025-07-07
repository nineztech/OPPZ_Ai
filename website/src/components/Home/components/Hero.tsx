import React from 'react';
import { Link } from 'react-router-dom';

export const Home = () => (
  <div className="bg-gray-50">
    {/* Hero Section */}
    <header className="py-32 bg-gradient-to-br from-gray-100 to-gray-200 text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Automate Your LinkedIn Job Applications
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Save time and increase your chances of landing your dream job with our powerful automation tool.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <Link to="/signup" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
            Get Started
          </Link>
          <Link to="/features" className="px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded hover:bg-blue-600 hover:text-white transition">
            Learn More
          </Link>
        </div>
      </div>
    </header>

    {/* Features Section */}
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded shadow hover:-translate-y-1 transition">
            <h3 className="text-xl font-semibold text-blue-600 mb-2">Easy Apply Automation</h3>
            <p className="text-gray-600">Automatically fill out job applications with your saved information.</p>
          </div>
          <div className="p-6 bg-white rounded shadow hover:-translate-y-1 transition">
            <h3 className="text-xl font-semibold text-blue-600 mb-2">Smart Filtering</h3>
            <p className="text-gray-600">Set custom filters to find the most relevant jobs for your career.</p>
          </div>
          <div className="p-6 bg-white rounded shadow hover:-translate-y-1 transition">
            <h3 className="text-xl font-semibold text-blue-600 mb-2">Application Tracking</h3>
            <p className="text-gray-600">Keep track of all your applications in one place.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
);
