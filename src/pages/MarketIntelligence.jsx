import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Truck, MapPin, Loader, Lightbulb, Calendar, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { getAvailableMarketStates, getMarketLocations, getMarketPrices, predictPrices } from '../services/marketPriceService';
import { getListings, getTransporters } from '../services/firebaseService';

const MarketIntelligence = () => {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandi, setSelectedMandi] = useState('');
  const [cropOptions, setCropOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [marketsByDistrict, setMarketsByDistrict] = useState({});
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPriceData, setCurrentPriceData] = useState(null);
  const [pricePredictions, setPricePredictions] = useState([]);
  const [quantity, setQuantity] = useState(50);
  const [distance, setDistance] = useState(100);

  useEffect(() => {
    const unsubscribeListings = getListings((listings) => {
      const crops = [...new Set(listings.map((listing) => listing.crop).filter(Boolean))];
      setCropOptions(crops);
      if (!selectedCrop && crops.length) {
        setSelectedCrop(crops[0]);
      }
    });

    const unsubscribeTransporters = getTransporters((items) => {
      setTransporters(items.filter((item) => item.status !== 'inactive'));
    });

    return () => {
      unsubscribeListings();
      unsubscribeTransporters();
    };
  }, []);

  useEffect(() => {
    const loadStateOptions = async () => {
      if (!selectedCrop) {
        setStateOptions([]);
        setSelectedState('');
        return;
      }

      const states = await getAvailableMarketStates(selectedCrop);
      setStateOptions(states);

      if (!states.length) {
        setSelectedState('');
        setSelectedDistrict('');
        setSelectedMandi('');
        return;
      }

      setSelectedState((currentState) => (
        states.includes(currentState) ? currentState : states[0]
      ));
      setSelectedDistrict('');
      setSelectedMandi('');
    };

    loadStateOptions();
  }, [selectedCrop]);

  useEffect(() => {
    const loadLocationOptions = async () => {
      if (!selectedCrop || !selectedState) {
        setDistrictOptions([]);
        setMarketsByDistrict({});
        return;
      }

      const locations = await getMarketLocations(selectedCrop, selectedState);
      const districts = Array.isArray(locations?.districts) ? locations.districts : [];
      const markets = locations?.marketsByDistrict && typeof locations.marketsByDistrict === 'object'
        ? locations.marketsByDistrict
        : {};

      setDistrictOptions(districts);
      setMarketsByDistrict(markets);

      if (selectedDistrict && !districts.includes(selectedDistrict)) {
        setSelectedDistrict('');
        setSelectedMandi('');
      } else if (selectedDistrict) {
        const mandis = markets[selectedDistrict] || [];
        if (selectedMandi && !mandis.includes(selectedMandi)) {
          setSelectedMandi('');
        }
      }
    };

    loadLocationOptions();
  }, [selectedCrop, selectedState]);

  useEffect(() => {
    if (!selectedCrop || !selectedState) {
      setLoading(false);
      setCurrentPriceData(null);
      setPricePredictions([]);
      return;
    }

    loadMarketData();
  }, [selectedCrop, selectedState, selectedDistrict, selectedMandi]);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      const locationFilters = {
        district: selectedDistrict,
        market: selectedMandi
      };
      const prices = await getMarketPrices(selectedCrop, selectedState, locationFilters);
      const predictions = await predictPrices(selectedCrop, 14, selectedState, prices?.date, prices?.current, locationFilters);
      setCurrentPriceData(prices);
      setPricePredictions(predictions);
    } catch (error) {
      console.error('Error loading market data:', error);
      setCurrentPriceData(null);
      setPricePredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const averageTransportRate = (() => {
    const rates = transporters.map((item) => Number(item.pricePerKm)).filter(Boolean);
    if (!rates.length) return null;
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  })();

  const transportCost = averageTransportRate
    ? {
        totalCost: distance * averageTransportRate,
        costPerQuintal: quantity > 0 ? (distance * averageTransportRate) / quantity : 0
      }
    : null;
  const priceDateLabel = currentPriceData?.freshness === 'today' ? 'Today' : 'Latest available';
  const mandiOptions = selectedDistrict ? (marketsByDistrict[selectedDistrict] || []) : [];
  const marketScopeLabel = selectedMandi
    ? selectedMandi
    : selectedDistrict
      ? `${selectedDistrict} District Markets`
      : selectedState
        ? `${selectedState} State Markets`
        : 'Selected State Markets';

  const sellingWindowAdvice = (() => {
    if (!pricePredictions.length || !currentPriceData?.current) return null;
    const current = Number(currentPriceData.current);
    const prices = pricePredictions.map((p) => Number(p.predicted));
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const peakIndex = prices.indexOf(max);
    const peakDay = pricePredictions[peakIndex]?.day || `Day ${peakIndex + 1}`;
    const pctVsCurrent = (((max - current) / current) * 100).toFixed(1);
    const trend = prices[prices.length - 1] > prices[0] ? 'rising' : prices[prices.length - 1] < prices[0] ? 'falling' : 'stable';
    const daysAboveAvg = prices.filter((p) => p > avg).length;

    let advice, urgency;
    if (max <= current) {
      advice = 'Prices are expected to decline. Sell now to get the best value.';
      urgency = 'sell-now';
    } else if (peakIndex <= 3) {
      advice = `Peak price expected within ${peakIndex + 1} day(s). Sell soon for maximum returns.`;
      urgency = 'sell-soon';
    } else {
      advice = `Hold until ${peakDay} for the best price — ${pctVsCurrent}% higher than today.`;
      urgency = 'hold';
    }

    return { advice, urgency, peakDay, peakPrice: max, pctVsCurrent, trend, daysAboveAvg, avg: avg.toFixed(0) };
  })();

  if (loading) {
    return (
      <div className="market-intelligence-page">
        <div className="loading" style={{ textAlign: 'center', padding: '60px' }}>
          <Loader size={48} className="spinner" />
          <p>Loading market intelligence data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-intelligence-page">
      <div className="page-header">
        <h1>
          <TrendingUp size={32} />
          Market & Price Intelligence
        </h1>
        <p>Today's mandi prices first, latest available AGMARKNET data when today is not published</p>
      </div>

      <div className="crop-selector-section">
        <div className="selector-container">
          <div className="selector-field">
            <label>Select Crop:</label>
            <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
              {cropOptions.length ? (
                cropOptions.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))
              ) : (
                <option value="">No listed crops found</option>
              )}
            </select>
          </div>
          <div className="selector-field">
            <label>Select State:</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('');
                setSelectedMandi('');
              }}
              disabled={!stateOptions.length}
            >
              {stateOptions.length ? (
                stateOptions.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))
              ) : (
                <option value="">No current states found</option>
              )}
            </select>
          </div>
          <div className="selector-field">
            <label>Select District:</label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedMandi('');
              }}
              disabled={!selectedState}
            >
              <option value="">All {selectedState || 'State'}</option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
          <div className="selector-field">
            <label>Select Mandi:</label>
            <select
              value={selectedMandi}
              onChange={(e) => setSelectedMandi(e.target.value)}
              disabled={!selectedDistrict}
            >
              <option value="">All Mandis</option>
              {mandiOptions.map((mandi) => (
                <option key={mandi} value={mandi}>{mandi}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {currentPriceData?.markets?.length ? (
        <div className="section-card">
          <div className="section-header">
            <h2>
              <DollarSign size={24} />
              {currentPriceData.freshness === 'today' ? 'Today\'s Mandi Prices' : 'Latest Available Mandi Prices'}
            </h2>
            {currentPriceData.trend ? (
              <div className={`price-trend ${currentPriceData.trend}`}>
                <TrendingUp size={20} />
                <span>{currentPriceData.trend}</span>
              </div>
            ) : null}
          </div>

          <div className="current-price-card">
            <div className="price-main">
              <h3>{currentPriceData.freshness === 'today' ? 'Current Average Price' : 'Latest Average Price'}</h3>
              <div className="location-badge">
                <MapPin size={16} />
                <span>{marketScopeLabel} - {priceDateLabel}: {currentPriceData.date}</span>
              </div>
              <div className="price-display">
                <span className="price-amount">Rs.{currentPriceData.current}</span>
                <span className="price-unit">per quintal</span>
              </div>
            </div>
          </div>

          <div className="markets-grid">
            {currentPriceData.markets.map((market, index) => (
              <div key={`${market.name}-${index}`} className="market-card">
                <h4>{market.name}</h4>
                {market.district ? <span className="market-updated">{market.district}</span> : null}
                <div className="market-price">Rs.{market.price}</div>
                <span className="market-updated">Updated {market.updated}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="section-card">
          <h2>No mandi price records found</h2>
          <p>AGMARKNET has not published today or latest available records for {selectedCrop || 'this crop'} in {marketScopeLabel} yet.</p>
        </div>
      )}

      {currentPriceData?.markets?.length > 0 && pricePredictions.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2>
              <TrendingUp size={24} />
              Next 14 Days Price Prediction
            </h2>
            <p>Forecast starts after {currentPriceData.date} using real AGMARKNET price history</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={pricePredictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Predicted Price"
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sellingWindowAdvice && (
        <div className="section-card selling-window-card">
          <div className="section-header">
            <h2>
              <Lightbulb size={24} />
              AI Optimal Selling Window
            </h2>
          </div>
          <div className="selling-window-body">
            <div className={`selling-advice-banner urgency-${sellingWindowAdvice.urgency}`}>
              <div className="advice-icon">
                {sellingWindowAdvice.urgency === 'sell-now' && <ArrowDown size={28} />}
                {sellingWindowAdvice.urgency === 'sell-soon' && <ArrowUp size={28} />}
                {sellingWindowAdvice.urgency === 'hold' && <Calendar size={28} />}
              </div>
              <div className="advice-content">
                <h3>
                  {sellingWindowAdvice.urgency === 'sell-now' && 'Sell Now'}
                  {sellingWindowAdvice.urgency === 'sell-soon' && 'Sell Soon'}
                  {sellingWindowAdvice.urgency === 'hold' && 'Hold & Wait'}
                </h3>
                <p>{sellingWindowAdvice.advice}</p>
              </div>
            </div>
            <div className="selling-window-stats">
              <div className="sw-stat">
                <span className="sw-label">Peak Price Day</span>
                <span className="sw-value">{sellingWindowAdvice.peakDay}</span>
              </div>
              <div className="sw-stat">
                <span className="sw-label">Expected Peak</span>
                <span className="sw-value">Rs.{sellingWindowAdvice.peakPrice.toFixed(0)}</span>
              </div>
              <div className="sw-stat">
                <span className="sw-label">vs Today</span>
                <span className={`sw-value ${Number(sellingWindowAdvice.pctVsCurrent) >= 0 ? 'positive' : 'negative'}`}>
                  {Number(sellingWindowAdvice.pctVsCurrent) >= 0 ? '+' : ''}{sellingWindowAdvice.pctVsCurrent}%
                </span>
              </div>
              <div className="sw-stat">
                <span className="sw-label">14-Day Avg</span>
                <span className="sw-value">Rs.{sellingWindowAdvice.avg}</span>
              </div>
              <div className="sw-stat">
                <span className="sw-label">Price Trend</span>
                <span className={`sw-value trend-${sellingWindowAdvice.trend}`}>
                  {sellingWindowAdvice.trend === 'rising' && <ArrowUp size={14} />}
                  {sellingWindowAdvice.trend === 'falling' && <ArrowDown size={14} />}
                  {sellingWindowAdvice.trend === 'stable' && <Minus size={14} />}
                  {sellingWindowAdvice.trend}
                </span>
              </div>
              <div className="sw-stat">
                <span className="sw-label">Days Above Avg</span>
                <span className="sw-value">{sellingWindowAdvice.daysAboveAvg} / 14</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section-card">
        <div className="section-header">
          <h2>
            <Truck size={24} />
            Transport Cost Calculator
          </h2>
        </div>
        <div className="calculator-container">
          <div className="calculator-inputs">
            <div className="input-group">
              <label>Quantity (quintals)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="input-group">
              <label>Distance to Mandi (km)</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>
          <div className="calculator-results">
            {transportCost ? (
              <>
                <div className="result-card">
                  <h4>Total Transport Cost</h4>
                  <p className="result-value">Rs.{transportCost.totalCost.toFixed(2)}</p>
                </div>
                <div className="result-card">
                  <h4>Cost Per Quintal</h4>
                  <p className="result-value">Rs.{transportCost.costPerQuintal.toFixed(2)}</p>
                </div>
                {currentPriceData?.current ? (
                  <div className="result-card comparison">
                    <h4>Net Price Calculation</h4>
                    <div className="comparison-details">
                      <div>
                        <span>Market Price:</span>
                        <strong>Rs.{currentPriceData.current}</strong>
                      </div>
                      <div>
                        <span>Less Transport:</span>
                        <strong>Rs.{transportCost.costPerQuintal.toFixed(2)}</strong>
                      </div>
                      <div className="savings">
                        Net Earnings: Rs.{(currentPriceData.current - transportCost.costPerQuintal).toFixed(2)} per quintal
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="empty-state">Add transporters with pricePerKm in Firebase to calculate transport cost.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;
