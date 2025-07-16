import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import SignUp from './components/auth/SignUp';
import Login from './components/auth/Login';
import PrivacyPolicy from './components/auth/Privacy_Policy';
import  Home  from './components/Home/components/Hero';
import AppliedJob from './components/AppliedJob/AppliedJob';
import Profile from './components/Profile/Profile';
import UserProfile from './components/UserProfile/UserProfile';
import { Feature } from './components/Home/components/Features';
import { Pricing } from './components/Home/components/Pricing';
import MainPage from './components/Quotations/MainPage';
import TermsAndConditions  from './components/auth/Terms_COndition';
import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import RefundPolicy from './components/auth/RefundPolicy';
import FAQ from './components/Home/components/FAQ';
const AppRoutes = () => {
  const { isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/signup" element={<Layout><SignUp /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/PrivacyPolicy" element={<Layout><PrivacyPolicy /></Layout>} />
      <Route path="/TermsAndConditions" element={<Layout><TermsAndConditions /></Layout>} />
      <Route path="/RefundPolicy" element={<Layout><RefundPolicy /></Layout>} />
       
      
      {/* Public Routes */}
      <Route path="/features" element={<Layout><Feature /></Layout>} />
      <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
      <Route path="/FAQ" element={<Layout><FAQ /></Layout>} />
      {/* Protected Routes */}
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      <Route path="/UserProfile" element={<ProtectedRoute><Layout><UserProfile /></Layout></ProtectedRoute>} />
      <Route path="/AppliedJob" element={<ProtectedRoute><Layout><AppliedJob /></Layout></ProtectedRoute>} />
      <Route path="/MainPage" element={<ProtectedRoute><Layout><MainPage /></Layout></ProtectedRoute>} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
              <p>Start Applying for Jobs</p>
            </div>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/subscription" element={
        <ProtectedRoute>
          <Layout>
            <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
  <div className="max-w-2xl text-center">
    <h1 className="text-4xl font-bold text-gray-800 mb-4">Subscription Plan</h1>
    
    <p className="text-lg text-purple-600 font-semibold mb-2">
      🎉 Limited-Time Offer! Free for <span className="font-medium text-indigo-600">Beta</span> Version.
    </p>
    
    <p className="text-base text-gray-600 mb-2">
      Our AI finds and applies to jobs for you so you can focus on what matters.
    </p>
    
    <p className="text-base text-gray-600 mb-6">
      Offer ends with our next release — claim it now.
    </p>

    {/* Add pricing plans below here */}
  </div>
</div>
          </Layout>
        </ProtectedRoute>
      } />
       
    </Routes>
  );
};

export default AppRoutes;
