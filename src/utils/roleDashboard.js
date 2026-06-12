export const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':    return '/admin';
    case 'buyer':    return '/buyer-dashboard';
    case 'customer': return '/customer-dashboard';
    case 'farmer':   return '/farmer-dashboard';
    default:         return '/';
  }
};
