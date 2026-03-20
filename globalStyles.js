import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700;800&display=swap');

  :root {
    --bg-primary: #050810;
    --bg-secondary: #0a0f1e;
    --bg-card: #0d1426;
    --bg-glass: rgba(13, 20, 38, 0.8);
    --border: rgba(0, 255, 200, 0.12);
    --border-bright: rgba(0, 255, 200, 0.35);
    --accent-cyan: #00ffc8;
    --accent-red: #ff3366;
    --accent-orange: #ff7b00;
    --accent-blue: #0066ff;
    --accent-purple: #7b2fff;
    --text-primary: #e8f0fe;
    --text-secondary: #8899bb;
    --text-dim: #445577;
    --success: #00ff88;
    --danger: #ff3366;
    --warning: #ff7b00;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
    --glow-cyan: 0 0 20px rgba(0, 255, 200, 0.3);
    --glow-red: 0 0 20px rgba(255, 51, 102, 0.4);
    --glow-card: 0 0 40px rgba(0, 255, 200, 0.05), 0 0 80px rgba(0, 102, 255, 0.03);
    --radius: 12px;
    --radius-lg: 20px;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-display);
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0, 255, 200, 0.06) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 110%, rgba(0, 102, 255, 0.05) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 50% 50%, rgba(123, 47, 255, 0.02) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  #root {
    position: relative;
    z-index: 1;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 200, 0.2);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 200, 0.4);
  }

  a {
    color: var(--accent-cyan);
    text-decoration: none;
  }

  button {
    font-family: var(--font-display);
    cursor: pointer;
  }

  input, textarea {
    font-family: var(--font-mono);
  }
`;
