import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Cloud, CloudRain, Sun, Wind, Droplets,
  Sprout, AlertTriangle, Calendar, MapPin, TrendingUp, Loader, Bug, ShieldAlert
} from 'lucide-react';
import { getCurrentWeather, getWeatherForecast } from '../services/weatherService';
import { getSoilHealthData, getCropRecommendations, getFertilizerSchedule } from '../services/soilHealthService';

// ── Pest & Disease Knowledge Base ──────────────────────────────────────────
const PEST_DISEASE_DB = {
  Rice: [
    { name: 'Brown Plant Hopper', kannadaName: 'ಕಂದು ಸಸ್ಯ ಹಾಪ್ಪರ್', type: 'pest',
      riskWhen: (w) => w.humidity > 70 && w.temperature > 25,
      symptoms: 'Yellowing & drying of plants from base (hopper burn), sticky honeydew on leaves.',
      kannadaSymptoms: 'ಕೆಳಗಿನಿಂದ ಹಳದಿ ಮತ್ತು ಒಣಗುವಿಕೆ, ಎಲೆಗಳ ಮೇಲೆ ಅಂಟಾದ ಹನಿ.',
      prevention: ['Use resistant varieties (IR-64, Jyothi)', 'Avoid excess nitrogen fertilizer', 'Maintain 5 cm water depth'],
      treatment: ['Spray Imidacloprid 17.8 SL @ 0.3 ml/L water', 'Drain water for 4 days', 'Apply Chlorpyrifos 20 EC @ 2.5 ml/L'],
      severity: 'high' },
    { name: 'Blast Disease', kannadaName: 'ಸ್ಫೋಟ ರೋಗ', type: 'disease',
      riskWhen: (w) => w.humidity > 80 && w.temperature >= 20 && w.temperature <= 28,
      symptoms: 'Diamond-shaped grey lesions with brown border on leaves and neck.',
      kannadaSymptoms: 'ಎಲೆ ಮತ್ತು ಕತ್ತಿನ ಮೇಲೆ ವಜ್ರಾಕಾರದ ಬೂದು ಗಾಯ.',
      prevention: ['Use certified disease-free seeds', 'Balanced NPK application', 'Avoid late evening irrigation'],
      treatment: ['Spray Tricyclazole 75 WP @ 0.6 g/L', 'Apply Carbendazim 50 WP @ 1 g/L', 'Remove and destroy infected plants'],
      severity: 'high' },
    { name: 'Stem Borer', kannadaName: 'ಕಾಂಡ ಕೊರಕ', type: 'pest',
      riskWhen: (w) => w.temperature > 28,
      symptoms: 'Dead heart at vegetative stage; white ear at heading stage.',
      kannadaSymptoms: 'ಸಸ್ಯ ಹಂತದಲ್ಲಿ ಒಣಗಿದ ತಿರುಳು; ತಲೆ ಹಂತದಲ್ಲಿ ಬಿಳಿ ತೆನೆ.',
      prevention: ['Destroy stubble after harvest', 'Use light traps', 'Timely planting'],
      treatment: ['Apply Chlorantraniliprole 18.5 SC @ 0.3 ml/L', 'Use Carbofuran 3 G @ 25 kg/ha'],
      severity: 'medium' },
    { name: 'Sheath Blight', kannadaName: 'ಶೀತ್ ಬ್ಲೈಟ್', type: 'disease',
      riskWhen: (w) => w.humidity > 85 && w.temperature > 30,
      symptoms: 'Oval/irregular greenish-grey lesions on leaf sheaths near water level.',
      kannadaSymptoms: 'ನೀರಿನ ಮಟ್ಟದ ಬಳಿ ಎಲೆ ಹೊದಿಕೆಯ ಮೇಲೆ ಹಸಿರು-ಬೂದು ಗಾಯ.',
      prevention: ['Maintain proper spacing', 'Reduce nitrogen dose', 'Drain water periodically'],
      treatment: ['Spray Hexaconazole 5 EC @ 2 ml/L', 'Apply Validamycin 3 SL @ 2 ml/L'],
      severity: 'medium' }
  ],
  Tomato: [
    { name: 'Early Blight', kannadaName: 'ಆರಂಭಿಕ ರೋಗ', type: 'disease',
      riskWhen: (w) => w.humidity > 65 && w.temperature >= 24 && w.temperature <= 29,
      symptoms: 'Dark brown circular spots with concentric rings (target-board pattern) on older leaves.',
      kannadaSymptoms: 'ಹಳೆಯ ಎಲೆಗಳ ಮೇಲೆ ಕೇಂದ್ರೀಕೃತ ಉಂಗುರಗಳೊಂದಿಗೆ ಕಂದು ಚುಕ್ಕೆ.',
      prevention: ['Use resistant varieties', 'Crop rotation with non-solanaceous crops', 'Remove infected leaves'],
      treatment: ['Spray Mancozeb 75 WP @ 2.5 g/L', 'Apply Chlorothalonil 75 WP @ 2 g/L', 'Spray copper oxychloride @ 3 g/L'],
      severity: 'high' },
    { name: 'Fruit Borer', kannadaName: 'ಹಣ್ಣು ಕೊರಕ', type: 'pest',
      riskWhen: (w) => w.temperature > 25,
      symptoms: 'Bore holes on fruits filled with frass; premature fruit drop.',
      kannadaSymptoms: 'ಹಣ್ಣಿನ ಮೇಲೆ ರಂಧ್ರ; ಅಕಾಲದ ಹಣ್ಣು ಉದುರುವಿಕೆ.',
      prevention: ['Install pheromone traps (5/acre)', 'Remove and destroy infested fruits', 'Intercrop with coriander'],
      treatment: ['Spray Spinosad 45 SC @ 0.3 ml/L', 'Apply Emamectin Benzoate 5 SG @ 0.4 g/L'],
      severity: 'high' },
    { name: 'Leaf Curl Virus', kannadaName: 'ಎಲೆ ಮುದುರು ವೈರಸ್', type: 'disease',
      riskWhen: (w) => w.temperature > 30 && w.humidity < 50,
      symptoms: 'Upward curling of leaves, yellowing, stunted growth, flower drop.',
      kannadaSymptoms: 'ಎಲೆ ಮೇಲ್ಮುಖ ಮಡಿಕೆ, ಹಳದಿ, ಕುಂಠಿತ ಬೆಳವಣಿಗೆ.',
      prevention: ['Use virus-free certified seedlings', 'Control whitefly vector with yellow sticky traps', 'Remove infected plants immediately'],
      treatment: ['Spray Imidacloprid 17.8 SL @ 0.5 ml/L for whitefly control', 'No cure for virus — remove plant'],
      severity: 'high' },
    { name: 'Damping Off', kannadaName: 'ಮೊಳಕೆ ಕೊಳೆ', type: 'disease',
      riskWhen: (w) => w.humidity > 80 && w.rainfall > 5,
      symptoms: 'Seedlings collapse at soil level; brown-black water-soaked lesion at stem base.',
      kannadaSymptoms: 'ಮಣ್ಣಿನ ಮಟ್ಟದಲ್ಲಿ ಸಸಿ ಕುಸಿತ; ಕಾಂಡದ ತಳದಲ್ಲಿ ಕಂದು ಗಾಯ.',
      prevention: ['Use raised nursery beds', 'Treat seeds with Trichoderma viride @ 4 g/kg', 'Avoid waterlogging'],
      treatment: ['Drench with Copper oxychloride 50 WP @ 3 g/L', 'Apply Metalaxyl + Mancozeb @ 2.5 g/L'],
      severity: 'medium' }
  ],
  Cotton: [
    { name: 'Bollworm', kannadaName: 'ಬೋಲ್ ಹುಳ', type: 'pest',
      riskWhen: (w) => w.temperature > 28 && w.humidity > 60,
      symptoms: 'Entry holes in bolls, frass at holes, shed squares and young bolls.',
      kannadaSymptoms: 'ಬೊಲ್ಲಿನಲ್ಲಿ ರಂಧ್ರ, ಚೌಕ ಮತ್ತು ಎಳೆಯ ಬೊಲ್ ಉದುರುವಿಕೆ.',
      prevention: ['Plant Bt cotton varieties', 'Install pheromone traps', 'Grow trap crops (African marigold)'],
      treatment: ['Spray Indoxacarb 14.5 SC @ 1 ml/L', 'Apply Profenofos 50 EC @ 2 ml/L', 'Use Neem oil 2%'],
      severity: 'high' },
    { name: 'Leaf Curl Disease', kannadaName: 'ಎಲೆ ಮುದುರು ರೋಗ', type: 'disease',
      riskWhen: (w) => w.temperature > 32,
      symptoms: 'Thickening and upward curling of leaves, dark green color, stunted growth.',
      kannadaSymptoms: 'ಎಲೆ ದಪ್ಪ ಮತ್ತು ಮೇಲ್ಮುಖ ಮಡಿಕೆ, ಗಾಢ ಹಸಿರು, ಕುಂಠಿತ ಬೆಳವಣಿಗೆ.',
      prevention: ['Use tolerant varieties', 'Uproot and destroy infected plants', 'Control whitefly vector'],
      treatment: ['Spray Acetamiprid 20 SP @ 0.2 g/L for whitefly', 'Remove and bury infected plants'],
      severity: 'high' },
    { name: 'Aphids', kannadaName: 'ಜಿಗಣೆ', type: 'pest',
      riskWhen: (w) => w.humidity < 60 && w.temperature > 25,
      symptoms: 'Curling of tender leaves, sooty mold on honeydew, stunted plant growth.',
      kannadaSymptoms: 'ಎಳೆಯ ಎಲೆ ಮಡಿಕೆ, ಕಪ್ಪು ಶಿಲೀಂಧ್ರ, ಕುಂಠಿತ ಬೆಳವಣಿಗೆ.',
      prevention: ['Conserve natural enemies (ladybird beetles)', 'Avoid excessive nitrogen', 'Monitor regularly'],
      treatment: ['Spray Dimethoate 30 EC @ 1.5 ml/L', 'Apply Thiamethoxam 25 WG @ 0.2 g/L', 'Use Neem oil 2%'],
      severity: 'medium' }
  ],
  Maize: [
    { name: 'Fall Armyworm', kannadaName: 'ಫಾಲ್ ಆರ್ಮಿ ವರ್ಮ್', type: 'pest',
      riskWhen: (w) => w.temperature > 25 && w.humidity > 60,
      symptoms: 'Scraped leaves, window-pane feeding, frass in whorls, irregular holes on leaves.',
      kannadaSymptoms: 'ಎಲೆ ತುರಿಕೆ, ಗೊಂಚಲಿನಲ್ಲಿ ಮಲ, ಎಲೆಗಳ ಮೇಲೆ ಅನಿಯಮಿತ ರಂಧ್ರ.',
      prevention: ['Early planting', 'Apply sand+lime in whorls', 'Use pheromone traps'],
      treatment: ['Spray Emamectin Benzoate 5 SG @ 0.4 g/L', 'Apply Chlorantraniliprole 18.5 SC @ 0.4 ml/L'],
      severity: 'high' },
    { name: 'Downy Mildew', kannadaName: 'ಡೌನಿ ಮಿಲ್ಡ್ಯೂ', type: 'disease',
      riskWhen: (w) => w.humidity > 80 && w.temperature >= 18 && w.temperature <= 26,
      symptoms: 'Chlorotic streaks on leaves, white powdery growth on underside, stunted plants.',
      kannadaSymptoms: 'ಎಲೆಯ ಕೆಳಭಾಗದಲ್ಲಿ ಬಿಳಿ ಪೌಡರ್ ಬೆಳವಣಿಗೆ, ಕ್ಲೋರೊಟಿಕ್ ಪಟ್ಟೆಗಳು.',
      prevention: ['Use certified seed treated with Metalaxyl', 'Remove infected plants', 'Crop rotation'],
      treatment: ['Spray Metalaxyl + Mancozeb 72 WP @ 2.5 g/L', 'Apply Dimethomorph 50 WP @ 1 g/L'],
      severity: 'medium' }
  ],
  Sugarcane: [
    { name: 'Top Borer', kannadaName: 'ತುದಿ ಕೊರಕ', type: 'pest',
      riskWhen: (w) => w.temperature > 30 && w.humidity > 70,
      symptoms: 'Dead heart in young shoots, withering of central leaf, frass in tunnel.',
      kannadaSymptoms: 'ಎಳೆ ಚಿಗುರಿನಲ್ಲಿ ಒಣ ತಿರುಳು, ಮಧ್ಯ ಎಲೆ ಬಾಡುವಿಕೆ.',
      prevention: ['Remove and destroy dry leaves', 'Use Trichogramma chilonis egg parasitoid @ 50,000/ha', 'Trash mulching'],
      treatment: ['Apply Chlorpyrifos 10 G @ 25 kg/ha in whorls', 'Spray Monocrotophos 36 SL @ 1.5 ml/L'],
      severity: 'high' },
    { name: 'Red Rot', kannadaName: 'ಕೆಂಪು ಕೊಳೆ', type: 'disease',
      riskWhen: (w) => w.rainfall > 10 && w.humidity > 80,
      symptoms: 'Red discolouration of internal tissue with white patches, sour smell from stalks.',
      kannadaSymptoms: 'ಕಾಂಡದ ಒಳಭಾಗ ಕೆಂಪು ಬಣ್ಣ, ಹೆಣ್ಣುಮಗಳ ವಾಸನೆ.',
      prevention: ['Use disease-free setts from certified nurseries', 'Treat setts with Carbendazim @ 1 g/L', 'Avoid waterlogging'],
      treatment: ['Remove and destroy infected plants', 'Drench soil with Carbendazim 50 WP @ 2 g/L', 'No chemical cure — remove plants'],
      severity: 'high' }
  ],
  Groundnut: [
    { name: 'Tikka Disease (Leaf Spot)', kannadaName: 'ಟಿಕ್ಕ ರೋಗ', type: 'disease',
      riskWhen: (w) => w.humidity > 70 && w.temperature >= 25 && w.temperature <= 30,
      symptoms: 'Circular brown spots with yellow halo on leaves; defoliation in severe cases.',
      kannadaSymptoms: 'ಎಲೆಯ ಮೇಲೆ ಹಳದಿ ಕಿರೀಟದ ಕಂದು ಚುಕ್ಕೆ, ತೀವ್ರತರದ ಎಲೆ ಉದುರುವಿಕೆ.',
      prevention: ['Use resistant varieties', 'Treat seeds with Thiram @ 3 g/kg', 'Crop rotation'],
      treatment: ['Spray Chlorothalonil 75 WP @ 2 g/L', 'Apply Mancozeb 75 WP @ 2.5 g/L every 10 days'],
      severity: 'medium' },
    { name: 'White Grub', kannadaName: 'ಬಿಳಿ ಹುಳ', type: 'pest',
      riskWhen: (w) => w.rainfall > 15,
      symptoms: 'Wilting of plants, feeding on roots and pods underground.',
      kannadaSymptoms: 'ಸಸ್ಯ ಬಾಡುವಿಕೆ, ಭೂಗತ ಬೇರು ಮತ್ತು ಕಾಯಿ ತಿನ್ನುವಿಕೆ.',
      prevention: ['Deep summer ploughing to expose pupae', 'Apply Chlorpyrifos 10 G @ 25 kg/ha at sowing', 'Collect adults during mating flight'],
      treatment: ['Drench with Chlorpyrifos 20 EC @ 2.5 ml/L', 'Apply Phorate 10 G @ 10 kg/ha'],
      severity: 'high' }
  ]
};

