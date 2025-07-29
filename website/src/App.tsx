import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import AppRoutes from './AppRoutes';
import {Contect} from './components/Home/components/Contect_Chatbot'
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Contect />
      </Router>
    </AuthProvider>
  );
}

export default App;
