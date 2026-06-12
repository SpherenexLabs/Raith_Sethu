import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, ChevronDown, Sprout } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getDashboardPath } from '../utils/roleDashboard';

const MAX_VISIBLE_LINKS = 4;

const Navbar = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsMoreOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const roleLinks = useMemo(() => {
    if (!user) {
      return [{ to: '/', label: t('home') }];
    }

    const role = user.role || 'farmer';
    const dashboardLink = {
      to: getDashboardPath(role),
      label: role === 'admin' ? t('adminDashboard') : t('dashboard')
    };

    const linksByRole = {
      admin: [
        dashboardLink,
        { to: '/crop-insurance', label: 'Crop Insurance' },
        { to: '/farmer-mapping', label: 'Farmer Map' }
      ],
      farmer: [
        dashboardLink,
        { to: '/crop-planning', label: 'Crop Planning' },
        { to: '/farming-activity', label: 'Farming Activity' },
        { to: '/marketplace', label: t('marketplace') },
        { to: '/analytics', label: t('analytics') },
        { to: '/crop-insurance', label: 'Crop Insurance' },
        { to: '/market-intelligence', label: t('marketIntel') },
        { to: '/input-marketplace', label: 'Input Marketplace' },
        { to: '/equipment-rental', label: 'Equipment Rental' },
        { to: '/government-schemes', label: 'Government Schemes' },
        { to: '/trust-center', label: t('trustCenter') },
        { to: '/voice-support', label: t('voiceSupport') }
      ],
      buyer: [
        dashboardLink,
        { to: '/marketplace', label: t('marketplace') },
        { to: '/farmer-mapping', label: 'Find Farmers' },
        { to: '/market-intelligence', label: t('marketIntel') },
        { to: '/input-marketplace', label: 'Input Marketplace' },
        { to: '/equipment-rental', label: 'Transport & Equipment' },
        { to: '/trust-center', label: t('trustCenter') },
        { to: '/voice-support', label: t('voiceSupport') }
      ],
      customer: [
        { to: '/customer-dashboard', label: t('dashboard') },
        { to: '/marketplace', label: t('marketplace') },
        { to: '/market-intelligence', label: t('marketIntel') },
        { to: '/farmer-mapping', label: 'Farmer Map' },
        { to: '/trust-center', label: t('trustCenter') },
        { to: '/voice-support', label: t('voiceSupport') }
      ]
    };

    return linksByRole[role] || linksByRole.customer;
  }, [t, user]);

  const visibleLinks = roleLinks.slice(0, MAX_VISIBLE_LINKS);
  const moreLinks = roleLinks.slice(MAX_VISIBLE_LINKS);
  const isMoreActive = moreLinks.some((link) => isActive(link.to));
  const isAdmin = user?.role === 'admin';
  const brandPath = user ? getDashboardPath(user.role) : '/';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={brandPath} className="nav-brand" onClick={closeAll}>
          <Sprout className="brand-icon" size={30} />
          <span className="brand-text">Raith Sethu</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={closeAll}
            >
              {link.label}
            </Link>
          ))}

          {user && moreLinks.length > 0 && (
            <div className={`nav-more-wrapper ${isMoreActive ? 'active' : ''}`} ref={moreRef}>
              <button
                type="button"
                className={`nav-more-btn ${isMoreOpen ? 'open' : ''} ${isMoreActive ? 'active' : ''}`}
                onClick={() => setIsMoreOpen(!isMoreOpen)}
              >
                More <ChevronDown size={14} className={`more-chevron ${isMoreOpen ? 'rotated' : ''}`} />
              </button>
              {isMoreOpen && (
                <div className="nav-more-dropdown">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`nav-more-item ${isActive(link.to) ? 'active' : ''}`}
                      onClick={closeAll}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="nav-actions">
          <button className="language-btn" onClick={toggleLanguage} title="Toggle Language">
            <Globe size={20} />
            <span>{language.toUpperCase()}</span>
          </button>

          {user ? (
            <div className="user-menu">
              {isAdmin ? (
                <span className="profile-btn admin-session-label">
                  <User size={20} />
                  <span>{user.name || 'Admin'}</span>
                </span>
              ) : (
                <Link to="/profile" className="profile-btn" onClick={closeAll}>
                  <User size={20} />
                  <span>{user.name || 'Profile'}</span>
                </Link>
              )}
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={20} />
                <span>{t('logout')}</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
