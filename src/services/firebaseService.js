import { ref, set, push, get, onValue, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../config/firebase';

// Listings Operations
export const createListing = async (userId, listingData) => {
  try {
    const listingsRef = ref(database, 'listings');
    const newListingRef = push(listingsRef);
    
    const listing = {
      ...listingData,
      userId,
      createdAt: new Date().toISOString(),
      status: 'active',
      id: newListingRef.key
    };
    
    await set(newListingRef, listing);
    return { success: true, id: newListingRef.key };
  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, error: error.message };
  }
};

export const getListings = (callback) => {
  const listingsRef = ref(database, 'listings');
  return onValue(listingsRef, (snapshot) => {
    const data = snapshot.val();
    const listings = data ? Object.values(data) : [];
    callback(listings);
  });
};

export const getCollection = (collectionPath, callback) => {
  const collectionRef = ref(database, collectionPath);
  return onValue(collectionRef, (snapshot) => {
    const data = snapshot.val();
    const items = data ? Object.entries(data).map(([id, value]) => ({
      id,
      ...value
    })) : [];
    callback(items);
  });
};

export const getCollectionOnce = async (collectionPath) => {
  const collectionRef = ref(database, collectionPath);
  const snapshot = await get(collectionRef);
  const data = snapshot.val();
  return data ? Object.entries(data).map(([id, value]) => ({
    id,
    ...value
  })) : [];
};

export const getUserListings = (userId, callback) => {
  const listingsRef = ref(database, 'listings');
  const userListingsQuery = query(listingsRef, orderByChild('userId'), equalTo(userId));
  
  return onValue(userListingsQuery, (snapshot) => {
    const data = snapshot.val();
    const listings = data ? Object.values(data) : [];
    callback(listings);
  });
};

