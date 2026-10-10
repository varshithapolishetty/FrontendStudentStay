// ---------- Facilities ----------
export const FACILITIES = [
  { key: "ac", label: "AC", icon: "❄️" },
  { key: "fridge", label: "Fridge", icon: "🧊" },
  { key: "ro", label: "Water Purifier", icon: "💧" },
  { key: "washing", label: "Washing Machine", icon: "🧺" },
  { key: "tv", label: "TV", icon: "📺" },
  { key: "wifi", label: "WiFi", icon: "📶" },
  { key: "geyser", label: "Geyser", icon: "🚿" },
  { key: "power", label: "Power Backup", icon: "🔋" },
  { key: "mess", label: "Food / Mess", icon: "🍛" },
  { key: "biometric", label: "Biometric Entry", icon: "🖐️" },
  { key: "cooking", label: "Self Cooking", icon: "🍳" },
  { key: "cctv", label: "CCTV", icon: "📹" },
  { key: "parking", label: "Parking", icon: "🅿️" },
];

export const FAC = Object.fromEntries(FACILITIES.map((f) => [f.key, f]));

// ---------- Locations (add more here any time) ----------
export const LOCATIONS = [
  { name: "Ghatkesar", grad: "linear-gradient(135deg,#f97316,#ec4899)", icon: "🎓", note: "Near college campuses" },
  { name: "Uppal", grad: "linear-gradient(135deg,#06b6d4,#3b82f6)", icon: "🚇", note: "Metro & bus connectivity" },
  { name: "Boduppal", grad: "linear-gradient(135deg,#8b5cf6,#ec4899)", icon: "🏙️", note: "Calm residential area" },
  { name: "Ramanthapur", grad: "linear-gradient(135deg,#10b981,#06b6d4)", icon: "🌳", note: "Peaceful & green" },
  { name: "Habsiguda", grad: "linear-gradient(135deg,#f59e0b,#ef4444)", icon: "🏢", note: "Close to IT offices" },
  { name: "Pocharam", grad: "linear-gradient(135deg,#6366f1,#22d3ee)", icon: "🌇", note: "Budget friendly stays" },
];

export const BUDGETS = [
  { key: "any", label: "Any budget", min: 0, max: Infinity },
  { key: "u7", label: "Under ₹7,000", min: 0, max: 7000 },
  { key: "7-10", label: "₹7,000 – ₹10,000", min: 7000, max: 10000 },
  { key: "10-15", label: "₹10,000 – ₹15,000", min: 10000, max: 15000 },
  { key: "15+", label: "Above ₹15,000", min: 15000, max: Infinity },
];

export const SHARING_TYPES = [1, 2, 3, 4];

export const sharingLabel = (n) => (n === 1 ? "Single room" : `${n} Sharing`);

// Quick filter presets
export const PRESETS = [
  { label: "❄️ AC + 🧺 Washing Machine", facilities: ["ac", "washing"] },
  { label: "⭐ All Facilities", facilities: FACILITIES.map((f) => f.key) },
  { label: "💰 Budget Basic", facilities: ["wifi", "ro"], budget: "u7" },
];

