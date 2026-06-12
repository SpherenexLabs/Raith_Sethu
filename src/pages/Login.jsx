import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, MapPin, AlertCircle, LocateFixed } from 'lucide-react';
import { getDashboardPath } from '../utils/roleDashboard';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCseX7e7t3cWnc5wq5NRkZtWtcnyG0QKD4';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'farmer',
    location: '',
    latitude: '',
    longitude: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);

        if (result.success) {
          navigate(getDashboardPath(result.user?.role), { replace: true });
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      } else {
        const result = await signup(formData.email, formData.password, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude
        });

        if (result.success) {
          navigate(getDashboardPath(formData.role), { replace: true });
        } else {
          setError(result.error || 'Signup failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const getBrowserPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Current location is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  });

  const reverseGeocodeLocation = async (latitude, longitude) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.length) {
      throw new Error(data.error_message || 'Unable to find address for this location.');
    }

    return data.results[0].formatted_address;
  };

  const handleUseCurrentLocation = async () => {
    setError('');
    setLocationStatus('Requesting location access...');
    setLocationLoading(true);

    try {
      const position = await getBrowserPosition();
      const latitude = position.coords.latitude.toFixed(6);
      const longitude = position.coords.longitude.toFixed(6);
      let location = `${latitude}, ${longitude}`;

      try {
        setLocationStatus('Finding address...');
        location = await reverseGeocodeLocation(latitude, longitude);
      } catch (geocodeError) {
        console.warn('Reverse geocode error:', geocodeError);
        setLocationStatus('Address not found. Saved coordinates instead.');
      }

      setFormData((current) => ({
        ...current,
        location,
        latitude,
        longitude
      }));

      if (location !== `${latitude}, ${longitude}`) {
        setLocationStatus('Current location added.');
      }
    } catch (locationError) {
      console.error('Location error:', locationError);
      setLocationStatus('');
      setError(locationError.message || 'Unable to access current location. Please allow location permission.');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p>{isLogin ? 'Sign in to your account' : 'Register to get started'}</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>
                    <User size={20} />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={20} />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <MapPin size={20} />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Village, Taluk, District"
                    required={!isLogin}
                    disabled={loading || locationLoading}
                  />
                  <button
                    type="button"
                    className="location-access-btn"
                    onClick={handleUseCurrentLocation}
                    disabled={loading || locationLoading}
                  >
                    <LocateFixed size={18} />
                    <span>{locationLoading ? 'Getting location...' : 'Use current location'}</span>
                  </button>
                  {locationStatus && <p className="location-status">{locationStatus}</p>}
                </div>

                <div className="form-group">
                  <label>
                    <User size={20} />
                    <span>Register As</span>
                  </label>
                  <div className="role-selector">
                    {[
                      { value: 'farmer',   icon: '🌾', title: 'Farmer',          desc: 'Crop planning, marketplace listing, analytics & government schemes' },
                      { value: 'buyer',    icon: '🏪', title: 'Buyer / Wholesaler', desc: 'Bulk orders, group buying, verified listings & buyer verification' },
                      { value: 'customer', icon: '🛒', title: 'Customer',         desc: 'Browse & buy fresh produce, track orders & view market prices' },
                    ].map((r) => (
                      <label
                        key={r.value}
                        className={`role-option ${formData.role === r.value ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={formData.role === r.value}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <span className="role-option-icon">{r.icon}</span>
                        <span className="role-option-text">
                          <strong>{r.title}</strong>
                          <small>{r.desc}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label>
                <Mail size={20} />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={20} />
                <span>Password</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="login-switch">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="switch-btn"
                disabled={loading}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <div className="login-info">
          <h2>Raith Sethu</h2>

          <div className="role-info-card">
            <span className="role-info-icon">🌾</span>
            <div>
              <strong>Farmer</strong>
              <ul>
                <li>AI crop planning & weather alerts</li>
                <li>List crops on marketplace</li>
                <li>Analytics & farming activity tracker</li>
                <li>Government schemes & input marketplace</li>
              </ul>
            </div>
          </div>

          <div className="role-info-card">
            <span className="role-info-icon">🏪</span>
            <div>
              <strong>Buyer / Wholesaler</strong>
              <ul>
                <li>Browse verified farmer listings</li>
                <li>Group buying at discounted rates</li>
                <li>Order tracking & buyer verification</li>
                <li>Market price intelligence</li>
              </ul>
            </div>
          </div>

          <div className="role-info-card">
            <span className="role-info-icon">🛒</span>
            <div>
              <strong>Customer</strong>
              <ul>
                <li>Buy fresh produce directly from farmers</li>
                <li>Track your orders</li>
                <li>Check market prices</li>
                <li>View farmer trust scores</li>
              </ul>
            </div>
          </div>

          <div className="admin-info">
            <h3>Admin Dashboard</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7, fontStyle: 'italic' }}>
              Admin login: admin@farmmanagement.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
