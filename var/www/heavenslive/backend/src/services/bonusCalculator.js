const DONATION_BONUS_RATE = 0.5; // 50% of donation amount in Credon bonus

class BonusCalculator {
  // Donation bonus: flat 50% of the donated amount (sustainable, unlike the purchase schedule)
  static getDonationBonusRate() { return DONATION_BONUS_RATE; }

  static calculateDonationBonus(purchaseAmountUSD) {
    if (!purchaseAmountUSD || purchaseAmountUSD <= 0) return { rate: DONATION_BONUS_RATE, bonusCents: 0, bonusDisplay: '50%' };
    const bonusCents = Math.round(DONATION_BONUS_RATE * purchaseAmountUSD * 100);
    return { rate: DONATION_BONUS_RATE, bonusCents, bonusDisplay: '50%' };
  }

  // Bonus multiplier based on purchase number
  static getBonusMultiplier(purchaseNumber) {
    if (purchaseNumber === 1) return 10;
    if (purchaseNumber === 2) return 9;
    if (purchaseNumber === 3) return 8;
    if (purchaseNumber >= 4 && purchaseNumber <= 10) return 7;
    if (purchaseNumber >= 11 && purchaseNumber <= 100) return 6;
    if (purchaseNumber >= 101 && purchaseNumber <= 1000) return 5;
    if (purchaseNumber >= 1001 && purchaseNumber <= 10000) return 4;
    if (purchaseNumber >= 10001 && purchaseNumber <= 100000) return 3;
    if (purchaseNumber >= 100001 && purchaseNumber <= 1000000) return 2;
    if (purchaseNumber >= 1000001 && purchaseNumber <= 10000000) return 1;
    return 0;
  }
  
  // Calculate bonus amount based on purchase amount (USD) and purchase number
  static calculateBonus(purchaseAmountUSD, purchaseNumber) {
    if (purchaseAmountUSD < 10) return 0;
    
    const multiplier = this.getBonusMultiplier(purchaseNumber);
    // Bonus is multiplier × purchase amount in Credon cents
    // 1 USD = 100 Credon cents (for bonus calculation)
    const bonusCents = multiplier * purchaseAmountUSD * 100;
    
    return {
      multiplier,
      bonusCents,
      bonusDisplay: `${multiplier}x`,
      purchaseNumber
    };
  }
  
  // Get bonus schedule for display
  static getBonusSchedule() {
    return [
      { range: "1st purchase", multiplier: "10x", minPurchase: "$10" },
      { range: "2nd purchase", multiplier: "9x", minPurchase: "$10" },
      { range: "3rd purchase", multiplier: "8x", minPurchase: "$10" },
      { range: "4th - 10th purchases", multiplier: "7x", minPurchase: "$10" },
      { range: "11th - 100th purchases", multiplier: "6x", minPurchase: "$10" },
      { range: "101st - 1,000th purchases", multiplier: "5x", minPurchase: "$10" },
      { range: "1,001st - 10,000th purchases", multiplier: "4x", minPurchase: "$10" },
      { range: "10,001st - 100,000th purchases", multiplier: "3x", minPurchase: "$10" },
      { range: "100,001st - 1,000,000th purchases", multiplier: "2x", minPurchase: "$10" },
      { range: "1,000,001st - 10,000,000th purchases", multiplier: "1x", minPurchase: "$10" }
    ];
  }
}

module.exports = BonusCalculator;
module.exports.DONATION_BONUS_RATE = DONATION_BONUS_RATE;