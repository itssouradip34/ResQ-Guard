import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthRoleProvider } from './context/AuthRoleContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthRoleProvider>
      <App />
    </AuthRoleProvider>
  </React.StrictMode>
);
