const localStorageKey = 'scene-editor';

export function saveToLocalStorage(state) {
  localStorage.setItem(localStorageKey, JSON.stringify(state));
}

export function loadFromLocalStorage() {
  return JSON.parse(localStorage.getItem(localStorageKey));
}
