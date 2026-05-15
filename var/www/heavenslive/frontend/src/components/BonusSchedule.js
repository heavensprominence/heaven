import React from 'react';

const BonusSchedule = () => {
  const bonusTiers = [
    { range: "1st purchase", multiplier: "10x", minPurchase: "$10+", description: "10x bonus on first purchase" },
    { range: "2nd purchase", multiplier: "9x", minPurchase: "$10+", description: "9x bonus on second purchase" },
    { range: "3rd purchase", multiplier: "8x", minPurchase: "$10+", description: "8x bonus on third purchase" },
    { range: "4th - 10th purchases", multiplier: "7x", minPurchase: "$10+", description: "7x bonus on purchases 4-10" },
    { range: "11th - 100th purchases", multiplier: "6x", minPurchase: "$10+", description: "6x bonus on purchases 11-100" },
    { range: "101st - 1,000th purchases", multiplier: "5x", minPurchase: "$10+", description: "5x bonus on purchases 101-1,000" },
    { range: "1,001st - 10,000th purchases", multiplier: "4x", minPurchase: "$10+", description: "4x bonus on purchases 1,001-10,000" },
    { range: "10,001st - 100,000th purchases", multiplier: "3x", minPurchase: "$10+", description: "3x bonus on purchases 10,001-100,000" },
    { range: "100,001st - 1,000,000th purchases", multiplier: "2x", minPurchase: "$10+", description: "2x bonus on purchases 100,001-1,000,000" },
    { range: "1,000,001st+ purchases", multiplier: "1x", minPurchase: "$10+", description: "1x bonus on purchases beyond 1M" }
  ];

  return (
    <div className="bonus-schedule">
      {/* Removed the large header that looked like a menu */}
      <div className="bonus-table-container">
        <table className="bonus-table">
          <thead>
            <tr>
              <th>Purchase Number</th>
              <th>Multiplier</th>
              <th>Minimum Purchase</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {bonusTiers.map((tier, index) => (
              <tr key={index} className={index < 3 ? 'highlight' : ''}>
                <td className="range">{tier.range}</td>
                <td className="multiplier">{tier.multiplier}</td>
                <td>{tier.minPurchase}</td>
                <td className="description">{tier.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BonusSchedule;
