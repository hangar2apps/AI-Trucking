// Copy this file to `config.js` and fill in your free API key(s).
// `config.js` is gitignored so your key is never committed.
//
// TomTom Traffic Incidents (free tier: 2,500 requests/day):
//   1. Create a free account at https://developer.tomtom.com/
//   2. Make an API key and paste it below.
//
// Note: this is a static client-side app, so the key is visible to anyone who
// loads the page. Lock the key to your domain in the TomTom dashboard, and keep
// it on the free tier. Without a key the app falls back to simulated accidents.
//
// Alternative (no file needed): run this once in the browser console —
//   localStorage.setItem("tomtomTrafficKey", "YOUR_KEY")
window.APP_CONFIG = {
  tomtomTrafficKey: "",
};
