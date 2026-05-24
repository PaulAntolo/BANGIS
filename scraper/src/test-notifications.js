const fetch = require('node-fetch');

async function checkEndpoint(path) {
  const url = `https://metrofueltracker.com${path}`;
  try {
    const res = await fetch(url, { headers: { "accept": "application/json", "user-agent": "Mozilla/5.0" } });
    if (res.status === 200) {
      const data = await res.text();
      console.log(`[SUCCESS] ${path} returned 200: ${data.substring(0, 100)}...`);
    } else {
      console.log(`[FAILED] ${path}: ${res.status}`);
    }
  } catch (err) {
    console.log(`[ERROR] ${path}: ${err.message}`);
  }
}

async function run() {
  await checkEndpoint('/api/notifications');
  await checkEndpoint('/api/advisories');
  await checkEndpoint('/api/alerts');
  await checkEndpoint('/api/news');
  await checkEndpoint('/api/messages');
  await checkEndpoint('/api/updates');
  await checkEndpoint('/api/announcements');
  await checkEndpoint('/advisories');
}

run();
