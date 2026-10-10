// Simple browser storage. Replace these with API calls (axios) once the
// backend has a /api/bookings endpoint.
const BOOKINGS_KEY = "studentstay_bookings";
const USER_KEY = "studentstay_user";

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
  const all = getBookings();
  const saved = {
    ...booking,
    id: "SS" + Date.now().toString().slice(-7),
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

export const getUser = () => read(USER_KEY, null);
export const setUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const logout = () => localStorage.removeItem(USER_KEY);

// Active (non-cancelled) bookings for a PG / sharing type
export const activeBookings = (pgId, sharingType) =>
  getBookings().filter(
    (b) => b.pgId === pgId && b.status !== "Cancelled" && (sharingType == null || b.sharing === sharingType)
  );

// Beds left after subtracting new bookings from the seed availability
export const bedsLeft = (pg, option) => Math.max(0, option.available - activeBookings(pg.id, option.type).length);
