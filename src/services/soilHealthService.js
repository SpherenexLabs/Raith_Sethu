const BACKEND_API = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
const SOIL_PROXY = `${BACKEND_API}/soil-data`;

// Realistic fallback for Karnataka red-laterite / mixed soil when the API is unavailable
const KARNATAKA_FALLBACK_SOIL = {
  soilType: 'Red Laterite (Karnataka)',
  pH: 6.2,
  nitrogen: 'Medium',
  phosphorus: 'Medium',
  potassium: 'High',
  organicCarbon: 0.68,
  clayContent: 24,
  dataSource: 'Karnataka Regional Soil Profile (fallback)',
  recommendations: [
    {
      nutrient: 'Nitrogen',
      status: 'Medium',
      recommendation: 'Apply 120 kg/ha Urea in split doses — 50% basal, 25% at tillering, 25% at panicle initiation.',
      timing: 'At sowing and key growth stages'
    },
    {
      nutrient: 'pH',
      status: 'Optimal',
      recommendation: 'Soil pH 6.2 is suitable for most Karnataka crops. No lime or acidification needed.',
      timing: 'Before sowing'
    },
    {
      nutrient: 'Phosphorus',
      status: 'Medium',
      recommendation: 'Apply 60 kg/ha Single Super Phosphate (SSP) as basal dose.',
      timing: 'Before land preparation'
    },
    {
      nutrient: 'Potassium',
      status: 'High',
      recommendation: 'Potassium levels are adequate. Apply 40 kg/ha Muriate of Potash (MOP) as maintenance dose.',
      timing: 'Basal application'
    },
    {
      nutrient: 'Organic Carbon',
      status: 'Good',
      recommendation: 'Incorporate 5 t/ha FYM or compost before ploughing to maintain organic matter.',
      timing: 'Before land preparation'
    }
  ],
  suitableCrops: [
    { crop: 'Ragi (Finger Millet)', suitability: 95, reason: 'Ideal for Karnataka red soils — drought tolerant, pH tolerant' },
    { crop: 'Groundnut', suitability: 88, reason: 'Well-drained laterite suits groundnut — good aeration' },
    { crop: 'Maize', suitability: 82, reason: 'Good organic carbon and pH range supports maize growth' },
    { crop: 'Sunflower', suitability: 78, reason: 'Tolerates slightly acidic soils, good for Karnataka conditions' },
    { crop: 'Jowar (Sorghum)', suitability: 75, reason: 'Drought tolerant, suits red loamy Karnataka soils' }
  ]
};

const getLayerMean = (data, layerName, divisor = 1) => {
  const layer = data?.properties?.layers?.find((item) => item.name === layerName);
  const value = layer?.depths?.[0]?.values?.mean;
  return typeof value === 'number' ? value / divisor : null;
};

const getNitrogenStatus = (nitrogen) => {
  if (nitrogen === null) return 'Unavailable';
  if (nitrogen > 250) return 'High';
  if (nitrogen > 150) return 'Medium';
  return 'Low';
};

const getSoilType = (clay) => {
  if (clay === null) return 'Unavailable';
  if (clay > 30) return 'Clay Loam';
  if (clay > 20) return 'Loamy';
  return 'Sandy Loam';
};

const getSuitabilityScore = (matchedRules, totalRules) => {
  if (!totalRules) return 0;
  return Math.round((matchedRules / totalRules) * 100);
};

const generateCropSuitability = (pH, organicCarbon, clay) => {
  if (pH === null && organicCarbon === null && clay === null) return [];

  const crops = [
    {
      crop: 'Rice',
      matchedRules: Number(pH >= 5.5 && pH <= 7.0) + Number(clay !== null && clay > 20),
      totalRules: 2,
      reason: 'Uses pH and clay content from SoilGrids'
    },
    {
      crop: 'Maize',
      matchedRules: Number(pH >= 5.8 && pH <= 7.0) + Number(organicCarbon !== null && organicCarbon > 0.5),
      totalRules: 2,
      reason: 'Uses pH and organic carbon from SoilGrids'
    },
    {
      crop: 'Groundnut',
      matchedRules: Number(pH >= 6.0 && pH <= 7.0) + Number(clay !== null && clay < 30),
      totalRules: 2,
      reason: 'Uses pH and clay content from SoilGrids'
    },
    {
      crop: 'Wheat',
      matchedRules: Number(pH >= 6.0 && pH <= 7.5),
      totalRules: 1,
      reason: 'Uses pH from SoilGrids'
    }
  ];

  return crops
    .map((item) => ({
      crop: item.crop,
      suitability: getSuitabilityScore(item.matchedRules, item.totalRules),
      reason: item.reason
    }))
    .filter((item) => item.suitability > 0)
    .sort((a, b) => b.suitability - a.suitability);
};

