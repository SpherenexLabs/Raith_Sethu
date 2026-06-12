import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Edit, Save, Calendar } from 'lucide-react';
import { 
  updateUserProfile, 
  getUserActivities, 
  getUserListings,
  getUserOrders,
  getFarmerOrders
} from '../services/firebaseService';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    successfulSales: 0,
    totalRevenue: 0,
    rating: 0,
    memberSince: ''
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    farmSize: user?.farmSize || '',
    experience: user?.experience || '',
    preferredCrops: user?.preferredCrops || ''
  });

  // Load user activities
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = getUserActivities(user.uid, (activities) => {
      setActivityLog(activities.slice(0, 10)); // Show last 10 activities
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Load user statistics
  useEffect(() => {
    if (!user?.uid) return;

    const loadStats = async () => {
      try {
        // Get user's listings
        getUserListings(user.uid, (listings) => {
          const activeListings = listings.filter(l => l.status === 'active').length;
          setStats(prev => ({ ...prev, totalListings: activeListings }));
        });

        // Get user's orders/sales based on role
        if (user.role === 'farmer') {
          getFarmerOrders(user.uid, (orders) => {
            const completed = orders.filter(o => o.status === 'completed');
            const revenue = completed.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            setStats(prev => ({
              ...prev,
              successfulSales: completed.length,
              totalRevenue: revenue
            }));
          });
        } else {
          getUserOrders(user.uid, (orders) => {
            const completed = orders.filter(o => o.status === 'completed');
            setStats(prev => ({
              ...prev,
              successfulSales: completed.length
            }));
          });
        }

        // Set member since date
        if (user.createdAt) {
          const date = new Date(user.createdAt);
          const memberSince = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          const monthsDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
          setStats(prev => ({
            ...prev,
            memberSince,
            monthsActive: monthsDiff
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading stats:', error);
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.uid, user?.role, user?.createdAt]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(user.uid, formData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account information</p>
      </div>

      <div className="profile-container">
        <div className="profile-main">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <User size={64} />
              </div>
              <div className="profile-info">
                <h2>{user?.name}</h2>
                <p className="role-badge">{user?.role}</p>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Save size={20} /> : <Edit size={20} />}
                {isEditing ? 'Save' : 'Edit Profile'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <User size={18} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <Mail size={18} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <Phone size={18} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <MapPin size={18} />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {user?.role === 'farmer' && (
                <div className="form-section">
                  <h3>Farm Details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Farm Size (acres)</label>
                      <input
                        type="number"
                        name="farmSize"
                        value={formData.farmSize}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Farming Experience (years)</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Preferred Crops</label>
                      <input
                        type="text"
                        name="preferredCrops"
                        value={formData.preferredCrops}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., Rice, Wheat, Maize"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Activity Log */}
          <div className="activity-card">
            <h3>
              <Calendar size={20} />
              Recent Activity
            </h3>
            <div className="activity-list">
              {activityLog.length > 0 ? (
                activityLog.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className={`activity-icon ${activity.type}`}></div>
                    <div className="activity-content">
                      <p className="activity-action">{activity.action}</p>
                      <span className="activity-date">{formatDate(activity.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No activity yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="profile-sidebar">
          <div className="stat-card">
            <h4>Total Listings</h4>
            <p className="stat-value">{stats.totalListings}</p>
            <span className="stat-change">Active listings</span>
          </div>
          <div className="stat-card">
            <h4>Successful Sales</h4>
            <p className="stat-value">{stats.successfulSales}</p>
            {user?.role === 'farmer' && (
              <span className="stat-change">₹{(stats.totalRevenue / 100000).toFixed(1)}L revenue</span>
            )}
          </div>
          <div className="stat-card">
            <h4>Rating</h4>
            <p className="stat-value">{stats.rating || 'New'}⭐</p>
            <span className="stat-change">Build your reputation</span>
          </div>
          <div className="stat-card">
            <h4>Member Since</h4>
            <p className="stat-value">{stats.memberSince || 'Recently'}</p>
            <span className="stat-change">{stats.monthsActive || 0} months</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
