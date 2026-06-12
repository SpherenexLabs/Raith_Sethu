import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout, Package, IndianRupee, TrendingUp, Plus,
  ShoppingCart, Clock, CheckCircle, MapPin, User,
  Leaf, BarChart2, Cloud, Tractor, ArrowRight, Phone
} from 'lucide-react';
import {
  getUserListings,
  getFarmerOrders,
} from '../services/firebaseService';

const STATUS_COLOR = {
  pending:    { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  confirmed:  { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
  'in-transit': { bg: '#ede9fe', color: '#5b21b6', label: 'In Transit' },
  delivered:  { bg: '#d1fae5', color: '#065f46', label: 'Delivered' },
  completed:  { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const FarmerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const u1 = getUserListings(user.uid, (data) => {
      setListings(data);
    });
    const u2 = getFarmerOrders(user.uid, (data) => {
      setOrders(data.sort((a, b) => b.orderDate - a.orderDate));
      setLoading(false);
    });
    return () => { u1(); u2(); };
  }, [user?.uid]);

  // Metrics
  const activeListings   = listings.filter((l) => l.status === 'active').length;
  const pendingOrders    = orders.filter((o) => o.status === 'pending').length;
  const totalRevenue     = orders.filter((o) => o.status === 'delivered' || o.status === 'completed').reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const deliveredOrders  = orders.filter((o) => o.status === 'delivered' || o.status === 'completed').length;

  const recentOrders   = orders.slice(0, 5);
  const activeListData = listings.filter((l) => l.status === 'active').slice(0, 4);

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div className="farmer-dashboard-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

      {/* ── Header ── */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sprout size={32} color="#10b981" />
            Welcome, {user?.name || 'Farmer'}!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {user?.location && <><MapPin size={14} style={{ verticalAlign: 'middle' }} /> {user.location} &nbsp;|&nbsp;</>}
            Here's your farm business overview
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/marketplace')}
          style={{ gap: '0.5rem' }}
        >
          <Plus size={18} /> Post New Crop
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard
          icon={<Leaf size={28} />}
          color="#10b981"
          label="Active Listings"
          value={activeListings}
          sub="Crops listed for sale"
          onClick={() => navigate('/marketplace')}
        />
        <StatCard
          icon={<Package size={28} />}
          color="#f59e0b"
          label="Pending Orders"
          value={pendingOrders}
          sub="Awaiting your confirmation"
          onClick={() => navigate('/marketplace')}
          highlight={pendingOrders > 0}
        />
        <StatCard
          icon={<IndianRupee size={28} />}
          color="#3b82f6"
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          sub="From all completed orders"
        />
        <StatCard
          icon={<CheckCircle size={28} />}
          color="#8b5cf6"
          label="Delivered"
          value={deliveredOrders}
          sub="Successfully delivered orders"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Recent Incoming Orders */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2><Package size={20} /> Recent Incoming Orders</h2>
              <Link to="/marketplace" className="view-all-link">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="empty-dashboard-state">
                <Package size={40} strokeWidth={1} />
                <p>No orders yet. Post your crops to start receiving orders.</p>
                <button className="btn btn-primary" onClick={() => navigate('/marketplace')}>
                  <Plus size={16} /> Post a Crop
                </button>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Crop</th>
                      <th>Buyer</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const s = STATUS_COLOR[order.status] || { bg: '#f3f4f6', color: '#374151', label: order.status };
                      return (
                        <tr key={order.id}>
                          <td><strong>{order.crop}</strong>{order.variety ? <span style={{ color: '#6b7280', fontSize: '0.8rem' }}> ({order.variety})</span> : ''}</td>
                          <td>
                            <div style={{ fontSize: '0.9rem' }}>{order.buyerName || '—'}</div>
                            {order.buyerPhone && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{order.buyerPhone}</div>}
                          </td>
                          <td>{order.quantity} {order.unit}</td>
                          <td style={{ fontWeight: 600, color: '#10b981' }}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                          <td>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* My Active Listings */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2><Leaf size={20} /> My Active Listings</h2>
              <Link to="/marketplace" className="view-all-link">
                Manage <ArrowRight size={14} />
              </Link>
            </div>

            {activeListData.length === 0 ? (
              <div className="empty-dashboard-state">
                <Sprout size={40} strokeWidth={1} />
                <p>No active listings. Start selling your crops!</p>
                <button className="btn btn-primary" onClick={() => navigate('/marketplace')}>
                  <Plus size={16} /> Post Crop
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {activeListData.map((listing) => (
                  <div key={listing.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{listing.crop}</div>
                    {listing.variety && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{listing.variety}</div>}
                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>₹{Number(listing.price).toLocaleString('en-IN')}</span>
                      <span style={{ color: '#6b7280' }}> / {listing.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {listing.quantity} {listing.unit} available
                    </div>
                    {listing.quality && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#d1fae5', color: '#065f46', borderRadius: '999px' }}>
                          {listing.quality}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: Quick Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="dashboard-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} /> Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <QuickLink to="/marketplace" icon={<ShoppingCart size={18} />} label="Post & Manage Crops" color="#10b981" />
              <QuickLink to="/crop-planning" icon={<Cloud size={18} />} label="Crop Planning & Weather" color="#3b82f6" />
              <QuickLink to="/farming-activity" icon={<Sprout size={18} />} label="Farming Activity Log" color="#8b5cf6" />
              <QuickLink to="/analytics" icon={<BarChart2 size={18} />} label="Market Analytics" color="#f59e0b" />
              <QuickLink to="/market-intelligence" icon={<TrendingUp size={18} />} label="Market Intelligence" color="#ec4899" />
              <QuickLink to="/equipment-rental" icon={<Tractor size={18} />} label="Equipment Rental" color="#6366f1" />
              <QuickLink to="/crop-insurance" icon={<CheckCircle size={18} />} label="Crop Insurance" color="#14b8a6" />
              <QuickLink to="/government-schemes" icon={<IndianRupee size={18} />} label="Government Schemes" color="#f97316" />
            </div>
          </div>

          {/* Order status summary */}
          {orders.length > 0 && (
            <div className="dashboard-card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} /> Order Summary
              </h3>
              {[
                { label: 'Pending', count: orders.filter((o) => o.status === 'pending').length, color: '#f59e0b' },
                { label: 'Confirmed', count: orders.filter((o) => o.status === 'confirmed').length, color: '#3b82f6' },
                { label: 'In Transit', count: orders.filter((o) => o.status === 'in-transit').length, color: '#8b5cf6' },
                { label: 'Delivered', count: orders.filter((o) => o.status === 'delivered' || o.status === 'completed').length, color: '#10b981' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '0.9rem', color: '#374151' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                </div>
              ))}
              <Link to="/marketplace" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', color: '#10b981', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
                Manage all orders →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, color, label, value, sub, onClick, highlight }) => (
  <div
    className="dashboard-stat-card"
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default', borderLeft: highlight ? `4px solid ${color}` : undefined }}
  >
    <div className="stat-icon" style={{ background: color }}>{icon}</div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{label}</p>
      <span className="stat-change">{sub}</span>
    </div>
  </div>
);

const QuickLink = ({ to, icon, label, color }) => (
  <Link
    to={to}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
      background: '#f9fafb', border: '1px solid #e5e7eb',
      textDecoration: 'none', color: '#1f2937',
      fontSize: '0.9rem', fontWeight: 500,
      transition: 'all 0.15s ease'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = color + '15'; e.currentTarget.style.borderColor = color; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
  >
    <span style={{ color }}>{icon}</span>
    {label}
    <ArrowRight size={14} style={{ marginLeft: 'auto', color: '#9ca3af' }} />
  </Link>
);

export default FarmerDashboard;
