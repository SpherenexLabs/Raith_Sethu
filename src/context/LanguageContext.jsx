import { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    home: 'Home',
    cropPlanning: 'Crop Planning',
    analytics: 'Analytics',
    marketplace: 'Marketplace',
    marketIntel: 'Market Intel',
    buyerHub: 'Buyer Hub',
    trustCenter: 'Trust Center',
    voiceSupport: 'Voice Support',
    adminDashboard: 'Admin Dashboard',
    profile: 'Profile',
    login: 'Login',
    logout: 'Logout',
    
    // Common
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    loading: 'Loading...',
    
    // Module specific
    cropRecommendations: 'Crop Recommendations',
    weatherAlerts: 'Weather Alerts',
    soilHealth: 'Soil Health',
    fertilizerSchedule: 'Fertilizer Schedule',
    irrigationSchedule: 'Irrigation Schedule',
    pestForecasting: 'Pest & Disease Forecasting',
    
    // Analytics Page
    analyticsSubtitle: 'Real-time farming analytics and market insights',
    loadingAnalytics: 'Loading analytics data...',
    unableToLoad: 'Unable to load analytics data',
    totalFarmers: 'Total Farmers',
    cultivatedArea: 'Cultivated Area',
    totalProduction: 'Total Production',
    currentTemperature: 'Current Temperature',
    cropDistributionByArea: 'Crop Distribution by Area',
    seasonalCroppingTrends: 'Seasonal Cropping Trends (Last 6 Months)',
    regionalFarmerDistribution: 'Regional Farmer Distribution',
    liveMarketPriceAnalysis: 'Live Market Price Analysis (₹/Quintal)',
    upcomingHarvestPredictions: 'Upcoming Harvest Predictions',
    crop: 'Crop',
    expectedYield: 'Expected Yield',
    readyDate: 'Ready Date',
    estimatedVolume: 'Estimated Volume (tons)',
    rice: 'Rice',
    maize: 'Maize',
    wheat: 'Wheat',
    groundnut: 'Groundnut',
    current: 'Current',
    yesterday: 'Yesterday',
    weekAgo: 'Week Ago',
    farmers: 'farmers',
    up: 'up',
    down: 'down',
  },
  kn: {
    // Navigation (Kannada)
    home: 'ಮುಖಪುಟ',
    cropPlanning: 'ಬೆಳೆ ಯೋಜನೆ',
    analytics: 'ವಿಶ್ಲೇಷಣೆ',
    marketplace: 'ಮಾರುಕಟ್ಟೆ',
    marketIntel: 'ಮಾರುಕಟ್ಟೆ ಒಳನೋಟ',
    buyerHub: 'ಖರೀದಿದಾರ ಕೇಂದ್ರ',
    trustCenter: 'ವಿಶ್ವಾಸ ಕೇಂದ್ರ',
    voiceSupport: 'ವಾಚ್ ಸಹಾಯ',
    adminDashboard: 'ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    profile: 'ಪ್ರೊಫೈಲ್',
    login: 'ಲಾಗಿನ್',
    logout: 'ಲಾಗೌಟ್',
    
    // Common
    welcome: 'ಸ್ವಾಗತ',
    dashboard: 'ಡ್ಯಾಶ್ಬೋರ್ಡ್',
    save: 'ಉಳಿಸು',
    cancel: 'ರದ್ದುಮಾಡಿ',
    submit: 'ಸಲ್ಲಿಸು',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    
    // Module specific
    cropRecommendations: 'ಬೆಳೆ ಶಿಫಾರಸುಗಳು',
    weatherAlerts: 'ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು',
    soilHealth: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ',
    fertilizerSchedule: 'ಗೊಬ್ಬರ ವೇಳಾಪಟ್ಟಿ',
    irrigationSchedule: 'ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ',
    pestForecasting: 'ಕೀಟ ಮತ್ತು ರೋಗ ಮುನ್ಸೂಚನೆ',
    
    // Analytics Page
    analyticsSubtitle: 'ನೈಜ ಸಮಯದ ಕೃಷಿ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಒಳನೋಟಗಳು',
    loadingAnalytics: 'ವಿಶ್ಲೇಷಣಾ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    unableToLoad: 'ವಿಶ್ಲೇಷಣಾ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ',
    totalFarmers: 'ಒಟ್ಟು ರೈತರು',
    cultivatedArea: 'ಕೃಷಿ ಮಾಡಿದ ಪ್ರದೇಶ',
    totalProduction: 'ಒಟ್ಟು ಉತ್ಪಾದನೆ',
    currentTemperature: 'ಪ್ರಸ್ತುತ ತಾಪಮಾನ',
    cropDistributionByArea: 'ಪ್ರದೇಶದ ಮೂಲಕ ಬೆಳೆ ವಿತರಣೆ',
    seasonalCroppingTrends: 'ಕಾಲೋಚಿತ ಬೆಳೆ ಪ್ರವೃತ್ತಿಗಳು (ಕಳೆದ 6 ತಿಂಗಳು)',
    regionalFarmerDistribution: 'ಪ್ರಾದೇಶಿಕ ರೈತರ ವಿತರಣೆ',
    liveMarketPriceAnalysis: 'ನೇರ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ವಿಶ್ಲೇಷಣೆ (₹/ಕ್ವಿಂಟಾಲ್)',
    upcomingHarvestPredictions: 'ಮುಂಬರುವ ಕೊಯ್ಲು ಭವಿಷ್ಯ',
    crop: 'ಬೆಳೆ',
    expectedYield: 'ನಿರೀಕ್ಷಿತ ಇಳುವರಿ',
    readyDate: 'ಸಿದ್ಧ ದಿನಾಂಕ',
    estimatedVolume: 'ಅಂದಾಜು ಪ್ರಮಾಣ (ಟನ್)',
    rice: 'ಅಕ್ಕಿ',
    maize: 'ಜೋಳ',
    wheat: 'ಗೋಧಿ',
    groundnut: 'ಕಡಲೆಕಾಯಿ',
    current: 'ಪ್ರಸ್ತುತ',
    yesterday: 'ನಿನ್ನೆ',
    weekAgo: 'ವಾರದ ಹಿಂದೆ',
    farmers: 'ರೈತರು',
    up: 'ಹೆಚ್ಚು',
    down: 'ಕಡಿಮೆ',
  },
};

