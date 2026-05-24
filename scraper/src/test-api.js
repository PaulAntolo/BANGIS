const https = require('https');

function fetchFuel(type) {
  const url = `https://metrofueltracker.com/api/stations?fuelType=${type}&south=10.5799&west=122.8092&north=10.7356&east=123.1444`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`\n--- ${type} ---`);
        if (Array.isArray(json) && json.length > 0) {
          console.log(JSON.stringify(json[0], null, 2));
        } else if (json.stations && json.stations.length > 0) {
          console.log(JSON.stringify(json.stations[0], null, 2));
        } else {
          console.log("Empty or unrecognized format:", data.substring(0, 100));
        }
      } catch(e) {
        console.log("Error parsing:", e.message);
      }
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}

fetchFuel('DIESEL');
setTimeout(() => fetchFuel('UNLEADED_91'), 1000);
setTimeout(() => fetchFuel('PREMIUM_95'), 2000);
