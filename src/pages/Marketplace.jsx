import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Plus, Search, Filter, MessageCircle, ShoppingCart,
  Truck, MapPin, Calendar, DollarSign, User, Star, Phone,
  Clock, Package, CheckCircle, X, IndianRupee, Leaf, BadgeCheck
} from 'lucide-react';
import {
  getListings,
  getUserListings,
  createListing,
  updateListing,
  deleteListing,
  createOrder,
  logActivity,
  getOrders,
  getFarmerOrders,
  getUserOrders,
  updateOrderStatus,
  getTransporters,
  createTransporter,
  deleteTransporter,
  createTransportBooking,
  getTransportBookings
} from '../services/firebaseService';
import { RAZORPAY_TEST_KEY_ID, createRazorpayOrder, loadRazorpayCheckout, verifyRazorpayPayment } from '../services/razorpayService';
import { createChat, findExistingChat } from '../services/chatService';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  'in-transit': '#8b5cf6',
  delivered: '#10b981',
  completed: '#10b981',
  cancelled: '#ef4444'
};

const CROP_EMOJI = {
  rice: '🌾', wheat: '🌾', maize: '🌽', corn: '🌽',
  groundnut: '🥜', peanut: '🥜', tomato: '🍅', potato: '🥔',
  onion: '🧅', chili: '🌶️', pepper: '🌶️', cotton: '🌿',
  sugarcane: '🎋', turmeric: '🟡', default: '🌿'
};

const cropEmoji = (name) => CROP_EMOJI[(name || '').toLowerCase()] || CROP_EMOJI.default;

