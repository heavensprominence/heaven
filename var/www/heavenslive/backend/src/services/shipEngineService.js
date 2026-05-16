const ShipEngine = require('shipengine');

// Initialize ShipEngine client
const shipengine = new ShipEngine({
    apiKey: process.env.SHIPENGINE_API_KEY
});

// Default ship from address (seller's location)
const shipFrom = {
    name: 'HeavensLive Shop Seller',
    phone: '+1-555-555-5555',
    addressLine1: '123 Seller Street',
    cityLocality: 'Toronto',
    stateProvince: 'ON',
    postalCode: 'M5V 2T6',
    countryCode: 'CA',
    addressResidentialIndicator: 'yes'
};

/**
 * Get shipping rates for a package
 * @param {Object} shipTo - Destination address
 * @param {Object} packageInfo - Package weight and dimensions
 * @returns {Array} Shipping rates
 */
async function getShippingRates(shipTo, packageInfo) {
    try {
        // If no API key, return mock rates
        if (!process.env.SHIPENGINE_API_KEY || process.env.SHIPENGINE_API_KEY === 'your_shipengine_api_key_here') {
            console.log('⚠️ Using mock shipping rates (no ShipEngine API key)');
            return getMockRates(packageInfo);
        }

        const shipmentDetails = {
            shipTo: {
                name: shipTo.name || 'Customer',
                phone: shipTo.phone || '+1-555-555-5555',
                addressLine1: shipTo.addressLine1,
                addressLine2: shipTo.addressLine2 || '',
                cityLocality: shipTo.city,
                stateProvince: shipTo.state,
                postalCode: shipTo.postalCode,
                countryCode: shipTo.countryCode || 'US',
                addressResidentialIndicator: 'yes'
            },
            shipFrom: {
                ...shipFrom,
                ...shipTo.shipFrom
            },
            packages: [{
                weight: {
                    value: packageInfo.weightOz || 16,
                    unit: 'ounce'
                },
                dimensions: {
                    unit: 'inch',
                    length: packageInfo.length || 12,
                    width: packageInfo.width || 12,
                    height: packageInfo.height || 12
                }
            }],
            rateOptions: {
                carrierIds: process.env.SHIPENGINE_CARRIER_IDS?.split(',') || [
                    'se-423887', // USPS
                    'se-423888', // FedEx
                    'se-423889'  // UPS
                ]
            }
        };

        const result = await shipengine.getRatesWithShipmentDetails(shipmentDetails);
        
        // Format the rates
        const rates = result.rateResponse.rates.map(rate => ({
            carrier: rate.carrierFriendlyName,
            service: rate.serviceType,
            rate_cents: Math.round(rate.shippingAmount.amount * 100),
            estimated_days: rate.estimatedDeliveryDays || 5,
            id: rate.rateId,
            carrierCode: rate.carrierCode,
            serviceCode: rate.serviceCode,
            deliveryDays: rate.deliveryDays,
            guaranteedService: rate.guaranteedService
        }));

        // Add free local pickup option
        rates.push({
            carrier: 'Local Pickup',
            service: 'Free Local Pickup',
            rate_cents: 0,
            estimated_days: 0,
            id: 'local_pickup'
        });

        return rates;
    } catch (error) {
        console.error('ShipEngine API error:', error.message);
        // Fallback to mock rates
        return getMockRates(packageInfo);
    }
}

/**
 * Create a shipping label
 * @param {String} rateId - The rate ID from getShippingRates
 * @returns {Object} Label information
 */