const uiPhraseTranslations = {
  'Raith Sethu': 'ರೈತ ಸೇತು',
  'Raith Sethu System': 'ರೈತ ಸೇತು ವ್ಯವಸ್ಥೆ',
  'Empowering farmers with data-driven insights and direct market access': 'ಡೇಟಾ ಆಧಾರಿತ ಒಳನೋಟಗಳು ಮತ್ತು ನೇರ ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶದ ಮೂಲಕ ರೈತರಿಗೆ ಶಕ್ತಿ',
  'Quick Links': 'ತ್ವರಿತ ಲಿಂಕ್‌ಗಳು',
  'About Us': 'ನಮ್ಮ ಬಗ್ಗೆ',
  'Contact': 'ಸಂಪರ್ಕ',
  'FAQ': 'ಪ್ರಶ್ನೋತ್ತರ',
  'Support': 'ಬೆಂಬಲ',
  'Modules': 'ಮಾಡ್ಯೂಲ್‌ಗಳು',
  'Email:': 'ಇಮೇಲ್:',
  'Phone:': 'ಫೋನ್:',
  'All rights reserved.': 'ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
  'More': 'ಇನ್ನಷ್ಟು',
  'Toggle navigation': 'ನ್ಯಾವಿಗೇಶನ್ ಬದಲಿಸಿ',
  'Toggle Language': 'ಭಾಷೆ ಬದಲಿಸಿ',
  'Farming Activity': 'ಕೃಷಿ ಚಟುವಟಿಕೆ',
  'Input Marketplace': 'ಇನ್‌ಪುಟ್ ಮಾರುಕಟ್ಟೆ',
  'Equipment Rental': 'ಉಪಕರಣ ಬಾಡಿಗೆ',
  'Government Schemes': 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು',
  'Trust Center': 'ವಿಶ್ವಾಸ ಕೇಂದ್ರ',
  'Market Intel': 'ಮಾರುಕಟ್ಟೆ ಒಳನೋಟ',
  'Transport & Equipment': 'ಸಾರಿಗೆ ಮತ್ತು ಉಪಕರಣ',
  'Crop Insurance': 'ಬೆಳೆ ವಿಮೆ',
  'Crop Insurance Services': 'ಬೆಳೆ ವಿಮೆ ಸೇವೆಗಳು',
  'Farmer Map': 'ರೈತ ನಕ್ಷೆ',
  'Geo Tagged Farmer Mapping': 'ಜಿಯೋ ಟ್ಯಾಗ್ ಮಾಡಿದ ರೈತರ ನಕ್ಷೆ',
  'Chat': 'ಚಾಟ್',

  'Welcome Back': 'ಮತ್ತೆ ಸ್ವಾಗತ',
  'Sign in to your account': 'ನಿಮ್ಮ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
  'Register to get started': 'ಪ್ರಾರಂಭಿಸಲು ನೋಂದಣಿ ಮಾಡಿ',
  'Full Name': 'ಪೂರ್ಣ ಹೆಸರು',
  'Phone Number': 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
  'Location': 'ಸ್ಥಳ',
  'Role': 'ಪಾತ್ರ',
  'Email Address': 'ಇಮೇಲ್ ವಿಳಾಸ',
  'Password': 'ಗುಪ್ತಪದ',
  'Enter your full name': 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
  'Enter your phone number': 'ನಿಮ್ಮ ದೂರವಾಣಿ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ',
  'Village, Taluk, District': 'ಗ್ರಾಮ, ತಾಲ್ಲೂಕು, ಜಿಲ್ಲೆ',
  'Enter your email': 'ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ',
  'Enter your password': 'ನಿಮ್ಮ ಗುಪ್ತಪದ ನಮೂದಿಸಿ',
  'Use current location': 'ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ',
  'Getting location...': 'ಸ್ಥಳ ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
  'Current location added.': 'ಪ್ರಸ್ತುತ ಸ್ಥಳ ಸೇರಿಸಲಾಗಿದೆ.',
  'Please wait...': 'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ...',
  'Sign In': 'ಸೈನ್ ಇನ್',
  'Sign Up': 'ಸೈನ್ ಅಪ್',
  'Create Account': 'ಖಾತೆ ರಚಿಸಿ',
  "Don't have an account?": 'ಖಾತೆ ಇಲ್ಲವೇ?',
  'Already have an account?': 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
  'AI-driven crop recommendations': 'AI ಆಧಾರಿತ ಬೆಳೆ ಶಿಫಾರಸುಗಳು',
  'Real-time weather alerts': 'ನೈಜ ಸಮಯದ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು',
  'Direct market access': 'ನೇರ ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶ',
  'Bilingual support (English & Kannada)': 'ದ್ವಿಭಾಷಾ ಬೆಂಬಲ (ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ)',
  'Analytics & insights': 'ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಒಳನೋಟಗಳು',
  'Admin login: admin@farmmanagement.com': 'ಅಡ್ಮಿನ್ ಲಾಗಿನ್: admin@farmmanagement.com',

  'Empowering Farmers with': 'ರೈತರಿಗೆ ಶಕ್ತಿ ನೀಡುವುದು',
  'Plan better, grow smarter, and connect directly with customers through our comprehensive farmer management platform': 'ನಮ್ಮ ಸಮಗ್ರ ರೈತ ನಿರ್ವಹಣಾ ವೇದಿಕೆಯ ಮೂಲಕ ಉತ್ತಮವಾಗಿ ಯೋಜಿಸಿ, ಚುರುಕಾಗಿ ಬೆಳೆಸಿ, ಗ್ರಾಹಕರೊಂದಿಗೆ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ',
  'Get Started': 'ಪ್ರಾರಂಭಿಸಿ',
  'Learn More': 'ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ',
  'Go to Dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ',
  'Our Features': 'ನಮ್ಮ ವೈಶಿಷ್ಟ್ಯಗಳು',
  'Comprehensive tools to help you succeed in modern farming': 'ಆಧುನಿಕ ಕೃಷಿಯಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಲು ಸಮಗ್ರ ಉಪಕರಣಗಳು',
  'AI-Driven Crop Planning': 'AI ಆಧಾರಿತ ಬೆಳೆ ಯೋಜನೆ',
  'Farmer Analytics': 'ರೈತ ವಿಶ್ಲೇಷಣೆ',
  'F2C Marketplace': 'ರೈತನಿಂದ ಗ್ರಾಹಕ ಮಾರುಕಟ್ಟೆ',
  'Weather Alerts': 'ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು',
  'Pest Forecasting': 'ಕೀಟ ಮುನ್ಸೂಚನೆ',
  'Market Intelligence': 'ಮಾರುಕಟ್ಟೆ ಬುದ್ಧಿವಂತಿಕೆ',
  'Registered Farmers': 'ನೋಂದಾಯಿತ ರೈತರು',
  'Crop Varieties Listed': 'ಪಟ್ಟಿಯಾದ ಬೆಳೆ ಜಾತಿಗಳು',
  'Completed Orders': 'ಪೂರ್ಣಗೊಂಡ ಆರ್ಡರ್‌ಗಳು',
  'Active Listings': 'ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು',
  'Our Mission': 'ನಮ್ಮ ಗುರಿ',
  'Data-Driven Insights': 'ಡೇಟಾ ಆಧಾರಿತ ಒಳನೋಟಗಳು',
  'Direct Market Access': 'ನೇರ ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶ',
  'Real-Time Alerts': 'ನೈಜ ಸಮಯದ ಎಚ್ಚರಿಕೆಗಳು',
  'Transparency & Trust': 'ಪಾರದರ್ಶಕತೆ ಮತ್ತು ವಿಶ್ವಾಸ',
  'Inclusive Interface': 'ಎಲ್ಲರಿಗೂ ಸುಲಭವಾದ ಇಂಟರ್ಫೇಸ್',
  'Ready to Transform Your Farming?': 'ನಿಮ್ಮ ಕೃಷಿಯನ್ನು ಬದಲಾಯಿಸಲು ಸಿದ್ಧವೇ?',
  'Join thousands of farmers who are already using our platform': 'ನಮ್ಮ ವೇದಿಕೆಯನ್ನು ಈಗಾಗಲೇ ಬಳಸುತ್ತಿರುವ ಸಾವಿರಾರು ರೈತರೊಂದಿಗೆ ಸೇರಿ',
  'Join Now': 'ಈಗ ಸೇರಿ',

  'Direct Farmer-to-Customer marketplace': 'ರೈತನಿಂದ ಗ್ರಾಹಕರಿಗೆ ನೇರ ಮಾರುಕಟ್ಟೆ',
  'Create New Listing': 'ಹೊಸ ಪಟ್ಟಿಯನ್ನು ರಚಿಸಿ',
  'Browse Listings': 'ಪಟ್ಟಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
  'My Listings': 'ನನ್ನ ಪಟ್ಟಿಗಳು',
  'Incoming Orders': 'ಬರುವ ಆರ್ಡರ್‌ಗಳು',
  'Transport': 'ಸಾರಿಗೆ',
  'Search crops, farmers, locations...': 'ಬೆಳೆ, ರೈತರು, ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ...',
  'All Crops': 'ಎಲ್ಲ ಬೆಳೆಗಳು',
  'Organic Only': 'ಸಾವಯವ ಮಾತ್ರ',
  'Organic': 'ಸಾವಯವ',
  'Harvest:': 'ಕೊಯ್ಲು:',
  'per': 'ಪ್ರತಿ',
  'Buy Now': 'ಈಗ ಖರೀದಿಸಿ',
  'No listings found.': 'ಯಾವುದೇ ಪಟ್ಟಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ.',
  'Create your first listing!': 'ನಿಮ್ಮ ಮೊದಲ ಪಟ್ಟಿಯನ್ನು ರಚಿಸಿ!',
  'Check back later for new listings.': 'ಹೊಸ ಪಟ್ಟಿಗಳಿಗಾಗಿ ನಂತರ ಪರಿಶೀಲಿಸಿ.',
  'Crop': 'ಬೆಳೆ',
  'Quantity': 'ಪ್ರಮಾಣ',
  'Price': 'ಬೆಲೆ',
  'Status': 'ಸ್ಥಿತಿ',
  'Actions': 'ಕ್ರಿಯೆಗಳು',
  'Delete': 'ಅಳಿಸಿ',
  'Available Transport Providers': 'ಲಭ್ಯವಿರುವ ಸಾರಿಗೆ ಪೂರೈಕೆದಾರರು',
  'Your Orders': 'ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳು',
  'Booked Transports': 'ಬುಕ್ ಮಾಡಿದ ಸಾರಿಗೆ',
  'Add Transport Provider': 'ಸಾರಿಗೆ ಪೂರೈಕೆದಾರರನ್ನು ಸೇರಿಸಿ',
  'Select vehicle': 'ವಾಹನ ಆಯ್ಕೆಮಾಡಿ',
  'Mini Truck (1 Ton)': 'ಮಿನಿ ಟ್ರಕ್ (1 ಟನ್)',
  'Medium Truck (3 Ton)': 'ಮಧ್ಯಮ ಟ್ರಕ್ (3 ಟನ್)',
  'Large Truck (5 Ton)': 'ದೊಡ್ಡ ಟ್ರಕ್ (5 ಟನ್)',
  'Tempo (500 kg)': 'ಟೆಂಪೋ (500 ಕೆಜಿ)',
  'Pickup Van': 'ಪಿಕಪ್ ವ್ಯಾನ್',
  'Currently Available': 'ಪ್ರಸ್ತುತ ಲಭ್ಯ',
  'Add Provider': 'ಪೂರೈಕೆದಾರ ಸೇರಿಸಿ',
  'Select unit': 'ಘಟಕ ಆಯ್ಕೆಮಾಡಿ',
  'Quintals': 'ಕ್ವಿಂಟಲ್‌ಗಳು',
  'Kilograms': 'ಕಿಲೋಗ್ರಾಂಗಳು',
  'Tons': 'ಟನ್‌ಗಳು',
  'Select grade': 'ಗ್ರೇಡ್ ಆಯ್ಕೆಮಾಡಿ',
  'Premium': 'ಪ್ರೀಮಿಯಂ',
  'Grade A': 'ಗ್ರೇಡ್ A',
  'Grade B': 'ಗ್ರೇಡ್ B',
  'Additional Details': 'ಹೆಚ್ಚುವರಿ ವಿವರಗಳು',
  'Add any additional information...': 'ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ ಸೇರಿಸಿ...',
  'Create Listing': 'ಪಟ್ಟಿ ರಚಿಸಿ',

  'Market & Price Intelligence': 'ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಬೆಲೆ ಬುದ್ಧಿವಂತಿಕೆ',
  "Today's mandi prices first, latest available AGMARKNET data when today is not published": 'ಮೊದಲು ಇಂದಿನ ಮಂಡಿ ಬೆಲೆಗಳು, ಇಂದು ಪ್ರಕಟವಾಗದಿದ್ದರೆ ಲಭ್ಯವಿರುವ ಇತ್ತೀಚಿನ AGMARKNET ಡೇಟಾ',
  'Select Crop:': 'ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ:',
  'Select State:': 'ರಾಜ್ಯ ಆಯ್ಕೆಮಾಡಿ:',
  'Select District:': 'ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ:',
  'Select Mandi:': 'ಮಂಡಿ ಆಯ್ಕೆಮಾಡಿ:',
  'No listed crops found': 'ಪಟ್ಟಿಯಾದ ಬೆಳೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
  'No current states found': 'ಪ್ರಸ್ತುತ ರಾಜ್ಯಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
  'All Mandis': 'ಎಲ್ಲ ಮಂಡಿಗಳು',
  "Today's Mandi Prices": 'ಇಂದಿನ ಮಂಡಿ ಬೆಲೆಗಳು',
  'Latest Available Mandi Prices': 'ಲಭ್ಯವಿರುವ ಇತ್ತೀಚಿನ ಮಂಡಿ ಬೆಲೆಗಳು',
  'Current Average Price': 'ಪ್ರಸ್ತುತ ಸರಾಸರಿ ಬೆಲೆ',
  'Latest Average Price': 'ಇತ್ತೀಚಿನ ಸರಾಸರಿ ಬೆಲೆ',
  'Today': 'ಇಂದು',
  'Latest available': 'ಇತ್ತೀಚಿನ ಲಭ್ಯ',
  'per quintal': 'ಪ್ರತಿ ಕ್ವಿಂಟಲ್',
  'No mandi price records found': 'ಮಂಡಿ ಬೆಲೆ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
  'Next 14 Days Price Prediction': 'ಮುಂದಿನ 14 ದಿನಗಳ ಬೆಲೆ ಮುನ್ಸೂಚನೆ',
  'Predicted Price': 'ಮುನ್ಸೂಚಿತ ಬೆಲೆ',
  'AI Optimal Selling Window': 'AI ಉತ್ತಮ ಮಾರಾಟ ಸಮಯ',
  'Sell Now': 'ಈಗ ಮಾರಾಟ ಮಾಡಿ',
  'Sell Soon': 'ಶೀಘ್ರದಲ್ಲೇ ಮಾರಾಟ ಮಾಡಿ',
  'Hold & Wait': 'ಕಾಯಿರಿ',
  'Peak Price Day': 'ಗರಿಷ್ಠ ಬೆಲೆ ದಿನ',
  'Expected Peak': 'ನಿರೀಕ್ಷಿತ ಗರಿಷ್ಠ',
  'vs Today': 'ಇಂದಿನೊಂದಿಗೆ ಹೋಲಿಕೆ',
  '14-Day Avg': '14 ದಿನಗಳ ಸರಾಸರಿ',
  'Transport Cost Calculator': 'ಸಾರಿಗೆ ವೆಚ್ಚ ಕ್ಯಾಲ್ಕುಲೇಟರ್',
  'Quantity (quintals)': 'ಪ್ರಮಾಣ (ಕ್ವಿಂಟಲ್‌ಗಳು)',
  'Distance to Mandi (km)': 'ಮಂಡಿಯ ದೂರ (ಕಿ.ಮೀ)',
  'Total Transport Cost': 'ಒಟ್ಟು ಸಾರಿಗೆ ವೆಚ್ಚ',
  'Cost per Quintal': 'ಪ್ರತಿ ಕ್ವಿಂಟಲ್ ವೆಚ್ಚ',

  'Admin Dashboard': 'ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'Maintain farmers, buyers, customers, orders, and platform activity': 'ರೈತರು, ಖರೀದಿದಾರರು, ಗ್ರಾಹಕರು, ಆರ್ಡರ್‌ಗಳು ಮತ್ತು ವೇದಿಕೆ ಚಟುವಟಿಕೆಯನ್ನು ನಿರ್ವಹಿಸಿ',
  'Export Users': 'ಬಳಕೆದಾರರನ್ನು ರಫ್ತು ಮಾಡಿ',
  'Refresh Data': 'ಡೇಟಾ ರಿಫ್ರೆಶ್ ಮಾಡಿ',
  'Overview': 'ಅವಲೋಕನ',
  'Users': 'ಬಳಕೆದಾರರು',
  'Farmers': 'ರೈತರು',
  'Buyers': 'ಖರೀದಿದಾರರು',
  'Customers': 'ಗ್ರಾಹಕರು',
  'Orders': 'ಆರ್ಡರ್‌ಗಳು',
  'Catalog': 'ಕ್ಯಾಟಲಾಗ್',
  'Disputes': 'ವಿವಾದಗಳು',
  'Monitoring': 'ಮೇಲ್ವಿಚಾರಣೆ',
  'Total Users': 'ಒಟ್ಟು ಬಳಕೆದಾರರು',
  'Total Orders': 'ಒಟ್ಟು ಆರ್ಡರ್‌ಗಳು',
  'Order Value': 'ಆರ್ಡರ್ ಮೌಲ್ಯ',
  'Suspended Users': 'ಸ್ಥಗಿತ ಬಳಕೆದಾರರು',
  'User Distribution by Role': 'ಪಾತ್ರದ ಪ್ರಕಾರ ಬಳಕೆದಾರರ ವಿತರಣೆ',
  'All Users': 'ಎಲ್ಲ ಬಳಕೆದಾರರು',
  'All Users Management': 'ಎಲ್ಲ ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ',
  'Farmers Management': 'ರೈತರ ನಿರ್ವಹಣೆ',
  'Buyers Management': 'ಖರೀದಿದಾರರ ನಿರ್ವಹಣೆ',
  'Customers Management': 'ಗ್ರಾಹಕರ ನಿರ್ವಹಣೆ',
  'View, verify, edit, suspend, or delete accounts.': 'ಖಾತೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ, ಪರಿಶೀಲಿಸಿ, ಸಂಪಾದಿಸಿ, ಸ್ಥಗಿತಗೊಳಿಸಿ ಅಥವಾ ಅಳಿಸಿ.',
  'records': 'ದಾಖಲೆಗಳು',
  'Search by name, email, phone, location, or ID...': 'ಹೆಸರು, ಇಮೇಲ್, ಫೋನ್, ಸ್ಥಳ ಅಥವಾ ID ಮೂಲಕ ಹುಡುಕಿ...',
  'Name': 'ಹೆಸರು',
  'Email': 'ಇಮೇಲ್',
  'Phone': 'ಫೋನ್',
  'Joined': 'ಸೇರಿದ ದಿನಾಂಕ',
  'View Details': 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
  'Edit User': 'ಬಳಕೆದಾರರನ್ನು ಸಂಪಾದಿಸಿ',
  'Verify User': 'ಬಳಕೆದಾರ ಪರಿಶೀಲಿಸಿ',
  'Unverify User': 'ಪರಿಶೀಲನೆ ತೆಗೆದುಹಾಕಿ',
  'Suspend': 'ಸ್ಥಗಿತಗೊಳಿಸಿ',
  'Unsuspend': 'ಸ್ಥಗಿತ ತೆಗೆದುಹಾಕಿ',
  'Delete User': 'ಬಳಕೆದಾರ ಅಳಿಸಿ',
  'Orders Management': 'ಆರ್ಡರ್ ನಿರ್ವಹಣೆ',
  'Catalog Management': 'ಕ್ಯಾಟಲಾಗ್ ನಿರ್ವಹಣೆ',
  'Create and manage Equipment, Input Products, and Group Buying listings.': 'ಉಪಕರಣ, ಇನ್‌ಪುಟ್ ಉತ್ಪನ್ನಗಳು ಮತ್ತು ಗುಂಪು ಖರೀದಿ ಪಟ್ಟಿಗಳನ್ನು ರಚಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ.',
  'Equipment': 'ಉಪಕರಣ',
  'Input Products': 'ಇನ್‌ಪುಟ್ ಉತ್ಪನ್ನಗಳು',
  'Group Buying': 'ಗುಂಪು ಖರೀದಿ',
  'Add Equipment': 'ಉಪಕರಣ ಸೇರಿಸಿ',
  'Product Name *': 'ಉತ್ಪನ್ನ ಹೆಸರು *',
  'Category': 'ವರ್ಗ',
  'Owner Name': 'ಮಾಲೀಕರ ಹೆಸರು',
  'Daily Rate (Rs.)': 'ದೈನಂದಿನ ದರ (ರೂ.)',
  'Horsepower': 'ಹಾರ್ಸ್‌ಪವರ್',
  'Add Product': 'ಉತ್ಪನ್ನ ಸೇರಿಸಿ',
  'Add Group Buying Opportunity': 'ಗುಂಪು ಖರೀದಿ ಅವಕಾಶ ಸೇರಿಸಿ',
  'Dispute Management': 'ವಿವಾದ ನಿರ್ವಹಣೆ',
  'Recent Activity Logs': 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ ದಾಖಲೆಗಳು',

  'Profile': 'ಪ್ರೊಫೈಲ್',
  'Personal Information': 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ',
  'Farm Details': 'ಫಾರ್ಮ್ ವಿವರಗಳು',
  'Recent Activity': 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ',
  'Farming Experience (years)': 'ಕೃಷಿ ಅನುಭವ (ವರ್ಷಗಳು)',
  'Profile updated successfully!': 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!',

  'Customer Dashboard': 'ಗ್ರಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'Buyer Dashboard': 'ಖರೀದಿದಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'Order History & Tracking': 'ಆರ್ಡರ್ ಇತಿಹಾಸ ಮತ್ತು ಟ್ರ್ಯಾಕಿಂಗ್',
  'My Orders': 'ನನ್ನ ಆರ್ಡರ್‌ಗಳು',
  'Buyer Verification': 'ಖರೀದಿದಾರ ಪರಿಶೀಲನೆ',
  'You are Verified': 'ನೀವು ಪರಿಶೀಲಿತರಾಗಿದ್ದೀರಿ',
  'Verification Pending': 'ಪರಿಶೀಲನೆ ಬಾಕಿಯಿದೆ',
  'Business Name': 'ವ್ಯಾಪಾರ ಹೆಸರು',
  'Business Type': 'ವ್ಯಾಪಾರ ಪ್ರಕಾರ',
  'Individual': 'ವೈಯಕ್ತಿಕ',
  'Wholesaler': 'ಹೊಲ್ಸೇಲರ್',
  'Retailer': 'ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿ',
  'Submit Verification': 'ಪರಿಶೀಲನೆ ಸಲ್ಲಿಸಿ',

  'Trust & Transparency Center': 'ವಿಶ್ವಾಸ ಮತ್ತು ಪಾರದರ್ಶಕತೆ ಕೇಂದ್ರ',
  'Building trust through verified farmer reputation and transparent transactions': 'ಪರಿಶೀಲಿತ ರೈತ ಖ್ಯಾತಿ ಮತ್ತು ಪಾರದರ್ಶಕ ವ್ಯವಹಾರಗಳ ಮೂಲಕ ವಿಶ್ವಾಸ ನಿರ್ಮಾಣ',
  'Verified Farmers': 'ಪರಿಶೀಲಿತ ರೈತರು',
  'No Farmers Found': 'ರೈತರು ಕಂಡುಬಂದಿಲ್ಲ',
  'Dispute Resolution': 'ವಿವಾದ ಪರಿಹಾರ',
  'New Dispute': 'ಹೊಸ ವಿವಾದ',
  'Report Dispute': 'ವಿವಾದ ವರದಿ ಮಾಡಿ',
  'Crop Quality': 'ಬೆಳೆ ಗುಣಮಟ್ಟ',
  'Delivery Issue': 'ವಿತರಣಾ ಸಮಸ್ಯೆ',
  'Payment Problem': 'ಪಾವತಿ ಸಮಸ್ಯೆ',
  'Wrong Quantity': 'ತಪ್ಪು ಪ್ರಮಾಣ',
  'Fraud / Scam': 'ಮೋಸ',
  'Other': 'ಇತರೆ',

  'Recommended Crops for Your Farm': 'ನಿಮ್ಮ ಫಾರ್ಮ್‌ಗೆ ಶಿಫಾರಸು ಮಾಡಿದ ಬೆಳೆಗಳು',
  'Select This Crop': 'ಈ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ',
  'Soil Health Report': 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ವರದಿ',
  'Nutrient Recommendations': 'ಪೋಷಕಾಂಶ ಶಿಫಾರಸುಗಳು',
  'Irrigation Schedule': 'ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ',
  'Pest & Disease Forecasting': 'ಕೀಟ ಮತ್ತು ರೋಗ ಮುನ್ಸೂಚನೆ',

  'Search products...': 'ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ...',
  'No products found': 'ಉತ್ಪನ್ನಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
  'Cart': 'ಕಾರ್ಟ್',
  'Checkout': 'ಚೆಕ್‌ಔಟ್',
  'Continue Shopping': 'ಖರೀದಿ ಮುಂದುವರಿಸಿ',

  'Book': 'ಬುಕ್ ಮಾಡಿ',
  'Booking Summary': 'ಬುಕಿಂಗ್ ಸಾರಾಂಶ',
  'Enter pickup location': 'ಪಿಕಪ್ ಸ್ಥಳ ನಮೂದಿಸಿ',
  'Booking request saved.': 'ಬುಕಿಂಗ್ ವಿನಂತಿ ಉಳಿಸಲಾಗಿದೆ.',
  'No real equipment found': 'ನಿಜವಾದ ಉಪಕರಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ',

  'Loading...': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  'Save': 'ಉಳಿಸಿ',
  'Cancel': 'ರದ್ದುಮಾಡಿ',
  'Submit': 'ಸಲ್ಲಿಸಿ',
  'Close': 'ಮುಚ್ಚಿ',
  'Search': 'ಹುಡುಕಿ',
  'Edit': 'ಸಂಪಾದಿಸಿ',
  'Active': 'ಸಕ್ರಿಯ',
  'Pending': 'ಬಾಕಿ',
  'Completed': 'ಪೂರ್ಣಗೊಂಡಿದೆ',
  'Delivered': 'ವಿತರಿಸಲಾಗಿದೆ',
  'Available': 'ಲಭ್ಯ',
  'Booked': 'ಬುಕ್ ಆಗಿದೆ',
  'In Stock': 'ಸ್ಟಾಕ್‌ನಲ್ಲಿ ಇದೆ',
  'Out of Stock': 'ಸ್ಟಾಕ್ ಇಲ್ಲ',
  'Saving...': 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
  'Loading marketplace...': 'ಮಾರುಕಟ್ಟೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  'Loading market intelligence data...': 'ಮಾರುಕಟ್ಟೆ ಬುದ್ಧಿವಂತಿಕೆ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  'New Insurance Application': 'ಹೊಸ ವಿಮೆ ಅರ್ಜಿ',
  'Submit Insurance Application': 'ವಿಮೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
  'My Insurance Applications': 'ನನ್ನ ವಿಮೆ ಅರ್ಜಿಗಳು',
  'All Insurance Applications': 'ಎಲ್ಲ ವಿಮೆ ಅರ್ಜಿಗಳು',
  'Crop Insurance Management': 'ಬೆಳೆ ವಿಮೆ ನಿರ್ವಹಣೆ',
  'Total Applications': 'ಒಟ್ಟು ಅರ್ಜಿಗಳು',
  'Submitted': 'ಸಲ್ಲಿಸಲಾಗಿದೆ',
  'submitted': 'ಸಲ್ಲಿಸಲಾಗಿದೆ',
  'In Review': 'ಪರಿಶೀಲನೆಯಲ್ಲಿ',
  'in-review': 'ಪರಿಶೀಲನೆಯಲ್ಲಿ',
  'Approved': 'ಅನುಮೋದಿಸಲಾಗಿದೆ',
  'approved': 'ಅನುಮೋದಿಸಲಾಗಿದೆ',
  'Rejected': 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
  'rejected': 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
  'Sum Insured (Rs.)': 'ವಿಮೆ ಮೊತ್ತ (ರೂ.)',
  'Risk Cover': 'ಅಪಾಯ ಕವರ್',
  'Geo Tagged': 'ಜಿಯೋ ಟ್ಯಾಗ್',
  'Reputation Score': 'ಖ್ಯಾತಿ ಅಂಕ',
  'Active Crop Listings': 'ಸಕ್ರಿಯ ಬೆಳೆ ಪಟ್ಟಿಗಳು',
  'Live Farmer Map': 'ಲೈವ್ ರೈತ ನಕ್ಷೆ'
};