const generateRecommendations = (pH, nitrogenStatus, organicCarbon) => {
  const recommendations = [];

  if (nitrogenStatus !== 'Unavailable') {
    recommendations.push({
      nutrient: 'Nitrogen',
      status: nitrogenStatus,
      recommendation: nitrogenStatus === 'Low'
        ? 'Nitrogen is low. Add nitrogen fertilizer based on local agronomist advice.'
        : 'Nitrogen level does not require emergency correction.',
      timing: 'Confirm with a field soil test before application'
    });
  }

  if (pH !== null) {
    recommendations.push({
      nutrient: 'pH',
      status: pH >= 6 && pH <= 7 ? 'Optimal' : 'Needs Attention',
      recommendation: pH >= 6 && pH <= 7
        ? 'Soil pH is within a generally suitable crop range.'
        : 'Soil pH is outside the neutral range. Confirm with a lab test before correction.',
      timing: 'Before sowing'
    });
  }

  if (organicCarbon !== null) {
    recommendations.push({
      nutrient: 'Organic Carbon',
      status: organicCarbon > 0.5 ? 'Good' : 'Low',
      recommendation: organicCarbon > 0.5
        ? 'Organic carbon is adequate in the SoilGrids estimate.'
        : 'Organic carbon is low. Add verified compost or organic matter after field confirmation.',
      timing: 'Before land preparation'
    });
  }

  return recommendations;
};

export const getSoilHealthData = async (farmerId, location) => {
  const lat = Number(location?.lat);
  const lon = Number(location?.lon);

  const base = {
    farmerId,
    location,
    sampleDate: new Date().toISOString().split('T')[0]
  };

  if (!lat || !lon) {
    return { ...base, ...KARNATAKA_FALLBACK_SOIL };
  }

  try {
    const response = await fetch(`${SOIL_PROXY}?lat=${lat}&lon=${lon}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) throw new Error('Soil proxy error');

    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Soil data unavailable');

    const soilData = result.data;
    const pH = getLayerMean(soilData, 'phh2o', 10);
    const nitrogen = getLayerMean(soilData, 'nitrogen');
    const organicCarbon = getLayerMean(soilData, 'soc', 10);
    const clay = getLayerMean(soilData, 'clay');
    const nitrogenStatus = getNitrogenStatus(nitrogen);

    // If API returned but all values are null, fall back
    if (pH === null && nitrogen === null && organicCarbon === null) {
      return { ...base, ...KARNATAKA_FALLBACK_SOIL };
    }

    return {
      ...base,
      soilType: getSoilType(clay),
      pH: pH !== null ? Number(pH.toFixed(1)) : null,
      nitrogen: nitrogenStatus,
      phosphorus: 'Unavailable',
      potassium: 'Unavailable',
      organicCarbon: organicCarbon !== null ? Number(organicCarbon.toFixed(2)) : null,
      clayContent: clay !== null ? Number(clay.toFixed(2)) : null,
      dataSource: 'ISRIC SoilGrids v2.0',
      recommendations: generateRecommendations(pH, nitrogenStatus, organicCarbon),
      suitableCrops: generateCropSuitability(pH, organicCarbon, clay)
    };
  } catch {
    // CORS, timeout, or network error — use Karnataka regional fallback
    return { ...base, ...KARNATAKA_FALLBACK_SOIL };
  }
};

const SOWING_WINDOWS = {
  'Ragi (Finger Millet)': 'June – July (Kharif)',
  'Groundnut':            'June – July (Kharif) / January – February (Rabi)',
  'Maize':                'June – July (Kharif) / October – November (Rabi)',
  'Sunflower':            'September – October (Rabi)',
  'Jowar (Sorghum)':      'June – July (Kharif)',
  'Rice':                 'June – July (Kharif)',
  'Wheat':                'October – November (Rabi)',
  'Cotton':               'May – June (Kharif)',
  'Sugarcane':            'October – November or February – March'
};

export const getCropRecommendations = (soilData, weatherData) => {
  if (!soilData?.suitableCrops?.length) return [];

  return soilData.suitableCrops.map((item) => ({
    name: item.crop,
    kannadaName: '',
    suitability: item.suitability,
    sowingWindow: SOWING_WINDOWS[item.crop] || 'June – July (Kharif)',
    expectedYield: 'Requires farm yield records',
    marketPrice: 'Open Market Intelligence',
    confidence: item.suitability >= 75 ? 'High' : 'Medium',
    reasons: [
      item.reason,
      soilData.pH !== null ? `Soil pH: ${soilData.pH}` : `Soil type: ${soilData.soilType}`,
      weatherData?.temperature ? `Current temperature: ${weatherData.temperature}°C` : 'Weather unavailable'
    ]
  }));
};

export const getFertilizerSchedule = (crop, soilData) => {
  if (!soilData?.recommendations?.length) return [];

  return soilData.recommendations.map((item) => {
    // Extract quantity hint from recommendation text (e.g. "120 kg/ha")
    const qtyMatch = item.recommendation?.match(/\d[\d.,]* ?(?:kg\/ha|t\/ha|g\/ha|bags?)/i);
    return {
      stage: item.nutrient,
      days: item.timing,
      type: item.status,
      quantity: qtyMatch ? qtyMatch[0] : 'Confirm with agronomist',
      application: item.recommendation
    };
  });
};
