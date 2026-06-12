import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, Package, CheckCircle, Clock, Star,
  Users, TrendingDown, MessageCircle, ShieldCheck, BadgeCheck, AlertCircle, ShoppingCart,
  MapPin, Truck, BarChart2, ArrowRight
} from 'lucide-react';
import { getUserOrders, getListings, getGroupBuyingOpportunities, submitBuyerVerification, getBuyerVerification, updateOrderRating, joinGroupBuying } from '../services/firebaseService';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [verifiedListings, setVerifiedListings] = useState([]);
  const [groupBuyingOpportunities, setGroupBuyingOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null);
  const [verForm, setVerForm] = useState({ businessName: '', businessType: 'individual', gstNumber: '', phone: '', address: '' });
  const [verSubmitting, setVerSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = getUserOrders(user.uid, (userOrders) => {
      setOrders(userOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribeListings = getListings((listings) => {
      const activeListings = listings.filter((listing) => listing.status === 'active');
      const verified = activeListings.filter((listing) => listing.verified || listing.farmerVerified);
      setVerifiedListings(verified);
    });

    return () => unsubscribeListings();
  }, []);

  useEffect(() => {
    const unsubscribe = getGroupBuyingOpportunities((items) => {
      setGroupBuyingOpportunities(items.filter((item) => item.status !== 'inactive'));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = getBuyerVerification(user.uid, setVerification);
    return () => unsubscribe();
  }, [user?.uid]);

  const handleRateOrder = async (orderId, rating) => {
    await updateOrderRating(orderId, rating);
  };

  const handleJoinGroupBuy = async (opportunityId) => {
    if (!user?.uid) return;
    await joinGroupBuying(opportunityId, user.uid);
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verForm.businessName || !verForm.phone) return;
    setVerSubmitting(true);
    await submitBuyerVerification(user.uid, { ...verForm, buyerName: user.name || user.email });
    setVerSubmitting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return '#10b981';
      case 'in-transit':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((order) => order.status === filterStatus);

  const activeOrders = orders.filter((order) => order.status === 'pending' || order.status === 'in-transit').length;
  const totalPurchaseValue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const completedOrders = orders.filter((order) => order.status === 'completed' || order.status === 'delivered');
  const ratedOrders = completedOrders.filter((order) => Number(order.farmerRating) > 0);
  const avgRating = ratedOrders.length
    ? (ratedOrders.reduce((sum, order) => sum + Number(order.farmerRating), 0) / ratedOrders.length).toFixed(1)
    : 'N/A';

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="buyer-dashboard-page">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>
            <ShoppingBag size={32} />
            Buyer Dashboard
          </h1>
          <p>Track your orders, browse verified farmers, and join group buys</p>
        </div>
        <Link to="/marketplace" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={18} /> Browse &amp; Buy Crops
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <Package size={32} />
          </div>
          <div className="stat-content">
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
            <span className="stat-change">{activeOrders} active orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <CheckCircle size={32} />
          </div>
          <div className="stat-content">
            <h3>Rs.{totalPurchaseValue.toLocaleString('en-IN')}</h3>
            <p>Total Purchase Value</p>
            <span className="stat-change">From your orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <TrendingDown size={32} />
          </div>
          <div className="stat-content">
            <h3>{groupBuyingOpportunities.length}</h3>
            <p>Group Buying</p>
            <span className="stat-change positive">Live opportunities</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>
            <Star size={32} />
          </div>
          <div className="stat-content">
            <h3>{avgRating}</h3>
            <p>Avg Farmer Rating</p>
            <span className="stat-change">From completed orders</span>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {[
          { to: '/marketplace', icon: <ShoppingCart size={16} />, label: 'Browse & Buy Crops', color: '#10b981' },
          { to: '/farmer-mapping', icon: <MapPin size={16} />, label: 'Find Farmers Near Me', color: '#3b82f6' },
          { to: '/input-marketplace', icon: <Package size={16} />, label: 'Input Marketplace', color: '#8b5cf6' },
          { to: '/equipment-rental', icon: <Truck size={16} />, label: 'Transport & Equipment', color: '#f59e0b' },
          { to: '/market-intelligence', icon: <BarChart2 size={16} />, label: 'Market Intelligence', color: '#ec4899' },
          { to: '/trust-center', icon: <ShieldCheck size={16} />, label: 'Trust Center', color: '#14b8a6' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.7rem 0.9rem', borderRadius: '0.5rem',
              background: '#f9fafb', border: '1px solid #e5e7eb',
              textDecoration: 'none', color: '#1f2937',
              fontSize: '0.85rem', fontWeight: 500
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = item.color + '15'; e.currentTarget.style.borderColor = item.color; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            <span style={{ color: item.color }}>{item.icon}</span>
            {item.label}
            <ArrowRight size={12} style={{ marginLeft: 'auto', color: '#9ca3af' }} />
          </Link>
        ))}
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={20} />
          My Orders ({orders.length})
        </button>
        <button
          className={`tab ${activeTab === 'groupBuying' ? 'active' : ''}`}
          onClick={() => setActiveTab('groupBuying')}
        >
          <Users size={20} />
          Group Buying ({groupBuyingOpportunities.length})
        </button>
        <button
          className={`tab ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          <CheckCircle size={20} />
          Verified Farmers ({verifiedListings.length})
        </button>
        <button
          className={`tab ${activeTab === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveTab('verification')}
        >
          <ShieldCheck size={20} />
          My Verification
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="orders-section">
          <div className="section-header">
            <h2>Order History & Tracking</h2>
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
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.id}</h3>
                      <p className="order-date">
                        Placed on {order.orderDate || order.createdAt ? new Date(order.orderDate || order.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="order-status" style={{ background: getStatusColor(order.status) }}>
                      {(order.status || 'pending').replace('-', ' ')}
                    </div>
                  </div>

                  <div className="order-body">
                    <div className="farmer-info">
                      <div>
                        <h4>{order.farmer || order.farmerName || 'Farmer'}</h4>
                        {order.farmerRating ? (
                          <div className="farmer-rating">
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                            <span>{order.farmerRating}</span>
                          </div>
                        ) : null}
                      </div>
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
                        <span className="label">Quality:</span>
                        <span className="value">{order.quality || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Total Amount:</span>
                        <span className="value price">Rs.{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="delivery-info">
                      {order.status === 'delivered' || order.status === 'completed' ? (
                        <div className="delivered-info">
                          <CheckCircle size={20} color="#10b981" />
                          <span>Delivered on {order.deliveredDate || order.completedDate || order.createdAt ? new Date(order.deliveredDate || order.completedDate || order.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                      ) : (
                        <div className="expected-delivery">
                          <Clock size={20} />
                          <span>Expected by {order.expectedDelivery || order.createdAt ? new Date(order.expectedDelivery || order.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                      )}
                    </div>

                    <div className="order-actions">
                      <button className="btn btn-secondary">
                        <MessageCircle size={18} />
                        Contact Farmer
                      </button>
                      {(order.status === 'delivered' || order.status === 'completed') && (
                        <div className="rate-farmer">
                          <span className="rate-label">{order.farmerRating ? 'Your rating:' : 'Rate farmer:'}</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              className="star-btn"
                              onClick={() => handleRateOrder(order.id, star)}
                              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            >
                              <Star
                                size={18}
                                fill={star <= Number(order.farmerRating || 0) ? '#f59e0b' : 'none'}
                                color="#f59e0b"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Package size={48} />
                <p>No orders yet. Browse the marketplace to buy crops from farmers.</p>
                <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  <ShoppingCart size={16} /> Browse Marketplace
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'groupBuying' && (
        <div className="group-buying-section">
          <div className="section-header">
            <h2>
              <Users size={24} />
              Group Buying Opportunities
            </h2>
            <p className="section-subtitle">Records loaded from Firebase groupBuyingOpportunities</p>
          </div>

          {groupBuyingOpportunities.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>No real group buying opportunities found</p>
            </div>
          ) : (
            <div className="group-buying-grid">
              {groupBuyingOpportunities.map((opportunity) => {
                const normalPrice = Number(opportunity.normalPrice || 0);
                const groupPrice = Number(opportunity.pricePerUnit || opportunity.price || 0);
                const savings = Number(opportunity.savings || Math.max(normalPrice - groupPrice, 0));
                const savingsPercent = Number(opportunity.savingsPercent || (normalPrice > 0 ? ((savings / normalPrice) * 100).toFixed(1) : 0));
                const currentParticipants = Number(opportunity.currentParticipants || 0);
                const maxParticipants = Number(opportunity.maxParticipants || 1);

                return (
                  <div key={opportunity.id} className="group-buying-card">
                    <div className="gb-header">
                      <div>
                        <h3>{opportunity.crop || 'Crop'} {opportunity.variety ? `- ${opportunity.variety}` : ''}</h3>
                        <p className="fpo-name">
                          {opportunity.verified && <CheckCircle size={16} color="#10b981" />}
                          {opportunity.fpo || opportunity.seller || 'FPO'}
                        </p>
                      </div>
                      <div className="savings-badge">
                        Save {savingsPercent}%
                      </div>
                    </div>

                    <div className="gb-body">
                      <div className="price-comparison">
                        <div className="normal-price">
                          <span className="label">Normal Price</span>
                          <span className="value strikethrough">Rs.{normalPrice}</span>
                        </div>
                        <div className="group-price">
                          <span className="label">Group Price</span>
                          <span className="value highlight">Rs.{groupPrice}</span>
                        </div>
                        <div className="savings">
                          <span>You save Rs.{savings}/quintal</span>
                        </div>
                      </div>

                      <div className="gb-details">
                        <div className="detail">
                          <span className="label">Total Quantity</span>
                          <span>{opportunity.totalQuantity || 0} quintals</span>
                        </div>
                        <div className="detail">
                          <span className="label">Min Order</span>
                          <span>{opportunity.minOrderQuantity || 0} quintals</span>
                        </div>
                        <div className="detail">
                          <span className="label">Quality</span>
                          <span>{opportunity.quality || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="participation-status">
                        <div className="participants-bar">
                          <div
                            className="participants-fill"
                            style={{ width: `${Math.min((currentParticipants / maxParticipants) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="participants-text">
                          {currentParticipants} / {maxParticipants} buyers joined
                        </span>
                      </div>

                      {opportunity.deadline ? (
                        <div className="deadline">
                          <Clock size={16} />
                          <span>Closes on {opportunity.deadline}</span>
                        </div>
                      ) : null}

                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.75rem' }}
                        disabled={
                          opportunity.participants?.[user?.uid] ||
                          currentParticipants >= maxParticipants
                        }
                        onClick={() => handleJoinGroupBuy(opportunity.id)}
                      >
                        {opportunity.participants?.[user?.uid]
                          ? 'Already Joined'
                          : currentParticipants >= maxParticipants
                          ? 'Group Full'
                          : 'Join Group Buy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'verified' && (
        <div className="verified-farmers-section">
          <div className="section-header">
            <h2>
              <CheckCircle size={24} />
              Verified Farmer Listings
            </h2>
            <p className="section-subtitle">Verified records from Firebase listings</p>
          </div>

          {verifiedListings.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} />
              <p>No verified farmer listings found</p>
            </div>
          ) : (
            <div className="verified-listings-grid">
              {verifiedListings.map((listing) => (
                <div key={listing.id} className="verified-listing-card">
                  <div className="verified-badge">
                    <CheckCircle size={20} color="#10b981" />
                    <span>Verified Farmer</span>
                  </div>

                  <div className="farmer-profile">
                    <h3>{listing.farmer || listing.farmerName || 'Farmer'}</h3>
                    <div className="farmer-stats">
                      {listing.rating ? (
                        <div className="stat">
                          <Star size={18} fill="#f59e0b" color="#f59e0b" />
                          <span>{listing.rating}</span>
                        </div>
                      ) : null}
                      <div className="stat">
                        <Package size={18} />
                        <span>{listing.totalDeliveries || 0} deliveries</span>
                      </div>
                    </div>
                  </div>

                  <div className="listing-details">
                    <h4>{listing.crop || 'Crop'}</h4>
                    <div className="listing-info">
                      <div className="info-row">
                        <span>Quantity:</span>
                        <span>{listing.quantity || 0} {listing.unit || ''}</span>
                      </div>
                      <div className="info-row">
                        <span>Price:</span>
                        <span className="price">Rs.{Number(listing.price || 0).toLocaleString('en-IN')}/{listing.unit || 'unit'}</span>
                      </div>
                      <div className="info-row">
                        <span>Quality:</span>
                        <span>{listing.quality || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <span>Harvest:</span>
                        <span>{listing.harvestDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'verification' && (
        <div className="verification-section">
          <div className="section-header">
            <h2><ShieldCheck size={24} /> Buyer Verification</h2>
            <p className="section-subtitle">Get verified to build trust with farmers and unlock priority access</p>
          </div>

          {verification?.status === 'verified' ? (
            <div className="verification-status-card verified">
              <BadgeCheck size={48} color="#10b981" />
              <h3>You are Verified</h3>
              <p>Your buyer account has been verified. Farmers can see your verified badge.</p>
              <div className="ver-details">
                <span><strong>Business:</strong> {verification.businessName}</span>
                <span><strong>Type:</strong> {verification.businessType}</span>
                <span><strong>Verified on:</strong> {new Date(verification.verifiedAt || verification.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : verification?.status === 'pending' ? (
            <div className="verification-status-card pending">
              <AlertCircle size={48} color="#f59e0b" />
              <h3>Verification Pending</h3>
              <p>Your verification request is under review. We'll update you within 2-3 business days.</p>
              <div className="ver-details">
                <span><strong>Business:</strong> {verification.businessName}</span>
                <span><strong>Submitted:</strong> {new Date(verification.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="verification-form-card">
              <div className="ver-benefits">
                <h4>Benefits of getting verified:</h4>
                <ul>
                  <li><CheckCircle size={16} color="#10b981" /> Verified badge visible to all farmers</li>
                  <li><CheckCircle size={16} color="#10b981" /> Priority access to new listings</li>
                  <li><CheckCircle size={16} color="#10b981" /> Higher trust score in marketplace</li>
                  <li><CheckCircle size={16} color="#10b981" /> Access to group buying opportunities</li>
                </ul>
              </div>
              <form onSubmit={handleVerificationSubmit} className="ver-form">
                <div className="form-group">
                  <label>Business / Full Name *</label>
                  <input type="text" value={verForm.businessName} onChange={(e) => setVerForm({ ...verForm, businessName: e.target.value })} required placeholder="Enter your business or full name" />
                </div>
                <div className="form-group">
                  <label>Buyer Type *</label>
                  <select value={verForm.businessType} onChange={(e) => setVerForm({ ...verForm, businessType: e.target.value })}>
                    <option value="individual">Individual</option>
                    <option value="hotel_restaurant">Hotel / Restaurant</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="retailer">Retailer</option>
                    <option value="fpo">FPO / Cooperative</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" value={verForm.phone} onChange={(e) => setVerForm({ ...verForm, phone: e.target.value })} required placeholder="10-digit mobile number" />
                </div>
                <div className="form-group">
                  <label>GST / Aadhaar Number</label>
                  <input type="text" value={verForm.gstNumber} onChange={(e) => setVerForm({ ...verForm, gstNumber: e.target.value })} placeholder="Optional — for business verification" />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea value={verForm.address} onChange={(e) => setVerForm({ ...verForm, address: e.target.value })} rows="2" placeholder="City, District, State" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={verSubmitting}>
                  {verSubmitting ? 'Submitting...' : 'Submit Verification Request'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
