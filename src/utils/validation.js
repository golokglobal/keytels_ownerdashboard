// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone);
};

// Password validation
export const isValidPassword = (password) => {
  return password.length >= 6;
};

// Required field validation
export const isRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};
