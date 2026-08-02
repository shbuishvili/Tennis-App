import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Key, User, HelpCircle, Trophy } from 'lucide-react';

const TennisRacketIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <ellipse cx="12" cy="8" rx="5" ry="6" />
    <line x1="12" y1="2" x2="12" y2="14" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="8.5" y1="5" x2="15.5" y2="5" />
    <line x1="8.5" y1="11" x2="15.5" y2="11" />
    <line x1="12" y1="14" x2="12" y2="22" />
    <path d="M10 22h4" />
  </svg>
);

const LOCAL_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'super_admin', full_name: 'სუპერ ადმინისტრატორი' },
  { username: 'manager', password: 'manager123', role: 'manager', full_name: 'მთავარი მენეჯერი' },
  { username: 'staff', password: 'staff123', role: 'staff', full_name: 'მორიგე ოპერატორი' }
];

export default function Login({ onLoginSuccess, isSupabaseConnected }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoHelp, setShowDemoHelp] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('გთხოვთ შეავსოთ ყველა ველი');
      setLoading(false);
      return;
    }

    try {
      if (isSupabaseConnected) {
        // Query user from Supabase user_accounts table
        const { data, error: dbError } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('username', username.trim())
          .eq('password', password.trim())
          .maybeSingle();

        if (dbError || !data) {
          throw new Error('არასწორი მომხმარებელი ან პაროლი');
        }

        onLoginSuccess(data);
      } else {
        // Local fallback authentication
        const account = LOCAL_ACCOUNTS.find(
          (acc) => acc.username === username.trim() && acc.password === password.trim()
        );

        if (account) {
          onLoginSuccess(account);
        } else {
          // If they created a user locally, we can also check localStorage
          const localUsers = localStorage.getItem('local_user_accounts');
          if (localUsers) {
            const parsed = JSON.parse(localUsers);
            const customAccount = parsed.find(
              (acc) => acc.username === username.trim() && acc.password === password.trim()
            );
            if (customAccount) {
              onLoginSuccess(customAccount);
              return;
            }
          }
          throw new Error('არასწორი მომხმარებელი ან პაროლი');
        }
      }
    } catch (err) {
      setError(err.message || 'ავტორიზაცია ვერ განხორციელდა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card glass-panel">
        <div className="login-logo-box">
          <TennisRacketIcon size={44} className="text-volt animate-spin-slow" />
          <h2>აქტივობების ჯავშნის პორტალი</h2>
          <p className="text-xs text-secondary">სისტემაში შესვლა</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="form-error">{error}</div>}

          {/* Username field */}
          <div className="form-group">
            <label className="form-label">მომხმარებლის სახელი</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="შეიყვანეთ იუზერნეიმი"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="form-group">
            <label className="form-label">პაროლი</label>
            <div className="input-with-icon">
              <Key size={16} className="input-icon" />
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="შეიყვანეთ პაროლი"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
            {loading ? 'მიმდინარეობს შესვლა...' : 'ავტორიზაცია'}
          </button>
        </form>
      </div>

      <style>{`
        .login-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, #111827 0%, #030712 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 2000;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 32px 24px;
          border-radius: var(--radius-lg);
          box-shadow: 0 30px 60px rgba(0,0,0,0.8), var(--shadow-glow);
          border: 1px solid rgba(204, 255, 0, 0.1);
        }

        .login-logo-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 28px;
        }
        
        .login-logo-box h2 {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.3rem;
          color: white;
          margin-top: 14px;
          letter-spacing: -0.01em;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-submit-btn {
          margin-top: 8px;
          padding: 12px;
          font-size: 1rem;
        }

        .demo-credentials-box {
          margin-top: 24px;
          background: rgba(204, 255, 0, 0.02);
          border: 1px dashed rgba(204, 255, 0, 0.15);
          border-radius: var(--radius-sm);
          padding: 12px;
          font-size: 0.75rem;
        }

        .demo-help-header {
          display: flex;
          align-items: center;
          font-weight: 700;
          color: white;
          cursor: pointer;
          margin-bottom: 8px;
        }

        .demo-users-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: var(--text-secondary);
        }
        
        .demo-users-list code {
          background: rgba(255, 255, 255, 0.05);
          padding: 1px 4px;
          border-radius: 3px;
          color: var(--color-volt);
        }
      `}</style>
    </div>
  );
}
