import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    setResetToken('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setMessage(data.message);
      // In production, the token would be sent via email
      // For now, we'll display it and store it
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  const goToResetPassword = () => {
    if (resetToken) {
      // Navigate with token as URL parameter
      navigate(`/reset-password?token=${resetToken}`);
    } else {
      // Navigate without token
      navigate('/reset-password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Reset Password</h2>
        <p className="login-subtitle">Enter your email to receive reset instructions</p>

        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            padding: '12px',
            marginBottom: '15px',
            backgroundColor: '#efe',
            color: '#2a2',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>✓ {message}</p>
            {resetToken && (
              <>
                <p style={{ margin: '10px 0 5px 0', fontWeight: '600' }}>Your Reset Token:</p>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '10px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  border: '1px solid #2a2'
                }}>
                  {resetToken}
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>
                  Copy this token and click the button below to reset your password.
                </p>
              </>
            )}
          </div>
        )}

        {!resetToken ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading && <span className="spinner"></span>}
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
        ) : (
          <button
            onClick={goToResetPassword}
            className="login-button"
            style={{ marginTop: '10px' }}
          >
            Go to Reset Password Page →
          </button>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p className="signup-text" style={{ marginBottom: '10px' }}>
            Remember your password?{' '}
            <Link to="/login" className="signup-link">
              Sign in
            </Link>
          </p>
          
          <p className="signup-text">
            Already have a reset token?{' '}
            <Link to="/reset-password" className="signup-link">
              Reset Password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;