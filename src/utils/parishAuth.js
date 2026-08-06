// src/utils/parishAuth.js

export const isParishUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'parish' && !!localStorage.getItem('token');
  } catch {
    return false;
  }
};

export const getParishUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const getParishId = () => {
  const user = getParishUser();
  return user.parishId || '';
};

export const getParishName = () => {
  const user = getParishUser();
  return user.parishName || '';
};