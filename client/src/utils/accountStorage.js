const getAccountId = (user) => {
  if (!user) return 'guest';
  return String(user._id || user.id || user.email || 'guest').toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
};

export const getAccountStorageKey = (user) => `userData_${getAccountId(user)}`;

export const emptyAccountData = () => ({
  searchHistory: [],
  favorites: [],
  cart: [],
  tickets: [],
});

export const readAccountData = (user) => {
  if (typeof window === 'undefined') return emptyAccountData();
  try {
    const saved = JSON.parse(window.localStorage.getItem(getAccountStorageKey(user)) || 'null');
    return { ...emptyAccountData(), ...(saved || {}) };
  } catch {
    return emptyAccountData();
  }
};

// NOTE (bug fix): this previously returned early for guests, which meant guest
// carts were silently dropped on refresh. Guests now persist to the 'guest'
// storage key; their cart merges into the server cart after login.
export const writeAccountData = (user, data) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getAccountStorageKey(user), JSON.stringify({
    ...emptyAccountData(),
    ...data,
  }));
};
