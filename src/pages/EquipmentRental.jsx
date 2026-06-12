import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tractor, Calendar, MapPin, Phone, Star, Clock, Loader } from 'lucide-react';
import { createEquipmentBooking, getEquipmentListings, updateEquipmentAvailability } from '../services/firebaseService';
import { RAZORPAY_TEST_KEY_ID, createRazorpayOrder, loadRazorpayCheckout } from '../services/razorpayService';

const categories = [
  { id: 'all', name: 'All Equipment' },
  { id: 'tractors', name: 'Tractors' },
  { id: 'harvesters', name: 'Harvesters' },
  { id: 'sprayers', name: 'Sprayers' },
  { id: 'tillers', name: 'Tillers' }
];

const EquipmentRental = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const [equipment, setEquipment] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingBooking, setSavingBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    duration: 1,
    location: ''
  });

  useEffect(() => {
    const unsubscribe = getEquipmentListings((items) => {
      setEquipment(items.filter((item) => item.status !== 'inactive'));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEquipment = equipment.filter((item) =>
    category === 'all' || item.category === category
  );

  const handleBookNow = (item) => {
    setSelectedEquipment(item);
    setShowBookingModal(true);
    setBookingData({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      duration: 1,
      location: user?.location || ''
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEquipment || !user?.uid) return;

    const totalCost = bookingData.duration * Number(selectedEquipment.dailyRate || 0);
    const amountInPaise = Math.round(totalCost * 100);

    if (amountInPaise < 100) {
      alert('Booking amount is too low. Please check the equipment daily rate.');
      return;
    }

    const saveBooking = async (paymentId) => {
      setSavingBooking(true);
      const result = await createEquipmentBooking({
        equipmentId: selectedEquipment.id,
        equipmentName: selectedEquipment.name,
        ownerId: selectedEquipment.ownerId || '',
        owner: selectedEquipment.owner || '',
        requesterId: user.uid,
        requesterName: user.name || '',
        requesterPhone: user.phone || '',
        ...bookingData,
        totalCost,
        paymentId,
        paymentStatus: 'completed'
      });
      if (result.success) {
        await updateEquipmentAvailability(selectedEquipment.id, false);
        setShowBookingModal(false);
        alert(`Booking confirmed!\nPayment ID: ${paymentId}`);
      } else {
        alert(result.error || 'Unable to save booking.');
      }
      setSavingBooking(false);
    };

    try {
      await loadRazorpayCheckout();

      let razorpayOrder = null;
      let razorpayKeyId = RAZORPAY_TEST_KEY_ID;

      try {
        const result = await createRazorpayOrder({
          amount: amountInPaise,
          receipt: `equip_${selectedEquipment.id || Date.now()}`.slice(0, 40),
          notes: { equipmentId: selectedEquipment.id || '', requester: user.uid }
        });
        razorpayOrder = result.order;
        razorpayKeyId = result.keyId || RAZORPAY_TEST_KEY_ID;
      } catch {
        if (import.meta.env.PROD) {
          alert('Payment setup failed. Please try again later.');
          return;
        }
      }

      const options = {
        key: razorpayKeyId,
        name: 'Equipment Rental',
        description: `${selectedEquipment.name} — ${bookingData.duration} day(s)`,
        amount: razorpayOrder?.amount || amountInPaise,
        currency: razorpayOrder?.currency || 'INR',
        ...(razorpayOrder?.id ? { order_id: razorpayOrder.id } : {}),
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: { color: '#10b981' },
        handler: async (response) => {
          await saveBooking(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => {}
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        alert(`Payment failed: ${response.error?.description || 'Please try again.'}`);
      });
      rzp.open();
    } catch (error) {
      alert(`Unable to start payment: ${error.message}`);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  useEffect(() => {
    if (bookingData.startDate && bookingData.endDate) {
      const duration = calculateDuration(bookingData.startDate, bookingData.endDate);
      setBookingData((current) => ({ ...current, duration }));
    }
  }, [bookingData.startDate, bookingData.endDate]);

  if (loading) {
    return (
      <div className="equipment-rental-page">
        <div className="loading">
          <Loader size={48} className="spinner" />
          <p>Loading equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-rental-page">
      <div className="page-header">
        <div>
          <h1>
            <Tractor size={32} />
            Equipment Rental
          </h1>
          <p>Live equipment records from Firebase equipment</p>
        </div>
      </div>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="equipment-grid">
        {filteredEquipment.map((item) => (
          <div key={item.id} className="equipment-card">
            <div className="equipment-header">
              <Tractor className="equipment-emoji" size={48} />
              {item.available && <span className="available-badge">Available</span>}
            </div>

            <div className="equipment-details">
              <h3>{item.name || 'Unnamed equipment'}</h3>
              {item.hp && <p className="equipment-spec">Power: {item.hp} HP</p>}
              <p className="equipment-description">{item.description || 'No description provided.'}</p>

              <div className="equipment-owner">
                <span>Owner: {item.owner || 'Unknown owner'}</span>
              </div>

              <div className="equipment-location">
                <MapPin size={16} />
                <span>{item.location || 'Location not provided'}</span>
              </div>

              {item.rating ? (
                <div className="equipment-rating">
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  <span>{item.rating} ({item.reviews || 0} reviews)</span>
                </div>
              ) : null}

              <div className="equipment-pricing">
                {item.hourlyRate ? (
                  <div className="price-item">
                    <Clock size={16} />
                    <span>Rs.{Number(item.hourlyRate).toLocaleString('en-IN')}/hour</span>
                  </div>
                ) : null}
                {item.dailyRate ? (
                  <div className="price-item">
                    <Calendar size={16} />
                    <span>Rs.{Number(item.dailyRate).toLocaleString('en-IN')}/day</span>
                  </div>
                ) : null}
              </div>

              <div className="equipment-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleBookNow(item)}
                  disabled={!item.available}
                >
                  <Calendar size={16} />
                  Book Now
                </button>
                {item.phone ? (
                  <a href={`tel:${item.phone}`} className="btn btn-secondary">
                    <Phone size={16} />
                    Call Owner
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="no-results">
          <Tractor size={64} color="#ccc" />
          <h3>No real equipment found</h3>
          <p>Add equipment records in Firebase under equipment to display them here.</p>
        </div>
      )}

      {showBookingModal && selectedEquipment && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book {selectedEquipment.name}</h2>
              <button className="close-btn" onClick={() => setShowBookingModal(false)}>x</button>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={bookingData.startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={bookingData.endDate}
                  min={bookingData.startDate}
                  onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Duration: {bookingData.duration} day(s)</label>
              </div>

              <div className="form-group">
                <label>Your Location (Village/Taluk)</label>
                <input
                  type="text"
                  value={bookingData.location}
                  onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                  placeholder="Enter pickup location"
                  required
                />
              </div>

              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Daily Rate:</span>
                  <span>Rs.{Number(selectedEquipment.dailyRate || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-row">
                  <span>Duration:</span>
                  <span>{bookingData.duration} day(s)</span>
                </div>
                <div className="summary-row total">
                  <span>Total Cost:</span>
                  <span>Rs.{(bookingData.duration * Number(selectedEquipment.dailyRate || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingBooking}>
                  {savingBooking ? 'Saving...' : `Pay Rs.${(bookingData.duration * Number(selectedEquipment.dailyRate || 0)).toLocaleString('en-IN')} & Book`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentRental;
