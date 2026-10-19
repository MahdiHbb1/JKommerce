import '@testing-library/jest-dom';

// Node 25 mengekspos `localStorage` eksperimental yang menimpa milik jsdom.
// Pastikan komponen yang memakai localStorage membaca storage jsdom di test.
if (typeof window !== 'undefined' && window.localStorage) {
  for (const key of ['localStorage', 'sessionStorage']) {
    try {
      Object.defineProperty(globalThis, key, {
        value: window[key],
        configurable: true,
        writable: true,
      });
    } catch {
      // Kalau properti tidak bisa didefinisikan ulang, biarkan apa adanya.
    }
  }
}