const originalTextNodes = new WeakMap();
const translatedAttributes = ['placeholder', 'title', 'aria-label'];

const translatePhrase = (value, language) => {
  if (language === 'en' || !value) return value;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return value;

  if (uiPhraseTranslations[normalized]) {
    return value.replace(normalized, uiPhraseTranslations[normalized]);
  }

  const lower = normalized.toLowerCase();
  if (uiPhraseTranslations[lower]) {
    return value.replace(normalized, uiPhraseTranslations[lower]);
  }

  if (normalized.startsWith('All ') && normalized.length > 4) {
    const item = normalized.slice(4);
    return `ಎಲ್ಲ ${uiPhraseTranslations[item] || item}`;
  }

  if (normalized.startsWith('Loading ') && normalized.endsWith('...')) {
    return 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...';
  }

  if (normalized.startsWith('No ') && normalized.endsWith(' found')) {
    return 'ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ';
  }

  return value;
};

const shouldSkipNode = (node) => {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest('script, style, noscript, code, pre, [data-no-translate], input, textarea'));
};

const applyDomTranslations = (language) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language === 'kn' ? 'kn' : 'en';

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    if (shouldSkipNode(node)) return;
    const original = originalTextNodes.get(node) || node.nodeValue;
    if (!originalTextNodes.has(node)) {
      originalTextNodes.set(node, original);
    }

    const translated = translatePhrase(original, language);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  });

  translatedAttributes.forEach((attr) => {
    document.querySelectorAll(`[${attr}]`).forEach((element) => {
      const originalAttr = `data-i18n-original-${attr}`;
      const original = element.getAttribute(originalAttr) || element.getAttribute(attr);
      if (!element.hasAttribute(originalAttr) && original) {
        element.setAttribute(originalAttr, original);
      }
      const translated = translatePhrase(original, language);
      if (translated && element.getAttribute(attr) !== translated) {
        element.setAttribute(attr, translated);
      }
    });
  });
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('appLanguage') || 'en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'kn' : 'en');
  };

  const t = (key) => {
    return translations[language]?.[key] || translatePhrase(translations.en?.[key] || key, language);
  };

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    applyDomTranslations(language);

    let scheduled = false;
    const scheduleTranslate = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyDomTranslations(language);
      });
    };

    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((mutation) => (
        mutation.type === 'childList' ||
        mutation.type === 'characterData' ||
        translatedAttributes.includes(mutation.attributeName)
      ));
      if (relevant) scheduleTranslate();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatedAttributes
    });

    return () => observer.disconnect();
  }, [language]);

  const value = {
    language,
    toggleLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
