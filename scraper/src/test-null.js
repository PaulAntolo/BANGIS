const fetch = require('node-fetch');

async function test(fuelType) {
  const url = `https://metrofueltracker.com/api/stations?fuelType=${fuelType}&south=10.5799&west=122.8092&north=10.7356&east=123.1444`;
  const res = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "Mozilla/5.0"
    }
  });
  if (res.status === 200) {
    const json = await res.json();
    const stations = json.stations || json || [];
    let withPrice = 0;
    let nullPrice = 0;
    
    stations.forEach(s => {
      // Check how price is structured
      const price = s.price ?? s.prices?.[fuelType] ?? s.prices?.price ?? s.pricePerLiter;
      if (price == null) nullPrice++;
      else withPrice++;
      
      // Let's print the first one with a null price
      if (price == null && nullPrice === 1) {
        console.log(`\nExample of NULL price station for ${fuelType}:`);
        console.log(JSON.stringify(s, null, 2));
      }
    });
    
    console.log(`\n${fuelType}: ${withPrice} have price, ${nullPrice} are null`);
  } else {
    console.log(`${fuelType}: ${res.status}`);
  }
}

async function run() {
  await test('DIESEL');
  await test('UNLEADED_91');
  await test('PREMIUM_95');
}

run();
