// OpenWeatherMap API Integration
const WEATHER_API_KEY = 'f65ce095cf5d15f23b38bc0d9c009432';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

export const getCurrentWeather = async (lat = 12.9716, lon = 77.5946) => {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) throw new Error('Weather data fetch failed');
    const data = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      condition: data.weather[0].main,
      description: data.weather[0].description,
      rainfall: data.rain?.['1h'] || 0,
      location: data.name
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

export const getWeatherForecast = async (lat = 12.9716, lon = 77.5946) => {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) throw new Error('Forecast data fetch failed');
    const data = await response.json();
    
    // Get 5-day forecast (one per day at noon)
    const dailyForecasts = [];
    const processedDates = new Set();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toLocaleDateString();
      
      // Get one forecast per day (around noon)
      if (!processedDates.has(dateStr) && dailyForecasts.length < 5) {
        processedDates.add(dateStr);
        dailyForecasts.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main.toLowerCase(),
          description: item.weather[0].description
        });
      }
    });
    
    return dailyForecasts;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
};

export const getWeatherByCity = async (cityName) => {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE}/weather?q=${cityName}&appid=${WEATHER_API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('Weather data fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather by city:', error);
    throw error;
  }
};
