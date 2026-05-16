// Mock shipping rates - replace with ShipEngine API later
const getShippingRates = async (weightOz, dimensions, destinationZip, originZip = '10001') => {
    // Mock rates based on weight
    const baseRate = Math.max(5, weightOz * 0.5);
    
    return [
        {
            carrier: 'USPS',
            service: 'Priority Mail',
            rate_cents: Math.round(baseRate * 100 * 1.2),
            estimated_days: 3,
            id: 'usps_priority'
        },
        {
            carrier: 'USPS',
            service: 'Ground Advantage',
            rate_cents: Math.round(baseRate * 100 * 0.8),
            estimated_days: 5,
            id: 'usps_ground'
        },
        {
            carrier: 'FedEx',
            service: '2Day',
            rate_cents: Math.round(baseRate * 100 * 1.8),
            estimated_days: 2,
            id: 'fedex_2day'
        },
        {
            carrier: 'UPS',
            service: 'Ground',
            rate_cents: Math.round(baseRate * 100 * 1.1),
            estimated_days: 4,
            id: 'ups_ground'
        },
        {
            carrier: 'Local Pickup',
            service: 'Free Local Pickup',
            rate_cents: 0,
            estimated_days: 0,
            id: 'local_pickup'
        }
    ];
};

module.exports = { getShippingRates };
