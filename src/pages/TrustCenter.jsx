import { useState, useEffect, useMemo } from 'react';
import {
  Shield, Award, CheckCircle, TrendingUp, Star,
  Package, Clock, ThumbsUp, AlertCircle, User, MapPin, Phone, Mail, Loader,
  MessageSquareWarning, PlusCircle, XCircle
} from 'lucide-react';
import { getAllUsers, getOrders, getListings, getDisputes, createDispute, updateDisputeStatus } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const TrustCenter = () => {
  const { user } = useAuth();
  const [rawFarmers, setRawFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [filterTier, setFilterTier] = useState('all');
  const [activeTab, setActiveTab] = useState('farmers');
  const [disputes, setDisputes] = useState([]);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeForm, setDisputeForm] = useState({ orderId: '', againstUserId: '', againstName: '', category: 'quality', description: '' });

  useEffect(() => {
    setLoading(true);

    const unsubUsers = getAllUsers((userData) => {
      setRawFarmers(userData.filter(u => u.role === 'farmer'));
    });

    const unsubOrders = getOrders((orderData) => {
      setOrders(orderData);
    });

    const unsubListings = getListings((listingData) => {
      setListings(listingData);
    });

    setLoading(false);

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubOrders) unsubOrders();
      if (unsubListings) unsubListings();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = getDisputes(user.uid, setDisputes);
    return () => unsubscribe();
  }, [user?.uid]);

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeForm.description.trim()) return;
    setDisputeSubmitting(true);
    await createDispute({
      ...disputeForm,
      raisedBy: user.uid,
      raisedByName: user.name || user.email,
      raisedByRole: user.role
    });
    setDisputeForm({ orderId: '', againstUserId: '', againstName: '', category: 'quality', description: '' });
    setShowDisputeForm(false);
    setDisputeSubmitting(false);
  };

  const calculateFarmerStats = (farmer) => {
    // Get farmer's orders
    const farmerOrders = orders.filter(o => o.farmerId === farmer.id || o.userId === farmer.id);
    const completedOrders = farmerOrders.filter(o => o.status === 'delivered' || o.status === 'completed');
    const farmerListings = listings.filter(l => l.userId === farmer.id);

    // Calculate metrics
    const totalOrders = farmerOrders.length;
    const successRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // Calculate rating (simplified - would be from actual reviews)
    const baseRating = 3.5;
    const bonusRating = Math.min(1.5, (successRate / 100) * 1.5);
    const rating = Math.min(5, baseRating + bonusRating);

    // Calculate trust score (0-100)
    const trustScore = Math.round(
      (successRate * 0.4) + 
      (Math.min(totalOrders / 10, 1) * 30) + 
      (farmer.verified ? 20 : 0) +
      (farmerListings.length > 0 ? 10 : 0)
    );

    // Determine tier
    let tier = 'Bronze';
    let tierColor = '#cd7f32';
    if (trustScore >= 80) {
      tier = 'Gold';
      tierColor = '#ffd700';
    } else if (trustScore >= 60) {
      tier = 'Silver';
      tierColor = '#c0c0c0';
    }

    return {
      ...farmer,
      totalOrders,
      completedOrders: completedOrders.length,
      successRate: successRate.toFixed(1),
      rating: rating.toFixed(1),
      trustScore,
      tier,
      tierColor,
      totalRevenue,
      activeListings: farmerListings.filter(l => l.status === 'active').length,
      totalListings: farmerListings.length,
      joinedDays: Math.floor((Date.now() - new Date(farmer.joinDate || farmer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const farmers = useMemo(
    () => rawFarmers.map(farmer => calculateFarmerStats(farmer)),
    [rawFarmers, orders, listings]
  );

  const filteredFarmers = farmers
    .filter(f => filterTier === 'all' || f.tier === filterTier)
    .sort((a, b) => b.trustScore - a.trustScore);

  if (loading) {
    return (
      <div className="trust-center-page">
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>Loading trust center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trust-center-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Trust & Transparency Center</h1>
            <p>Building trust through verified farmer reputation and transparent transactions</p>
          </div>
          <Shield size={48} className="header-icon" style={{ color: '#10b981' }} />
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'farmers' ? 'active' : ''}`} onClick={() => setActiveTab('farmers')}>
          <Shield size={20} /> Farmer Trust Scores
        </button>
        <button className={`tab ${activeTab === 'disputes' ? 'active' : ''}`} onClick={() => setActiveTab('disputes')}>
          <MessageSquareWarning size={20} /> Disputes ({disputes.length})
        </button>
      </div>

      {activeTab === 'farmers' && (<>
      {/* Trust Metrics Overview */}
      <div className="trust-metrics">
        <div className="metric-card">
          <Award size={32} color="#ffd700" />
          <div>
            <h3>{farmers.filter(f => f.tier === 'Gold').length}</h3>
            <p>Gold Tier Farmers</p>
          </div>
        </div>
        <div className="metric-card">
          <Award size={32} color="#c0c0c0" />
          <div>
            <h3>{farmers.filter(f => f.tier === 'Silver').length}</h3>
            <p>Silver Tier Farmers</p>
          </div>
        </div>
        <div className="metric-card">
          <CheckCircle size={32} color="#10b981" />
          <div>
            <h3>{farmers.filter(f => f.verified).length}</h3>
            <p>Verified Farmers</p>
          </div>
        </div>
        <div className="metric-card">
          <TrendingUp size={32} color="#3b82f6" />
          <div>
            <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
            <p>Successful Deliveries</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={filterTier === 'all' ? 'active' : ''}
          onClick={() => setFilterTier('all')}
        >
          All Farmers
        </button>
        <button 
          className={filterTier === 'Gold' ? 'active' : ''}
          onClick={() => setFilterTier('Gold')}
        >
          <Award size={16} color="#ffd700" />
          Gold Tier
        </button>
        <button 
          className={filterTier === 'Silver' ? 'active' : ''}
          onClick={() => setFilterTier('Silver')}
        >
          <Award size={16} color="#c0c0c0" />
          Silver Tier
        </button>
        <button 
          className={filterTier === 'Bronze' ? 'active' : ''}
          onClick={() => setFilterTier('Bronze')}
        >
          <Award size={16} color="#cd7f32" />
          Bronze Tier
        </button>
      </div>

      {/* Farmer Cards */}
      {filteredFarmers.length > 0 ? (
        <div className="farmers-grid">
          {filteredFarmers.map(farmer => (
            <div key={farmer.id} className="farmer-trust-card">
              {/* Tier Badge */}
              <div className="tier-badge" style={{ background: farmer.tierColor }}>
                <Award size={20} />
                {farmer.tier}
              </div>

              {/* Farmer Header */}
              <div className="farmer-header">
                <div className="farmer-avatar">
                  <User size={32} />
                </div>
                <div className="farmer-info">
                  <h3>
                    {farmer.name}
                    {farmer.verified && (
                      <CheckCircle size={20} color="#10b981" style={{ marginLeft: '0.5rem' }} />
                    )}
                  </h3>
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < Math.floor(farmer.rating) ? '#fbbf24' : 'none'}
                        color="#fbbf24"
                      />
                    ))}
                    <span>{farmer.rating}</span>
                  </div>
                </div>
              </div>

              {/* Trust Score */}
              <div className="trust-score-container">
                <div className="trust-score-label">Trust Score</div>
                <div className="trust-score-bar">
                  <div 
                    className="trust-score-fill" 
                    style={{ 
                      width: `${farmer.trustScore}%`,
                      background: farmer.trustScore >= 80 ? '#10b981' : farmer.trustScore >= 60 ? '#3b82f6' : '#f59e0b'
                    }}
                  />
                </div>
                <div className="trust-score-value">{farmer.trustScore}/100</div>
              </div>

              {/* Stats Grid */}
              <div className="farmer-stats">
                <div className="stat">
                  <Package size={20} color="#3b82f6" />
                  <div>
                    <strong>{farmer.totalOrders}</strong>
                    <span>Total Orders</span>
                  </div>
                </div>
                <div className="stat">
                  <CheckCircle size={20} color="#10b981" />
                  <div>
                    <strong>{farmer.successRate}%</strong>
                    <span>Success Rate</span>
                  </div>
                </div>
                <div className="stat">
                  <TrendingUp size={20} color="#f59e0b" />
                  <div>
                    <strong>{farmer.activeListings}</strong>
                    <span>Active Listings</span>
                  </div>
                </div>
                <div className="stat">
                  <Clock size={20} color="#8b5cf6" />
                  <div>
                    <strong>{farmer.joinedDays}</strong>
                    <span>Days Active</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="farmer-contact">
                {farmer.location && (
                  <div className="contact-item">
                    <MapPin size={16} />
                    <span>{farmer.location}</span>
                  </div>
                )}
                {farmer.phone && (
                  <div className="contact-item">
                    <Phone size={16} />
                    <span>{farmer.phone}</span>
                  </div>
                )}
              </div>

              {/* Revenue Badge */}
              {farmer.totalRevenue > 0 && (
                <div className="revenue-badge">
                  Total Revenue: ₹{farmer.totalRevenue.toLocaleString()}
                </div>
              )}

              {/* View Profile Button */}
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setSelectedFarmer(farmer)}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                View Full Profile
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <User size={64} strokeWidth={1} style={{ color: '#94a3b8' }} />
          <h2>No Farmers Found</h2>
          <p>No farmers match the selected filter criteria.</p>
        </div>
      )}

      {/* Farmer Detail Modal */}
      {selectedFarmer && (
        <div className="modal-overlay" onClick={() => setSelectedFarmer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedFarmer.name}
                {selectedFarmer.verified && (
                  <CheckCircle size={24} color="#10b981" style={{ marginLeft: '0.5rem' }} />
                )}
              </h2>
              <button onClick={() => setSelectedFarmer(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="profile-detail">
                <div className="detail-row"><strong>Email:</strong><span>{selectedFarmer.email}</span></div>
                <div className="detail-row"><strong>Phone:</strong><span>{selectedFarmer.phone || 'Not provided'}</span></div>
                <div className="detail-row"><strong>Location:</strong><span>{selectedFarmer.location || 'Not provided'}</span></div>
                <div className="detail-row">
                  <strong>Tier:</strong>
                  <span style={{ color: selectedFarmer.tierColor, fontWeight: 'bold' }}>{selectedFarmer.tier}</span>
                </div>
                <div className="detail-row"><strong>Trust Score:</strong><span>{selectedFarmer.trustScore}/100</span></div>
                <div className="detail-row"><strong>Total Orders:</strong><span>{selectedFarmer.totalOrders}</span></div>
                <div className="detail-row"><strong>Completed:</strong><span>{selectedFarmer.completedOrders}</span></div>
                <div className="detail-row"><strong>Success Rate:</strong><span>{selectedFarmer.successRate}%</span></div>
                <div className="detail-row"><strong>Total Revenue:</strong><span>₹{selectedFarmer.totalRevenue.toLocaleString()}</span></div>
                <div className="detail-row">
                  <strong>Joined:</strong>
                  <span>{new Date(selectedFarmer.joinDate || selectedFarmer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>)}

      {activeTab === 'disputes' && (
        <div className="disputes-section">
          <div className="section-header">
            <h2><MessageSquareWarning size={24} /> Dispute Resolution</h2>
            <button className="btn btn-primary" onClick={() => setShowDisputeForm(!showDisputeForm)}>
              {showDisputeForm ? <><XCircle size={18} /> Cancel</> : <><PlusCircle size={18} /> Raise Dispute</>}
            </button>
          </div>
          <p className="section-subtitle">Report issues with orders, quality, or payments. Our team reviews all disputes within 48 hours.</p>

          {showDisputeForm && (
            <form onSubmit={handleDisputeSubmit} className="dispute-form section-card">
              <h3>New Dispute</h3>
              <div className="form-group">
                <label>Order ID (optional)</label>
                <input type="text" value={disputeForm.orderId} onChange={(e) => setDisputeForm({ ...disputeForm, orderId: e.target.value })} placeholder="e.g. -OQxyz123" />
              </div>
              <div className="form-group">
                <label>Against (Farmer/Buyer Name)</label>
                <input type="text" value={disputeForm.againstName} onChange={(e) => setDisputeForm({ ...disputeForm, againstName: e.target.value })} placeholder="Name of the other party" />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select value={disputeForm.category} onChange={(e) => setDisputeForm({ ...disputeForm, category: e.target.value })}>
                  <option value="quality">Crop Quality</option>
                  <option value="delivery">Delivery Issue</option>
                  <option value="payment">Payment Problem</option>
                  <option value="quantity">Wrong Quantity</option>
                  <option value="fraud">Fraud / Scam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Describe the issue *</label>
                <textarea value={disputeForm.description} onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })} rows="4" required placeholder="Explain what happened in detail..." />
              </div>
              <button type="submit" className="btn btn-primary" disabled={disputeSubmitting}>
                {disputeSubmitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </form>
          )}

          {disputes.length === 0 ? (
            <div className="empty-state">
              <MessageSquareWarning size={48} strokeWidth={1} />
              <p>No disputes raised yet</p>
            </div>
          ) : (
            <div className="disputes-list">
              {disputes.map((dispute) => (
                <div key={dispute.id} className={`dispute-card status-${dispute.status}`}>
                  <div className="dispute-header">
                    <div>
                      <span className={`dispute-status-badge status-${dispute.status}`}>
                        {dispute.status === 'open' && <AlertCircle size={14} />}
                        {dispute.status === 'in-review' && <Clock size={14} />}
                        {dispute.status === 'resolved' && <CheckCircle size={14} />}
                        {dispute.status}
                      </span>
                      <span className="dispute-category">{dispute.category}</span>
                    </div>
                    <span className="dispute-date">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="dispute-body">
                    {dispute.orderId && <p><strong>Order:</strong> {dispute.orderId}</p>}
                    {dispute.againstName && <p><strong>Against:</strong> {dispute.againstName}</p>}
                    <p>{dispute.description}</p>
                    {dispute.resolution && (
                      <div className="dispute-resolution">
                        <strong>Resolution:</strong> {dispute.resolution}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrustCenter;
