import { useEffect, useMemo, useState } from 'react';
import { MapPin, Navigation, Search, Sprout, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { getAllUsers, getListings, getOrders } from '../services/firebaseService';

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const FarmerMapping = () => {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubUsers = getAllUsers(setUsers);
    const unsubListings = getListings(setListings);
    const unsubOrders = getOrders(setOrders);
    return () => {
      unsubUsers();
      unsubListings();
      unsubOrders();
    };
  }, []);

  const farmers = useMemo(() => {
    return users
      .filter((user) => user.role === 'farmer')
      .map((farmer) => {
        const id = farmer.uid || farmer.id;
        const farmerListings = listings.filter((listing) => listing.userId === id);
        const farmerOrders = orders.filter((order) => order.farmerId === id || order.userId === id);
        const latitude = toNumber(farmer.latitude);
        const longitude = toNumber(farmer.longitude);
        const completedOrders = farmerOrders.filter((order) => order.status === 'completed' || order.status === 'delivered').length;
        const reputationScore = Math.min(100, Math.round(
          (farmer.verified ? 25 : 0) +
          Math.min(farmerListings.length * 8, 30) +
          Math.min(completedOrders * 10, 35) +
          (latitude && longitude ? 10 : 0)
        ));

        return {
          ...farmer,
          id,
          latitude,
          longitude,
          activeListings: farmerListings.filter((listing) => listing.status === 'active').length,
          totalListings: farmerListings.length,
          completedOrders,
          reputationScore
        };
      });
  }, [users, listings, orders]);

  const filteredFarmers = farmers.filter((farmer) => {
    const haystack = `${farmer.name || ''} ${farmer.location || ''} ${farmer.phone || ''} ${farmer.email || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const mappedFarmers = filteredFarmers.filter((farmer) => farmer.latitude !== null && farmer.longitude !== null);

  const bounds = useMemo(() => {
    if (!mappedFarmers.length) {
      return { minLat: 11, maxLat: 19, minLng: 74, maxLng: 79 };
    }

    const lats = mappedFarmers.map((farmer) => farmer.latitude);
    const lngs = mappedFarmers.map((farmer) => farmer.longitude);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  }, [mappedFarmers]);

  const getMarkerStyle = (farmer) => {
    const latRange = bounds.maxLat - bounds.minLat || 1;
    const lngRange = bounds.maxLng - bounds.minLng || 1;
    const left = ((farmer.longitude - bounds.minLng) / lngRange) * 86 + 7;
    const top = 93 - (((farmer.latitude - bounds.minLat) / latRange) * 86 + 7);
    return {
      left: `${Math.max(5, Math.min(95, left))}%`,
      top: `${Math.max(5, Math.min(95, top))}%`
    };
  };

  return (
    <div className="farmer-mapping-page">
      <div className="page-header">
        <h1><MapPin size={32} /> Geo Tagged Farmer Mapping</h1>
        <p>Live farmer location map from signup coordinates, with listings, reputation, and contact details.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><h3>{farmers.length}</h3><p>Total Farmers</p></div>
        <div className="stat-card"><h3>{mappedFarmers.length}</h3><p>Geo Tagged</p></div>
        <div className="stat-card"><h3>{farmers.filter((farmer) => farmer.verified).length}</h3><p>Verified Farmers</p></div>
        <div className="stat-card"><h3>{farmers.reduce((sum, farmer) => sum + farmer.activeListings, 0)}</h3><p>Active Crop Listings</p></div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2><Navigation size={24} /> Live Farmer Map</h2>
          <div className="search-box farmer-map-search">
            <Search size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search farmer, phone, or location..."
            />
          </div>
        </div>

        <div className="geo-map-panel">
          {mappedFarmers.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>No geo-tagged farmers found. Farmers need to allow current location during signup.</p>
            </div>
          ) : (
            mappedFarmers.map((farmer) => (
              <a
                key={farmer.id}
                className={`farmer-map-marker ${farmer.verified ? 'verified' : ''}`}
                style={getMarkerStyle(farmer)}
                href={`https://www.google.com/maps?q=${farmer.latitude},${farmer.longitude}`}
                target="_blank"
                rel="noreferrer"
                title={`${farmer.name || 'Farmer'} - ${farmer.location || 'Location not set'}`}
              >
                <Sprout size={16} />
                <span>{farmer.name || 'Farmer'}</span>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="farmers-grid">
        {filteredFarmers.map((farmer) => (
          <div key={farmer.id} className="farmer-trust-card">
            <div className="farmer-header">
              <div className="farmer-avatar"><Sprout size={28} /></div>
              <div className="farmer-info">
                <h3>
                  {farmer.name || 'Unnamed Farmer'}
                  {farmer.verified && <CheckCircle size={18} color="#10b981" />}
                </h3>
                <p>{farmer.location || 'Location not provided'}</p>
              </div>
            </div>

            <div className="trust-score-container">
              <div className="trust-score-label">Reputation Score</div>
              <div className="trust-score-bar">
                <div className="trust-score-fill" style={{ width: `${farmer.reputationScore}%` }} />
              </div>
              <div className="trust-score-value">{farmer.reputationScore}/100</div>
            </div>

            <div className="farmer-stats">
              <div className="stat"><strong>{farmer.activeListings}</strong><span>Active Listings</span></div>
              <div className="stat"><strong>{farmer.completedOrders}</strong><span>Completed Orders</span></div>
              <div className="stat"><strong>{farmer.latitude && farmer.longitude ? 'Yes' : 'No'}</strong><span>Geo Tagged</span></div>
            </div>

            <div className="farmer-contact">
              {farmer.phone && <div className="contact-item"><Phone size={16} /><span>{farmer.phone}</span></div>}
              {farmer.email && <div className="contact-item"><Mail size={16} /><span>{farmer.email}</span></div>}
              {farmer.latitude !== null && farmer.longitude !== null && (
                <div className="contact-item"><MapPin size={16} /><span>{farmer.latitude}, {farmer.longitude}</span></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarmerMapping;
