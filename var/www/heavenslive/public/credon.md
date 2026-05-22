# Credon Wallet — Borderless Digital Banking

## Overview
Credon is the digital wallet built into HeavensLive. Send money, exchange currencies, get loans, and manage appointments — all in one place. Free for all users.

## Features

### Dashboard
At-a-glance view of your total balance (USD equivalent), recent transactions, and live exchange rates for 100+ currencies.

### Send Money
Send funds to any HeavensLive user by email or username. Instant transfers, zero platform fees on wallet-to-wallet sends.

### Exchange
Convert between 100+ fiat, crypto, and Credon clone currencies at live exchange rates. USD, EUR, GBP, JPY, BTC, ETH, USDT, and more.

### History
Complete transaction log with filtering by date, type, and currency. Export to CSV for accounting.

### Loans
Interest-bearing loans with flexible repayment periods. Loan amounts based on account history and balance.

### Appointments
Book appointments with Credon representatives for personalized financial guidance.

### Currency Management
Add and manage multiple currencies in your wallet. Track balances across all supported currencies.

### Grants
Available grants and financial assistance programs. Apply directly from the wallet.

## Security
- **Two-Factor Authentication (2FA)**: Optional email-based 2FA for login
- **Session Management**: View and revoke active sessions
- **API Key Management**: Generate, view, and revoke API keys for developers
- **Transaction Verification**: Every transaction is logged and verifiable

## Supported Currencies
- **Fiat (30+)**: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, and more
- **Crypto (15+)**: BTC, ETH, USDT, USDC, BNB, XRP, SOL, ADA, DOGE, and more
- **Credon Clone Currencies (12+)**: Credon-USD, Credon-EUR, Credon-BTC, and more

## Live Exchange Rates
Real-time rates via Frankfurter API (fiat) and CoinGecko (crypto). Static fallback for 100+ currency pairs when live data is unavailable.

## Multi-Language
All 17 languages supported across the Credon interface. Switch using the language dropdown in the navigation bar.

## For Developers
- Wallet API at `/api/wallet/`
- Balance endpoint: `GET /api/wallet/balance`
- Send endpoint: `POST /api/wallet/send`
- Transaction history: `GET /api/transactions`
- Exchange rates: Available via `/api/rates`
