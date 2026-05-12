export const DURATION_OPTIONS = [
    { value: '1day', label: '1 Day', days: 1 },
    { value: '2weeks', label: '2 Weeks', days: 14 },
    { value: '1year', label: '1 Year', days: 365 },
    { value: 'forever', label: 'Forever', days: null }
];

export const getExpirationDate = (duration) => {
    const option = DURATION_OPTIONS.find(o => o.value === duration);
    if (!option || !option.days) return null;
    
    const date = new Date();
    date.setDate(date.getDate() + option.days);
    return date;
};
