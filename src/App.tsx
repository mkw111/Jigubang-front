import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string>('Waiting for token...');

  useEffect(() => {
    // Listener for messages from React Native
    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SET_FCM_TOKEN') {
          setDeviceToken(data.token);
        }
      } catch (e) {
        // Not our message or not JSON
      }
    };

    // For Android (document) and iOS (window)
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage as any);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage as any);
    };
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(deviceToken);
    alert('Token copied to clipboard!');
  };

  const sendPushNotification = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: deviceToken,
          title: '🌍 Jigubang Alert',
          message: 'Time to save the planet! Check your daily mission.'
        }),
      });
      const data = await response.json();
      alert(data.message || 'Push Notification Triggered!');
    } catch (error) {
      console.error('Error triggering push:', error);
      alert('Failed to trigger push notification (Backend might be down)');
    }
  };

  if (isLoggedIn) {
    return (
      <div className="App main-theme">
        <header className="hero-section">
          <div className="logo-container">
            <span className="earth-icon">🌍</span>
            <h1 className="brand-name">Jigubang</h1>
          </div>
          <p className="hero-subtitle">지구를 구하는 방법</p>
          
          <div className="token-card">
            <h4>My Device FCM Token</h4>
            <div className="token-display">
              <code>{deviceToken}</code>
            </div>
            <button onClick={copyToken} className="btn-small">Copy Token</button>
          </div>

          <div className="action-card">
            <h3>Admin Dashboard</h3>
            <p>Push Test Control Center</p>
            <button onClick={sendPushNotification} className="btn btn-push">
              🚀 Send App Push Notification
            </button>
            <button onClick={() => setIsLoggedIn(false)} className="btn btn-logout">
              Logout
            </button>
          </div>
        </header>
        <footer className="footer">
          <p>&copy; 2026 Jigubang Project. Small steps, Big impact.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="App auth-theme">
      <div className="auth-card">
        <div className="logo-container">
          <span className="earth-icon">🌍</span>
          <h1 className="brand-name">Jigubang</h1>
        </div>
        <p className="auth-subtitle">Join the mission to save Earth</p>
        
        <div className="auth-container">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <form onSubmit={handleAuth}>
            <div className="input-group">
              <input type="email" placeholder="Earth-friendly Email" required />
            </div>
            <div className="input-group">
              <input type="password" placeholder="Secure Password" required />
            </div>
            {!isLogin && (
              <div className="input-group">
                <input type="password" placeholder="Confirm Password" required />
              </div>
            )}
            <button type="submit" className="btn btn-primary">
              {isLogin ? 'Login to Action' : 'Start Saving Earth'}
            </button>
          </form>
          <p onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
            {isLogin ? "New to the mission? Sign Up" : 'Already an eco-warrior? Login'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
