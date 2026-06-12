import { ref, push, set, update, get, onValue } from 'firebase/database';
import { database } from '../config/firebase';

const filterActivitiesByFarmer = (data, farmerId) => (
  data
    ? Object.values(data)
        .filter((activity) => activity.farmerId === farmerId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : []
);

// Create a new farming activity (sowing/harvesting)
export const createActivity = async (farmerId, activityData) => {
  try {
    const activitiesRef = ref(database, 'farmingActivities');
    const newActivityRef = push(activitiesRef);
    
    const activity = {
      ...activityData,
      id: newActivityRef.key,
      farmerId,
      createdAt: new Date().toISOString(),
      status: activityData.type === 'sowing' ? 'sown' : 'harvested'
    };
    
    await set(newActivityRef, activity);
    return { success: true, id: newActivityRef.key };
  } catch (error) {
    console.error('Error creating activity:', error);
    return { success: false, error: error.message };
  }
};

// Get activities for a farmer
export const getFarmerActivities = (farmerId, callback) => {
  const activitiesRef = ref(database, 'farmingActivities');

  return onValue(activitiesRef, (snapshot) => {
    callback(filterActivitiesByFarmer(snapshot.val(), farmerId));
  }, (error) => {
    console.error('Error getting farmer activities:', error);
    callback([]);
  });
};

// Update activity status
export const updateActivity = async (activityId, updates) => {
  try {
    const activityRef = ref(database, `farmingActivities/${activityId}`);
    await update(activityRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating activity:', error);
    return { success: false, error: error.message };
  }
};

// Get activity statistics
export const getActivityStats = async (farmerId) => {
  try {
    const activitiesRef = ref(database, 'farmingActivities');

    const snapshot = await get(activitiesRef);
    if (!snapshot.exists()) {
      return { totalSown: 0, totalHarvested: 0, totalArea: 0, crops: [] };
    }

    const activities = filterActivitiesByFarmer(snapshot.val(), farmerId);
    const sowingActivities = activities.filter(a => a.type === 'sowing');
    const harvestingActivities = activities.filter(a => a.type === 'harvesting');
    
    const totalArea = sowingActivities.reduce((sum, a) => sum + (parseFloat(a.area) || 0), 0);
    const crops = [...new Set(activities.map(a => a.crop))];
    
    return {
      totalSown: sowingActivities.length,
      totalHarvested: harvestingActivities.length,
      totalArea: totalArea.toFixed(2),
      crops
    };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return { totalSown: 0, totalHarvested: 0, totalArea: 0, crops: [] };
  }
};