async function createLabel(rateId) {
    try {
        if (!process.env.SHIPENGINE_API_KEY || process.env.SHIPENGINE_API_KEY === 'your_shipengine_api_key_here') {
            return {
                trackingNumber: 'MOCK-' + Date.now(),
                labelUrl: null,
                carrier: 'Mock Carrier'
            };
        }

        const label = await shipengine.createLabelFromRate({
            rateId: rateId,
            validateAddress: 'no_validation',
            labelLayout: '4x6',
            labelFormat: 'pdf',
            labelDownloadType: 'url'
        });

        return {
            trackingNumber: label.trackingNumber,
            labelUrl: label.labelDownload.href,
            carrier: label.carrierCode,
            trackingStatus: label.trackingStatus,
            shipDate: label.shipDate,
            deliveryDate: label.estimatedDeliveryDate
        };
    } catch (error) {
        console.error('Create label error:', error.message);
        throw error;
    }
}

/**
 * Track a shipment
 * @param {String} trackingNumber - The tracking number
 * @param {String} carrierCode - The carrier code (usps, fedex, ups)
 * @returns {Object} Tracking information
 */
async function trackShipment(trackingNumber, carrierCode) {
    try {
        if (!process.env.SHIPENGINE_API_KEY) {
            return {
                status: 'in_transit',
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            };
        }

        const tracking = await shipengine.trackUsingCarrierCodeAndTrackingNumber({
            carrierCode: carrierCode,
            trackingNumber: trackingNumber
        });

        return {
            status: tracking.statusCode,
            statusDescription: tracking.statusDescription,
            estimatedDelivery: tracking.estimatedDeliveryDate,
            events: tracking.events?.map(e => ({
                occurredAt: e.occurredAt,
                description: e.eventDescription,
                city: e.cityLocality,
                state: e.stateProvince
            }))
        };
    } catch (error) {
        console.error('Track shipment error:', error.message);
        return null;
    }
}

/**
 * Validate an address
 * @param {Object} address - Address to validate
 * @returns {Object} Validated address
 */
async function validateAddress(address) {
    try {
        if (!process.env.SHIPENGINE_API_KEY) {
            return { ...address, validated: true };
        }

        const validation = await shipengine.validateAddresses([{
            name: address.name || 'Customer',
            phone: address.phone || '',
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || '',
            cityLocality: address.city,
            stateProvince: address.state,
            postalCode: address.postalCode,
            countryCode: address.countryCode || 'US',
            addressResidentialIndicator: 'yes'
        }]);

        const validated = validation[0];
        return {
            addressLine1: validated.matchedAddress.addressLine1,
            addressLine2: validated.matchedAddress.addressLine2 || '',
            city: validated.matchedAddress.cityLocality,
            state: validated.matchedAddress.stateProvince,
            postalCode: validated.matchedAddress.postalCode,
            countryCode: validated.matchedAddress.countryCode,
            validated: validated.status === 'verified',
            original: address
        };
    } catch (error) {
        console.error('Address validation error:', error.message);
        return { ...address, validated: false };
    }
}

// Mock rates for testing without API key
function getMockRates(packageInfo) {
    const baseRate = Math.max(5, (packageInfo.weightOz || 16) * 0.5);
    
    return [
        {
            carrier: 'USPS',
            service: 'Priority Mail',
            rate_cents: Math.round(baseRate * 100 * 1.2),
            estimated_days: 3,
            id: 'mock_usps_priority'
        },
        {
            carrier: 'USPS',
            service: 'Ground Advantage',
            rate_cents: Math.round(baseRate * 100 * 0.8),
            estimated_days: 5,
            id: 'mock_usps_ground'
        },
        {
            carrier: 'FedEx',
            service: '2Day',
            rate_cents: Math.round(baseRate * 100 * 1.8),
            estimated_days: 2,
            id: 'mock_fedex_2day'
        },
        {
            carrier: 'UPS',
            service: 'Ground',
            rate_cents: Math.round(baseRate * 100 * 1.1),
            estimated_days: 4,
            id: 'mock_ups_ground'
        },
        {
            carrier: 'Local Pickup',
            service: 'Free Local Pickup',
            rate_cents: 0,
            estimated_days: 0,
            id: 'local_pickup'
        }
    ];
}

module.exports = {
    getShippingRates,
    createLabel,
    trackShipment,
    validateAddress
};