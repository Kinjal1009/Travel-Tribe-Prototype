
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global Error Handler for boot/runtime crashes
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root) {
    const errorBanner = document.createElement('div');
    errorBanner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fee2e2;color:#991b1b;padding:12px;z-index:9999;font-size:12px;font-family:monospace;border-bottom:1px solid #f87171';
    errorBanner.innerHTML = `<strong>App Error:</strong> ${event.message} <br/> <small>${event.filename}:${event.lineno}</small>`;
    document.body.prepend(errorBanner);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
