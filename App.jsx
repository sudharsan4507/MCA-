import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GlobalStyles } from './styles/globalStyles';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import HistoryPage from './pages/HistoryPage';
import { checkHealth } from './services/api';

function App() {
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const check = async () => {
      try {
        await checkHealth();
        setServerStatus('connected');
      } catch {
        setServerStatus('offline');
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <GlobalStyles />
      <Navbar serverStatus={serverStatus} />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/analyze" element={<PageWrapper><UploadPage /></PageWrapper>} />
          <Route path="/history" element={<PageWrapper><HistoryPage /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

export default App;
