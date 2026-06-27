const getApiBase = () => {
  if (__DEV__) return "http://192.168.1.77:5000";
  return "https://pehrawa-store.up.railway.app";
};

export const API_BASE = getApiBase();
export const RAZORPAY_KEY_ID = "rzp_live_T6aA0kd4BdVC3q";
