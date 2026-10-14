// Simple browser storage. Replace these with API calls (axios) once the
// backend has a /api/bookings endpoint.
const BOOKINGS_KEY = "studentstay_bookings";
const USER_KEY = "studentstay_user";
const TOKEN_KEY = "studentstay_token";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8080" : "https://backendstudentstay.onrender.com")).replace(/\/$/, "");

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const getBookings = () => read(BOOKINGS_KEY, []);

export const addBooking = (booking) => {
  if (!getUser()) {
    throw new Error("Log in before creating a booking.");
  }
  const all = getBookings();
  const saved = {
    ...booking,
    id: "SS" + Date.now().toString().slice(-7),
    accountEmail: getUser().email,
    status: "Confirmed",
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify([saved, ...all]));
  return saved;
};

export const cancelBooking = (id) => {
  const all = getBookings().map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b));
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
};

export const cancelBookingByServerId = (serverId) => {
  const all = getBookings().map((booking) =>
    booking.serverBookingId === serverId ? { ...booking, status: "Cancelled" } : booking
  );
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
};

export const getUser = () => read(USER_KEY, null);
export const setUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const setSession = (auth) => {
  localStorage.setItem(TOKEN_KEY, auth.token);
  setUser({
    name: auth.fullName,
    email: auth.email,
    username: auth.username,
    role: auth.role,
  });
};
export const logout = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};
export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed: ${response.status}`);
  }
  return payload;
};

// Active (non-cancelled) bookings for a PG / sharing type
export const activeBookings = (pgId, sharingType) =>
  getBookings().filter(
    (b) => b.pgId === pgId && b.status !== "Cancelled" && (sharingType == null || b.sharing === sharingType)
  );

// Beds left after subtracting new bookings from the seed availability
export const bedsLeft = (pg, option) => Math.max(0, option.available - activeBookings(pg.id, option.type).length);
