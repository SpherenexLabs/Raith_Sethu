import { useEffect, useMemo, useState } from 'react';
import { FileCheck, ShieldCheck, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createCropInsuranceApplication,
  getCropInsuranceApplications,
  getUserCropInsuranceApplications,
  updateCropInsuranceStatus
} from '../services/firebaseService';

const initialForm = {
  crop: '',
  variety: '',
  season: 'Kharif',
  cultivatedArea: '',
  surveyNumber: '',
  village: '',
  district: '',
  expectedYield: '',
  sumInsured: '',
  riskCover: 'Weather + Pest/Disease',
  notes: ''
};

const statusIcons = {
  submitted: <Clock size={18} />,
  'in-review': <AlertCircle size={18} />,
  approved: <CheckCircle size={18} />,
  rejected: <XCircle size={18} />
};

const CropInsurance = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [applications, setApplications] = useState([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user?.uid) return undefined;
    if (isAdmin) {
      return getCropInsuranceApplications((items) => {
        setApplications(items.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)));
      });
    }
    return getUserCropInsuranceApplications(user.uid, setApplications);
  }, [isAdmin, user?.uid]);

  const statusCounts = useMemo(() => ({
    submitted: applications.filter((item) => item.status === 'submitted').length,
    review: applications.filter((item) => item.status === 'in-review').length,
    approved: applications.filter((item) => item.status === 'approved').length,
    rejected: applications.filter((item) => item.status === 'rejected').length
  }), [applications]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const result = await createCropInsuranceApplication(user.uid, {
      ...form,
      farmerName: user.name || user.email,
      farmerPhone: user.phone || '',
      farmerLocation: user.location || '',
      latitude: user.latitude || '',
      longitude: user.longitude || '',
      cultivatedArea: Number(form.cultivatedArea || 0),
      expectedYield: Number(form.expectedYield || 0),
      sumInsured: Number(form.sumInsured || 0)
    });
    setSaving(false);

    if (result.success) {
      setForm(initialForm);
      alert('Crop insurance application submitted successfully.');
    } else {
      alert(`Unable to submit crop insurance application: ${result.error}`);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    const note = status === 'rejected' || status === 'approved'
      ? prompt('Add admin note:', '')
      : '';
    const result = await updateCropInsuranceStatus(applicationId, status, note || '');
    if (!result.success) {
      alert(`Unable to update application: ${result.error}`);
    }
  };

  return (
    <div className="crop-insurance-page">
      <div className="page-header">
        <h1><ShieldCheck size={32} /> Crop Insurance Services</h1>
        <p>Submit and track crop insurance applications using real farmer, crop, and location data.</p>
      </div>

      <div className="insurance-summary-grid">
        <div className="summary-card"><h3>{applications.length}</h3><p>Total Applications</p></div>
        <div className="summary-card"><h3>{statusCounts.submitted}</h3><p>Submitted</p></div>
        <div className="summary-card"><h3>{statusCounts.review}</h3><p>In Review</p></div>
        <div className="summary-card"><h3>{statusCounts.approved}</h3><p>Approved</p></div>
      </div>

      {!isAdmin && (
        <form className="section-card insurance-form" onSubmit={handleSubmit}>
          <div className="section-header">
            <h2><FileCheck size={24} /> New Insurance Application</h2>
            <p>Farmer profile location is attached automatically when available.</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Crop *</label>
              <input name="crop" value={form.crop} onChange={handleChange} placeholder="e.g. Rice" required />
            </div>
            <div className="form-group">
              <label>Variety</label>
              <input name="variety" value={form.variety} onChange={handleChange} placeholder="e.g. Sona Masuri" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Season</label>
              <select name="season" value={form.season} onChange={handleChange}>
                <option value="Kharif">Kharif</option>
                <option value="Rabi">Rabi</option>
                <option value="Summer">Summer</option>
                <option value="Perennial">Perennial</option>
              </select>
            </div>
            <div className="form-group">
              <label>Cultivated Area (acres) *</label>
              <input type="number" name="cultivatedArea" value={form.cultivatedArea} onChange={handleChange} required min="0.1" step="0.1" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Survey Number</label>
              <input name="surveyNumber" value={form.surveyNumber} onChange={handleChange} placeholder="Land survey number" />
            </div>
            <div className="form-group">
              <label>District *</label>
              <input name="district" value={form.district} onChange={handleChange} placeholder="District" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Village *</label>
              <input name="village" value={form.village} onChange={handleChange} placeholder="Village" required />
            </div>
            <div className="form-group">
              <label>Expected Yield (quintals)</label>
              <input type="number" name="expectedYield" value={form.expectedYield} onChange={handleChange} min="0" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sum Insured (Rs.) *</label>
              <input type="number" name="sumInsured" value={form.sumInsured} onChange={handleChange} min="1" required />
            </div>
            <div className="form-group">
              <label>Risk Cover</label>
              <select name="riskCover" value={form.riskCover} onChange={handleChange}>
                <option value="Weather + Pest/Disease">Weather + Pest/Disease</option>
                <option value="Weather Only">Weather Only</option>
                <option value="Pest/Disease Only">Pest/Disease Only</option>
                <option value="Full Crop Loss">Full Crop Loss</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="Any additional claim or risk details" />
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Submitting...' : 'Submit Insurance Application'}
          </button>
        </form>
      )}

      <div className="section-card">
        <div className="section-header">
          <h2>{isAdmin ? 'All Insurance Applications' : 'My Insurance Applications'}</h2>
          <p>Live data from Firebase.</p>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">No crop insurance applications found.</div>
        ) : (
          <div className="insurance-list">
            {applications.map((application) => (
              <div key={application.id} className={`insurance-card status-${application.status}`}>
                <div className="insurance-card-header">
                  <div>
                    <h3>{application.crop} {application.variety ? `- ${application.variety}` : ''}</h3>
                    <p>{application.farmerName} | {application.village}, {application.district}</p>
                  </div>
                  <span className={`status-badge ${application.status}`}>
                    {statusIcons[application.status] || statusIcons.submitted}
                    {application.status}
                  </span>
                </div>

                <div className="insurance-details-grid">
                  <span><strong>Season:</strong> {application.season}</span>
                  <span><strong>Area:</strong> {application.cultivatedArea} acres</span>
                  <span><strong>Sum Insured:</strong> Rs.{Number(application.sumInsured || 0).toLocaleString('en-IN')}</span>
                  <span><strong>Risk Cover:</strong> {application.riskCover}</span>
                  <span><strong>Survey:</strong> {application.surveyNumber || 'N/A'}</span>
                  <span><strong>Submitted:</strong> {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>

                {application.adminNote && <p className="insurance-note"><strong>Admin Note:</strong> {application.adminNote}</p>}

                {isAdmin && (
                  <div className="insurance-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(application.id, 'in-review')}>Mark In Review</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(application.id, 'approved')}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(application.id, 'rejected')}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropInsurance;
