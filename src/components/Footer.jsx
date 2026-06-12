import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Raith Sethu</h3>
          <p>Empowering farmers with data-driven insights and direct market access</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/trust-center">Trust Center</Link></li>
            <li><Link to="/voice-support">Support</Link></li>
            <li><Link to="/government-schemes">Government Schemes</Link></li>
            <li><Link to="/market-intelligence">Market Intel</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Modules</h4>
          <ul>
            <li><Link to="/crop-planning">Crop Planning</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/marketplace">Marketplace</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: support@raithsethu.com</p>
          <p>Phone: +91 1800-XXX-XXXX</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 Raith Sethu. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
