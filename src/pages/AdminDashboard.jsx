import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Ban,
  BarChart3,
  CheckCircle,
  CheckSquare,
  Clock,
  Download,
  Edit,
  Eye,
  FileCheck,
  LogOut,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Sprout,
  Trash2,
  UserCheck,
  Users
} from 'lucide-react';
import {
  deleteUser,
  getAllUsers,
  getAllDisputes,
  getCropInsuranceApplications,
  getOrders,
  getSystemLogs,
  suspendUser,
  updateUserProfile,
  updateDisputeStatus,
  updateCropInsuranceStatus,
  verifyUser,
  createEquipmentListing,
  deleteEquipmentListing,
  updateEquipmentAvailability,
  getEquipmentListings,
  createInputProduct,
  deleteInputProduct,
  getInputProducts,
  createGroupBuyingOpportunity,
  deleteGroupBuyingOpportunity,
  getGroupBuyingOpportunities
} from '../services/firebaseService';

const roleTabs = {
  users: null,
  farmers: 'farmer',
  buyers: 'buyer',
  customers: 'customer'
};

const roleLabels = {
  users: 'All Users',
  farmers: 'Farmers',
  buyers: 'Buyers',
  customers: 'Customers'
};

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersData, setUsersData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [insuranceApplications, setInsuranceApplications] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [inputProducts, setInputProducts] = useState([]);
  const [groupBuying, setGroupBuying] = useState([]);
  const [catalogForm, setCatalogForm] = useState('equipment');
  const [eqForm, setEqForm] = useState({ name: '', category: 'tractors', owner: '', location: '', dailyRate: '', horsepower: '' });
  const [ipForm, setIpForm] = useState({ name: '', category: 'seeds', description: '', price: '', unit: 'kg', seller: '' });
  const [gbForm, setGbForm] = useState({ crop: '', variety: '', fpo: '', totalQuantity: '', minOrderQuantity: '', normalPrice: '', pricePerUnit: '', quality: 'A', deadline: '' });
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getAllUsers((users) => {
      setUsersData(users.map((account) => ({
        id: account.uid || account.id,
        name: account.name || 'Unknown',
        email: account.email || '',
        role: account.role || 'customer',
        phone: account.phone || '',
        location: account.location || '',
        status: account.suspended ? 'suspended' : 'active',
        suspended: !!account.suspended,
        verified: !!account.verified,
        joinDate: account.createdAt || ''
      })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = getOrders((orders) => {
      setOrdersData(orders);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = getAllDisputes(setDisputes);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = getCropInsuranceApplications((items) => {
      setInsuranceApplications(items.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const u1 = getEquipmentListings(setEquipment);
    const u2 = getInputProducts(setInputProducts);
    const u3 = getGroupBuyingOpportunities(setGroupBuying);
    return () => { u1(); u2(); u3(); };
  }, []);

  useEffect(() => {
    const unsubscribe = getSystemLogs((logs) => {
      setActivityLogs(logs.map((log, index) => ({
        id: log.id || index + 1,
        user: log.user || 'System',
        action: log.action || 'Activity',
        details: log.details || '',
        timestamp: log.timestamp || log.createdAt || '',
        type: log.type || 'info'
      })));
    }, 30);

    return () => unsubscribe();
  }, []);

  const stats = {
    totalUsers: usersData.length,
    farmers: usersData.filter((account) => account.role === 'farmer').length,
    buyers: usersData.filter((account) => account.role === 'buyer').length,
    customers: usersData.filter((account) => account.role === 'customer').length,
    activeUsers: usersData.filter((account) => account.status === 'active').length,
    suspendedUsers: usersData.filter((account) => account.suspended).length,
    totalOrders: ordersData.length,
    pendingOrders: ordersData.filter((order) => order.status === 'pending').length,
    completedOrders: ordersData.filter((order) => order.status === 'completed' || order.status === 'delivered').length,
    orderValue: ordersData.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
  };

  const getUserOrderStats = (account) => {
    const relatedOrders = ordersData.filter((order) => (
      order.buyerId === account.id ||
      order.customerId === account.id ||
      order.farmerId === account.id ||
      order.userId === account.id
    ));

    return {
      totalOrders: relatedOrders.length,
      orderValue: relatedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    };
  };

  const activeRole = roleTabs[activeTab];
  const managedUsers = usersData.filter((account) => !activeRole || account.role === activeRole);
  const filteredUsers = managedUsers.filter((account) => {
    const searchText = `${account.name} ${account.email} ${account.id} ${account.phone} ${account.location}`.toLowerCase();
    return searchText.includes(searchQuery.toLowerCase());
  });

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const getRelativeTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';

    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const handleUserAction = async (userId, action) => {
    const account = usersData.find((item) => item.id === userId);
    if (!account) return;

    if (action === 'view') {
      const userStats = getUserOrderStats(account);
      alert(`User Details:\n\nName: ${account.name}\nEmail: ${account.email}\nRole: ${account.role}\nPhone: ${account.phone || 'N/A'}\nLocation: ${account.location || 'N/A'}\nOrders: ${userStats.totalOrders}\nOrder Value: Rs.${userStats.orderValue.toLocaleString('en-IN')}\nJoined: ${formatDate(account.joinDate)}`);
      return;
    }

    if (action === 'edit') {
      const newName = prompt('Edit user name:', account.name);
      if (newName && newName !== account.name) {
        const result = await updateUserProfile(userId, { name: newName });
        alert(result.success ? 'User updated successfully.' : `Failed to update user: ${result.error}`);
      }
      return;
    }

    if (action === 'verify') {
      const result = await verifyUser(userId, !account.verified);
      alert(result.success ? `User ${account.verified ? 'unverified' : 'verified'} successfully.` : `Failed to update verification: ${result.error}`);
      return;
    }

    if (action === 'suspend') {
      if (confirm(`Are you sure you want to ${account.suspended ? 'unsuspend' : 'suspend'} ${account.name}?`)) {
        const result = await suspendUser(userId, !account.suspended);
        alert(result.success ? `User ${account.suspended ? 'unsuspended' : 'suspended'} successfully.` : `Failed to update user: ${result.error}`);
      }
      return;
    }

    if (action === 'delete' && confirm(`Delete ${account.name}? This cannot be undone.`)) {
      const result = await deleteUser(userId);
      alert(result.success ? 'User deleted successfully.' : `Failed to delete user: ${result.error}`);
    }
  };

  const handleExportData = (type) => {
    const data = type === 'orders' ? ordersData : type === 'logs' ? activityLogs : usersData;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard-page">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Maintain farmers, buyers, customers, orders, and platform activity</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => handleExportData('users')}>
            <Download size={18} />
            Export Users
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('Firebase data updates in real time.')}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <BarChart3 size={18} />
          Overview
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={18} />
          All Users
        </button>
        <button className={`tab-btn ${activeTab === 'farmers' ? 'active' : ''}`} onClick={() => setActiveTab('farmers')}>
          <Sprout size={18} />
          Farmers
        </button>
        <button className={`tab-btn ${activeTab === 'buyers' ? 'active' : ''}`} onClick={() => setActiveTab('buyers')}>
          <ShoppingBag size={18} />
          Buyers
        </button>
        <button className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          <UserCheck size={18} />
          Customers
        </button>
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <Package size={18} />
          Orders
        </button>
        <button className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>
          <Package size={18} />
          Catalog
        </button>
        <button className={`tab-btn ${activeTab === 'insurance' ? 'active' : ''}`} onClick={() => setActiveTab('insurance')}>
          <FileCheck size={18} />
          Insurance {insuranceApplications.filter((item) => item.status === 'submitted').length > 0 && `(${insuranceApplications.filter((item) => item.status === 'submitted').length})`}
        </button>
        <button className={`tab-btn ${activeTab === 'disputes' ? 'active' : ''}`} onClick={() => setActiveTab('disputes')}>
          <AlertCircle size={18} />
          Disputes {disputes.filter(d => d.status === 'open').length > 0 && `(${disputes.filter(d => d.status === 'open').length})`}
        </button>
        <button className={`tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
          <Activity size={18} />
          Monitoring
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-content">
          <div className="stats-overview">
            <div className="stat-card-admin primary">
              <div className="stat-icon"><Users size={32} /></div>
              <div className="stat-details">
                <h3>{stats.totalUsers}</h3>
                <p>Total Users</p>
                <span className="stat-change positive">{stats.activeUsers} active</span>
              </div>
            </div>
            <div className="stat-card-admin success">
              <div className="stat-icon"><ShoppingBag size={32} /></div>
              <div className="stat-details">
                <h3>{stats.totalOrders}</h3>
                <p>Total Orders</p>
                <span className="stat-change positive">{stats.completedOrders} completed</span>
              </div>
            </div>
            <div className="stat-card-admin info">
              <div className="stat-icon"><Package size={32} /></div>
              <div className="stat-details">
                <h3>Rs.{stats.orderValue.toLocaleString('en-IN')}</h3>
                <p>Total Order Value</p>
                <span className="stat-change positive">From Firebase orders</span>
              </div>
            </div>
            <div className="stat-card-admin warning">
              <div className="stat-icon"><Ban size={32} /></div>
              <div className="stat-details">
                <h3>{stats.suspendedUsers}</h3>
                <p>Suspended Users</p>
                <span className="stat-change">{stats.pendingOrders} pending orders</span>
              </div>
            </div>
          </div>

          <div className="role-breakdown">
            <h3>User Distribution by Role</h3>
            <div className="role-cards">
              <button className="role-card" onClick={() => setActiveTab('farmers')}>
                <div className="role-icon farmer">F</div>
                <h4>Farmers</h4>
                <p className="role-count">{stats.farmers}</p>
              </button>
              <button className="role-card" onClick={() => setActiveTab('buyers')}>
                <div className="role-icon buyer">B</div>
                <h4>Buyers</h4>
                <p className="role-count">{stats.buyers}</p>
              </button>
              <button className="role-card" onClick={() => setActiveTab('customers')}>
                <div className="role-icon customer">C</div>
                <h4>Customers</h4>
                <p className="role-count">{stats.customers}</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {['users', 'farmers', 'buyers', 'customers'].includes(activeTab) && (
        <div className="users-content">
          <div className="admin-management-header">
            <div>
              <h2>{roleLabels[activeTab]} Management</h2>
              <p>View, verify, edit, suspend, or delete accounts.</p>
            </div>
            <div className="admin-management-count">{filteredUsers.length} records</div>
          </div>

          <div className="users-toolbar">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by name, email, phone, location, or ID..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Orders</th>
                  <th>Order Value</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((account) => {
                  const accountStats = getUserOrderStats(account);
                  return (
                    <tr key={account.id}>
                      <td><span className="user-id">{account.id}</span></td>
                      <td>
                        <div className="user-name-cell">
                          <strong>{account.name}</strong>
                          {account.verified && <CheckCircle size={14} className="verified-icon" />}
                        </div>
                      </td>
                      <td>{account.email}</td>
                      <td><span className={`role-badge ${account.role}`}>{account.role}</span></td>
                      <td>{account.phone || 'N/A'}</td>
                      <td>{account.location || 'N/A'}</td>
                      <td><span className={`status-badge ${account.status}`}>{account.status}</span></td>
                      <td>{accountStats.totalOrders}</td>
                      <td>Rs.{accountStats.orderValue.toLocaleString('en-IN')}</td>
                      <td>{formatDate(account.joinDate)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view" onClick={() => handleUserAction(account.id, 'view')} title="View Details"><Eye size={16} /></button>
                          <button className="action-btn edit" onClick={() => handleUserAction(account.id, 'edit')} title="Edit User"><Edit size={16} /></button>
                          <button className="action-btn verify" onClick={() => handleUserAction(account.id, 'verify')} title={account.verified ? 'Unverify User' : 'Verify User'}><CheckCircle size={16} /></button>
                          <button className="action-btn suspend" onClick={() => handleUserAction(account.id, 'suspend')} title={account.suspended ? 'Unsuspend' : 'Suspend'}>{account.suspended ? <CheckSquare size={16} /> : <Ban size={16} />}</button>
                          <button className="action-btn delete" onClick={() => handleUserAction(account.id, 'delete')} title="Delete User"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <p>Showing {filteredUsers.length} of {managedUsers.length} records</p>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="users-content">
          <div className="admin-management-header">
            <div>
              <h2>Orders Management</h2>
              <p>Monitor real orders from Firebase.</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExportData('orders')}>
              <Download size={16} />
              Export Orders
            </button>
          </div>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Farmer</th>
                  <th>Crop</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.map((order) => (
                  <tr key={order.id}>
                    <td><span className="user-id">{order.id}</span></td>
                    <td>{order.buyerName || order.buyer || order.buyerId || 'N/A'}</td>
                    <td>{order.farmerName || order.farmer || order.farmerId || 'N/A'}</td>
                    <td>{order.crop || 'N/A'}</td>
                    <td>{order.quantity || 0} {order.unit || ''}</td>
                    <td><span className={`status-badge ${order.status || 'pending'}`}>{order.status || 'pending'}</span></td>
                    <td>Rs.{Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td>{formatDate(order.orderDate || order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="users-content">
          <div className="admin-management-header">
            <div>
              <h2>Catalog Management</h2>
              <p>Create and manage Equipment, Input Products, and Group Buying listings.</p>
            </div>
          </div>

          <div className="catalog-sub-tabs">
            {[['equipment', 'Equipment'], ['inputProducts', 'Input Products'], ['groupBuying', 'Group Buying']].map(([key, label]) => (
              <button key={key} className={`filter-btn ${catalogForm === key ? 'active' : ''}`} onClick={() => setCatalogForm(key)}>
                {label} ({key === 'equipment' ? equipment.length : key === 'inputProducts' ? inputProducts.length : groupBuying.length})
              </button>
            ))}
          </div>

          {catalogForm === 'equipment' && (
            <div className="catalog-section">
              <form className="catalog-form" onSubmit={async (e) => { e.preventDefault(); setCatalogSaving(true); await createEquipmentListing({ ...eqForm, dailyRate: Number(eqForm.dailyRate), horsepower: Number(eqForm.horsepower) }); setEqForm({ name: '', category: 'tractors', owner: '', location: '', dailyRate: '', horsepower: '' }); setCatalogSaving(false); }}>
                <h3>Add Equipment</h3>
                <div className="form-row">
                  <div className="form-group"><label>Name *</label><input required value={eqForm.name} onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })} placeholder="e.g. Mahindra 575 Tractor" /></div>
                  <div className="form-group"><label>Category</label><select value={eqForm.category} onChange={(e) => setEqForm({ ...eqForm, category: e.target.value })}><option value="tractors">Tractor</option><option value="harvesters">Harvester</option><option value="sprayers">Sprayer</option><option value="tillers">Tiller</option></select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Owner Name</label><input value={eqForm.owner} onChange={(e) => setEqForm({ ...eqForm, owner: e.target.value })} placeholder="Owner name" /></div>
                  <div className="form-group"><label>Location</label><input value={eqForm.location} onChange={(e) => setEqForm({ ...eqForm, location: e.target.value })} placeholder="Village, District" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Daily Rate (Rs.)</label><input type="number" value={eqForm.dailyRate} onChange={(e) => setEqForm({ ...eqForm, dailyRate: e.target.value })} placeholder="e.g. 1500" /></div>
                  <div className="form-group"><label>Horsepower</label><input type="number" value={eqForm.horsepower} onChange={(e) => setEqForm({ ...eqForm, horsepower: e.target.value })} placeholder="e.g. 45" /></div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={catalogSaving}>{catalogSaving ? 'Saving...' : 'Add Equipment'}</button>
              </form>
              <div className="catalog-list">
                {equipment.map((item) => (
                  <div key={item.id} className="catalog-item">
                    <div><strong>{item.name}</strong> <span className="role-badge">{item.category}</span> <span className={`status-badge ${item.available ? 'active' : 'suspended'}`}>{item.available ? 'Available' : 'Booked'}</span></div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.owner} · {item.location} · Rs.{item.dailyRate}/day</div>
                    <div className="action-buttons" style={{ marginTop: '0.4rem' }}>
                      <button className="action-btn verify" title="Toggle Availability" onClick={() => updateEquipmentAvailability(item.id, !item.available)}><CheckCircle size={16} /></button>
                      <button className="action-btn delete" title="Delete" onClick={() => deleteEquipmentListing(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {catalogForm === 'inputProducts' && (
            <div className="catalog-section">
              <form className="catalog-form" onSubmit={async (e) => { e.preventDefault(); setCatalogSaving(true); await createInputProduct({ ...ipForm, price: Number(ipForm.price) }); setIpForm({ name: '', category: 'seeds', description: '', price: '', unit: 'kg', seller: '' }); setCatalogSaving(false); }}>
                <h3>Add Input Product</h3>
                <div className="form-row">
                  <div className="form-group"><label>Product Name *</label><input required value={ipForm.name} onChange={(e) => setIpForm({ ...ipForm, name: e.target.value })} placeholder="e.g. Paddy Seeds (IR-64)" /></div>
                  <div className="form-group"><label>Category</label><select value={ipForm.category} onChange={(e) => setIpForm({ ...ipForm, category: e.target.value })}><option value="seeds">Seeds</option><option value="fertilizers">Fertilizers</option><option value="pesticides">Pesticides</option><option value="tools">Tools & Equipment</option></select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Price (Rs.)</label><input type="number" value={ipForm.price} onChange={(e) => setIpForm({ ...ipForm, price: e.target.value })} placeholder="Price" /></div>
                  <div className="form-group"><label>Unit</label><select value={ipForm.unit} onChange={(e) => setIpForm({ ...ipForm, unit: e.target.value })}><option value="kg">kg</option><option value="litre">litre</option><option value="packet">packet</option><option value="unit">unit</option></select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Seller / Brand</label><input value={ipForm.seller} onChange={(e) => setIpForm({ ...ipForm, seller: e.target.value })} placeholder="Seller or brand name" /></div>
                  <div className="form-group"><label>Description</label><input value={ipForm.description} onChange={(e) => setIpForm({ ...ipForm, description: e.target.value })} placeholder="Short description" /></div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={catalogSaving}>{catalogSaving ? 'Saving...' : 'Add Product'}</button>
              </form>
              <div className="catalog-list">
                {inputProducts.map((item) => (
                  <div key={item.id} className="catalog-item">
                    <div><strong>{item.name}</strong> <span className="role-badge">{item.category}</span> <span className={`status-badge ${item.inStock ? 'active' : 'suspended'}`}>{item.inStock ? 'In Stock' : 'Out of Stock'}</span></div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.seller} · Rs.{item.price}/{item.unit}</div>
                    <div className="action-buttons" style={{ marginTop: '0.4rem' }}>
                      <button className="action-btn delete" title="Delete" onClick={() => deleteInputProduct(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {catalogForm === 'groupBuying' && (
            <div className="catalog-section">
              <form className="catalog-form" onSubmit={async (e) => {
                e.preventDefault(); setCatalogSaving(true);
                const savings = Number(gbForm.normalPrice) - Number(gbForm.pricePerUnit);
                const savingsPercent = gbForm.normalPrice > 0 ? ((savings / Number(gbForm.normalPrice)) * 100).toFixed(1) : 0;
                await createGroupBuyingOpportunity({ ...gbForm, totalQuantity: Number(gbForm.totalQuantity), minOrderQuantity: Number(gbForm.minOrderQuantity), normalPrice: Number(gbForm.normalPrice), pricePerUnit: Number(gbForm.pricePerUnit), savings, savingsPercent, verified: true, maxParticipants: 50 });
                setGbForm({ crop: '', variety: '', fpo: '', totalQuantity: '', minOrderQuantity: '', normalPrice: '', pricePerUnit: '', quality: 'A', deadline: '' });
                setCatalogSaving(false);
              }}>
                <h3>Add Group Buying Opportunity</h3>
                <div className="form-row">
                  <div className="form-group"><label>Crop *</label><input required value={gbForm.crop} onChange={(e) => setGbForm({ ...gbForm, crop: e.target.value })} placeholder="e.g. Rice" /></div>
                  <div className="form-group"><label>Variety</label><input value={gbForm.variety} onChange={(e) => setGbForm({ ...gbForm, variety: e.target.value })} placeholder="e.g. Sona Masuri" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>FPO / Seller</label><input value={gbForm.fpo} onChange={(e) => setGbForm({ ...gbForm, fpo: e.target.value })} placeholder="FPO or seller name" /></div>
                  <div className="form-group"><label>Quality</label><select value={gbForm.quality} onChange={(e) => setGbForm({ ...gbForm, quality: e.target.value })}><option value="A">Grade A</option><option value="B">Grade B</option><option value="Premium">Premium</option><option value="Organic">Organic</option></select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Normal Price (Rs./qt)</label><input type="number" value={gbForm.normalPrice} onChange={(e) => setGbForm({ ...gbForm, normalPrice: e.target.value })} /></div>
                  <div className="form-group"><label>Group Price (Rs./qt)</label><input type="number" value={gbForm.pricePerUnit} onChange={(e) => setGbForm({ ...gbForm, pricePerUnit: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Total Quantity (qt)</label><input type="number" value={gbForm.totalQuantity} onChange={(e) => setGbForm({ ...gbForm, totalQuantity: e.target.value })} /></div>
                  <div className="form-group"><label>Min Order (qt)</label><input type="number" value={gbForm.minOrderQuantity} onChange={(e) => setGbForm({ ...gbForm, minOrderQuantity: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Deadline</label><input type="date" value={gbForm.deadline} onChange={(e) => setGbForm({ ...gbForm, deadline: e.target.value })} /></div>
                <button type="submit" className="btn btn-primary" disabled={catalogSaving}>{catalogSaving ? 'Saving...' : 'Add Group Buy'}</button>
              </form>
              <div className="catalog-list">
                {groupBuying.map((item) => (
                  <div key={item.id} className="catalog-item">
                    <div><strong>{item.crop} {item.variety}</strong> <span className="role-badge">{item.quality}</span></div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.fpo} · Normal: Rs.{item.normalPrice} → Group: Rs.{item.pricePerUnit} · {item.currentParticipants || 0} joined</div>
                    <div className="action-buttons" style={{ marginTop: '0.4rem' }}>
                      <button className="action-btn delete" title="Delete" onClick={() => deleteGroupBuyingOpportunity(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className="users-content">
          <div className="admin-management-header">
            <div>
              <h2>Dispute Management</h2>
              <p>Review and resolve disputes raised by farmers and buyers.</p>
            </div>
            <div className="admin-management-count">{disputes.length} total · {disputes.filter(d => d.status === 'open').length} open</div>
          </div>
          {disputes.length === 0 ? (
            <div className="empty-state"><AlertCircle size={48} /><p>No disputes found</p></div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Raised By</th>
                    <th>Against</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Order ID</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.id}>
                      <td><span className="user-id">{dispute.id?.slice(-6)}</span></td>
                      <td>{dispute.raisedByName || dispute.raisedBy}</td>
                      <td>{dispute.againstName || '—'}</td>
                      <td><span className="role-badge">{dispute.category}</span></td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.85rem' }}>{dispute.description}</td>
                      <td>{dispute.orderId || '—'}</td>
                      <td><span className={`status-badge ${dispute.status}`}>{dispute.status}</span></td>
                      <td>{formatDate(dispute.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          {dispute.status === 'open' && (
                            <button className="action-btn verify" title="Mark In Review"
                              onClick={() => updateDisputeStatus(dispute.id, 'in-review')}>
                              <Clock size={16} />
                            </button>
                          )}
                          {dispute.status !== 'resolved' && (
                            <button className="action-btn edit" title="Resolve"
                              onClick={async () => {
                                const resolution = prompt('Enter resolution note:');
                                if (resolution) await updateDisputeStatus(dispute.id, 'resolved', resolution);
                              }}>
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insurance' && (
        <div className="users-content">
          <div className="admin-management-header">
            <div>
              <h2>Crop Insurance Management</h2>
              <p>Review farmer crop insurance applications in real time.</p>
            </div>
            <div className="admin-management-count">
              {insuranceApplications.length} total | {insuranceApplications.filter((item) => item.status === 'submitted').length} submitted
            </div>
          </div>

          {insuranceApplications.length === 0 ? (
            <div className="empty-state"><FileCheck size={48} /><p>No crop insurance applications found</p></div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Farmer</th>
                    <th>Crop</th>
                    <th>Season</th>
                    <th>Area</th>
                    <th>District</th>
                    <th>Sum Insured</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {insuranceApplications.map((application) => (
                    <tr key={application.id}>
                      <td><span className="user-id">{application.id?.slice(-6)}</span></td>
                      <td>{application.farmerName || application.userId}</td>
                      <td>{application.crop} {application.variety ? `(${application.variety})` : ''}</td>
                      <td>{application.season}</td>
                      <td>{application.cultivatedArea} acres</td>
                      <td>{application.district || 'N/A'}</td>
                      <td>Rs.{Number(application.sumInsured || 0).toLocaleString('en-IN')}</td>
                      <td><span className={`status-badge ${application.status}`}>{application.status}</span></td>
                      <td>{formatDate(application.submittedAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn view"
                            title="Mark In Review"
                            onClick={() => updateCropInsuranceStatus(application.id, 'in-review')}
                          >
                            <Clock size={16} />
                          </button>
                          <button
                            className="action-btn verify"
                            title="Approve"
                            onClick={async () => {
                              const note = prompt('Approval note:', application.adminNote || '');
                              await updateCropInsuranceStatus(application.id, 'approved', note || '');
                            }}
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            className="action-btn delete"
                            title="Reject"
                            onClick={async () => {
                              const note = prompt('Rejection reason:', application.adminNote || '');
                              if (note !== null) await updateCropInsuranceStatus(application.id, 'rejected', note || '');
                            }}
                          >
                            <Ban size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="monitoring-content">
          <div className="system-health-grid">
            {[
              { metric: 'Total Users', value: stats.totalUsers, status: 'normal', icon: Users },
              { metric: 'Active Users', value: stats.activeUsers, status: 'normal', icon: UserCheck },
              { metric: 'Total Orders', value: stats.totalOrders, status: 'normal', icon: Package },
              { metric: 'Pending Orders', value: stats.pendingOrders, status: stats.pendingOrders ? 'warning' : 'good', icon: Clock },
              { metric: 'Completed Orders', value: stats.completedOrders, status: 'good', icon: CheckCircle },
              { metric: 'System Logs', value: activityLogs.length, status: 'normal', icon: Activity }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.metric} className={`health-card ${item.status}`}>
                  <div className="health-icon"><Icon size={24} /></div>
                  <div className="health-details">
                    <h4>{item.metric}</h4>
                    <p className="health-value">{item.value}</p>
                    <span className={`health-status ${item.status}`}>{item.status.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="activity-logs-section">
            <div className="section-header">
              <h3>Recent Activity Logs</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => handleExportData('logs')}>
                <Download size={16} />
                Export Logs
              </button>
            </div>
            <div className="activity-logs">
              {activityLogs.length ? activityLogs.map((log) => (
                <div key={log.id} className={`activity-log-item ${log.type}`}>
                  <div className="log-icon">
                    {log.type === 'success' && <CheckCircle size={20} />}
                    {log.type === 'info' && <Activity size={20} />}
                    {log.type === 'warning' && <AlertCircle size={20} />}
                    {log.type === 'error' && <AlertCircle size={20} />}
                  </div>
                  <div className="log-content">
                    <div className="log-header"><strong>{log.user}</strong> - {log.action}</div>
                    <p className="log-details">{log.details}</p>
                  </div>
                  <span className="log-time">{getRelativeTime(log.timestamp)}</span>
                </div>
              )) : (
                <div className="empty-state">No real system logs found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
