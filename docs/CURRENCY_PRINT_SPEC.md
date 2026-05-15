# Credon Currency — Professional Print Specifications

## For Authorized Security Printing Presses Only

---

## 1. Paper Specifications

| Property | Specification |
|----------|--------------|
| **Type** | 100% cotton security paper, 85-90 g/m² |
| **Color** | Off-white, no optical brighteners |
| **Embedded fibers** | Visible + UV-fluorescent, currency-specific colors |
| **Watermark** | Multi-tonal, cylinder mould made, currency-specific motif |
| **Thickness** | 100-110 μm |

---

## 2. Dimensions (per currency)

| Currency | Width × Height (mm) | Ratio |
|----------|---------------------|-------|
| Credon-USD | 156 × 66.3 | 2.35:1 |
| Credon-EUR | 147 × 82 (€50) | 1.79:1 |
| Credon-GBP | 156 × 85 (£50) | 1.84:1 |
| Credon-JPY | 160 × 76 (¥10,000) | 2.11:1 |
| Credon-VND | 152 × 65 (500,000₫) | 2.34:1 |
| Credon-CAD | 152.4 × 69.85 | 2.18:1 |
| Others | 150 × 70 | 2.14:1 |

---

## 3. Security Features (ALL notes)

### Front
1. **Intaglio (raised) printing** — Portrait frame, denomination numerals, text
2. **Latent image** — Denomination visible only at acute angle
3. **Microprinting** — "CREDON-XXX" repeated at <0.2mm below portrait
4. **Color-shifting ink** — Denomination numeral shifts green→gold at angle
5. **Security thread** — 3mm wide, embedded, microtext "CREDON" visible under UV
6. **See-through register** — Alignment marks front/back form complete symbol
7. **Tactile marks** — Raised dots for visually impaired (count per denomination)

### Back
1. **Offset printing** — Fine-line guilloche patterns, currency-specific motif
2. **UV fluorescent** — Currency code + denomination glow under 365nm UV
3. **Iridescent stripe** — 10mm band with metallic sheen
4. **EURion constellation** — Anti-photocopy pattern (5 rings)

---

## 4. Pantone Colors

| Currency | Primary | Secondary | Tertiary | UV Color |
|----------|---------|-----------|----------|----------|
| Credon-USD | PANTONE 3435 C (Green) | PANTONE 583 C | PANTONE Black 6 C | Yellow-Green |
| Credon-EUR | PANTONE 294 C (Blue) | PANTONE 425 C | PANTONE 187 C | Blue |
| Credon-GBP | PANTONE 466 C (Gold) | PANTONE 4625 C | PANTONE 187 C | Orange |
| Credon-JPY | PANTONE 2685 C (Purple) | PANTONE 583 C | PANTONE Black 6 C | Purple |
| Credon-VND | PANTONE 320 C (Cyan) | PANTONE 185 C | PANTONE 116 C | Cyan |
| Credon-CAD | PANTONE 294 C (Blue) | PANTONE 7416 C | PANTONE 185 C | Blue |
| Credon-CNY | PANTONE 186 C (Red) | PANTONE 116 C | PANTONE 425 C | Red |

---

## 5. Serial Number System

**Format:** `HL-{CURRENCY}-{8-DIGIT-SEQ}`

**Font:** OCR-B, 10pt, letterpress (debossed)

**Check-digit:** MOD 97-10 algorithm applied to numeric portion

**Verification API:** `GET https://heavenslive.com/api/verify/HL-USD-00000001`

Every serial is registered before printing. Counterfeit detection is instant — any serial not in the database returns "COUNTERFEIT".

---

## 6. Front/Back Registration Template

```
┌─────────────────────────────────────────────────┐
│  BLEED: 3mm all sides                           │
│  ┌───────────────────────────────────────────┐  │
│  │ TRIM: 156 × 66.3mm (Credon-USD)          │  │
│  │ ┌─────────────────────────────────────┐   │  │
│  │ │ LIVE AREA: 150 × 60mm               │   │  │
│  │ │                                     │   │  │
│  │ │  [WATERMARK]    CREDON-USD   [PORT] │   │  │
│  │ │                 ONE HUNDRED         │   │  │
│  │ │                  CREDON DOLLARS     │   │  │
│  │ │                      $100           │   │  │
│  │ │                                     │   │  │
│  │ │  HL-USD-00000001     HL-USD-00000001│   │  │
│  │ │                                     │   │  │
│  │ └─────────────────────────────────────┘   │  │
│  │  REGISTRATION MARKS: + at each corner     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 7. Anti-Counterfeit Verification

### For the Public
1. Visit `heavenslive.com/verify` or scan QR code on note
2. Enter serial number (HL-XXX-XXXXXXXX)
3. Instant verification: authentic, denomination, print date
4. Fake serials immediately flagged as COUNTERFEIT

### For Law Enforcement / Banks
1. UV light check: fluorescent elements at 365nm
2. Magnification: microprint "CREDON-XXX" visible at 10×
3. Tilt: color-shifting ink, latent image, iridescent stripe
4. API: programmatic verification via `GET /api/verify/{serial}`

---

## 8. Batch Printing Process

1. Generate serials via API: `POST /api/admin/currency/register-batch`
2. Print: use registered serials only
3. Confirm: `POST /api/admin/currency/mark-printed`
4. Serials are now live — verifiable by anyone

---

*Document v1.0 — HeavensLive — CONFIDENTIAL — For Authorized Press Only*
