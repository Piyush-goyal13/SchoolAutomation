import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axious';
import './Login.css'; // Import the new CSS file

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await API.post('/auth/login', { email, password });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.user.role);
            localStorage.setItem('userName', response.data.user.name);

            const role = response.data.user.role;
            if (role === 'admin') navigate('/admin-dashboard');
            else if (role === 'teacher') navigate('/teacher-dashboard');
            else navigate('/student-dashboard');

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Credentials');
        } finally {
            setLoading(false);
        }
    };

    // ... keep imports same
    return (
        <div className="login-page">
            <div className="glass-card">
                <div className="header">
                    {/* You can replace this with a logo <img> if you have one later */}
                    <h1 className="title">TechVeda</h1>
                    <p className="subtitle">Sign in to your school account</p>
                </div>

                {error && <div className="error-badge">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="john@school.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default Login;