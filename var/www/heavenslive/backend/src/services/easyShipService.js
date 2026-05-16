/**
 * EasyShip Shipping Service
 * Multi-carrier shipping with 3+ courier options per shipment.
 * Tax, duties, landed cost calculated automatically.
 * 
 * API: https://developers.easyship.com
 * Env: EASYSHIP_API_KEY, EASYSHIP_API_SECRET (optional for webhooks)
 */
require('dotenv').config();

const EASYSHIP_URL = process.env.EASYSHIP_SANDBOX === 'true'
  ? 'https://sandbox-api.easyship.com/2023-01'
  : 'https://api.easyship.com/2023-01';

const EASYSHIP_KEY = process.env.EASYSHIP_API_KEY;

// Currency → EasyShip currency code mapping
const currencyMap = {
  'USD':'USD','CAD':'CAD','EUR':'EUR','GBP':'GBP','JPY':'JPY',
  'CNY':'CNY','AUD':'AUD','NZD':'NZD','SGD':'SGD','HKD':'HKD',
};

function toEasyShipCurrency(code) {
  const base = (code || 'USD').replace('Credon-','');
  return currencyMap[base] || 'USD';
}

async function easyShipRequest(method, endpoint, body = null) {
  if (!EASYSHIP_KEY) throw new Error('EASYSHIP_API_KEY not configured');

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${EASYSHIP_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${EASYSHIP_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    const errMsg = data.errors?.map(e => e.message || e.code).join(', ') || response.statusText;
    throw new Error(`EasyShip ${response.status}: ${errMsg}`);
  }

  return data;
}

/**
 * Get shipping rates from all available couriers.
 * Returns minimum 3 courier options.
 */
async function getShippingRates(shipFrom, shipTo, packages, options = {}) {
  if (!EASYSHIP_KEY) return getMockRates(shipTo, packages);

  try {
    const body = {
      origin_address: {
        line_1: shipFrom.addressLine1 || '123 Seller St',
        line_2: shipFrom.addressLine2 || '',
        city: shipFrom.city || 'Toronto',
        state: shipFrom.state || 'ON',
        postal_code: shipFrom.postalCode || 'M5V2T6',
        country_alpha2: (shipFrom.countryCode || 'CA').toUpperCase(),
        contact_name: shipFrom.name || 'Seller',
        contact_phone: shipFrom.phone || '+14165551234',
      },
      destination_address: {
        line_1: shipTo.addressLine1,
        line_2: shipTo.addressLine2 || '',
        city: shipTo.city,
        state: shipTo.state || '',
        postal_code: shipTo.postalCode,
        country_alpha2: (shipTo.countryCode || 'US').toUpperCase(),
        contact_name: shipTo.name || 'Customer',
        contact_phone: shipTo.phone || '',
      },
      parcels: packages.map(p => ({
        total_actual_weight: (p.weightOz || 16) * 0.02835, // oz → kg
        box: {
          length: (p.length || 12) * 2.54,   // inches → cm
          width: (p.width || 12) * 2.54,
          height: (p.height || 12) * 2.54,
        },
        items: p.items || [{ description: p.description || 'Merchandise', quantity: 1 }],
      })),
      courier_selection: {
        required_couriers: options.minCouriers || 3,
        show_all: true,
      },
    };

    // Add item value for insurance + duties
    if (options.orderValue) {
      body.parcels[0].items[0].actual_weight = body.parcels[0].total_actual_weight;
      body.parcels[0].items[0].declared_currency = toEasyShipCurrency(options.currency);
      body.parcels[0].items[0].declared_customs_value = options.orderValue;
    }

    const result = await easyShipRequest('POST', '/rates', body);

    // Format rates — ensure at least 3 couriers
    const rates = (result.rates || []).map(rate => ({
      courier_id: rate.courier_id,
      courier_name: rate.courier_name,
      courier_logo: rate.courier_logo,
      service_name: rate.service_name || rate.courier_name,
      total_cents: Math.round(rate.total_charge * 100),
      shipping_cents: Math.round(rate.shipping_charge * 100),
      fuel_surcharge_cents: Math.round((rate.fuel_surcharge || 0) * 100),
      tax_cents: Math.round((rate.sales_tax || 0) * 100),
      currency: rate.currency || 'USD',
      min_delivery_days: rate.min_delivery_time,
      max_delivery_days: rate.max_delivery_time,
      delivery_date: rate.earliest_delivery_date,
      rate_id: rate.rate_id,
      courier_type: rate.courier_type,
      incoterms: rate.incoterms || 'DDP', // Delivery Duty Paid
      is_ddp: rate.courier_type !== 'international',
    }));

    // Add free local pickup
    rates.push({
      courier_id: 'local_pickup',
      courier_name: 'Local Pickup',
      service_name: 'Free In-Person Pickup',
      total_cents: 0,
      shipping_cents: 0,
      fuel_surcharge_cents: 0,
      tax_cents: 0,
      currency: 'USD',
      min_delivery_days: 0,
      max_delivery_days: 0,
      rate_id: 'local_pickup',
      is_pickup: true,
    });

    // Sort by price, ensure at least 3 distinct couriers
    const sorted = rates.sort((a, b) => a.total_cents - b.total_cents);
    const seenCouriers = new Set();
    const diverse = [];
    for (const rate of sorted) {
      if (!seenCouriers.has(rate.courier_name) || rate.is_pickup) {
        seenCouriers.add(rate.courier_name);
        diverse.push(rate);
      }
    }

    return diverse.slice(0, Math.max(4, options.minCouriers || 3));
  } catch (error) {
    console.error('EasyShip rates error:', error.message);
    return getMockRates(shipTo, packages);
  }
}

/**
 * Create a shipment and generate label.
 */
async function createShipment(shipFrom, shipTo, packages, rateId, options = {}) {
  if (!EASYSHIP_KEY) {
    return {
      shipment_id: 'MOCK-' + Date.now(),
      tracking_number: 'EZ' + Math.random().toString(36).substr(2, 10).toUpperCase(),
      label_url: null,
      courier_name: 'Mock Courier',
      status: 'created',
    };
  }

  try {
    const body = {
      origin_address: {
        line_1: shipFrom.addressLine1,
        city: shipFrom.city,
        state: shipFrom.state || '',
        postal_code: shipFrom.postalCode,
        country_alpha2: (shipFrom.countryCode || 'CA').toUpperCase(),
        contact_name: shipFrom.name,
        contact_phone: shipFrom.phone || '',
      },
      destination_address: {
        line_1: shipTo.addressLine1,
        line_2: shipTo.addressLine2 || '',
        city: shipTo.city,
        state: shipTo.state || '',
        postal_code: shipTo.postalCode,
        country_alpha2: (shipTo.countryCode || 'US').toUpperCase(),
        contact_name: shipTo.name,
        contact_phone: shipTo.phone || '',
      },
      parcels: packages.map(p => ({
        total_actual_weight: (p.weightOz || 16) * 0.02835,
        box: {
          length: (p.length || 12) * 2.54,
          width: (p.width || 12) * 2.54,
          height: (p.height || 12) * 2.54,
        },
        items: p.items || [{ description: 'Merchandise', quantity: 1, declared_currency: 'USD', declared_customs_value: options.orderValue || 10 }],
      })),
      selected_courier_id: rateId,
      shipping_settings: {
        additional_services: {
          qr_code: options.qrCode !== false,
        },
      },
      label_generate: true,
      label_format: options.labelFormat || 'pdf',
      label_size: options.labelSize || '4x6',
      insurance: options.insure ? { is_insured: true, insured_value: options.orderValue, insured_currency: 'USD' } : { is_insured: false },
    };

    const result = await easyShipRequest('POST', '/shipments', body);
    const shipment = result.shipment || result;

    return {
      shipment_id: shipment.easyship_shipment_id,
      tracking_number: shipment.tracking_number,
      label_url: shipment.label_url || shipment.documents?.[0]?.url,
      courier_name: shipment.courier_name,
      courier_logo: shipment.courier_logo,
      status: shipment.shipment_state,
      shipping_fee: shipment.total_charge,
      currency: shipment.currency,
      estimated_delivery: shipment.estimated_delivery_date,
      created_at: shipment.created_at,
    };
  } catch (error) {
    console.error('EasyShip create shipment error:', error.message);
    throw error;
  }
}

/**
 * Track a shipment by tracking number or EasyShip ID.
 */
async function trackShipment(trackingNumber, courierId = null) {
  if (!EASYSHIP_KEY) {
    return {
      status: 'in_transit',
      status_description: 'Mock shipment in transit',
      estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString(),
      events: [{ occurred_at: new Date().toISOString(), description: 'Package in transit' }],
    };
  }

  try {
    const result = await easyShipRequest(
      'GET',
      `/shipments?easyship_shipment_id=${trackingNumber}`
    );

    const shipment = result.shipments?.[0];
    if (!shipment) return null;

    return {
      status: shipment.shipment_state,
      status_description: shipment.shipment_state_display,
      tracking_number: shipment.tracking_number,
      courier_name: shipment.courier_name,
      estimated_delivery: shipment.estimated_delivery_date,
      events: (shipment.tracking_events || []).map(e => ({
        occurred_at: e.occurred_at,
        description: e.description,
        location: e.location,
        status: e.status,
      })),
      delivered_at: shipment.delivered_at,
      proof_of_delivery: shipment.proof_of_delivery_url,
    };
  } catch (error) {
    console.error('EasyShip track error:', error.message);
    return null;
  }
}

/**
 * Calculate landed cost (taxes + duties) for international shipments.
 * Used to show buyer the total cost before checkout.
 */
async function calculateLandedCost(shipFrom, shipTo, items, currency = 'USD') {
  if (!EASYSHIP_KEY) return getMockLandedCost(items);

  try {
    const body = {
      origin_country_alpha2: (shipFrom.countryCode || 'CA').toUpperCase(),
      destination_country_alpha2: (shipTo.countryCode || 'US').toUpperCase(),
      currency: toEasyShipCurrency(currency),
      items: items.map(item => ({
        description: item.description || 'Merchandise',
        quantity: item.quantity || 1,
        hs_code: item.hsCode || '0000.00.0000',
        declared_currency: toEasyShipCurrency(currency),
        declared_customs_value: item.value || 10,
      })),
      destination_postal_code: shipTo.postalCode,
    };

    const result = await easyShipRequest('POST', '/landed_cost', body);

    return {
      duties_cents: Math.round((result.total_duties || 0) * 100),
      taxes_cents: Math.round((result.total_taxes || 0) * 100),
      fees_cents: Math.round((result.total_fees || 0) * 100),
      total_landed_cents: Math.round((result.total_landed_cost || 0) * 100),
      currency: result.currency || 'USD',
      duty_rate: result.duty_rate,
      tax_rate: result.tax_rate,
      incoterms: 'DDP', // Delivery Duty Paid
      breakdown: (result.charges || []).map(c => ({
        type: c.type,
        name: c.name,
        amount_cents: Math.round((c.amount || 0) * 100),
      })),
    };
  } catch (error) {
    console.error('Landed cost error:', error.message);
    return getMockLandedCost(items);
  }
}

// === Mock Fallbacks ===

function getMockRates(shipTo, packages) {
  const weight = packages?.reduce((s, p) => s + (p.weightOz || 16), 0) || 16;
  const baseCents = Math.max(500, weight * 50);
  const isInternational = shipTo.countryCode && shipTo.countryCode !== 'US' && shipTo.countryCode !== 'CA';

  return [
    { courier_id:'mock_ups',courier_name:'UPS',service_name:isInternational?'Worldwide Express':'Ground',total_cents:Math.round(baseCents*1.1),shipping_cents:Math.round(baseCents*1.1),fuel_surcharge_cents:0,tax_cents:0,currency:'USD',min_delivery_days:isInternational?5:3,max_delivery_days:isInternational?7:5,rate_id:'mock_ups_1' },
    { courier_id:'mock_fedex',courier_name:'FedEx',service_name:isInternational?'International Priority':'2Day',total_cents:Math.round(baseCents*1.35),shipping_cents:Math.round(baseCents*1.35),fuel_surcharge_cents:0,tax_cents:0,currency:'USD',min_delivery_days:isInternational?3:2,max_delivery_days:isInternational?5:4,rate_id:'mock_fedex_1' },
    { courier_id:'mock_dhl',courier_name:'DHL Express',service_name:'Express Worldwide',total_cents:Math.round(baseCents*1.5),shipping_cents:Math.round(baseCents*1.5),fuel_surcharge_cents:0,tax_cents:0,currency:'USD',min_delivery_days:isInternational?2:1,max_delivery_days:isInternational?4:3,rate_id:'mock_dhl_1' },
    { courier_id:'mock_usps',courier_name:'USPS',service_name:isInternational?'Priority International':'Priority Mail',total_cents:Math.round(baseCents*0.85),shipping_cents:Math.round(baseCents*0.85),fuel_surcharge_cents:0,tax_cents:0,currency:'USD',min_delivery_days:isInternational?6:3,max_delivery_days:isInternational?10:5,rate_id:'mock_usps_1' },
    { courier_id:'local_pickup',courier_name:'Local Pickup',service_name:'Free In-Person Pickup',total_cents:0,shipping_cents:0,fuel_surcharge_cents:0,tax_cents:0,currency:'USD',min_delivery_days:0,max_delivery_days:0,rate_id:'local_pickup',is_pickup:true },
  ];
}

function getMockLandedCost(items) {
  const totalValue = items.reduce((s, i) => s + (i.value || 0) * (i.quantity || 1), 0);
  return {
    duties_cents: Math.round(totalValue * 0.05 * 100),  // 5% estimated duty
    taxes_cents: Math.round(totalValue * 0.08 * 100),   // 8% estimated tax  
    fees_cents: 1500,                                     // $15 processing fee
    total_landed_cents: Math.round(totalValue * 0.13 * 100) + 1500,
    currency: 'USD',
    duty_rate: 0.05,
    tax_rate: 0.08,
    incoterms: 'DDP',
    breakdown: [
      { type: 'duty', name: 'Customs Duty', amount_cents: Math.round(totalValue * 5) },
      { type: 'tax', name: 'Sales Tax / VAT', amount_cents: Math.round(totalValue * 8) },
      { type: 'fee', name: 'Processing Fee', amount_cents: 1500 },
    ],
  };
}

module.exports = {
  getShippingRates,
  createShipment,
  trackShipment,
  calculateLandedCost,
};
