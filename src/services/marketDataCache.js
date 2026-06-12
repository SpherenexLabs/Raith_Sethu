import { ref, set, get } from 'firebase/database';
import { database } from '../config/firebase';

// Cache market data in Firebase for fast retrieval
export const cacheMarketData = async (commodity, state, data) => {
  try {
    const cacheRef = ref(database, `marketCache/${state}/${commodity}`);
    await set(cacheRef, {
      data,
      timestamp: Date.now(),
      lastUpdated: new Date().toISOString()
    });
    console.log(`✅ Cached market data for ${commodity} in ${state}`);
  } catch (error) {
    console.error('Error caching market data:', error);
  }
};

export const getCachedMarketData = async (commodity, state) => {
  try {
    const cacheRef = ref(database, `marketCache/${state}/${commodity}`);
    const snapshot = await get(cacheRef);
    
    if (snapshot.exists()) {
      const cached = snapshot.val();
      const age = Date.now() - cached.timestamp;
      const ageMinutes = Math.floor(age / 60000);
      
      console.log(`📦 Using cached data (${ageMinutes} minutes old)`);
      return cached.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached market data:', error);
    return null;
  }
};

// Fetch and cache a single commodity (with minimal retries to avoid rate limits)
export const updateSingleCommodityCache = async (commodity, state = 'Karnataka') => {
  const AGMARKNET_BASE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
  const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
  const url = `${AGMARKNET_BASE}?api-key=${API_KEY}&format=json&limit=5&filters[state]=${encodeURIComponent(state)}&filters[commodity]=${encodeURIComponent(commodity)}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`Fetching ${commodity} (attempt ${attempt})...`);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (response.status === 429) {
        console.warn(`429 for ${commodity}, waiting before retry...`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.records && result.records.length > 0) {
          await cacheMarketData(commodity, state, result);
          console.log(`✅ Cached ${commodity}: ${result.records.length} records`);
          return { success: true, records: result.records.length };
        }
      }

      await new Promise(r => setTimeout(r, 4000));
    } catch (error) {
      console.error(`Error updating ${commodity} attempt ${attempt}:`, error.message);
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  return { success: false, records: 0 };
};

// Fetch and cache data from government API (to be run periodically)
export const updateMarketCache = async () => {
  const commodities = ['Rice', 'Maize', 'Wheat', 'Cotton', 'Sugarcane'];
  const state = 'Karnataka';
  for (const commodity of commodities) {
    await updateSingleCommodityCache(commodity, state);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('✅ Market cache update complete');
};
