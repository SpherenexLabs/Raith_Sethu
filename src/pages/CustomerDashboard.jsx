import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Package, CheckCircle, Clock, Star,
  TrendingUp, MessageCircle, Shield, Mic
} from 'lucide-react';
import { getUserOrders, updateOrderRating } from '../services/firebaseService';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = getUserOrders(user.uid, (userOrders) => {
      setOrders(userOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleRateOrder = async (orderId, rating) => {
    await updateOrderRating(orderId, rating);
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const activeOrders  = orders.filter((o) => o.status === 'pending' || o.status === 'in-transit').length;
  const totalSpent    = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': case 'completed': return '#10b981';
      case 'in-transit': return '#3b82f6';
      case 'pending':    return '#f59e0b';
      case 'cancelled':  return '#ef4444';
      default:           return '#6b7280';
    }
  };

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div className="buyer-dashboard-page">
      <div className="page-header">
        <div>
          <h1><ShoppingCart size={32} /> Customer Dashboard</h1>
          <p>Welcome back, {user?.name || 'Customer'} — browse fresh produce directly from farmers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}><Package size={32} /></div>
          <div className="stat-content">
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
            <span className="stat-change">{activeOrders} active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}><CheckCircle size={32} /></div>
          <div className="stat-content">
            <h3>{completedOrders}</h3>
            <p>Completed Orders</p>
            <span className="stat-change positive">delivered successfully</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}><TrendingUp size={32} /></div>
          <div className="stat-content">
            <h3>Rs.{totalSpent.toLocaleString('en-IN')}</h3>
            <p>Total Spent</p>
            <span className="stat-change">from your orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}><Clock size={32} /></div>
          <div className="stat-content">
            <h3>{activeOrders}</h3>
            <p>Active Orders</p>
            <span className="stat-change">pending / in-transit</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links-grid">
        <Link to="/marketplace" className="quick-link-card">
          <ShoppingCart size={28} color="#10b981" />
          <div>
            <h4>Browse Marketplace</h4>
            <p>Buy fresh crops directly from farmers</p>
          </div>
        </Link>
        <Link to="/market-intelligence" className="quick-link-card">
          <TrendingUp size={28} color="#3b82f6" />
          <div>
            <h4>Market Prices</h4>
            <p>Check live mandi prices & trends</p>
          </div>
        </Link>
        <Link to="/trust-center" className="quick-link-card">
          <Shield size={28} color="#f59e0b" />
          <div>
            <h4>Trust Center</h4>
            <p>View farmer ratings & reputation</p>
          </div>
        </Link>
        <Link to="/voice-support" className="quick-link-card">
          <Mic size={28} color="#8b5cf6" />
          <div>
            <h4>Voice Support</h4>
            <p>Navigate using voice commands</p>
          </div>
        </Link>
      </div>

      {/* Orders */}
      <div className="orders-section" style={{ marginTop: '1.5rem' }}>
        <div className="section-header">
          <h2>My Orders</h2>
          <div className="filter-buttons">
            {['all', 'pending', 'in-transit', 'delivered'].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="orders-grid">
          {filteredOrders.length > 0 ? filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.id?.slice(-6)}</h3>
                  <p className="order-date">
                    {new Date(order.orderDate || order.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <div className="order-status" style={{ background: getStatusColor(order.status) }}>
                  {(order.status || 'pending').replace('-', ' ')}
                </div>
              </div>

              <div className="order-body">
                <div className="farmer-info">
                  <h4>{order.farmer || order.farmerName || 'Farmer'}</h4>
                </div>
                <div className="crop-details">
                  <div className="detail-row">
                    <span className="label">Crop:</span>
                    <span className="value">{order.crop || 'N/A'} {order.variety ? `(${order.variety})` : ''}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Quantity:</span>
                    <span className="value">{order.quantity || 0} {order.unit || ''}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Total:</span>
                    <span className="value price">Rs.{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="delivery-info">
                  {order.status === 'delivered' || order.status === 'completed' ? (
                    <div className="delivered-info">
                      <CheckCircle size={20} color="#10b981" />
                      <span>Delivered on {new Date(order.deliveredDate || order.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <div className="expected-delivery">
                      <Clock size={20} />
                      <span>Expected by {new Date(order.expectedDelivery || order.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="order-actions">
                  <button className="btn btn-secondary">
                    <MessageCircle size={18} /> Contact Farmer
                  </button>
                  {(order.status === 'delivered' || order.status === 'completed') && (
                    <div className="rate-farmer">
                      <span className="rate-label">{order.farmerRating ? 'Your rating:' : 'Rate farmer:'}</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} className="star-btn" onClick={() => handleRateOrder(order.id, star)}>
                          <Star size={18} fill={star <= Number(order.farmerRating || 0) ? '#f59e0b' : 'none'} color="#f59e0b" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="empty-state">
              <Package size={48} />
              <p>No orders found</p>
              <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Browse Marketplace
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