export const updateListing = async (listingId, updates) => {
  try {
    const listingRef = ref(database, `listings/${listingId}`);
    await update(listingRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating listing:', error);
    return { success: false, error: error.message };
  }
};

export const deleteListing = async (listingId) => {
  try {
    const listingRef = ref(database, `listings/${listingId}`);
    await remove(listingRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting listing:', error);
    return { success: false, error: error.message };
  }
};

// Orders Operations
export const createOrder = async (orderData) => {
  try {
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    
    const order = {
      ...orderData,
      id: newOrderRef.key,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    await set(newOrderRef, order);
    return { success: true, id: newOrderRef.key };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

export const getOrders = (callback) => {
  const ordersRef = ref(database, 'orders');
  return onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    const orders = data ? Object.values(data) : [];
    callback(orders);
  });
};

export const getUserOrders = (userId, callback) => {
  const ordersRef = ref(database, 'orders');
  const userOrdersQuery = query(ordersRef, orderByChild('buyerId'), equalTo(userId));
  
  return onValue(userOrdersQuery, (snapshot) => {
    const data = snapshot.val();
    const orders = data ? Object.values(data) : [];
    callback(orders);
  });
};

export const getFarmerOrders = (farmerId, callback) => {
  const ordersRef = ref(database, 'orders');
  const farmerOrdersQuery = query(ordersRef, orderByChild('farmerId'), equalTo(farmerId));
  
  return onValue(farmerOrdersQuery, (snapshot) => {
    const data = snapshot.val();
    const orders = data ? Object.values(data) : [];
    callback(orders);
  });
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await update(orderRef, { 
      status,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
};

// User Profile Operations
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = (callback) => {
  const usersRef = ref(database, 'users');
  return onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    const users = data ? Object.entries(data).map(([uid, userData]) => ({
      uid,
      ...userData
    })) : [];
    callback(users);
  });
};

// Analytics Operations
export const saveAnalyticsData = async (type, data) => {
  try {
    const analyticsRef = ref(database, `analytics/${type}`);
    const newDataRef = push(analyticsRef);
    
    await set(newDataRef, {
      ...data,
      timestamp: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving analytics:', error);
    return { success: false, error: error.message };
  }
};

export const getAnalyticsData = (type, callback) => {
  const analyticsRef = ref(database, `analytics/${type}`);
  return onValue(analyticsRef, (snapshot) => {
    const data = snapshot.val();
    const analytics = data ? Object.values(data) : [];
    callback(analytics);
  });
};

// Activity Log Operations
export const logActivity = async (userId, activityData) => {
  try {
    const activityRef = ref(database, `activities/${userId}`);
    const newActivityRef = push(activityRef);
    
    await set(newActivityRef, {
      ...activityData,
      timestamp: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message };
  }
};

export const getUserActivities = (userId, callback) => {
  const activityRef = ref(database, `activities/${userId}`);
  return onValue(activityRef, (snapshot) => {
    const data = snapshot.val();
    const activities = data ? Object.values(data).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ) : [];
    callback(activities);
  });
};

// System Logs for Admin
export const logSystemActivity = async (activityData) => {
  try {
    const logsRef = ref(database, 'systemLogs');
    const newLogRef = push(logsRef);
    
    await set(newLogRef, {
      ...activityData,
      timestamp: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging system activity:', error);
    return { success: false, error: error.message };
  }
};

export const getSystemLogs = (callback, limit = 50) => {
  const logsRef = ref(database, 'systemLogs');
  return onValue(logsRef, (snapshot) => {
    const data = snapshot.val();
    const logs = data ? Object.values(data)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit) : [];
    callback(logs);
  });
};

// Statistics Operations
export const updateStatistics = async (statType, value) => {
  try {
    const statsRef = ref(database, `statistics/${statType}`);
    await set(statsRef, {
      value,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating statistics:', error);
    return { success: false, error: error.message };
  }
};

export const getStatistics = (callback) => {
  const statsRef = ref(database, 'statistics');
  return onValue(statsRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || {});
  });
};

export const getInputProducts = (callback) => getCollection('inputProducts', callback);

export const getEquipmentListings = (callback) => getCollection('equipment', callback);

export const getGroupBuyingOpportunities = (callback) => getCollection('groupBuyingOpportunities', callback);

// Crop Insurance Services
export const createCropInsuranceApplication = async (userId, applicationData) => {
  try {
    const insuranceRef = ref(database, 'cropInsuranceApplications');
    const newApplicationRef = push(insuranceRef);

    await set(newApplicationRef, {
      ...applicationData,
      id: newApplicationRef.key,
      userId,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await logActivity(userId, {
      action: 'Submitted crop insurance application',
      details: `${applicationData.crop} - ${applicationData.season}`,
      type: 'insurance'
    });

    return { success: true, id: newApplicationRef.key };
  } catch (error) {
    console.error('Error creating crop insurance application:', error);
    return { success: false, error: error.message };
  }
};

export const getCropInsuranceApplications = (callback) => (
  getCollection('cropInsuranceApplications', callback)
);

export const getUserCropInsuranceApplications = (userId, callback) => {
  const insuranceRef = ref(database, 'cropInsuranceApplications');
  const userInsuranceQuery = query(insuranceRef, orderByChild('userId'), equalTo(userId));

  return onValue(userInsuranceQuery, (snapshot) => {
    const data = snapshot.val();
    const applications = data ? Object.values(data) : [];
    callback(applications.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)));
  });
};

export const updateCropInsuranceStatus = async (applicationId, status, note = '') => {
  try {
    const applicationRef = ref(database, `cropInsuranceApplications/${applicationId}`);
    await update(applicationRef, {
      status,
      adminNote: note,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating crop insurance status:', error);
    return { success: false, error: error.message };
  }
};

export const createEquipmentBooking = async (bookingData) => {
  try {
    const bookingsRef = ref(database, 'equipmentBookings');
    const newBookingRef = push(bookingsRef);

    await set(newBookingRef, {
      ...bookingData,
      id: newBookingRef.key,
      bookedAt: Date.now(),
      status: bookingData.status || 'pending'
    });

    return { success: true, id: newBookingRef.key };
  } catch (error) {
    console.error('Error creating equipment booking:', error);
    return { success: false, error: error.message };
  }
};

// Transporter Management
export const getTransporters = (callback) => {
  const transportersRef = ref(database, 'transporters');
  return onValue(transportersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const transportersArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(transportersArray);
    } else {
      callback([]);
    }
  });
};

export const createTransporter = async (transporterData) => {
  try {
    const transportersRef = ref(database, 'transporters');
    const newTransporterRef = push(transportersRef);
    
    await set(newTransporterRef, {
      ...transporterData,
      createdAt: Date.now(),
      status: 'active',
      rating: transporterData.rating || 5.0,
      deliveries: transporterData.deliveries || 0
    });
    
    return { success: true, id: newTransporterRef.key };
  } catch (error) {
    console.error('Error creating transporter:', error);
    return { success: false, error: error.message };
  }
};

export const updateTransporter = async (transporterId, updates) => {
  try {
    const transporterRef = ref(database, `transporters/${transporterId}`);
    await update(transporterRef, {
      ...updates,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating transporter:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTransporter = async (transporterId) => {
  try {
    const transporterRef = ref(database, `transporters/${transporterId}`);
    await remove(transporterRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting transporter:', error);
    return { success: false, error: error.message };
  }
};

// Transport Bookings Management
export const createTransportBooking = async (bookingData) => {
  try {
    const bookingsRef = ref(database, 'transportBookings');
    const newBookingRef = push(bookingsRef);
    
    await set(newBookingRef, {
      ...bookingData,
      bookingId: newBookingRef.key,
      bookedAt: Date.now(),
      status: bookingData.status || 'booked'
    });
    
    return { success: true, id: newBookingRef.key };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
};

export const getTransportBookings = (userId, callback) => {
  const bookingsRef = ref(database, 'transportBookings');
  return onValue(bookingsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const bookingsArray = Object.keys(data)
        .map(key => ({
          id: key,
          ...data[key]
        }))
        .filter(booking => 
          booking.buyerId === userId || booking.farmerId === userId
        );
      callback(bookingsArray);
    } else {
      callback([]);
    }
  });
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const bookingRef = ref(database, `transportBookings/${bookingId}`);
    await update(bookingRef, {
      status,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { success: false, error: error.message };
  }
};

// Admin User Management
export const deleteUser = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await remove(userRef);
    
    await logSystemActivity({
      user: 'Admin',
      action: 'delete_user',
      details: `Deleted user ${userId}`,
      type: 'warning'
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

export const suspendUser = async (userId, suspended = true) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, {
      suspended,
      suspendedAt: suspended ? new Date().toISOString() : null
    });
    
    await logSystemActivity({
      user: 'Admin',
      action: suspended ? 'suspend_user' : 'unsuspend_user',
      details: `${suspended ? 'Suspended' : 'Unsuspended'} user ${userId}`,
      type: 'warning'
    });
    return { success: true };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: error.message };
  }
};

// Order Rating
export const updateOrderRating = async (orderId, rating) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await update(orderRef, { farmerRating: rating });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Group Buying
export const createGroupBuyingOpportunity = async (data) => {
  try {
    const gbRef = ref(database, 'groupBuyingOpportunities');
    const newRef = push(gbRef);
    await set(newRef, {
      ...data,
      id: newRef.key,
      createdAt: new Date().toISOString(),
      status: 'active',
      currentParticipants: 0
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const joinGroupBuying = async (opportunityId, userId) => {
  try {
    const oppRef = ref(database, `groupBuyingOpportunities/${opportunityId}`);
    const snap = await get(oppRef);
    if (!snap.exists()) return { success: false, error: 'Not found' };
    const current = Number(snap.val().currentParticipants || 0);
    await update(oppRef, {
      currentParticipants: current + 1,
      [`participants/${userId}`]: true
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Equipment Management
export const createEquipmentListing = async (data) => {
  try {
    const eqRef = ref(database, 'equipment');
    const newRef = push(eqRef);
    await set(newRef, {
      ...data,
      id: newRef.key,
      createdAt: new Date().toISOString(),
      available: true,
      rating: 0,
      reviews: 0
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateEquipmentAvailability = async (equipmentId, available) => {
  try {
    const eqRef = ref(database, `equipment/${equipmentId}`);
    await update(eqRef, { available });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Input Products Management
export const createInputProduct = async (data) => {
  try {
    const ipRef = ref(database, 'inputProducts');
    const newRef = push(ipRef);
    await set(newRef, {
      ...data,
      id: newRef.key,
      createdAt: new Date().toISOString(),
      inStock: true,
      rating: 0
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteInputProduct = async (productId) => {
  try {
    await remove(ref(database, `inputProducts/${productId}`));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteEquipmentListing = async (equipmentId) => {
  try {
    await remove(ref(database, `equipment/${equipmentId}`));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteGroupBuyingOpportunity = async (id) => {
  try {
    await remove(ref(database, `groupBuyingOpportunities/${id}`));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Buyer Verification Operations
export const submitBuyerVerification = async (userId, data) => {
  try {
    const verRef = ref(database, `buyerVerifications/${userId}`);
    await set(verRef, {
      ...data,
      userId,
      status: 'pending',
      submittedAt: new Date().toISOString()
    });
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, { verificationStatus: 'pending' });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBuyerVerification = (userId, callback) => {
  const verRef = ref(database, `buyerVerifications/${userId}`);
  return onValue(verRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
};

// Dispute Operations
export const createDispute = async (disputeData) => {
  try {
    const disputesRef = ref(database, 'disputes');
    const newRef = push(disputesRef);
    await set(newRef, {
      ...disputeData,
      id: newRef.key,
      status: 'open',
      createdAt: new Date().toISOString()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getDisputes = (userId, callback) => {
  const disputesRef = ref(database, 'disputes');
  return onValue(disputesRef, (snapshot) => {
    const data = snapshot.val();
    const all = data ? Object.values(data) : [];
    callback(all.filter((d) => d.raisedBy === userId || d.againstUserId === userId));
  });
};

export const getAllDisputes = (callback) => {
  const disputesRef = ref(database, 'disputes');
  return onValue(disputesRef, (snapshot) => {
    const data = snapshot.val();
    callback(data ? Object.values(data) : []);
  });
};

export const updateDisputeStatus = async (disputeId, status, resolution = '') => {
  try {
    const disputeRef = ref(database, `disputes/${disputeId}`);
    await update(disputeRef, {
      status,
      resolution,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const verifyUser = async (userId, verified = true) => {
  try {
    const now = new Date().toISOString();

    // Update user record
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, { verified, verifiedAt: verified ? now : null });

    // Sync buyerVerifications if an entry exists
    const buyerVerRef = ref(database, `buyerVerifications/${userId}`);
    const buyerVerSnap = await get(buyerVerRef);
    if (buyerVerSnap.exists()) {
      await update(buyerVerRef, {
        status: verified ? 'verified' : 'unverified',
        verifiedAt: verified ? now : null
      });
    }

    // Sync farmerVerified on all listings owned by this user
    const listingsRef = ref(database, 'listings');
    const listingsSnap = await get(listingsRef);
    if (listingsSnap.exists()) {
      const updates = {};
      Object.entries(listingsSnap.val()).forEach(([key, listing]) => {
        if (listing.userId === userId) {
          updates[`listings/${key}/farmerVerified`] = verified;
        }
      });
      if (Object.keys(updates).length) {
        const rootRef = ref(database, '/');
        await update(rootRef, updates);
      }
    }

    await logSystemActivity({
      user: 'Admin',
      action: verified ? 'verify_user' : 'unverify_user',
      details: `${verified ? 'Verified' : 'Unverified'} user ${userId}`,
      type: 'success'
    });
    return { success: true };
  } catch (error) {
    console.error('Error verifying user:', error);
    return { success: false, error: error.message };
  }
};