const CROP_LIST = Object.keys(PEST_DISEASE_DB);

const getRiskLevel = (pest, weather) => {
  if (!weather) return 'unknown';
  return pest.riskWhen(weather) ? (pest.severity === 'high' ? 'high' : 'medium') : 'low';
};

const RISK_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#10b981', unknown: '#94a3b8' };
const RISK_BG    = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4', unknown: '#f8fafc' };

const CropPlanning = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [soilData, setSoilData] = useState(null);
  const [cropRecommendations, setCropRecommendations] = useState([]);
  const [fertilizerSchedule, setFertilizerSchedule] = useState([]);
  const [selectedPestCrop, setSelectedPestCrop] = useState(CROP_LIST[0]);
  const [pestFilter, setPestFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Use user's saved coordinates, or default to Bengaluru, Karnataka
      const location = user?.latitude && user?.longitude
        ? { lat: Number(user.latitude), lon: Number(user.longitude) }
        : { lat: 12.9716, lon: 77.5946 };

      const [weather, forecastData, soil] = await Promise.allSettled([
        getCurrentWeather(location.lat, location.lon),
        getWeatherForecast(location.lat, location.lon),
        getSoilHealthData(user?.uid, location)
      ]);

      const weatherResult = weather.status === 'fulfilled' ? weather.value : null;
      const forecastResult = forecastData.status === 'fulfilled' ? forecastData.value : [];
      const soilResult = soil.status === 'fulfilled' ? soil.value : null;

      setWeatherData(weatherResult);
      setForecast(forecastResult);
      setSoilData(soilResult);

      const recommendations = soilResult ? getCropRecommendations(soilResult, weatherResult) : [];
      setCropRecommendations(recommendations);

      const schedule = getFertilizerSchedule(
        recommendations[0]?.name || '',
        soilResult
      );
      setFertilizerSchedule(schedule);

    } catch (error) {
      console.error('Error loading planning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain size={64} />;
    if (cond.includes('cloud')) return <Cloud size={64} />;
    return <Sun size={64} />;
  };

  if (loading) {
    return (
      <div className="crop-planning-page">
        <div className="loading" style={{ textAlign: 'center', padding: '60px' }}>
          <Loader size={48} className="spinner" />
          <p>Loading crop planning data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crop-planning-page">
      <div className="page-header">
        <h1>{t('cropPlanning')}</h1>
        <p>AI-powered insights for better crop management</p>
      </div>

      {/* Weather Dashboard */}
      {weatherData && (
        <div className="weather-section">
          <div className="weather-card">
            <div className="weather-header">
              <h2>
                <Cloud size={24} />
                Current Weather
              </h2>
              <div className="location">
                <MapPin size={16} />
                <span>{weatherData.location}</span>
              </div>
            </div>
            <div className="weather-content">
              <div className="current-weather">
                <div className="temp-display">
                  {getWeatherIcon(weatherData.condition)}
                  <span className="temp">{weatherData.temperature}°C</span>
                </div>
                <p className="condition">{weatherData.description}</p>
              </div>
              <div className="weather-stats">
                <div className="stat">
                  <Droplets size={20} />
                  <div>
                    <span className="value">{weatherData.humidity}%</span>
                    <span className="label">Humidity</span>
                  </div>
                </div>
                <div className="stat">
                  <CloudRain size={20} />
                  <div>
                    <span className="value">{weatherData.rainfall}mm</span>
                    <span className="label">Rainfall</span>
                  </div>
                </div>
                <div className="stat">
                  <Wind size={20} />
                  <div>
                    <span className="value">{weatherData.windSpeed} km/h</span>
                    <span className="label">Wind Speed</span>
                  </div>
                </div>
              </div>
              {forecast.length > 0 && (
                <div className="weather-forecast">
                  {forecast.map((day, index) => (
                    <div key={index} className="forecast-day">
                      <span>{day.day}</span>
                      {day.condition.includes('rain') ? <CloudRain size={24} /> : 
                       day.condition.includes('cloud') ? <Cloud size={24} /> : <Sun size={24} />}
                      <span>{day.temp}°C</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <Sprout size={20} />
          {t('cropRecommendations')}
        </button>
        <button 
          className={`tab ${activeTab === 'fertilizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('fertilizer')}
        >
          <TrendingUp size={20} />
          {t('fertilizerSchedule')}
        </button>
        <button
          className={`tab ${activeTab === 'soil' ? 'active' : ''}`}
          onClick={() => setActiveTab('soil')}
        >
          <AlertTriangle size={20} />
          Soil Health
        </button>
        <button
          className={`tab ${activeTab === 'pest' ? 'active' : ''}`}
          onClick={() => setActiveTab('pest')}
        >
          <Bug size={20} />
          Pest & Disease
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'recommendations' && (
          <div className="recommendations-section">
            <h2>Recommended Crops for Your Farm</h2>
            <p className="section-subtitle">Based on soil health, weather patterns, and market analysis</p>
            <div className="recommendations-grid">
              {cropRecommendations.length > 0 ? cropRecommendations.map((crop, index) => (
                <div key={index} className="recommendation-card">
                  <div className="card-header">
                    <div>
                      <h3>{crop.name}</h3>
                      <p className="kannada-name">{crop.kannadaName}</p>
                    </div>
                    <div className="suitability-badge" style={{
                      background: crop.suitability > 90 ? '#10b981' : 
                                 crop.suitability > 80 ? '#f59e0b' : '#6b7280'
                    }}>
                      {crop.suitability}%
                    </div>
                  </div>
                  <div className="card-details">
                    <div className="detail">
                      <Calendar size={16} />
                      <div>
                        <span className="detail-label">Sowing Window</span>
                        <span className="detail-value">{crop.sowingWindow}</span>
                      </div>
                    </div>
                    <div className="detail">
                      <TrendingUp size={16} />
                      <div>
                        <span className="detail-label">Expected Yield</span>
                        <span className="detail-value">{crop.expectedYield}</span>
                      </div>
                    </div>
                    <div className="detail">
                      <span className="detail-label">Market Price</span>
                      <span className="detail-value highlight">{crop.marketPrice}</span>
                    </div>
                  </div>
                  <div className="reasons">
                    <h4>Why this crop?</h4>
                    <ul>
                      {crop.reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <button className="btn btn-primary">Select This Crop</button>
                </div>
              )) : (
                <div className="empty-state">No real soil/location data available for crop recommendations.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'fertilizer' && (
          <div className="schedule-section">
            <h2>{t('fertilizerSchedule')}</h2>
            <p className="section-subtitle">Optimized fertilizer application based on soil health analysis</p>
            <div className="schedule-table">
              <table>
                <thead>
                  <tr>
                    <th>Growth Stage</th>
                    <th>Days After Sowing</th>
                    <th>Fertilizer Type</th>
                    <th>Quantity</th>
                    <th>Application Method</th>
                  </tr>
                </thead>
                <tbody>
                  {fertilizerSchedule.length > 0 ? fertilizerSchedule.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.stage}</strong></td>
                      <td>{item.days}</td>
                      <td>{item.type}</td>
                      <td>{item.quantity}</td>
                      <td>{item.application}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5">No real soil data available for fertilizer recommendations.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'soil' && soilData && (
          <div className="soil-section">
            <h2>Soil Health Report</h2>
            <p className="section-subtitle">Based on latest soil analysis</p>
            
            <div className="soil-metrics">
              <div className="metric-card">
                <h4>Soil Type</h4>
                <p className="metric-value">{soilData.soilType}</p>
              </div>
              <div className="metric-card">
                <h4>pH Level</h4>
                <p className="metric-value">{soilData.pH}</p>
                <span className={soilData.pH >= 6 && soilData.pH <= 7 ? 'status-good' : 'status-warning'}>
                  {soilData.pH >= 6 && soilData.pH <= 7 ? 'Optimal' : 'Needs Attention'}
                </span>
              </div>
              <div className="metric-card">
                <h4>Nitrogen</h4>
                <p className="metric-value">{soilData.nitrogen}</p>
              </div>
              <div className="metric-card">
                <h4>Phosphorus</h4>
                <p className="metric-value">{soilData.phosphorus}</p>
              </div>
              <div className="metric-card">
                <h4>Potassium</h4>
                <p className="metric-value">{soilData.potassium}</p>
              </div>
              <div className="metric-card">
                <h4>Organic Carbon</h4>
                <p className="metric-value">{soilData.organicCarbon}%</p>
              </div>
            </div>

            <div className="recommendations-list">
              <h3>Nutrient Recommendations</h3>
              {soilData.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <div className="rec-header">
                    <h4>{rec.nutrient}</h4>
                    <span className={`status-badge ${rec.status.toLowerCase()}`}>{rec.status}</span>
                  </div>
                  <p className="rec-text">{rec.recommendation}</p>
                  <p className="rec-timing"><Calendar size={14} /> {rec.timing}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'soil' && !soilData && (
          <div className="soil-section">
            <h2>Soil Health Report</h2>
            <div className="empty-state">No real location/SoilGrids data available.</div>
          </div>
        )}

        {activeTab === 'pest' && (
          <div className="pest-section">
            <div className="pest-header">
              <div>
                <h2><Bug size={22} /> Pest & Disease Advisory</h2>
                <p className="section-subtitle">
                  Risk levels calculated from current weather conditions
                  {weatherData ? ` — ${weatherData.temperature}°C, ${weatherData.humidity}% humidity` : ' (no weather data)'}
                </p>
              </div>
              <div className="pest-controls">
                <div className="selector-field">
                  <label>Crop:</label>
                  <select value={selectedPestCrop} onChange={(e) => setSelectedPestCrop(e.target.value)}>
                    {CROP_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="selector-field">
                  <label>Filter:</label>
                  <select value={pestFilter} onChange={(e) => setPestFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="pest">Pests Only</option>
                    <option value="disease">Diseases Only</option>
                    <option value="high">High Risk Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Risk summary bar */}
            {weatherData && (() => {
              const items = PEST_DISEASE_DB[selectedPestCrop] || [];
              const highRisk   = items.filter((p) => getRiskLevel(p, weatherData) === 'high').length;
              const medRisk    = items.filter((p) => getRiskLevel(p, weatherData) === 'medium').length;
              const lowRisk    = items.filter((p) => getRiskLevel(p, weatherData) === 'low').length;
              return (
                <div className="pest-risk-summary">
                  <div className="risk-pill high"><ShieldAlert size={16} /> {highRisk} High Risk</div>
                  <div className="risk-pill medium"><AlertTriangle size={16} /> {medRisk} Medium Risk</div>
                  <div className="risk-pill low"><Sprout size={16} /> {lowRisk} Low Risk</div>
                </div>
              );
            })()}

            <div className="pest-grid">
              {(PEST_DISEASE_DB[selectedPestCrop] || [])
                .filter((p) => {
                  if (pestFilter === 'pest') return p.type === 'pest';
                  if (pestFilter === 'disease') return p.type === 'disease';
                  if (pestFilter === 'high') return getRiskLevel(p, weatherData) === 'high';
                  return true;
                })
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2, unknown: 3 };
                  return order[getRiskLevel(a, weatherData)] - order[getRiskLevel(b, weatherData)];
                })
                .map((pest, idx) => {
                  const risk = getRiskLevel(pest, weatherData);
                  return (
                    <div key={idx} className="pest-card" style={{ borderLeftColor: RISK_COLOR[risk], background: RISK_BG[risk] }}>
                      <div className="pest-card-header">
                        <div>
                          <h3>{pest.name}</h3>
                          <p className="kannada-name">{pest.kannadaName}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                          <span className="pest-type-badge" style={{ background: pest.type === 'pest' ? '#fee2e2' : '#dbeafe', color: pest.type === 'pest' ? '#dc2626' : '#2563eb' }}>
                            {pest.type === 'pest' ? '🐛 Pest' : '🦠 Disease'}
                          </span>
                          <span className="risk-badge" style={{ background: RISK_COLOR[risk], color: '#fff' }}>
                            {risk.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>

                      <div className="pest-symptoms">
                        <h4>Symptoms</h4>
                        <p>{language === 'kn' ? pest.kannadaSymptoms : pest.symptoms}</p>
                      </div>

                      <div className="pest-actions">
                        <div className="pest-prevention">
                          <h4>Prevention</h4>
                          <ul>
                            {pest.prevention.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                        <div className="pest-treatment">
                          <h4>Treatment / Control</h4>
                          <ul>
                            {pest.treatment.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropPlanning;
