const fs = require('fs');
const html = fs.readFileSync('mft.html', 'utf8');
const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
if (nextDataMatch) {
  const data = JSON.parse(nextDataMatch[1]);
  // Assuming stations are somewhere in props.pageProps
  const stringified = JSON.stringify(data);
  const stationsMatch = stringified.match(/"stations":(\[[^\]]+\])/) || stringified.match(/"data":(\[[^\]]+\])/);
  
  if (stringified.toLowerCase().includes('bacolod')) {
     console.log("SUCCESS: Bacolod found in the Next.js data payload!");
     // Let's try to extract one Bacolod station
     const bacolodMatch = stringified.match(/\{[^}]*bacolod[^}]*\}/i);
     console.log("Sample Bacolod item:", bacolodMatch ? bacolodMatch[0] : "Not matched cleanly");
  } else {
     console.log("No Bacolod found in __NEXT_DATA__");
  }
} else {
  console.log("No __NEXT_DATA__ found.");
}
