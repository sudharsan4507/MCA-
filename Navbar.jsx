import React  from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

const Nav = styled(motion.nav)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 64px;
  background: rgba(5, 8, 16, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  position: relative;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const LogoText = styled.span`
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-primary);

  span {
    color: var(--accent-cyan);
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavLink = styled(Link)`
  position: relative;
  padding: 6px 14px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: ${p => p.$active ? 'var(--accent-cyan)' : 'var(--text-secondary)'};
  text-decoration: none;
  transition: color 0.2s;
  border-radius: 6px;
  text-transform: uppercase;

  &:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.04);
  }

  ${p => p.$active && `
    background: rgba(0, 255, 200, 0.06);
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: var(--accent-cyan);
      border-radius: 2px;
      box-shadow: var(--glow-cyan);
    }
  `}
`;

const StatusDot = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: ${p => p.$connected ? 'var(--success)' : 'var(--danger)'};
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid ${p => p.$connected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)'};
  background: ${p => p.$connected ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 51, 102, 0.05)'};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 6px currentColor;
    animation: ${p => p.$connected ? 'pulse 2s infinite' : 'none'};
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

const ScanLine = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
`;

export default function Navbar({ serverStatus }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <Nav
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Logo to="/">
        <LogoIcon>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" stroke="rgba(0,255,200,0.3)" strokeWidth="1"/>
            <circle cx="16" cy="16" r="10" stroke="rgba(0,255,200,0.5)" strokeWidth="1"/>
            <path d="M8 16 Q12 10 16 16 Q20 22 24 16" stroke="#00ffc8" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M10 20 Q13 14 16 20 Q19 26 22 20" stroke="rgba(0,255,200,0.4)" strokeWidth="1" fill="none" strokeLinecap="round"/>
            <circle cx="16" cy="16" r="2" fill="#00ffc8"/>
            <circle cx="16" cy="16" r="4" stroke="rgba(0,255,200,0.3)" strokeWidth="0.5"/>
          </svg>
        </LogoIcon>
        <LogoText>VOICE<span>GUARD</span></LogoText>
      </Logo>

      <NavLinks>
        <NavLink to="/" $active={isActive('/')}>Dashboard</NavLink>
        <NavLink to="/analyze" $active={isActive('/analyze')}>Analyze</NavLink>
        <NavLink to="/history" $active={isActive('/history')}>History</NavLink>
      </NavLinks>

      <AnimatePresence mode="wait">
        <StatusDot
          key={serverStatus}
          $connected={serverStatus === 'connected'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {serverStatus === 'connected' ? 'ONLINE' : serverStatus === 'checking' ? 'CHECKING' : 'OFFLINE'}
        </StatusDot>
      </AnimatePresence>

      <ScanLine
        initial={{ scaleX: 0, x: '-50%', left: '50%' }}
        animate={{ scaleX: [0, 1, 0], x: ['-50%', '0%', '50%'], left: ['0%', '0%', '50%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }}
      />
    </Nav>
  );
}
