// Domain-aware path helper for shop
export const getBasePath = () => {
    const hostname = window.location.hostname;
    if (hostname === 'shop.heavenslive.com') return '';
    if (hostname === 'credon.heavenslive.com') return '';
    return '/shop';
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
