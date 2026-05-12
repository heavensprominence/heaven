const axios = require('axios');

class PayPalEscrowService {
    constructor() {
        this.clientId = process.env.PAYPAL_CLIENT_ID;
        this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        this.platformEmail = 'bmirkalami@gmail.com';
        this.baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com';
    }

    async getAccessToken() {
        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const response = await axios({
            method: 'post',
            url: `${this.baseURL}/v1/oauth2/token`,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: 'grant_type=client_credentials'
        });
        return response.data.access_token;
    }

    async createOrder(amount, currency = 'USD') {
        const accessToken = await this.getAccessToken();
        
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: currency,
                    value: amount.toFixed(2)
                },
                payee: {
                    email_address: this.platformEmail
                }
            }],
            application_context: {
                brand_name: 'HeavensLive Shop',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: `${process.env.FRONTEND_URL}/shop/checkout/success`,
                cancel_url: `${process.env.FRONTEND_URL}/shop/checkout/cancel`
            }
        };

        const response = await axios({
            method: 'post',
            url: `${this.baseURL}/v2/checkout/orders`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            data: orderData
        });

        return {
            id: response.data.id,
            status: response.data.status,
            links: response.data.links
        };
    }

    async captureOrder(orderId) {
        const accessToken = await this.getAccessToken();
        
        const response = await axios({
            method: 'post',
            url: `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            id: response.data.id,
            status: response.data.status,
            captureId: response.data.purchase_units[0].payments.captures[0].id
        };
    }

    async createPayout(sellerEmail, amount, currency = 'USD') {
        const accessToken = await this.getAccessToken();
        
        const payoutData = {
            sender_batch_header: {
                sender_batch_id: `Payouts_${Date.now()}`,
                email_subject: 'You received a payment from HeavensLive Shop',
                email_message: 'Your funds have been released from escrow.'
            },
            items: [{
                recipient_type: 'EMAIL',
                amount: {
                    value: amount.toFixed(2),
                    currency: currency
                },
                receiver: sellerEmail,
                note: 'HeavensLive Shop - Escrow Release'
            }]
        };

        const response = await axios({
            method: 'post',
            url: `${this.baseURL}/v1/payments/payouts`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            data: payoutData
        });

        return {
            batchId: response.data.batch_header.payout_batch_id,
            status: response.data.batch_header.batch_status
        };
    }
}

module.exports = new PayPalEscrowService();