const Marketplace = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const isFarmer = user?.role === 'farmer';
  const isBuyer = user?.role === 'buyer' || user?.role === 'customer';

  const [activeTab, setActiveTab] = useState(isFarmer ? 'myListings' : 'browse');
  // Farmer starts at My Listings (sell-side). Buyer starts at Browse Crops (buy-side).
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cropListings, setCropListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [transportOrders, setTransportOrders] = useState([]);
  const [transportBookings, setTransportBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incomingLoading, setIncomingLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [paying, setPaying] = useState(false);

  // Modals
  const [showListingModal, setShowListingModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showTransporterModal, setShowTransporterModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'browse') return;
    const unsub = getListings((list) => {
      setCropListings(list.filter((l) => l.status === 'active'));
      setLoading(false);
    });
    return () => unsub();
  }, [activeTab]);

  useEffect(() => {
    if (!user || activeTab !== 'myListings') return;
    const unsub = getUserListings(user.uid, (list) => {
      setMyListings(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== 'myOrders') return;
    const unsub = getUserOrders(user.uid, (orders) => {
      setMyOrders(orders.sort((a, b) => b.orderDate - a.orderDate));
      setLoading(false);
    });
    return () => unsub();
  }, [user, activeTab]);

  useEffect(() => {
    if (!isFarmer || !user || activeTab !== 'incomingOrders') return;
    setIncomingLoading(true);
    const unsub = getFarmerOrders(user.uid, (orders) => {
      setIncomingOrders(orders.sort((a, b) => b.orderDate - a.orderDate));
      setIncomingLoading(false);
    });
    return () => unsub();
  }, [isFarmer, user, activeTab]);

  useEffect(() => {
    if (activeTab !== 'transport') return;
    const u1 = getTransporters(setTransporters);
    const u2 = getOrders((orders) => {
      if (!user) return;
      setTransportOrders(orders.filter((o) => o.buyerId === user.uid || o.farmerId === user.uid));
      setLoading(false);
    });
    const u3 = user ? getTransportBookings(user.uid, setTransportBookings) : null;
    return () => { u1(); u2(); u3?.(); };
  }, [user, activeTab]);

  // ── Farmer: create listing ─────────────────────────────────────────────────

  const handleSubmitListing = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const listingData = {
      farmer: user.name || 'Unknown Farmer',
      farmerLocation: user.location || 'Karnataka',
      crop: fd.get('crop'),
      variety: fd.get('variety'),
      quantity: Number(fd.get('quantity')),
      unit: fd.get('unit'),
      price: Number(fd.get('price')),
      harvestDate: fd.get('harvestDate'),
      quality: fd.get('quality'),
      organic: fd.get('organic') === 'on',
      details: fd.get('details'),
      verified: false
    };
    const result = await createListing(user.uid, listingData);
    if (result.success) {
      await logActivity(user.uid, {
        action: 'Created new listing',
        details: `${listingData.crop} — ${listingData.quantity} ${listingData.unit}`,
        type: 'marketplace'
      });
      setShowListingModal(false);
      e.target.reset();
    } else {
      alert('Error creating listing: ' + result.error);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Delete this listing?')) return;
    const result = await deleteListing(listingId);
    if (!result.success) alert('Error deleting: ' + result.error);
  };

  // ── Buyer: open buy confirmation modal ────────────────────────────────────

  const handleBuyNow = (listing) => {
    if (!user) { alert('Please login to place an order'); return; }
    if (isFarmer) { alert('Farmers cannot purchase crops. Switch to a buyer account to shop.'); return; }
    if (user.uid === listing.userId) { alert('You cannot buy your own listing'); return; }
    setSelectedListing(listing);
    setBuyQuantity(1);
    setPaymentSuccess(null);
    setShowBuyModal(true);
  };

  // ── Buyer: confirm & pay ──────────────────────────────────────────────────

  const handleConfirmPurchase = async () => {
    if (!selectedListing || paying) return;

    const qty = Number(buyQuantity);
    if (!qty || qty < 1 || qty > selectedListing.quantity) {
      alert(`Please enter a valid quantity (1–${selectedListing.quantity})`);
      return;
    }

    const totalAmount = Number(selectedListing.price) * qty;
    const amountInPaise = Math.round(totalAmount * 100);

    if (amountInPaise < 100) {
      alert('Order amount is too small.');
      return;
    }

    setPaying(true);

    // Saves the order to Firebase and shows the success screen
    const finishOrder = async (paymentId, paymentOrderId = '', paymentSignature = '') => {
      try {
        const orderData = {
          buyerId: user.uid,
          buyerName: user.name || '',
          buyerEmail: user.email || '',
          buyerPhone: user.phone || '',
          farmerId: selectedListing.userId,
          farmerName: selectedListing.farmer,
          farmerLocation: selectedListing.farmerLocation,
          listingId: selectedListing.id,
          crop: selectedListing.crop,
          variety: selectedListing.variety || '',
          quantity: qty,
          unit: selectedListing.unit,
          pricePerUnit: selectedListing.price,
          totalAmount,
          quality: selectedListing.quality,
          organic: selectedListing.organic || false,
          paymentId,
          paymentOrderId,
          paymentSignature,
          paymentStatus: 'completed',
          status: 'pending',
          orderDate: Date.now(),
          expectedDelivery: Date.now() + 5 * 24 * 60 * 60 * 1000
        };

        const result = await createOrder(orderData);
        if (!result.success) {
          alert('Error saving order: ' + result.error);
          setPaying(false);
          return;
        }

        const remaining = selectedListing.quantity - qty;
        await updateListing(selectedListing.id, {
          quantity: remaining,
          status: remaining <= 0 ? 'sold' : 'active'
        });

        await logActivity(user.uid, {
          action: `Ordered ${selectedListing.crop} — ${qty} ${selectedListing.unit}`,
          details: `Order ID: ${result.id}, Payment ID: ${paymentId}`,
          type: 'marketplace'
        });
        await logActivity(selectedListing.userId, {
          action: `New order received for ${selectedListing.crop}`,
          details: `Order ID: ${result.id}, Buyer: ${user.name}`,
          type: 'marketplace'
        });

        setPaymentSuccess({
          orderId: result.id,
          paymentId,
          crop: selectedListing.crop,
          quantity: qty,
          unit: selectedListing.unit,
          totalAmount
        });
        setPaying(false);
      } catch (err) {
        alert('Failed to save order: ' + err.message);
        setPaying(false);
      }
    };

    // Step 1: Try to create a Razorpay order via the backend (5-second timeout)
    let razorpayOrder = null;
    let keyId = RAZORPAY_TEST_KEY_ID;

    try {
      const backendCall = createRazorpayOrder({
        amount: amountInPaise,
        receipt: `rcpt${Date.now()}`,
        notes: { crop: selectedListing.crop || '', buyer: user.name || user.email || '' }
      });
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Backend timeout after 5s')), 5000)
      );
      const res = await Promise.race([backendCall, timeout]);
      razorpayOrder = res.order;
      keyId = res.keyId || RAZORPAY_TEST_KEY_ID;
    } catch (err) {
      console.warn('Backend unavailable, using DEV simulation:', err.message);
    }

    // Step 2: No Razorpay order from backend → simulate payment (DEV) or block (PROD)
    if (!razorpayOrder) {
      if (import.meta.env.PROD) {
        alert('Payment setup failed. Run the backend server with: npm run dev:fullstack');
        setPaying(false);
        return;
      }
      // DEV mode: skip Razorpay — directly save order to Firebase
      // so buyer and farmer can test the full order tracking flow
      await finishOrder(`pay_dev_${Date.now()}`);
      return;
    }

    // Step 3: Backend order ready → open real Razorpay checkout
    try {
      await loadRazorpayCheckout();

      const options = {
        key: keyId,
        name: 'Raith Sethu',
        description: `${selectedListing.crop} — ${qty} ${selectedListing.unit}`,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        notes: {
          crop: selectedListing.crop,
          farmer: selectedListing.farmer,
          quantity: `${qty} ${selectedListing.unit}`
        },
        theme: { color: '#10b981' },
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          } catch (verErr) {
            console.warn('Payment verification warning:', verErr.message);
          }
          await finishOrder(
            response.razorpay_payment_id,
            response.razorpay_order_id || '',
            response.razorpay_signature || ''
          );
        },
        modal: { ondismiss: () => setPaying(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res) => {
        alert(`Payment failed: ${res.error?.description || 'Please try again.'}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      alert(`Unable to open payment: ${err.message}`);
      setPaying(false);
    }
  };

  // ── Farmer: update order status ───────────────────────────────────────────

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) alert('Failed to update status: ' + result.error);
    setUpdatingOrderId(null);
  };

  // ── Chat ──────────────────────────────────────────────────────────────────

  const handleStartChat = async (listing) => {
    if (!user) { alert('Please login to chat'); return; }
    if (user.uid === listing.userId) { alert('Cannot chat with yourself'); return; }
    const existingChatId = await findExistingChat(listing.userId, user.uid);
    if (!existingChatId) {
      const result = await createChat(
        listing.userId, listing.farmer || 'Farmer',
        user.uid, user.name || user.email || 'Buyer',
        listing.id
      );
      if (!result.success) { alert(`Unable to start chat: ${result.error}`); return; }
    }
    navigate('/chat');
  };

  // ── Transport ─────────────────────────────────────────────────────────────

  const handleAddTransporter = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const result = await createTransporter({
      name: fd.get('name'),
      vehicleType: fd.get('vehicleType'),
      pricePerKm: parseFloat(fd.get('pricePerKm')),
      phone: fd.get('phone'),
      location: fd.get('location'),
      email: fd.get('email') || '',
      available: fd.get('available') === 'on',
      rating: 5.0,
      deliveries: 0
    });
    if (result.success) { setShowTransporterModal(false); e.target.reset(); }
    else alert('Error adding transporter: ' + result.error);
  };

  const handleDeleteTransporter = async (id) => {
    if (!window.confirm('Delete this transporter?')) return;
    const result = await deleteTransporter(id);
    if (!result.success) alert('Error: ' + result.error);
  };

  const handleBookTransport = async (order, transporter, distance) => {
    const cost = Math.round(distance * transporter.pricePerKm);
    const result = await createTransportBooking({
      orderId: order.id,
      buyerId: user.uid,
      buyerName: user.name,
      farmerId: order.farmerId,
      transporterId: transporter.id,
      transporterName: transporter.name,
      vehicleType: transporter.vehicleType,
      pickupLocation: order.farmerLocation || 'Karnataka',
      deliveryLocation: user.location || 'Delivery Location',
      distance,
      cost,
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'booked'
    });
    if (result.success) {
      await logActivity(user.uid, {
        action: 'Booked transport',
        details: `${transporter.name} — ₹${cost}`,
        type: 'transport'
      });
      alert(`Transport booked! Booking ID: ${result.id}`);
    } else {
      alert('Error booking transport: ' + result.error);
    }
  };

  // ── Filtered listings ─────────────────────────────────────────────────────

  const filteredListings = cropListings.filter((l) => {
    if (user && l.userId === user.uid) return false;
    const matchSearch =
      l.crop?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.farmer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.farmerLocation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || (selectedCategory === 'organic' && l.organic);
    return matchSearch && matchCat;
  });

  if (loading && activeTab === 'browse' && cropListings.length === 0) {
    return <div className="loading">Loading marketplace...</div>;
  }

  // ── Tabs config ───────────────────────────────────────────────────────────
  // Farmers: sell-side only (My Listings, Incoming Orders, Transport)
  // Buyers:  buy-side only  (Browse Crops, My Orders, Transport)

  const tabs = [
    ...(isFarmer ? [
      { id: 'myListings', icon: <User size={18} />, label: 'My Listings' },
      {
        id: 'incomingOrders', icon: <Package size={18} />, label: 'Incoming Orders',
        badge: incomingOrders.filter((o) => o.status === 'pending').length
      }
    ] : [
      { id: 'browse', icon: <ShoppingCart size={18} />, label: 'Browse Crops' },
      { id: 'myOrders', icon: <Package size={18} />, label: 'My Orders' }
    ]),
    { id: 'transport', icon: <Truck size={18} />, label: 'Transport' }
  ];

  return (
    <div className="marketplace-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          {isFarmer ? (
            <>
              <h1>🌾 Manage Your Crops</h1>
              <p>Post listings, track incoming orders, and manage your farm sales</p>
            </>
          ) : (
            <>
              <h1>🛒 Buy Fresh Crops</h1>
              <p>Browse directly from farmers — fresh produce, fair prices, no middlemen</p>
            </>
          )}
        </div>
        {isFarmer && (
          <button className="btn btn-primary" onClick={() => setShowListingModal(true)}>
            <Plus size={18} /> Post Crop
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
            {tab.badge > 0 && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BROWSE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'browse' && (
        <div className="browse-section">
          <div className="marketplace-filters">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search crop, farmer, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              {['all', 'organic'].map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'organic' ? <><Leaf size={14} /> Organic</> : 'All Crops'}
                </button>
              ))}
            </div>
          </div>

          <div className="listings-grid">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <div className="listing-image">
                  <span style={{ fontSize: '4rem' }}>{cropEmoji(listing.crop)}</span>
                  {listing.organic && <span className="organic-badge"><Leaf size={12} /> Organic</span>}
                  {listing.farmerVerified && (
                    <span className="verified-badge" title="Verified Farmer">
                      <BadgeCheck size={14} /> Verified
                    </span>
                  )}
                </div>

                <div className="listing-content">
                  <div className="listing-header">
                    <div>
                      <h3>{listing.crop}</h3>
                      {listing.variety && <p className="variety">{listing.variety}</p>}
                    </div>
                    {listing.rating && (
                      <div className="rating">
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <span>{listing.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="listing-details">
                    <div className="detail-row"><User size={14} /><span>{listing.farmer}</span></div>
                    <div className="detail-row"><MapPin size={14} /><span>{listing.farmerLocation}</span></div>
                    {listing.harvestDate && (
                      <div className="detail-row"><Calendar size={14} /><span>Harvested: {listing.harvestDate}</span></div>
                    )}
                    {listing.quality && (
                      <div className="detail-row">
                        <span className="quality-badge">{listing.quality}</span>
                      </div>
                    )}
                  </div>

                  <div className="listing-footer">
                    <div className="price-section">
                      <span className="price">₹{Number(listing.price).toLocaleString('en-IN')}</span>
                      <span className="unit">per {listing.unit}</span>
                    </div>
                    <span className="quantity">{listing.quantity} {listing.unit} available</span>
                  </div>

                  <div className="listing-actions">
                    {!isFarmer && (
                      <button className="btn btn-primary" onClick={() => handleBuyNow(listing)}>
                        <ShoppingCart size={16} /> Buy Now
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => handleStartChat(listing)}>
                      <MessageCircle size={16} /> Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <ShoppingCart size={56} strokeWidth={1} style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
              <p>No crop listings found. {isFarmer ? 'Post your first crop!' : 'Check back soon.'}</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MY LISTINGS TAB (farmer)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'myListings' && isFarmer && (
        <div className="my-listings-section">
          {myListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <Package size={56} strokeWidth={1} style={{ display: 'block', margin: '0 auto 1rem' }} />
              <p>No listings yet. Click <strong>Post Crop</strong> to add your first crop.</p>
            </div>
          ) : (
            <div className="listings-table">
              <table>
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Variety</th>
                    <th>Quantity</th>
                    <th>Price / unit</th>
                    <th>Quality</th>
                    <th>Status</th>
                    <th>Posted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myListings.map((listing) => (
                    <tr key={listing.id}>
                      <td><strong>{listing.crop}</strong></td>
                      <td>{listing.variety || '—'}</td>
                      <td>{listing.quantity} {listing.unit}</td>
                      <td>₹{Number(listing.price).toLocaleString('en-IN')}</td>
                      <td>{listing.quality || '—'}</td>
                      <td>
                        <span className={`status-badge ${listing.status}`}>{listing.status}</span>
                      </td>
                      <td>{new Date(listing.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteListing(listing.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MY ORDERS TAB (buyer / customer)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'myOrders' && !isFarmer && (
        <div className="tab-content">
          {myOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <Package size={56} strokeWidth={1} style={{ display: 'block', margin: '0 auto 1rem' }} />
              <p>No orders yet. Browse crops and place your first order!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Summary */}
              <div className="orders-summary-bar">
                <div className="summary-item">
                  <span className="summary-num">{myOrders.length}</span>
                  <span className="summary-label">Total Orders</span>
                </div>
                <div className="summary-item pending">
                  <span className="summary-num">{myOrders.filter((o) => o.status === 'pending').length}</span>
                  <span className="summary-label">Pending</span>
                </div>
                <div className="summary-item confirmed">
                  <span className="summary-num">{myOrders.filter((o) => o.status === 'in-transit').length}</span>
                  <span className="summary-label">In Transit</span>
                </div>
                <div className="summary-item delivered">
                  <span className="summary-num">{myOrders.filter((o) => o.status === 'delivered' || o.status === 'completed').length}</span>
                  <span className="summary-label">Delivered</span>
                </div>
                <div className="summary-item revenue">
                  <span className="summary-num">₹{myOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0).toLocaleString('en-IN')}</span>
                  <span className="summary-label">Total Spent</span>
                </div>
              </div>

              {myOrders.map((order) => (
                <div key={order.id} className={`incoming-order-card order-status-${order.status}`}>
                  <div className="incoming-order-left">
                    <div className="incoming-order-top">
                      <div>
                        <h3>{order.crop} — {order.quantity} {order.unit}</h3>
                        {order.variety && <p className="order-variety">{order.variety}</p>}
                      </div>
                      <span
                        className="status-badge"
                        style={{ background: STATUS_COLORS[order.status] || '#6b7280', color: '#fff' }}
                      >
                        {order.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="incoming-order-details">
                      <div className="detail-row"><User size={14} /><strong>Farmer:</strong><span>{order.farmerName}</span></div>
                      <div className="detail-row"><MapPin size={14} /><strong>Location:</strong><span>{order.farmerLocation}</span></div>
                      <div className="detail-row">
                        <IndianRupee size={14} />
                        <strong>Amount Paid:</strong>
                        <span className="order-amount">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-row">
                        <Calendar size={14} />
                        <strong>Order Date:</strong>
                        <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : '—'}</span>
                      </div>
                      <div className="detail-row">
                        <Calendar size={14} />
                        <strong>Expected Delivery:</strong>
                        <span>{order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString('en-IN') : '—'}</span>
                      </div>
                      <div className="detail-row">
                        <CheckCircle size={14} />
                        <strong>Payment:</strong>
                        <span className={`payment-status ${order.paymentStatus}`}>{order.paymentStatus || 'pending'}</span>
                      </div>
                      {order.paymentId && (
                        <div className="detail-row">
                          <Clock size={14} />
                          <strong>Payment ID:</strong>
                          <span className="payment-id">{order.paymentId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          INCOMING ORDERS TAB (farmer)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'incomingOrders' && isFarmer && (
        <div className="tab-content incoming-orders-section">
          <div className="section-header">
            <h2><Package size={22} /> Incoming Orders</h2>
            <p>Orders placed by buyers for your listings</p>
          </div>

          {incomingLoading ? (
            <div className="loading">Loading orders...</div>
          ) : incomingOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <Package size={56} strokeWidth={1} style={{ display: 'block', margin: '0 auto 1rem' }} />
              <p>No orders yet. Once buyers purchase your crops, they appear here.</p>
            </div>
          ) : (
            <div className="incoming-orders-list">
              <div className="orders-summary-bar">
                <div className="summary-item">
                  <span className="summary-num">{incomingOrders.length}</span>
                  <span className="summary-label">Total</span>
                </div>
                <div className="summary-item pending">
                  <span className="summary-num">{incomingOrders.filter((o) => o.status === 'pending').length}</span>
                  <span className="summary-label">Pending</span>
                </div>
                <div className="summary-item confirmed">
                  <span className="summary-num">{incomingOrders.filter((o) => o.status === 'confirmed').length}</span>
                  <span className="summary-label">Confirmed</span>
                </div>
                <div className="summary-item delivered">
                  <span className="summary-num">{incomingOrders.filter((o) => o.status === 'delivered').length}</span>
                  <span className="summary-label">Delivered</span>
                </div>
                <div className="summary-item revenue">
                  <span className="summary-num">₹{incomingOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0).toLocaleString('en-IN')}</span>
                  <span className="summary-label">Revenue</span>
                </div>
              </div>

              {incomingOrders.map((order) => (
                <div key={order.id} className={`incoming-order-card order-status-${order.status}`}>
                  <div className="incoming-order-left">
                    <div className="incoming-order-top">
                      <div>
                        <h3>{order.crop} — {order.quantity} {order.unit}</h3>
                        {order.variety && <p className="order-variety">{order.variety}</p>}
                      </div>
                      <span
                        className="status-badge"
                        style={{ background: STATUS_COLORS[order.status] || '#6b7280', color: '#fff' }}
                      >
                        {order.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="incoming-order-details">
                      <div className="detail-row"><User size={14} /><strong>Buyer:</strong><span>{order.buyerName || 'Unknown'}</span></div>
                      <div className="detail-row"><Phone size={14} /><strong>Phone:</strong><span>{order.buyerPhone || '—'}</span></div>
                      <div className="detail-row">
                        <IndianRupee size={14} />
                        <strong>Amount:</strong>
                        <span className="order-amount">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-row">
                        <Calendar size={14} />
                        <strong>Order Date:</strong>
                        <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : '—'}</span>
                      </div>
                      <div className="detail-row">
                        <CheckCircle size={14} />
                        <strong>Payment:</strong>
                        <span className={`payment-status completed`}>✓ Completed</span>
                      </div>
                      {order.paymentId && (
                        <div className="detail-row">
                          <Clock size={14} />
                          <strong>Payment ID:</strong>
                          <span className="payment-id">{order.paymentId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="incoming-order-actions">
                    <p className="action-label">Update Status</p>
                    {['pending', 'confirmed', 'in-transit', 'delivered'].map((status) => (
                      <button
                        key={status}
                        className={`btn btn-status ${order.status === status ? 'current' : ''}`}
                        disabled={order.status === status || updatingOrderId === order.id}
                        onClick={() => handleUpdateOrderStatus(order.id, status)}
                      >
                        {updatingOrderId === order.id ? '...' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TRANSPORT TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transport' && (
        <div className="transport-section">
          <div className="section-header">
            <h2><Truck size={22} /> Transport & Logistics</h2>
            <p>Book reliable transport for your orders</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Available Transporters</h3>
            {user?.role === 'admin' && (
              <button className="btn btn-primary" onClick={() => setShowTransporterModal(true)}>
                <Plus size={16} /> Add Transporter
              </button>
            )}
          </div>

          <div className="transporters-grid">
            {transporters.map((t) => (
              <div key={t.id} className={`transporter-card ${!t.available ? 'unavailable' : ''}`}>
                <div className="transporter-header">
                  <div>
                    <h4>{t.name}</h4>
                    <div className="rating">
                      <Star size={14} fill="#fbbf24" color="#fbbf24" />
                      <span>{t.rating}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({t.deliveries} deliveries)</span>
                    </div>
                  </div>
                  <span className={`availability-badge ${t.available ? 'available' : 'busy'}`}>
                    {t.available ? 'Available' : 'Busy'}
                  </span>
                </div>
                <div className="transporter-details">
                  <div className="detail-item"><Truck size={16} /><span>{t.vehicleType}</span></div>
                  <div className="detail-item"><MapPin size={16} /><span>{t.location}</span></div>
                  <div className="detail-item"><Phone size={16} /><span>{t.phone}</span></div>
                  <div className="detail-item"><DollarSign size={16} /><span>₹{t.pricePerKm}/km</span></div>
                </div>
                {user?.role === 'admin' && (
                  <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: '0.75rem' }}
                    onClick={() => handleDeleteTransporter(t.id)}>Delete</button>
                )}
              </div>
            ))}
          </div>
          {transporters.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              No transporters available.
            </p>
          )}

          {transportOrders.length > 0 && (
            <>
              <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Book Transport for Your Orders</h3>
              <div className="orders-transport-list">
                {transportOrders.map((order) => (
                  <TransportOrderCard
                    key={order.id}
                    order={order}
                    transporters={transporters}
                    onBook={handleBookTransport}
                  />
                ))}
              </div>
            </>
          )}

          {transportBookings.length > 0 && (
            <>
              <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Booked Transports</h3>
              <div className="bookings-list">
                {transportBookings.map((b) => (
                  <div key={b.id} className="booking-card">
                    <div className="booking-header">
                      <h4>{b.transporterName}</h4>
                      <span className="status-badge booked">Booked</span>
                    </div>
                    <div className="booking-details">
                      <div className="detail-row"><strong>Vehicle:</strong><span>{b.vehicleType}</span></div>
                      <div className="detail-row"><strong>Route:</strong><span>{b.pickupLocation} → {b.deliveryLocation}</span></div>
                      <div className="detail-row"><strong>Distance:</strong><span>{b.distance} km</span></div>
                      <div className="detail-row"><strong>Cost:</strong><span className="cost-highlight">₹{b.cost}</span></div>
                      <div className="detail-row"><strong>Pickup:</strong><span>{b.pickupDate}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BUY CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showBuyModal && selectedListing && (
        <div className="buy-modal-overlay" onClick={() => { if (!paying) setShowBuyModal(false); }}>
          <div className="buy-modal-content" onClick={(e) => e.stopPropagation()}>
            {paymentSuccess ? (
              /* ── Success state ── */
              <div className="buy-modal-body">
                <div className="buy-success-header">
                  <div style={{ fontSize: '2.5rem' }}>✅</div>
                  <h2 style={{ color: '#10b981', margin: '0 0 0.2rem' }}>Order Confirmed!</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
                    Order placed. Farmer has been notified.
                  </p>
                </div>

                <div className="buy-success-card green">
                  <div className="buy-success-row">
                    <span>Crop</span>
                    <strong>{paymentSuccess.crop} × {paymentSuccess.quantity} {paymentSuccess.unit}</strong>
                  </div>
                  <div className="buy-success-row">
                    <span>Amount Paid</span>
                    <strong style={{ color: '#10b981' }}>₹{Number(paymentSuccess.totalAmount).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="buy-success-row">
                    <span>Status</span>
                    <span className="status-pill pending">Awaiting farmer confirmation</span>
                  </div>
                </div>

                <div className="buy-success-card gray">
                  <div style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.82rem', color: '#374151' }}>Tracking IDs</div>
                  <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#6b7280', minWidth: 75 }}>Order ID</span>
                      <code style={{ wordBreak: 'break-all' }}>{paymentSuccess.orderId}</code>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#6b7280', minWidth: 75 }}>Payment ID</span>
                      <code style={{ wordBreak: 'break-all' }}>{paymentSuccess.paymentId}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBuyModal(false)}>
                    Continue Shopping
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => { setShowBuyModal(false); setActiveTab('myOrders'); }}
                  >
                    <Package size={16} /> Track My Order
                  </button>
                </div>
              </div>
            ) : (
              /* ── Order summary ── */
              <>
                <div className="buy-modal-header">
                  <h2>Confirm Order</h2>
                  <button className="close-btn" onClick={() => setShowBuyModal(false)} disabled={paying}><X size={20} /></button>
                </div>

                <div className="buy-modal-body">
                  {/* Listing info — compact */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                    <span style={{ fontSize: '2.2rem' }}>{cropEmoji(selectedListing.crop)}</span>
                    <div>
                      <h3 style={{ margin: 0 }}>{selectedListing.crop}</h3>
                      {selectedListing.variety && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedListing.variety}</p>}
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        by {selectedListing.farmer} • {selectedListing.farmerLocation}
                      </p>
                    </div>
                  </div>

                  {/* Quantity + price in a compact row */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                        Qty ({selectedListing.unit}) — max {selectedListing.quantity}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selectedListing.quantity}
                        value={buyQuantity}
                        onChange={(e) => setBuyQuantity(Math.min(Number(e.target.value), selectedListing.quantity))}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', border: '2px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '1rem' }}
                      />
                    </div>
                    <div style={{ textAlign: 'right', paddingBottom: '0.1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        ₹{Number(selectedListing.price).toLocaleString('en-IN')} × {buyQuantity}
                      </div>
                    </div>
                  </div>

                  {/* Total + badges row */}
                  <div style={{ background: '#f0fdf4', borderRadius: '0.65rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {selectedListing.quality && <span className="quality-badge">{selectedListing.quality}</span>}
                      {selectedListing.organic && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#10b981', fontSize: '0.8rem' }}><Leaf size={12} />Organic</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#10b981' }}>
                        ₹{(Number(selectedListing.price) * Number(buyQuantity)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons — always visible */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBuyModal(false)} disabled={paying}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 2 }}
                      onClick={handleConfirmPurchase}
                      disabled={paying || !buyQuantity || buyQuantity < 1}
                    >
                      {paying
                        ? <><span className="btn-spinner" /> Processing...</>
                        : `Pay ₹${(Number(selectedListing.price) * Number(buyQuantity)).toLocaleString('en-IN')}`
                      }
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          POST CROP MODAL (farmer)
      ══════════════════════════════════════════════════════════════════════ */}
      {showListingModal && (
        <div className="modal-overlay" onClick={() => setShowListingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post Your Crop</h2>
              <button className="close-btn" onClick={() => setShowListingModal(false)}><X size={20} /></button>
            </div>
            <form className="listing-form" onSubmit={handleSubmitListing}>
              <div className="form-row">
                <div className="form-group">
                  <label>Crop Name *</label>
                  <input type="text" name="crop" placeholder="e.g., Rice, Tomato" required />
                </div>
                <div className="form-group">
                  <label>Variety</label>
                  <input type="text" name="variety" placeholder="e.g., BPT 5204" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" name="quantity" placeholder="e.g., 50" min="1" required />
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <select name="unit" required>
                    <option value="">Select</option>
                    <option value="quintals">Quintals</option>
                    <option value="kg">Kilograms</option>
                    <option value="tons">Tons</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price per unit (₹) *</label>
                  <input type="number" name="price" placeholder="e.g., 2000" min="1" required />
                </div>
                <div className="form-group">
                  <label>Harvest Date *</label>
                  <input type="date" name="harvestDate" required />
                </div>
              </div>
              <div className="form-group">
                <label>Quality Grade *</label>
                <select name="quality" required>
                  <option value="">Select grade</option>
                  <option value="Premium">Premium</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" name="organic" />
                  <span>Certified Organic produce</span>
                </label>
              </div>
              <div className="form-group">
                <label>Additional Details</label>
                <textarea name="details" placeholder="Soil type, farming method, certifications..." rows="3" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowListingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Crop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transporter Modal (admin) */}
      {showTransporterModal && (
        <div className="modal-overlay" onClick={() => setShowTransporterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Transport Provider</h2>
              <button className="close-btn" onClick={() => setShowTransporterModal(false)}><X size={20} /></button>
            </div>
            <form className="listing-form" onSubmit={handleAddTransporter}>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" name="name" placeholder="Express Logistics" required />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select name="vehicleType" required>
                    <option value="">Select</option>
                    <option>Mini Truck (1 Ton)</option>
                    <option>Medium Truck (3 Ton)</option>
                    <option>Large Truck (5 Ton)</option>
                    <option>Tempo (500 kg)</option>
                    <option>Pickup Van</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price per KM (₹)</label>
                  <input type="number" name="pricePerKm" placeholder="15" required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" name="phone" placeholder="+91 XXXXX XXXXX" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" placeholder="transporter@email.com" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" placeholder="Bangalore" required />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" name="available" defaultChecked />
                  <span>Currently Available</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransporterModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Transporter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Transport Order Card (sub-component) ──────────────────────────────────────

const TransportOrderCard = ({ order, transporters, onBook }) => {
  const [distance, setDistance] = useState('');
  const [selectedTransporterId, setSelectedTransporterId] = useState(transporters[0]?.id || '');

  const selectedTransporter = transporters.find((t) => t.id === selectedTransporterId);
  const cost = selectedTransporter && distance ? Math.round(parseFloat(distance) * selectedTransporter.pricePerKm) : 0;

  return (
    <div className="order-transport-card">
      <div className="order-info-section">
        <div className="order-header-info">
          <h4>{order.crop} — {order.quantity} {order.unit}</h4>
          <span className="status-badge" style={{ background: STATUS_COLORS[order.status] || '#6b7280', color: '#fff' }}>
            {order.status}
          </span>
        </div>
        <div className="order-details-grid">
          <div className="detail"><User size={14} /><span>{order.farmerName}</span></div>
          <div className="detail"><MapPin size={14} /><span>{order.farmerLocation || 'Karnataka'}</span></div>
          <div className="detail"><Package size={14} /><span>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span></div>
          <div className="detail"><Calendar size={14} /><span>{new Date(order.orderDate).toLocaleDateString('en-IN')}</span></div>
        </div>
      </div>

      <div className="transport-calculator">
        <h5>Book Transport</h5>
        <div className="calculator-form">
          <div className="calc-row">
            <label>Distance (km)</label>
            <input type="number" placeholder="Enter distance" value={distance} onChange={(e) => setDistance(e.target.value)} />
          </div>
          <div className="calc-row">
            <label>Select Transporter</label>
            <select value={selectedTransporterId} onChange={(e) => setSelectedTransporterId(e.target.value)}>
              {transporters.filter((t) => t.available).map((t) => (
                <option key={t.id} value={t.id}>{t.name} — ₹{t.pricePerKm}/km</option>
              ))}
            </select>
          </div>
          <div className="calc-result">
            <strong>Estimated Cost:</strong>
            <span className="cost-value">₹{cost.toLocaleString('en-IN')}</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            disabled={!distance || parseFloat(distance) <= 0 || !selectedTransporter}
            onClick={() => onBook(order, selectedTransporter, parseFloat(distance))}
          >
            <CheckCircle size={14} /> Book Transport
          </button>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
