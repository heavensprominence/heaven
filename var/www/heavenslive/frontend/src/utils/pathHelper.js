// Domain-aware path helper
export const getBasePath = () => {
  return window.location.hostname === 'credon.heavenslive.com' ? '' : '/credon';
};

export const getLoginPath = () => {
  return getBasePath() + '/login';
};

export const getRegisterPath = () => {
  return getBasePath() + '/register';
};

export const getDashboardPath = () => {
  return getBasePath() + '/';
};
