import '@testing-library/jest-dom';

// Node 25 tanpa `--localstorage-file` menyediakan localStorage tiruan yang
// tidak punya setItem/getItem dan menutupi storage milik jsdom. Ganti dengan
// implementasi in-memory supaya komponen yang memakai localStorage berjalan.
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key) {
    const normalized = String(key);
    return this.store.has(normalized) ? this.store.get(normalized) : null;
  }

  key(index) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key) {
    this.store.delete(String(key));
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }
}

const isWorkingStorage = (candidate) =>
  typeof candidate?.getItem === 'function' && typeof candidate?.setItem === 'function';

const installStorage = (target, name) => {
  try {
    if (isWorkingStorage(target[name])) {
      return;
    }
    Object.defineProperty(target, name, {
      value: new MemoryStorage(),
      configurable: true,
      writable: true,
    });
  } catch {
    // Kalau properti tidak bisa didefinisikan ulang, biarkan apa adanya.
  }
};

installStorage(globalThis, 'localStorage');
installStorage(globalThis, 'sessionStorage');

if (typeof window !== 'undefined' && window !== globalThis) {
  installStorage(window, 'localStorage');
  installStorage(window, 'sessionStorage');
}
