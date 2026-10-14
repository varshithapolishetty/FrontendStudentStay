import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LOCATIONS, PGS, BUDGETS, FACILITIES, FAC, COVERS, WOMEN_COVERS, getPG, sharingLabel } from "./data";
import { addBooking, cancelBooking, cancelBookingByServerId, getBookings, getUser, setSession, apiRequest, bedsLeft, activeBookings } from "./store";
import { Breadcrumb, FilterSidebar, OccupancyBar, PGCard, Stepper, money } from "./components";

const catName = (c) => (c === "women" ? "Women's Hostel" : "Men's Hostel");
const coverOf = (pg) => {
  const list = pg.category === "women" ? WOMEN_COVERS : COVERS;
  return list[pg.id % list.length];
};

/* ---------------- HOME ---------------- */
export function Home() {
  return (
    <>
      <section className="ss-hero">
        <span className="ss-orb o1" /><span className="ss-orb o2" /><span className="ss-orb o3" />
        <span className="ss-fl f1">🏠</span><span className="ss-fl f2">🛏️</span><span className="ss-fl f3">🎓</span><span className="ss-fl f4">📍</span>
        <div className="ss-hero-inner">
          <p className="ss-eyebrow">SMART STUDENT ACCOMMODATION</p>
          <h1>Find your perfect <span>student stay</span></h1>
          <p className="ss-hero-text">
            Men's and women's hostels near your college. Filter by budget, sharing and
            facilities, then book in a minute.
          </p>
          <Link to="/stay" className="ss-btn ss-btn-primary ss-btn-lg">Get Started →</Link>
          <div className="ss-hero-stats">
            <div><b>{PGS.length}+</b><span>Hostels</span></div>
            <div><b>{LOCATIONS.length}</b><span>Locations</span></div>
            <div><b>{FACILITIES.length}</b><span>Facilities to filter</span></div>
          </div>
        </div>
      </section>
      <section className="ss-section">
        <div className="ss-grid-4">
          {[
            ["🔍", "Smart filters", "Budget, sharing type and every facility you need."],
            ["📍", "6+ locations", "Stays across Hyderabad, close to colleges."],
            ["🖐️", "Safe & secure", "Biometric entry and CCTV where available."],
            ["📋", "Instant booking", "Your details are saved and viewable anytime."],
          ].map(([i, t, d]) => (
            <div key={t} className="ss-card ss-feature" style={{ "--h": t.length * 37 }}>
              <div className="ss-feature-icon">{i}</div>
              <h3>{t}</h3>
              <p className="ss-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ---------------- STEP 1: CATEGORY ---------------- */
export function Category() {
  const user = getUser();
  return (
    <div className="ss-page ss-center">
      <h1>{user ? `Hi ${user.name.split(" ")[0]} 👋` : "Welcome 👋"} Where do you want to stay?</h1>
      <p className="ss-muted">Choose one to continue</p>
      <div className="ss-cat-grid">
        <Link to="/stay/men" className="ss-card ss-cat ss-grad-men">
          <span className="ss-cat-emoji">👨‍🎓</span>
          <h2>Men's Hostel</h2>
          <p>{PGS.filter((p) => p.category === "men").length} stays available</p>
        </Link>
        <Link to="/stay/women" className="ss-card ss-cat ss-grad-women">
          <span className="ss-cat-emoji">👩‍🎓</span>
          <h2>Women's Hostel</h2>
          <p>{PGS.filter((p) => p.category === "women").length} stays available</p>
        </Link>
      </div>
    </div>
  );
}

/* ---------------- STEP 2: LOCATION ---------------- */
export function Locations() {
  const { cat } = useParams();
  const [q, setQ] = useState("");
  const list = LOCATIONS.filter((l) => l.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="ss-page">
      <Breadcrumb items={[{ label: "Home", to: "/stay" }, { label: catName(cat) }]} />
      <h1>Choose a location</h1>
      <input className="ss-input ss-search" placeholder="🔍 Search location..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="ss-grid-3">
        {list.map((l) => {
          const pgs = PGS.filter((p) => p.category === cat && p.location === l.name);
          const from = pgs.length ? Math.min(...pgs.flatMap((p) => p.sharing.map((s) => s.rent))) : null;
          return (
            <Link key={l.name} to={`/stay/${cat}/${l.name}`} className="ss-card ss-loc" style={{ "--accent": l.grad }}>
              <span className="ss-loc-icon" style={{ background: l.grad }}>{l.icon}</span>
              <div>
                <h3>{l.name}</h3>
                <p className="ss-muted">{l.note}</p>
                <p><b>{pgs.length}</b> hostels {from && <>• from <b>{money(from)}</b></>}</p>
              </div>
            </Link>
          );
        })}
        {list.length === 0 && <p className="ss-muted">No location found.</p>}
      </div>
    </div>
  );
}

/* ---------------- STEP 3: PG LIST + FILTERS ---------------- */
const emptyFilters = { sharing: [], budget: "any", facilities: [], sort: "rating" };

export function PGList() {
  const { cat, loc } = useParams();
  const [f, setF] = useState(emptyFilters);
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const b = BUDGETS.find((x) => x.key === f.budget);
    return PGS.filter((p) => p.category === cat && p.location === loc)
      .map((p) => {
        const options = p.sharing.filter(
          (s) => (f.sharing.length === 0 || f.sharing.includes(s.type)) && s.rent >= b.min && s.rent < b.max
        );
        return { pg: p, options };
      })
      .filter(({ pg, options }) => options.length > 0 && f.facilities.every((k) => pg.facilities.includes(k)))
      .sort((a, c) => {
        if (f.sort === "low") return Math.min(...a.options.map((o) => o.rent)) - Math.min(...c.options.map((o) => o.rent));
        if (f.sort === "high") return Math.min(...c.options.map((o) => o.rent)) - Math.min(...a.options.map((o) => o.rent));
        return c.pg.rating - a.pg.rating;
      });
  }, [cat, loc, f]);

  const chips = [
    ...f.sharing.map((n) => ({ label: sharingLabel(n), remove: () => setF({ ...f, sharing: f.sharing.filter((x) => x !== n) }) })),
    ...(f.budget !== "any" ? [{ label: BUDGETS.find((b) => b.key === f.budget).label, remove: () => setF({ ...f, budget: "any" }) }] : []),
    ...f.facilities.map((k) => ({ label: FAC[k].label, remove: () => setF({ ...f, facilities: f.facilities.filter((x) => x !== k) }) })),
  ];

  return (
    <div className="ss-page">
      <Breadcrumb items={[{ label: "Home", to: "/stay" }, { label: catName(cat), to: `/stay/${cat}` }, { label: loc }]} />
      <div className="ss-list-head">
        <div>
          <h1>{loc}</h1>
          <p className="ss-muted"><b>{results.length}</b> stays found</p>
        </div>
        <div className="ss-list-tools">
          <button className="ss-btn ss-btn-ghost ss-only-mobile" onClick={() => setOpen(true)}>⚙️ Filters</button>
          <select className="ss-input" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })}>
            <option value="rating">Top rated</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="ss-active">
          {chips.map((c) => (
            <span key={c.label} className="ss-active-chip">{c.label} <button onClick={c.remove}>✕</button></span>
          ))}
          <button className="ss-link-btn" onClick={() => setF({ ...emptyFilters, sort: f.sort })}>Clear all</button>
        </div>
      )}

      <div className="ss-layout">
        <div className={"ss-side " + (open ? "open" : "")}>
          <FilterSidebar f={f} setF={setF} onClose={() => setOpen(false)} resultCount={results.length} />
        </div>
        <div className="ss-grid-2">
          {results.map(({ pg, options }) => <PGCard key={pg.id} pg={pg} options={options} />)}
          {results.length === 0 && (
            <div className="ss-empty">
              <div>🔎</div>
              <h3>No stays match these filters</h3>
              <p className="ss-muted">Try removing a facility or widening your budget.</p>
              <button className="ss-btn ss-btn-primary" onClick={() => setF(emptyFilters)}>Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- PG DETAILS ---------------- */
export function PGDetails() {
  const { id } = useParams();
  const pg = getPG(id);
  const [tab, setTab] = useState("rooms");
  if (!pg) return <div className="ss-page">Hostel not found.</div>;

  const total = pg.sharing.reduce((s, o) => s + o.total, 0);
  const left = pg.sharing.reduce((s, o) => s + bedsLeft(pg, o), 0);

  return (
    <div className="ss-page">
      <Breadcrumb items={[{ label: "Home", to: "/stay" }, { label: catName(pg.category), to: `/stay/${pg.category}` }, { label: pg.location, to: `/stay/${pg.category}/${pg.location}` }, { label: pg.name }]} />
      <div className="ss-details">
        <div className="ss-detail-img" style={{ background: coverOf(pg) }}>
          <span className="ss-float">{pg.category === "women" ? "🏡" : "🏠"}</span>
        </div>
        <div>
          <p className="ss-eyebrow">{catName(pg.category).toUpperCase()}</p>
          <h1>{pg.name}</h1>
          <p className="ss-muted">📍 {pg.location}, Hyderabad • ⭐ {pg.rating}</p>
          <p className="ss-desc">{pg.description}</p>
          <div className="ss-badges">
            {pg.facilities.includes("biometric") && <span className="ss-badge ss-badge-blue">🖐️ Biometric Entry</span>}
            {pg.facilities.includes("cooking") && <span className="ss-badge ss-badge-orange">🍳 Self Cooking allowed</span>}
          </div>
          <OccupancyBar total={total} left={left} />
          <Link to={`/book/${pg.id}`} className={"ss-btn ss-btn-primary ss-btn-lg " + (left === 0 ? "disabled" : "")}>
            {left === 0 ? "No beds available" : "Book Now"}
          </Link>
        </div>
      </div>

      <div className="ss-tabs">
        {[["rooms", "Rooms & Rent"], ["fac", "Facilities"], ["rules", "Rules"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "rooms" && (
        <div className="ss-card ss-table-wrap">
          <table className="ss-table">
            <thead><tr><th>Sharing</th><th>Rent / month</th><th>Total beds</th><th>Available</th></tr></thead>
            <tbody>
              {pg.sharing.map((o) => (
                <tr key={o.type}>
                  <td><b>{sharingLabel(o.type)}</b></td>
                  <td>{money(o.rent)}</td>
                  <td>{o.total}</td>
                  <td><span className={"ss-badge " + (bedsLeft(pg, o) ? "ss-badge-green" : "ss-badge-red")}>{bedsLeft(pg, o)} left</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "fac" && (
        <div className="ss-fac-grid">
          {FACILITIES.map((x) => {
            const has = pg.facilities.includes(x.key);
            return <div key={x.key} className={"ss-fac " + (has ? "yes" : "no")}>{x.icon} {x.label} <b>{has ? "✓" : "—"}</b></div>;
          })}
        </div>
      )}

      {tab === "rules" && (
        <div className="ss-card ss-pad"><ul className="ss-rules">{pg.rules.map((r) => <li key={r}>{r}</li>)}</ul></div>
      )}
    </div>
  );
}

/* ---------------- BOOKING ---------------- */
export function Booking() {
  const { id } = useParams();
  const pg = getPG(id);
  const user = getUser();
  const [authRequired, setAuthRequired] = useState(!user);
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState(null);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "", place: "", phone: "", email: user?.email || "", joinDate: "",
  });

  if (!pg) return <div className="ss-page">Hostel not found.</div>;
  if (!user || authRequired) {
    const returnTo = `/book/${pg.id}`;
    return (
      <div className="ss-page ss-center">
        <div className="ss-card ss-success">
          <h1>Login required</h1>
          <p className="ss-muted">Please log in or create an account before booking {pg.name}.</p>
          <div className="ss-row">
            <Link to="/login" state={{ from: returnTo }} className="ss-btn ss-btn-primary">Login to continue</Link>
            <Link to="/register" state={{ from: returnTo }} className="ss-btn ss-btn-ghost">Create account</Link>
            <Link to={`/pg/${pg.id}`} className="ss-btn ss-btn-ghost">Back to hostel</Link>
          </div>
        </div>
      </div>
    );
  }
  const option = pg.sharing.find((o) => o.type === sel);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter your name";
    if (!form.place.trim()) e.place = "Enter your place";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit phone";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.joinDate) e.joinDate = "Choose a joining date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const confirm = async () => {
    if (!getUser()) {
      setAuthRequired(true);
      return;
    }
    if (!option || bedsLeft(pg, option) === 0) return;
    setBookingBusy(true);
    setBookingError("");
    try {
      const saved = await apiRequest("/demo-bookings", {
        method: "POST",
        body: JSON.stringify({
          pgId: pg.id,
          pgName: pg.name,
          location: pg.location,
          category: pg.category,
          sharing: option.type,
          rent: option.rent,
          studentName: form.name,
          place: form.place,
          phone: form.phone,
          moveInDate: form.joinDate,
        }),
      });
      addBooking({
        pgId: pg.id, pgName: pg.name, location: pg.location, category: pg.category,
        sharing: option.type, rent: option.rent, ...form, serverBookingId: saved.id,
      });
      setDone({
        ...saved,
        id: `DB-${saved.id}`,
        pgName: saved.pgName,
        sharing: saved.sharing,
        rent: saved.rent,
        moveInDate: saved.moveInDate,
      });
    } catch (requestError) {
      setBookingError(requestError.message);
    } finally {
      setBookingBusy(false);
    }
  };

  if (done) {
    return (
      <div className="ss-page ss-center">
        <div className="ss-confetti">
          {Array.from({ length: 36 }).map((_, i) => (
            <i key={i} style={{
              left: ((i * 2.8) % 100) + "%",
              background: ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"][i % 6],
              animationDelay: (i % 9) * 0.12 + "s",
              animationDuration: 2 + (i % 5) * 0.4 + "s",
            }} />
          ))}
        </div>
        <div className="ss-card ss-success">
          <div className="ss-check">✓</div>
          <h1>Booking confirmed!</h1>
          <p className="ss-muted">Your Booking ID</p>
          <h2 className="ss-bid">{done.id}</h2>
          <p>{pg.name}, {pg.location} • {sharingLabel(done.sharing)} • {money(done.rent)}/month</p>
          <div className="ss-row">
            <Link to="/my-bookings" className="ss-btn ss-btn-primary">View my bookings</Link>
            <Link to={`/pg/${pg.id}`} className="ss-btn ss-btn-ghost">Back to hostel</Link>
          </div>
        </div>
      </div>
    );
  }

  const field = (key, label, type = "text", ph = "") => (
    <div className="ss-field">
      <label>{label}</label>
      <input className={"ss-input " + (errors[key] ? "err" : "")} type={type} placeholder={ph} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      {errors[key] && <small className="ss-error">{errors[key]}</small>}
    </div>
  );

  return (
    <div className="ss-page ss-narrow">
      <h1>Book {pg.name}</h1>
      <Stepper steps={["Select room", "Your details", "Confirm"]} current={step} />

      {step === 0 && (
        <div className="ss-card ss-pad">
          <h3>Choose sharing type</h3>
          <div className="ss-opt-grid">
            {pg.sharing.map((o) => {
              const l = bedsLeft(pg, o);
              return (
                <button key={o.type} disabled={l === 0} className={"ss-opt " + (sel === o.type ? "on" : "")} onClick={() => setSel(o.type)}>
                  <b>{sharingLabel(o.type)}</b>
                  <span>{money(o.rent)}/month</span>
                  <small>{l ? `${l} beds left` : "Full"}</small>
                </button>
              );
            })}
          </div>
          <button className="ss-btn ss-btn-primary" disabled={!sel} onClick={() => setStep(1)}>Continue →</button>
        </div>
      )}

      {step === 1 && (
        <div className="ss-card ss-pad">
          <h3>Student details</h3>
          <div className="ss-form-grid">
            {field("name", "Full name", "text", "Your name")}
            {field("place", "Place (hometown)", "text", "e.g. Warangal")}
            {field("phone", "Phone", "tel", "10-digit mobile")}
            {field("email", "Email", "email", "you@college.edu")}
            {field("joinDate", "Joining date", "date")}
          </div>
          <div className="ss-row">
            <button className="ss-btn ss-btn-ghost" onClick={() => setStep(0)}>← Back</button>
            <button className="ss-btn ss-btn-primary" onClick={() => validate() && setStep(2)}>Continue →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="ss-card ss-pad">
          <h3>Review & confirm</h3>
          <dl className="ss-summary">
            <dt>Hostel</dt><dd>{pg.name}, {pg.location}</dd>
            <dt>Room</dt><dd>{sharingLabel(option.type)}</dd>
            <dt>Rent</dt><dd>{money(option.rent)} / month</dd>
            <dt>Name</dt><dd>{form.name}</dd>
            <dt>Place</dt><dd>{form.place}</dd>
            <dt>Phone</dt><dd>{form.phone}</dd>
            <dt>Email</dt><dd>{form.email}</dd>
            <dt>Joining</dt><dd>{form.joinDate}</dd>
          </dl>
          <div className="ss-row">
            <button className="ss-btn ss-btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="ss-btn ss-btn-primary" onClick={confirm} disabled={bookingBusy}>{bookingBusy ? "Saving booking..." : "Confirm Booking"}</button>
          </div>
          {bookingError && <p className="ss-error" role="alert">{bookingError}</p>}
        </div>
      )}
    </div>
  );
}

/* ---------------- MY BOOKINGS ---------------- */
export function MyBookings() {
  const user = getUser();
  const userEmail = user?.email;
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(user));

  const load = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    const localBookings = getBookings()
      .filter((booking) => !booking.serverBookingId
        && (booking.accountEmail || booking.email)?.toLowerCase() === userEmail.toLowerCase())
      .map((booking) => ({ ...booking, source: "local" }));
    setList(localBookings);
    try {
      const [demoBookings, propertyBookings] = await Promise.all([
        apiRequest("/demo-bookings/my"),
        apiRequest("/bookings/my"),
      ]);
      const persistedDemoBookings = (demoBookings || []).map((booking) => ({
        ...booking,
        id: `DB-${booking.id}`,
        serverBookingId: booking.id,
        pgName: booking.pgName,
        sharing: booking.sharing,
        rent: booking.rent,
        joinDate: booking.moveInDate,
        status: booking.status === "ACTIVE" ? "Confirmed" : booking.status,
        source: "demo-api",
      }));
      const persistedPropertyBookings = (propertyBookings || []).map((booking) => ({
        ...booking,
        pgName: booking.propertyTitle,
        sharing: booking.roomName || "Room",
        rent: booking.monthlyRent,
        joinDate: booking.moveInDate,
        status: booking.status,
        source: "api",
      }));
      setList([...persistedDemoBookings, ...persistedPropertyBookings, ...localBookings]);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const cancel = async (booking) => {
    setError("");
    try {
      if (booking.source === "local") {
        cancelBooking(booking.id);
      } else if (booking.source === "demo-api") {
        await apiRequest(`/demo-bookings/${booking.serverBookingId}/cancel`, { method: "PATCH" });
        cancelBookingByServerId(booking.serverBookingId);
      } else {
        await apiRequest(`/bookings/${booking.id}/cancel`, {
          method: "PATCH",
          body: JSON.stringify({ reason: "Cancelled by student" }),
        });
      }
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="ss-page">
      <h1>My Bookings</h1>
      {error && <p className="ss-error" role="alert">{error}</p>}
      {!user && <div className="ss-empty"><h3>Log in to view your bookings</h3><Link to="/login" className="ss-btn ss-btn-primary">Login</Link></div>}
      {loading && <p className="ss-muted">Loading your bookings...</p>}
      {user && !loading && list.length === 0 && (
        <div className="ss-empty"><div>🛏️</div><h3>No bookings yet</h3><Link to="/stay" className="ss-btn ss-btn-primary">Find a stay</Link></div>
      )}
      <div className="ss-grid-2">
        {list.map((b) => (
          <div key={b.id} className="ss-card ss-pad">
            <div className="ss-row ss-between">
              <h3>{b.pgName || b.propertyTitle}</h3>
              <span className={"ss-badge " + (["Confirmed", "ACTIVE"].includes(b.status) ? "ss-badge-green" : "ss-badge-red")}>{statusText(b.status)}</span>
            </div>
            <p className="ss-muted">📍 {b.location || b.propertyLocation || ""} • {b.sharing ? sharingLabel(b.sharing) : b.roomName || "Room"} • {money(b.rent ?? b.monthlyRent)}/mo</p>
            <p>Booking ID: <b>{b.id}</b></p>
            <p className="ss-muted">Joining: {b.joinDate || b.moveInDate || "—"}</p>
            {["Confirmed", "ACTIVE"].includes(b.status) && <button className="ss-btn ss-btn-ghost" onClick={() => void cancel(b)}>Cancel booking</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- RESIDENTS (owner / admin view) ---------------- */
export function Residents() {
  const [pgId, setPgId] = useState(PGS[0].id);
  const [q, setQ] = useState("");
  const pg = getPG(pgId);
  const total = pg.sharing.reduce((s, o) => s + o.total, 0);
  const left = pg.sharing.reduce((s, o) => s + bedsLeft(pg, o), 0);
  const residents = activeBookings(pg.id).filter(
    (r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.place.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="ss-page">
      <h1>Registered Residents</h1>
      <p className="ss-muted">Owner / admin view. Student names and places are saved after every booking.</p>
      <select className="ss-input ss-select-pg" value={pgId} onChange={(e) => setPgId(Number(e.target.value))}>
        {PGS.map((p) => <option key={p.id} value={p.id}>{p.name} – {p.location} ({p.category === "women" ? "Women" : "Men"})</option>)}
      </select>

      <div className="ss-grid-3 ss-stats">
        <div className="ss-card ss-stat"><span>Total beds</span><b>{total}</b></div>
        <div className="ss-card ss-stat"><span>Occupied</span><b>{total - left}</b></div>
        <div className="ss-card ss-stat"><span>Vacant</span><b>{left}</b></div>
      </div>
      <OccupancyBar total={total} left={left} />

      <input className="ss-input ss-search" placeholder="🔍 Search by name or place..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="ss-card ss-table-wrap">
        <table className="ss-table">
          <thead><tr><th>Name</th><th>Place</th><th>Room</th><th>Phone</th><th>Joining</th></tr></thead>
          <tbody>
            {residents.map((r) => (
              <tr key={r.id}><td><b>{r.name}</b></td><td>{r.place}</td><td>{sharingLabel(r.sharing)}</td><td>{r.phone}</td><td>{r.joinDate}</td></tr>
            ))}
            {residents.length === 0 && <tr><td colSpan="5" className="ss-muted ss-center">No registered students yet for this hostel.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- ROLE DASHBOARDS ---------------- */
const statusText = (status) => ({
  ACTIVE: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Checked out",
  PENDING: "Pending",
  ACCEPTED: "Approved",
  REJECTED: "Rejected",
}[status] || status || "—");

function StatCard({ label, value }) {
  return <div className="ss-card ss-stat"><span>{label}</span><b>{value ?? 0}</b></div>;
}

function StudentDashboard({ user }) {
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [remoteProfile, remoteBookings, remoteApplications, remoteDemoBookings] = await Promise.all([
        apiRequest("/auth/me"),
        apiRequest("/bookings/my"),
        apiRequest("/applications/my"),
        apiRequest("/demo-bookings/my"),
      ]);
      setProfile(remoteProfile);
      const localBookings = getBookings()
        .filter((booking) => !booking.serverBookingId
          && (booking.accountEmail || booking.email)?.toLowerCase() === user.email?.toLowerCase())
        .map((booking) => ({ ...booking, source: "local" }));
      const persistedDemoBookings = (remoteDemoBookings || []).map((booking) => ({
        ...booking,
        id: `DB-${booking.id}`,
        serverBookingId: booking.id,
        status: booking.status,
        source: "demo-api",
      }));
      setBookings([
        ...localBookings,
        ...persistedDemoBookings,
        ...(remoteBookings || []).map((booking) => ({ ...booking, source: "api" })),
      ]);
      setApplications(remoteApplications || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [user.email]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const cancel = async (booking) => {
    setError("");
    setNotice("");
    try {
      if (booking.source === "local") {
        cancelBooking(booking.id);
      } else if (booking.source === "demo-api") {
        await apiRequest(`/demo-bookings/${booking.serverBookingId}/cancel`, { method: "PATCH" });
        cancelBookingByServerId(booking.serverBookingId);
      } else {
        await apiRequest(`/bookings/${booking.id}/cancel`, {
          method: "PATCH",
          body: JSON.stringify({ reason: "Cancelled by student" }),
        });
      }
      setNotice("Booking cancelled.");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const activeCount = bookings.filter((booking) => ["ACTIVE", "Confirmed"].includes(booking.status)).length;
  return (
    <div className="ss-page">
      <div className="ss-row ss-between">
        <div><h1>Student Dashboard</h1><p className="ss-muted">Welcome, {profile.fullName || profile.name || profile.username || profile.email}</p></div>
        <Link to="/stay" className="ss-btn ss-btn-primary">Find a hostel</Link>
      </div>
      {error && <p className="ss-error" role="alert">{error}</p>}
      {notice && <p className="ss-muted" role="status">{notice}</p>}
      <div className="ss-grid-3 ss-stats">
        <StatCard label="Your bookings" value={bookings.length} />
        <StatCard label="Active bookings" value={activeCount} />
        <StatCard label="Applications" value={applications.length} />
      </div>
      <section className="ss-section">
        <h2>My profile</h2>
        <div className="ss-card ss-pad" style={{ marginTop: 14 }}>
          <p><b>Name</b> &nbsp; {profile.fullName || profile.name || "—"}</p>
          <p><b>Username</b> &nbsp; {profile.username || "—"}</p>
          <p><b>Email</b> &nbsp; {profile.email || "—"}</p>
          <p><b>Phone</b> &nbsp; {profile.phone || "—"}</p>
        </div>
      </section>
      <section className="ss-section">
        <div className="ss-row ss-between"><h2>Booking history</h2><Link to="/my-bookings" className="ss-link">View all</Link></div>
        {bookings.length === 0 ? (
          <div className="ss-empty"><div>🛏️</div><h3>No bookings yet</h3><Link to="/stay" className="ss-btn ss-btn-primary">Find a stay</Link></div>
        ) : (
          <div className="ss-grid-2">
            {bookings.map((booking) => {
              const active = ["ACTIVE", "Confirmed"].includes(booking.status);
              const name = booking.propertyTitle || booking.pgName || "Hostel";
              const location = booking.location || booking.propertyLocation || "";
              const room = booking.roomName || (booking.sharing ? sharingLabel(booking.sharing) : "Room allocation");
              const rent = booking.monthlyRent ?? booking.rent;
              return (
                <article className="ss-card ss-pad" key={`${booking.source}-${booking.id}`}>
                  <div className="ss-row ss-between"><h3>{name}</h3><span className={"ss-badge " + (active ? "ss-badge-green" : "ss-badge-red")}>{statusText(booking.status)}</span></div>
                  <p className="ss-muted">📍 {location} {location && "•"} {room}</p>
                  <p>Booking ID: <b>{booking.id}</b></p>
                  {rent != null && <p>Rent: {money(rent)}/month</p>}
                  <p className="ss-muted">Joining: {booking.moveInDate || booking.joinDate || "—"}</p>
                  {active && <button className="ss-btn ss-btn-ghost" onClick={() => cancel(booking)}>Cancel booking</button>}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <section className="ss-section">
        <h2>Application status</h2>
        {applications.length === 0 ? <p className="ss-muted" style={{ marginTop: 12 }}>No applications yet.</p> : (
          <div className="ss-grid-2" style={{ marginTop: 14 }}>
            {applications.map((application) => (
              <article className="ss-card ss-pad" key={application.id}>
                <div className="ss-row ss-between"><h3>{application.propertyTitle || application.propertyName || "Hostel"}</h3><span className="ss-badge ss-badge-blue">{statusText(application.status)}</span></div>
                <p className="ss-muted">Requested move-in: {application.proposedMoveInDate || "—"}</p>
                {application.ownerDecisionReason && <p>{application.ownerDecisionReason}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OwnerDashboard() {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [applications, setApplications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState("");
  const [roomEdits, setRoomEdits] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const owned = await apiRequest("/properties/owner");
      const data = await Promise.all((owned || []).map(async (property) => {
        const [details, propertyApplications, propertyBookings] = await Promise.all([
          apiRequest(`/properties/${property.id}?includeUnverified=true`),
          apiRequest(`/properties/${property.id}/applications`),
          apiRequest(`/properties/${property.id}/bookings`),
        ]);
        return {
          ...details,
          title: details.title || property.title,
          status: details.status || property.status,
          applications: propertyApplications || [],
          bookings: (propertyBookings || []).map((booking) => ({
            ...booking,
            propertyTitle: details.title,
            propertyLocation: [details.locality, details.city].filter(Boolean).join(", "),
          })),
        };
      }));
      setProperties(data);
      setApplications(data.flatMap((property) => property.applications));
      setBookings(data.flatMap((property) => property.bookings));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const perform = async (action, successMessage) => {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const decideApplication = (application, status) => perform(
    () => apiRequest(`/applications/${application.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason: "" }),
    }),
    `Application ${status === "ACCEPTED" ? "approved" : "rejected"}.`,
  );

  const setAttendance = (booking, status) => perform(
    () => apiRequest(`/bookings/${booking.id}/attendance`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
    `Attendance updated to ${status.toLowerCase()}.`,
  );

  const bookingAction = (booking, action) => perform(
    () => apiRequest(`/bookings/${booking.id}/${action}`, { method: "POST" }),
    action === "check-in" ? "Student checked in." : "Student checked out.",
  );

  const updateBed = (bed, status) => perform(
    () => apiRequest(`/beds/${bed.id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
    `Bed ${bed.bedNumber} availability updated.`,
  );

  const saveRoom = (room) => {
    const edit = roomEdits[room.id] || room;
    return perform(
      () => apiRequest(`/rooms/${room.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: edit.name,
          roomType: edit.roomType,
          capacity: Number(edit.capacity),
          rentPerMonth: Number(edit.rentPerMonth),
        }),
      }),
      `${edit.name} updated.`,
    );
  };

  const selectedProperty = properties.find((property) => String(property.id) === selectedPropertyId) || properties[0];
  const totalBeds = properties.reduce((total, property) => total + (property.rooms || []).reduce((sum, room) => sum + (room.totalBeds || 0), 0), 0);
  const vacantBeds = properties.reduce((total, property) => total + (property.rooms || []).reduce((sum, room) => sum + (room.availableBeds || 0), 0), 0);
  const activeBookings = bookings.filter((booking) => booking.status === "ACTIVE");
  const filteredResidents = activeBookings.filter((booking) => {
    const term = query.trim().toLowerCase();
    return !term || [booking.studentName, booking.studentEmail, booking.studentPhone, booking.propertyTitle, booking.roomName]
      .some((value) => value?.toLowerCase().includes(term));
  });
  const pendingApplications = applications.filter((application) => application.status === "PENDING");

  return (
    <div className="ss-page">
      <div className="ss-row ss-between">
        <div><h1>Owner Dashboard</h1><p className="ss-muted">Manage your hostels, applications and residents.</p></div>
        <button className="ss-btn ss-btn-ghost" onClick={() => { setError(""); void load(); }}>Refresh</button>
      </div>
      {error && <p className="ss-error" role="alert">{error}</p>}
      {notice && <p className="ss-muted" role="status">{notice}</p>}
      <div className="ss-grid-3 ss-stats">
        <StatCard label="Your hostels" value={properties.length} />
        <StatCard label="Pending applications" value={pendingApplications.length} />
        <StatCard label="Occupied beds" value={totalBeds - vacantBeds} />
        <StatCard label="Vacant beds" value={vacantBeds} />
        <StatCard label="Active allocations" value={activeBookings.length} />
        <StatCard label="Total beds" value={totalBeds} />
      </div>

      <section className="ss-section">
        <h2>Your hostels & rooms</h2>
        {properties.length === 0 ? <div className="ss-empty"><div>🏠</div><h3>No hostels are assigned to this owner account yet</h3></div> : (
          <div style={{ marginTop: 14 }}>
            <div className="ss-field ss-select-pg">
              <label htmlFor="owner-hostel-select">Select a hostel to view its details</label>
              <select id="owner-hostel-select" className="ss-input" value={selectedProperty?.id ?? ""} onChange={(event) => setSelectedPropertyId(event.target.value)}>
                {properties.map((property) => <option value={property.id} key={property.id}>{property.title}</option>)}
              </select>
            </div>
            {selectedProperty && <article className="ss-card ss-pad">
                <div className="ss-row ss-between">
                  <div><h3>{selectedProperty.title}</h3><p className="ss-muted">📍 {selectedProperty.locality}, {selectedProperty.city}</p></div>
                  <span className="ss-badge ss-badge-blue">{selectedProperty.status}</span>
                </div>
                <p>{selectedProperty.availableBeds ?? 0} vacant / {selectedProperty.totalBeds ?? 0} total beds</p>
                <p className="ss-muted">Facilities: {(selectedProperty.facilities || []).join(", ") || "Not specified"}</p>
                {(selectedProperty.rooms || []).length === 0 && <p className="ss-muted">No rooms have been added.</p>}
                {(selectedProperty.rooms || []).map((room) => {
                  const edit = roomEdits[room.id] || room;
                  return (
                    <div className="ss-card ss-pad" key={room.id} style={{ boxShadow: "none" }}>
                      <div className="ss-row ss-between"><h3>{room.name}</h3><span className="ss-muted">{room.availableBeds}/{room.totalBeds} vacant</span></div>
                      <div className="ss-form-grid">
                        <div className="ss-field"><label htmlFor={`room-name-${room.id}`}>Room name</label><input id={`room-name-${room.id}`} className="ss-input" value={edit.name} onChange={(event) => setRoomEdits((current) => ({ ...current, [room.id]: { ...edit, name: event.target.value } }))} /></div>
                        <div className="ss-field"><label htmlFor={`room-type-${room.id}`}>Sharing type</label>
                          <select id={`room-type-${room.id}`} className="ss-input" value={edit.roomType} onChange={(event) => setRoomEdits((current) => ({ ...current, [room.id]: { ...edit, roomType: event.target.value } }))}>
                            {["SINGLE", "DOUBLE", "TRIPLE", "FOUR_SHARE", "OTHER"].map((type) => <option value={type} key={type}>{type.replace("_", " ")}</option>)}
                          </select>
                        </div>
                        <div className="ss-field"><label htmlFor={`room-capacity-${room.id}`}>Total beds</label><input id={`room-capacity-${room.id}`} type="number" min={room.totalBeds} className="ss-input" value={edit.capacity} onChange={(event) => setRoomEdits((current) => ({ ...current, [room.id]: { ...edit, capacity: event.target.value } }))} /></div>
                        <div className="ss-field"><label htmlFor={`room-rent-${room.id}`}>Monthly rent</label><input id={`room-rent-${room.id}`} type="number" min="0" className="ss-input" value={edit.rentPerMonth} onChange={(event) => setRoomEdits((current) => ({ ...current, [room.id]: { ...edit, rentPerMonth: event.target.value } }))} /></div>
                      </div>
                      <button className="ss-btn ss-btn-ghost" onClick={() => saveRoom(room)}>Save room details</button>
                      {room.beds?.length > 0 && <div className="ss-row">{room.beds.map((bed) => (
                        <label key={bed.id} className="ss-muted">{bed.bedNumber}{" "}
                          <select className="ss-input" aria-label={`${bed.bedNumber} status`} value={bed.status} disabled={bed.status === "ALLOCATED"} onChange={(event) => updateBed(bed, event.target.value)}>
                            <option value="AVAILABLE">Available</option><option value="MAINTENANCE">Maintenance</option>{bed.status === "ALLOCATED" && <option value="ALLOCATED">Allocated</option>}
                          </select>
                        </label>
                      ))}</div>}
                    </div>
                  );
                })}
              </article>}
          </div>
        )}
      </section>

      <section className="ss-section">
        <h2>Booking requests</h2>
        {pendingApplications.length === 0 ? <p className="ss-muted" style={{ marginTop: 12 }}>No pending applications.</p> : (
          <div className="ss-grid-2" style={{ marginTop: 14 }}>
            {pendingApplications.map((application) => (
              <article className="ss-card ss-pad" key={application.id}>
                <h3>{application.propertyTitle}</h3>
                <p><b>{application.studentName}</b> · {application.studentEmail}</p>
                <p className="ss-muted">{application.roomName || "Room"} · Move-in {application.proposedMoveInDate || "—"}</p>
                {application.note && <p>{application.note}</p>}
                <div className="ss-row">
                  <button className="ss-btn ss-btn-primary" onClick={() => decideApplication(application, "ACCEPTED")}>Approve</button>
                  <button className="ss-btn ss-btn-ghost" onClick={() => decideApplication(application, "REJECTED")}>Reject</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="ss-section">
        <div className="ss-row ss-between">
          <h2>Residents & allocations</h2>
          <input className="ss-input ss-search" aria-label="Search residents" placeholder="Search name, email, phone, hostel or room" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="ss-card ss-table-wrap" style={{ marginTop: 14 }}>
          <table className="ss-table">
            <thead><tr><th>Student</th><th>Contact</th><th>Hostel / room</th><th>Joining</th><th>Attendance</th><th>Check-in</th></tr></thead>
            <tbody>
              {filteredResidents.map((booking) => (
                <tr key={booking.id}>
                  <td><b>{booking.studentName}</b><br /><span className="ss-muted">Booking #{booking.id}</span></td>
                  <td>{booking.studentEmail}<br />{booking.studentPhone || "—"}</td>
                  <td>{booking.propertyTitle}<br />{booking.roomName || booking.bedNumber || "—"}</td>
                  <td>{booking.moveInDate || "—"}</td>
                  <td><select className="ss-input" aria-label={`Attendance for ${booking.studentName}`} value={booking.attendanceStatus || ""} onChange={(event) => setAttendance(booking, event.target.value)}>
                    <option value="" disabled>Record attendance</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option>
                  </select></td>
                  <td>{booking.checkedInAt && !booking.checkedOutAt
                    ? <button className="ss-btn ss-btn-ghost" onClick={() => bookingAction(booking, "check-out")}>Check out</button>
                    : booking.checkedOutAt ? <span className="ss-muted">Checked out</span>
                      : <button className="ss-btn ss-btn-primary" onClick={() => bookingAction(booking, "check-in")}>Check in</button>}
                  </td>
                </tr>
              ))}
              {filteredResidents.length === 0 && <tr><td colSpan="6" className="ss-muted ss-center">No residents match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [allUsers, allProperties, allDemoBookings] = await Promise.all([
        apiRequest("/admin/users"),
        apiRequest("/admin/properties"),
        apiRequest("/admin/demo-bookings"),
      ]);
      const propertyBookings = await Promise.all(allProperties.map(async (property) => {
        try {
          const propertyId = property.id;
          const rows = await apiRequest(`/properties/${propertyId}/bookings`);
          return (rows || []).map((booking) => ({
            ...booking,
            propertyTitle: property.title,
            propertyLocation: [property.locality, property.city].filter(Boolean).join(", "),
          }));
        } catch (bookingError) {
          throw new Error(`Could not load bookings for ${property.title || `hostel ${property.id}`}: ${bookingError.message}`);
        }
      }));
      setUsers(allUsers || []);
      setBookings([
        ...propertyBookings.flat(),
        ...(allDemoBookings || []).map((booking) => ({
          ...booking,
          propertyTitle: booking.pgName,
          propertyLocation: booking.location,
          roomName: booking.sharing,
          moveInDate: booking.moveInDate,
          status: booking.status,
        })),
      ]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const students = users.filter((user) => user.role === "STUDENT");
  const bookingsByStudent = new Map();
  bookings.forEach((booking) => {
    const email = booking.studentEmail?.toLowerCase();
    if (!email) return;
    const studentBookings = bookingsByStudent.get(email) || [];
    studentBookings.push(booking);
    bookingsByStudent.set(email, studentBookings);
  });
  const housedStudentCount = new Set(
    bookings.filter((booking) => booking.status === "ACTIVE")
      .map((booking) => booking.studentEmail?.toLowerCase())
      .filter(Boolean),
  ).size;

  const updateRole = async (user, role) => {
    setError("");
    setNotice("");
    try {
      const updated = await apiRequest(`/admin/users/${user.id}/role?role=${encodeURIComponent(role)}`, { method: "PATCH" });
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${updated.fullName}'s role updated.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="ss-page">
      <h1>Admin Dashboard</h1>
      <p className="ss-muted">Manage accounts and view registered students and their hostel assignments.</p>
      {error && <p className="ss-error" role="alert">{error}</p>}
      {notice && <p className="ss-muted" role="status">{notice}</p>}
      <div className="ss-grid-3 ss-stats">
        <StatCard label="Registered students" value={students.length} />
        <StatCard label="Students with active hostel bookings" value={housedStudentCount} />
      </div>
      <section className="ss-section">
        <h2>Account management</h2>
        <div className="ss-card ss-table-wrap" style={{ marginTop: 14 }}>
          <table className="ss-table">
            <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Role</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><b>{user.fullName}</b></td><td>{user.username || "—"}</td><td>{user.email}</td><td>{user.phone || "—"}</td>
                  <td><select className="ss-input" value={user.role} onChange={(event) => updateRole(user, event.target.value)}>
                    <option value="STUDENT">Student</option><option value="OWNER">Owner</option><option value="ADMIN">Admin</option>
                  </select></td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="5" className="ss-muted ss-center">No accounts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="ss-section">
        <h2>Registered students and hostel assignments</h2>
        <p className="ss-muted">Registered students are listed even if they have not booked a hostel yet.</p>
        <div className="ss-card ss-table-wrap" style={{ marginTop: 14 }}>
          <table className="ss-table">
            <thead><tr><th>Student</th><th>Contact</th><th>Hostel and room</th><th>Move-in</th><th>Booking status</th></tr></thead>
            <tbody>
              {students.map((student) => {
                const assignments = bookingsByStudent.get(student.email?.toLowerCase()) || [];
                return (
                  <tr key={student.id}>
                    <td><b>{student.fullName}</b><br /><span className="ss-muted">{student.username || "No username"}</span></td>
                    <td>{student.email}<br />{student.phone || "No phone provided"}</td>
                    <td>{assignments.length === 0 ? <span className="ss-muted">Not assigned to a hostel</span> : assignments.map((booking) => (
                      <div key={booking.id}>
                        <b>{booking.propertyTitle || "Hostel"}</b>
                        {booking.propertyLocation && <><br /><span className="ss-muted">{booking.propertyLocation}</span></>}
                        <br /><span className="ss-muted">{booking.roomName || "Room"}{booking.bedNumber ? ` · Bed ${booking.bedNumber}` : ""}</span>
                      </div>
                    ))}</td>
                    <td>{assignments.length === 0 ? "—" : assignments.map((booking) => <div key={booking.id}>{booking.moveInDate || "—"}</div>)}</td>
                    <td>{assignments.length === 0 ? "No booking" : assignments.map((booking) => <div key={booking.id}>{statusText(booking.status)}</div>)}</td>
                  </tr>
                );
              })}
              {students.length === 0 && <tr><td colSpan="5" className="ss-muted ss-center">No students have registered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="ss-section">
        <h2>All bookings</h2>
        <div className="ss-card ss-table-wrap" style={{ marginTop: 14 }}>
          <table className="ss-table">
            <thead><tr><th>Booking ID</th><th>Student</th><th>Hostel</th><th>Room</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.map((booking) => <tr key={booking.id}><td>{booking.id}</td><td>{booking.studentName || booking.studentEmail || "—"}</td><td>{booking.propertyTitle}</td><td>{booking.roomName || booking.bedNumber || "—"}</td><td>{statusText(booking.status)}</td></tr>)}
              {bookings.length === 0 && <tr><td colSpan="5" className="ss-muted ss-center">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  if (!user) {
    return <div className="ss-page ss-center"><div className="ss-card ss-success"><h1>Login required</h1><p className="ss-muted">Log in to open your dashboard.</p><Link to="/login" className="ss-btn ss-btn-primary">Login</Link></div></div>;
  }
  if (user.role === "ADMIN") return <AdminDashboard />;
  if (user.role === "STUDENT") return <StudentDashboard user={user} />;
  if (user.role === "OWNER") return <OwnerDashboard />;
  return <div className="ss-page"><h1>Dashboard unavailable</h1><button className="ss-btn ss-btn-primary" onClick={() => navigate("/login")}>Sign in again</button></div>;
}

/* ---------------- AUTH (frontend demo) ---------------- */
function AuthForm({ mode }) {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", username: "", email: "", phone: "", password: "", identifier: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isReg = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setErr("");
    if (isReg && !f.name.trim()) return setErr("Enter your name");
    if (isReg && !/^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]*[@#$_.-][A-Za-z0-9]*$/.test(f.username)) {
      return setErr("Username must include letters, numbers, and exactly one of these characters: @ # $ _ - .");
    }
    const identifier = f.identifier.trim();
    const email = isReg ? f.email.trim() : identifier;
    if (isReg && !/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email");
    if (!isReg && !identifier) return setErr("Enter your username or email");
    if (isReg && !f.password) return setErr("Enter a password");
    if (!isReg && !f.password) return setErr("Enter your password");
    setBusy(true);
    try {
      const auth = await apiRequest(`/auth/${isReg ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(isReg
          ? { fullName: f.name.trim(), username: f.username.trim(), email, phone: f.phone.trim(), password: f.password, role: "STUDENT" }
          : { username: identifier.includes("@") ? undefined : identifier, email: identifier.includes("@") ? identifier : undefined, password: f.password }),
      });
      setSession(auth);
      window.dispatchEvent(new Event("ss-auth"));
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setErr(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ss-auth">
      <div className="ss-auth-art ss-grad-men"><h2>🏠 StudentStay</h2><p>Your next home is a few clicks away.</p></div>
      <div className="ss-auth-form">
        <h1>{isReg ? "Create account" : "Welcome back"}</h1>
        <form onSubmit={submit}>
          {isReg && <div className="ss-field"><label>Full name</label><input className="ss-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>}
          {isReg && <div className="ss-field"><label>Username</label><input className="ss-input" autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>}
          {isReg && <div className="ss-field"><label>Email</label><input className="ss-input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>}
          {isReg && <div className="ss-field"><label>Phone</label><input className="ss-input" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>}
          {!isReg && <div className="ss-field"><label>Admin ID, username or email</label><input className="ss-input" autoComplete="username" value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} /><small className="ss-muted">Sign in with your account ID and password. You’ll be taken to the dashboard for your role.</small></div>}
          <div className="ss-field">
            <label>Password</label>
            <input className="ss-input" type="password" autoComplete={isReg ? "new-password" : "current-password"} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
            {isReg && <small className="ss-muted">Any non-empty password is accepted.</small>}
          </div>
          {err && <small className="ss-error">{err}</small>}
          <button className="ss-btn ss-btn-primary ss-full" type="submit" disabled={busy}>{busy ? "Please wait..." : isReg ? "Create account" : "Login"}</button>
        </form>
        <p className="ss-muted ss-center">
          {isReg ? <>Already registered? <Link to="/login">Login</Link></> : <>New here? <Link to="/register">Register</Link></>}
        </p>
      </div>
    </div>
  );
}
export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
