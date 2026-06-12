import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MapPin, TrendingUp, Calendar, Users, Package, Loader } from 'lucide-react';
import { getMarketPrices } from '../services/marketPriceService';
import { getCurrentWeather } from '../services/weatherService';
import { getCollectionOnce } from '../services/firebaseService';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

const normalizeCrop = (crop) => (crop || 'Unknown').trim();

const getMonthKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const getDistrict = (location) => {
  if (!location) return 'Unknown';
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 2] || parts[parts.length - 1] || 'Unknown';
};

const Analytics = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [user?.uid]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [usersResult, listingsResult, ordersResult, activitiesResult] = await Promise.allSettled([
        getCollectionOnce('users'),
        getCollectionOnce('listings'),
        getCollectionOnce('orders'),
        getCollectionOnce('farmingActivities')
      ]);

      const users = usersResult.status === 'fulfilled' ? usersResult.value : [];
      const listings = listingsResult.status === 'fulfilled' ? listingsResult.value : [];
      const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
      const farmingActivities = activitiesResult.status === 'fulfilled' ? activitiesResult.value : [];

      if (usersResult.status === 'rejected') console.warn('Users read blocked (Firebase rules):', usersResult.reason);
      if (listingsResult.status === 'rejected') console.warn('Listings read failed:', listingsResult.reason);
      if (ordersResult.status === 'rejected') console.warn('Orders read failed:', ordersResult.reason);

      const farmers = users.filter((item) => item.role === 'farmer');
      const activeListings = listings.filter((item) => item.status === 'active');
      const completedOrders = orders.filter((item) => item.status === 'completed' || item.status === 'delivered');

      const cropTotals = activeListings.reduce((acc, listing) => {
        const crop = normalizeCrop(listing.crop);
        acc[crop] = (acc[crop] || 0) + Number(listing.quantity || 1);
        return acc;
      }, {});
      const totalCropQuantity = Object.values(cropTotals).reduce((sum, value) => sum + value, 0);
      const cropDistribution = Object.entries(cropTotals).map(([name, quantity], index) => ({
        name,
        value: totalCropQuantity ? Math.round((quantity / totalCropQuantity) * 100) : 0,
        quantity,
        farmers: new Set(activeListings.filter((listing) => normalizeCrop(listing.crop) === name).map((listing) => listing.userId)).size,
        color: COLORS[index % COLORS.length]
      }));

      const topCrops = cropDistribution.slice(0, 4).map((item) => item.name);
      const monthlyMap = {};
      activeListings.forEach((listing) => {
        const month = getMonthKey(listing.createdAt || listing.harvestDate);
        if (!month) return;
        monthlyMap[month] = monthlyMap[month] || { month };
        const crop = normalizeCrop(listing.crop);
        monthlyMap[month][crop] = (monthlyMap[month][crop] || 0) + Number(listing.quantity || 1);
      });
      const seasonalTrends = Object.values(monthlyMap);

      const farmerById = users.reduce((acc, item) => {
        acc[item.id || item.uid] = item;
        return acc;
      }, {});
      const regionalMap = {};
      farmers.forEach((farmer) => {
        const district = getDistrict(farmer.location);
        regionalMap[district] = regionalMap[district] || { district, farmers: 0, listings: 0 };
        regionalMap[district].farmers += 1;
      });
      activeListings.forEach((listing) => {
        const farmer = farmerById[listing.userId];
        const district = getDistrict(farmer?.location || listing.location);
        regionalMap[district] = regionalMap[district] || { district, farmers: 0, listings: 0 };
        regionalMap[district].listings += 1;
      });
      const regionalStats = Object.values(regionalMap);

      const today = new Date();
      const harvestPredictions = activeListings
        .filter((listing) => listing.harvestDate && new Date(listing.harvestDate) >= today)
        .sort((a, b) => new Date(a.harvestDate) - new Date(b.harvestDate))
        .slice(0, 10)
        .map((listing) => ({
          crop: normalizeCrop(listing.crop),
          expectedYield: `${listing.quantity || 0} ${listing.unit || ''}`.trim(),
          readyDate: new Date(listing.harvestDate).toLocaleDateString(),
          volume: Number(listing.quantity || 0)
        }));

      const priceTrends = await Promise.all(
        topCrops.map(async (crop) => {
          try {
            const data = await getMarketPrices(crop, 'Karnataka');
            return {
              crop,
              current: data?.current,
              yesterday: data?.yesterday,
              weekAgo: data?.weekAgo,
              trend: data?.trend,
              hasData: Boolean(data?.current)
            };
          } catch (error) {
            console.error('Market data error:', error);
            return { crop, hasData: false };
          }
        })
      );

      let weather = null;
      const latitude = Number(user?.latitude || farmers.find((farmer) => farmer.latitude)?.latitude);
      const longitude = Number(user?.longitude || farmers.find((farmer) => farmer.longitude)?.longitude);
      if (latitude && longitude) {
        try {
          weather = await getCurrentWeather(latitude, longitude);
        } catch (error) {
          console.error('Weather data error:', error);
        }
      }

      setAnalyticsData({
        cropDistribution,
        seasonalTrends,
        priceTrends: priceTrends.filter((item) => item.hasData),
        regionalStats,
        harvestPredictions,
        topCrops,
        weather,
        totalFarmers: farmers.length,
        totalArea: farmingActivities.reduce((sum, item) => sum + Number(item.area || 0), 0),
        totalProduction: completedOrders.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>{t('loadingAnalytics')}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-page">
        <div className="error-message">{t('unableToLoad')}</div>
      </div>
    );
  }

  const {
    cropDistribution,
    seasonalTrends,
    priceTrends,
    regionalStats,
    harvestPredictions,
    topCrops,
    weather,
    totalFarmers,
    totalArea,
    totalProduction
  } = analyticsData;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>{t('analytics')}</h1>
        <p>Real-time analytics from Firebase, weather, and market APIs</p>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <Users size={32} color="#10b981" />
          <div>
            <h3>{totalFarmers.toLocaleString('en-IN')}</h3>
            <p>{t('totalFarmers')}</p>
          </div>
        </div>
        <div className="summary-card">
          <MapPin size={32} color="#3b82f6" />
          <div>
            <h3>{totalArea.toLocaleString('en-IN')} acres</h3>
            <p>Cultivated Area from Activities</p>
          </div>
        </div>
        <div className="summary-card">
          <Package size={32} color="#f59e0b" />
          <div>
            <h3>{totalProduction.toLocaleString('en-IN')}</h3>
            <p>Delivered Quantity</p>
          </div>
        </div>
        <div className="summary-card">
          <TrendingUp size={32} color="#8b5cf6" />
          <div>
            <h3>{weather?.temperature ? `${weather.temperature}C` : '--'}</h3>
            <p>{t('currentTemperature')}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Crop Distribution from Active Listings</h3>
          {cropDistribution.length ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cropDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cropDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="crop-legend">
                {cropDistribution.map((crop) => (
                  <div key={crop.name} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: crop.color }} />
                    <span>{crop.name}: {crop.quantity} listed ({crop.farmers} {t('farmers')})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">No active listing data found</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Seasonal Listing Trends</h3>
          {seasonalTrends.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {topCrops.map((crop, index) => (
                  <Line key={crop} type="monotone" dataKey={crop} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No seasonal listing data found</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Regional Farmer Distribution</h3>
          {regionalStats.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="farmers" fill="#10b981" />
                <Bar dataKey="listings" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No regional farmer data found</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Live Market Price Analysis</h3>
          {priceTrends.length ? (
            <div className="price-trends">
              {priceTrends.map((price) => (
                <div key={price.crop} className="price-trend-item">
                  <div className="price-header">
                    <h4>{price.crop}</h4>
                    <span className={`trend-badge ${price.trend || ''}`}>
                      {price.trend || 'live'}
                    </span>
                  </div>
                  <div className="price-values">
                    <div>
                      <span className="label">{t('current')}</span>
                      <span className="value">Rs.{price.current}</span>
                    </div>
                    <div>
                      <span className="label">{t('yesterday')}</span>
                      <span className="value">Rs.{price.yesterday}</span>
                    </div>
                    <div>
                      <span className="label">{t('weekAgo')}</span>
                      <span className="value">Rs.{price.weekAgo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No live market price data found for listed crops</div>
          )}
        </div>
      </div>

      <div className="harvest-predictions">
        <h3><Calendar size={24} /> Upcoming Harvests from Listings</h3>
        {harvestPredictions.length ? (
          <table className="predictions-table">
            <thead>
              <tr>
                <th>{t('crop')}</th>
                <th>Listed Quantity</th>
                <th>{t('readyDate')}</th>
                <th>{t('estimatedVolume')}</th>
              </tr>
            </thead>
            <tbody>
              {harvestPredictions.map((harvest, index) => (
                <tr key={`${harvest.crop}-${index}`}>
                  <td><strong>{harvest.crop}</strong></td>
                  <td>{harvest.expectedYield}</td>
                  <td>{harvest.readyDate}</td>
                  <td>{harvest.volume.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No upcoming harvest listings found</div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
