# HeavensLive Mobile App — Scaffolding Plan
# ==========================================

## Architecture
- **Framework:** Flutter 3.x (Dart)
- **State:** Riverpod (lightweight, testable)
- **Sync:** PowerSync (SQLite local DB → PostgreSQL central)
- **API:** REST client calling our backend endpoints

## Project Structure
```
heavenslive_mobile/
├── lib/
│   ├── main.dart                    # Entry point, theme, routing
│   ├── app.dart                     # MaterialApp with GoRouter
│   ├── config/
│   │   ├── api_config.dart          # Base URL, endpoints
│   │   ├── theme.dart               # Gold-on-dark design system
│   │   └── i18n.dart                # Locale loader
│   ├── models/
│   │   ├── listing.dart             # Listing, Auction, Procurement
│   │   ├── user.dart                # User, Wallet
│   │   ├── cart.dart                # Cart item
│   │   ├── currency.dart            # Currency + denominations
│   │   └── transaction.dart         # Transaction history
│   ├── services/
│   │   ├── api_client.dart          # HTTP client (Dio)
│   │   ├── auth_service.dart        # Login, register, TOTP
│   │   ├── marketplace_service.dart # Listings, search, categories
│   │   ├── wallet_service.dart      # Balance, exchange, denominations
│   │   ├── cart_service.dart        # Guest/authenticated cart
│   │   ├── landing_service.dart     # Donations, USB, paper currency
│   │   └── powersync_service.dart   # Local-first sync layer
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── marketplace_provider.dart
│   │   └── wallet_provider.dart
│   ├── screens/
│   │   ├── landing_screen.dart      # Prayer audio, donate, USB
│   │   ├── marketplace_screen.dart  # Browse/search listings
│   │   ├── listing_detail.dart      # Full listing view
│   │   ├── cart_screen.dart         # Cart + checkout
│   │   ├── wallet_screen.dart       # Balances, exchange, denominations
│   │   ├── login_screen.dart        # Login with 2FA/TOTP
│   │   ├── register_screen.dart     # Registration with invite
│   │   ├── create_listing.dart      # Post new listing
│   │   └── profile_screen.dart      # Settings, TOTP setup
│   └── widgets/
│       ├── prayer_player.dart        # Audio player bar
│       ├── listing_card.dart         # Reusable listing card
│       ├── currency_picker.dart      # Currency selector
│       ├── denomination_view.dart    # Paper bills/coins display
│       └── language_switcher.dart    # 17-language dropdown
├── assets/
│   ├── i18n/                         # 17 locale JSON files
│   └── icons/
├── pubspec.yaml
└── README.md
```

## Screen Flow
```
Landing ─────┬── Donate → Checkout
             ├── USB Prayer → Checkout
             ├── Paper Currency → Order
             ├── Login / Register
             └── Marketplace ──┬── Search/Browse
                               ├── Listing Detail
                               ├── Cart → Checkout
                               ├── Auctions → Bid
                               └── Procurement → Submit
             
Wallet ───────┬── Balance Overview
              ├── Exchange
              ├── Denominations
              └── Transaction History
```

## Key Screens (from mockups)
1. Landing — Prayer player, hero, donate amounts, USB card
2. Marketplace — Search bar, category sidebar, listing grid, auction rows
3. Wallet — Balance, bonus tracker, quick balances, exchange rates
4. Cart Drawer — Items, total, checkout button
