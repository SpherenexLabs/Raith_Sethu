import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, MapPin, Sprout, TrendingUp, Plus, Edit, Trash2, Loader } from 'lucide-react';
import { createActivity, getFarmerActivities, getActivityStats } from '../services/farmingActivityService';

const FarmingActivity = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ totalSown: 0, totalHarvested: 0, totalArea: 0, crops: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activityType, setActivityType] = useState('sowing');

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Safety timeout — if Firebase never calls back, stop spinning after 8s
    const timeout = setTimeout(() => setLoading(false), 8000);

    const unsubscribe = getFarmerActivities(user.uid, (activitiesData) => {
      clearTimeout(timeout);
      setActivities(activitiesData);
      setLoading(false);
    });

    loadStats();

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [user?.uid]);

  const loadStats = async () => {
    if (!user?.uid) return;
    const statsData = await getActivityStats(user.uid);
    setStats(statsData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const activityData = {
      type: activityType,
      crop: formData.get('crop'),
      variety: formData.get('variety'),
      area: formData.get('area'),
      unit: formData.get('unit'),
      date: formData.get('date'),
      location: formData.get('location'),
      seedRate: formData.get('seedRate'),
      expectedYield: formData.get('expectedYield'),
      notes: formData.get('notes')
    };

    const result = await createActivity(user.uid, activityData);
    
    if (result.success) {
      setShowModal(false);
      e.target.reset();
      loadStats();
      alert(`${activityType === 'sowing' ? 'Sowing' : 'Harvesting'} activity recorded successfully!`);
    }
  };

  const getStatusBadge = (activity) => {
    if (activity.type === 'sowing') {
      const sowingDate = new Date(activity.date);
      const today = new Date();
      const daysAgo = Math.floor((today - sowingDate) / (1000 * 60 * 60 * 24));
      
      if (daysAgo < 30) return <span className="badge badge-success">Recently Sown</span>;
      if (daysAgo < 90) return <span className="badge badge-warning">Growing</span>;
      return <span className="badge badge-info">Ready for Harvest</span>;
    } else {
      return <span className="badge badge-secondary">Harvested</span>;
    }
  };

  if (loading) {
    return (
      <div className="farming-activity-page">
        <div className="loading">
          <Loader size={48} className="spinner" />
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="farming-activity-page">
      <div className="page-header">
        <div>
          <h1>
            <Calendar size={32} />
            Farming Activity Tracker
          </h1>
          <p>Track sowing and harvesting activities for better farm management</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Record Activity
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <Sprout size={28} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.totalSown}</h3>
            <p>Total Sown</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <TrendingUp size={28} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.totalHarvested}</h3>
            <p>Total Harvested</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <MapPin size={28} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.totalArea} acres</h3>
            <p>Total Farm Area</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>
            <Sprout size={28} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.crops.length}</h3>
            <p>Crop Varieties</p>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="activities-section">
        <h2>Activity Timeline</h2>
        
        {activities.length === 0 ? (
          <div className="no-activities">
            <Calendar size={64} color="#ccc" />
            <h3>No activities recorded yet</h3>
            <p>Start tracking your sowing and harvesting activities</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={20} />
              Record First Activity
            </button>
          </div>
        ) : (
          <div className="activities-list">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-card">
                <div className="activity-header">
                  <div>
                    <h3>{activity.crop}</h3>
                    <p className="activity-variety">{activity.variety}</p>
                  </div>
                  {getStatusBadge(activity)}
                </div>

                <div className="activity-details">
                  <div className="detail-item">
                    <Calendar size={18} />
                    <span>{new Date(activity.date).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  <div className="detail-item">
                    <MapPin size={18} />
                    <span>{activity.location}</span>
                  </div>
                  <div className="detail-item">
                    <Sprout size={18} />
                    <span>{activity.area} {activity.unit}</span>
                  </div>
                </div>

                <div className="activity-info">
                  <div className="info-row">
                    <span className="label">Type:</span>
                    <span className="value">{activity.type === 'sowing' ? '🌱 Sowing' : '🌾 Harvesting'}</span>
                  </div>
                  {activity.seedRate && (
                    <div className="info-row">
                      <span className="label">Seed Rate:</span>
                      <span className="value">{activity.seedRate}</span>
                    </div>
                  )}
                  {activity.expectedYield && (
                    <div className="info-row">
                      <span className="label">Expected Yield:</span>
                      <span className="value">{activity.expectedYield}</span>
                    </div>
                  )}
                  {activity.notes && (
                    <div className="info-row">
                      <span className="label">Notes:</span>
                      <span className="value">{activity.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Farming Activity</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Activity Type *</label>
                <select 
                  value={activityType} 
                  onChange={(e) => setActivityType(e.target.value)}
                  required
                >
                  <option value="sowing">🌱 Sowing</option>
                  <option value="harvesting">🌾 Harvesting</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Crop Name *</label>
                  <input type="text" name="crop" placeholder="e.g., Rice, Wheat" required />
                </div>
                <div className="form-group">
                  <label>Variety</label>
                  <input type="text" name="variety" placeholder="e.g., BPT 5204" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Area *</label>
                  <input type="number" name="area" step="0.01" placeholder="e.g., 5.5" required />
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <select name="unit" required>
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="guntas">Guntas</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input type="date" name="date" max={new Date().toISOString().split('T')[0]} required />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input type="text" name="location" placeholder="Village, Taluk, District" required />
              </div>

              {activityType === 'sowing' && (
                <>
                  <div className="form-group">
                    <label>Seed Rate</label>
                    <input type="text" name="seedRate" placeholder="e.g., 25 kg/acre" />
                  </div>
                  <div className="form-group">
                    <label>Expected Yield</label>
                    <input type="text" name="expectedYield" placeholder="e.g., 30 quintals/acre" />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" rows="3" placeholder="Additional information..."></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmingActivity;
