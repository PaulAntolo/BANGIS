const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Keep Node-only scraper tooling out of the Expo bundle (fixes dotenv/path resolution errors)
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /[/\\]scraper[/\\].*/,
];

module.exports = config;