// ---------- Seed PGs ----------
// row: [name, category, location, rating, [facility keys], [[sharing, rent, totalBeds, availableBeds], ...], blurb]
const ROWS = [
  // Ghatkesar
  ["Sunrise Stay", "men", "Ghatkesar", 4.5, ["wifi","ro","mess","geyser","power","cctv","biometric"], [[3,5500,18,6],[4,4500,24,9]], "Walk to campus. Simple, clean and friendly."],
  ["Campus Cove", "men", "Ghatkesar", 4.3, ["ac","wifi","ro","washing","tv","power","cooking"], [[2,9500,12,3],[3,7800,18,5]], "Modern rooms with AC and a shared kitchen."],
  ["Rose Villa", "women", "Ghatkesar", 4.8, ["ac","wifi","ro","mess","washing","cctv","biometric","geyser"], [[2,10500,10,2],[3,8500,18,4]], "Safe, bright and homely, with biometric entry."],
  ["Pearl Nest", "women", "Ghatkesar", 4.4, ["wifi","ro","mess","geyser","power","cctv"], [[3,6200,15,5],[4,5200,20,8]], "Budget stay close to the bus stop."],
  // Uppal
  ["Green Nest", "men", "Uppal", 4.2, ["wifi","ro","fridge","tv","power","parking"], [[2,8200,14,4],[4,5800,24,7]], "Five minutes from Uppal metro."],
  ["Royal Roost", "men", "Uppal", 4.6, ["ac","wifi","ro","fridge","washing","tv","geyser","power","mess","biometric","cctv","parking"], [[1,16000,6,1],[2,12500,12,2]], "Premium rooms with every facility."],
  ["Lotus Home", "women", "Uppal", 4.7, ["ac","wifi","ro","fridge","washing","mess","cctv","biometric","power"], [[2,11000,12,3],[3,9000,18,6]], "Quiet lanes and a caring warden."],
  ["Sweet Stay", "women", "Uppal", 4.1, ["wifi","ro","geyser","cooking","cctv"], [[3,6800,15,4],[4,5500,20,6]], "Cook your own meals in the shared kitchen."],
  // Boduppal
  ["Happy Homes", "men", "Boduppal", 4.0, ["wifi","ro","tv","geyser","cooking"], [[3,6500,18,7],[4,5200,24,10]], "Easygoing and affordable."],
  ["Blue Door", "men", "Boduppal", 4.4, ["ac","wifi","ro","fridge","tv","washing","power"], [[2,9800,10,2],[3,8000,15,5]], "Spacious rooms with AC and a TV lounge."],
  ["Safe Haven", "women", "Boduppal", 4.9, ["ac","wifi","ro","fridge","washing","tv","mess","geyser","power","cctv","biometric"], [[1,14500,6,2],[2,11800,12,3]], "Top-rated women's stay with 24x7 security."],
  ["Jasmine Stay", "women", "Boduppal", 4.2, ["wifi","ro","mess","cctv","geyser"], [[3,6000,18,6],[4,4900,24,9]], "Homely food and friendly rooms."],
  // Ramanthapur
  ["Star Stay", "men", "Ramanthapur", 4.3, ["wifi","ro","washing","tv","mess","power","cctv"], [[2,8800,12,3],[3,7000,18,6]], "Neat rooms with daily meals."],
  ["Lake View", "men", "Ramanthapur", 4.5, ["ac","wifi","ro","fridge","geyser","biometric","parking","cooking"], [[2,10200,10,4],[4,6900,20,8]], "Airy rooms, rooftop and biometric entry."],
  ["Moon Rise", "women", "Ramanthapur", 4.6, ["ac","wifi","ro","washing","mess","cctv","biometric","power"], [[2,10800,12,4],[3,8700,15,3]], "Calm area, ideal for study."],
  ["Sunshine Home", "women", "Ramanthapur", 4.0, ["wifi","ro","tv","geyser","cooking"], [[3,6400,15,5],[4,5000,20,8]], "Cheerful stay with self-cooking."],
  // Habsiguda
  ["City Nest", "men", "Habsiguda", 4.4, ["ac","wifi","ro","fridge","washing","tv","mess","power","cctv"], [[1,13500,8,2],[2,11000,12,3]], "Close to offices and coaching centers."],
  ["Cozy Corner", "men", "Habsiguda", 4.1, ["wifi","ro","geyser","tv","cooking"], [[3,6900,18,5],[4,5600,24,8]], "Small, cozy and budget friendly."],
  ["Orchid Home", "women", "Habsiguda", 4.7, ["ac","wifi","ro","fridge","washing","tv","mess","cctv","biometric","power","geyser"], [[1,15500,6,1],[2,12200,12,2]], "Premium women's stay, fully equipped."],
  ["Daisy Stay", "women", "Habsiguda", 4.2, ["wifi","ro","mess","cctv","geyser","power"], [[3,7200,18,6],[4,5900,24,7]], "Safe, clean and comfortable."],
  // Pocharam
  ["Easy Stay", "men", "Pocharam", 3.9, ["wifi","ro","power","cooking"], [[4,4200,28,12],[3,5000,18,8]], "Lowest rent in the area."],
  ["Pine Park", "men", "Pocharam", 4.2, ["ac","wifi","ro","tv","geyser","biometric","parking"], [[2,8500,12,4],[3,6800,18,7]], "Open, green and well connected."],
  ["Tulip Home", "women", "Pocharam", 4.3, ["wifi","ro","mess","cctv","biometric","geyser"], [[3,6300,15,5],[4,5100,20,9]], "Affordable stay with biometric entry."],
  ["Honey Nest", "women", "Pocharam", 4.0, ["wifi","ro","fridge","cooking","cctv"], [[2,7600,10,3],[4,4800,20,8]], "Warm and friendly, with a kitchen."],
];

export const PGS = ROWS.map((r, i) => ({
  id: i + 1,
  name: r[0],
  category: r[1],
  location: r[2],
  rating: r[3],
  facilities: r[4],
  sharing: r[5].map(([type, rent, total, available]) => ({ type, rent, total, available })),
  description: r[6],
  rules: ["Gate closes at 10:30 PM", "Visitors allowed in the lobby only", "No smoking or alcohol", "Rent due by the 5th of every month"],
}));

export const getPG = (id) => PGS.find((p) => p.id === Number(id));

// Card cover colours (picked by PG id)
export const COVERS = [
  "linear-gradient(135deg,#6366f1,#22d3ee)",
  "linear-gradient(135deg,#f97316,#ec4899)",
  "linear-gradient(135deg,#10b981,#3b82f6)",
  "linear-gradient(135deg,#8b5cf6,#f43f5e)",
  "linear-gradient(135deg,#f59e0b,#84cc16)",
  "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
];
export const WOMEN_COVERS = [
  "linear-gradient(135deg,#ec4899,#f59e0b)",
  "linear-gradient(135deg,#f43f5e,#a855f7)",
  "linear-gradient(135deg,#d946ef,#fb923c)",
  "linear-gradient(135deg,#fb7185,#fbbf24)",
];
