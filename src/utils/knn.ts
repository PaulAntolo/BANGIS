export interface StationFeature {
  id: string;
  price: number;
  distance: number;
  verificationCount: number;
}

/**
 * Uses a K-Nearest Neighbors (KNN) approach by finding the stations
 * that are "nearest" to the theoretical "Ideal Station" in a 
 * normalized multi-dimensional feature space.
 * 
 * Features:
 * - Price (Lower is better)
 * - Distance (Lower is better)
 * - Verification Count (Higher is better)
 */
export function getKNNRecommendations(
  stations: StationFeature[],
  k: number = 3
): { id: string; knnScore: number; reason: string }[] {
  if (stations.length === 0) return [];

  // Find min/max for normalization
  const maxPrice = Math.max(...stations.map(s => s.price));
  const minPrice = Math.min(...stations.map(s => s.price));
  
  const maxDist = Math.max(...stations.map(s => s.distance));
  const minDist = Math.min(...stations.map(s => s.distance));

  const maxVerif = Math.max(...stations.map(s => s.verificationCount));
  const minVerif = Math.min(...stations.map(s => s.verificationCount));

  const normalize = (val: number, min: number, max: number, invert: boolean = false) => {
    if (max === min) return 0; // If all values are the same, distance contribution is 0
    const norm = (val - min) / (max - min);
    return invert ? 1 - norm : norm; // invert=true makes higher values closer to 0
  };

  const scoredStations = stations.map(station => {
    // Transform features so that 0 represents the "Ideal" value
    const normPrice = normalize(station.price, minPrice, maxPrice, false); // Min price -> 0
    const normDist = normalize(station.distance, minDist, maxDist, false); // Min distance -> 0
    const normVerif = normalize(station.verificationCount, minVerif, maxVerif, true); // Max verification -> 0

    // Feature Weights (Price is 50% more important than distance)
    const weightPrice = 1.5;
    const weightDist = 1.0;
    const weightVerif = 0.5;

    // Euclidean distance to the Ideal Station (0, 0, 0)
    const euclideanDistance = Math.sqrt(
      Math.pow(normPrice * weightPrice, 2) +
      Math.pow(normDist * weightDist, 2) +
      Math.pow(normVerif * weightVerif, 2)
    );

    return {
      ...station,
      normPrice,
      normDist,
      normVerif,
      knnScore: euclideanDistance
    };
  });

  // Sort by closest distance to the ideal station
  scoredStations.sort((a, b) => a.knnScore - b.knnScore);

  const topK = scoredStations.slice(0, k);

  // Generate dynamic reasons based on Rank and relative features to the #1 choice
  return topK.map((station, index) => {
    let reason = '';

    if (index === 0) {
      if (station.normPrice <= 0.1 && station.normDist <= 0.2) {
        reason = '🏆 Perfect match: Cheapest fuel and very close to your location!';
      } else if (station.normPrice <= 0.1) {
        reason = '💰 Absolute cheapest option, even though it requires a slight drive.';
      } else if (station.normDist <= 0.1) {
        reason = '📍 Maximum convenience: Closest station to you with a highly competitive price.';
      } else {
        reason = '⭐ Best overall balance of price, distance, and reliability.';
      }
    } else {
      const bestStation = topK[0];
      const priceDiff = station.price - bestStation.price;
      const distDiff = station.distance - bestStation.distance;

      if (priceDiff <= 0 && distDiff > 0) {
        reason = `Matches the cheapest price, but it's a bit further away than the top pick.`;
      } else if (priceDiff > 0 && distDiff < 0) {
        reason = `Costs slightly more, but it's closer to you—saving you driving time!`;
      } else if (priceDiff > 0 && priceDiff <= 0.5) {
        reason = `Very competitive price, just slightly more expensive than the top choice.`;
      } else if (station.normVerif <= 0.1) {
        reason = `Highly verified and trusted by the community as a solid alternative.`;
      } else if (index === 1) {
        reason = `A very close runner-up with great overall value.`;
      } else {
        reason = `A solid alternative choice in your vicinity.`;
      }
    }

    return {
      id: station.id,
      knnScore: station.knnScore,
      reason
    };
  });
}
