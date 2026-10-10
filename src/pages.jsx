import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LOCATIONS, PGS, BUDGETS, FACILITIES, FAC, COVERS, WOMEN_COVERS, getPG, sharingLabel } from "./data";
import { addBooking, cancelBooking, getBookings, getUser, setUser, bedsLeft, activeBookings } from "./store";
import { Breadcrumb, FilterSidebar, OccupancyBar, PGCard, Stepper, money } from "./components";

const catName = (c) => (c === "women" ? "Women's PG / Hostel" : "Men's PG / Hostel");
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
            Men's and women's PGs and hostels near your college. Filter by budget, sharing and
            facilities, then book in a minute.
          </p>
          <Link to="/stay" className="ss-btn ss-btn-primary ss-btn-lg">Get Started →</Link>
          <div className="ss-hero-stats">
            <div><b>{PGS.length}+</b><span>PGs & Hostels</span></div>
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
          <h2>Men's PG / Hostel</h2>
          <p>{PGS.filter((p) => p.category === "men").length} stays available</p>
        </Link>
        <Link to="/stay/women" className="ss-card ss-cat ss-grad-women">
          <span className="ss-cat-emoji">👩‍🎓</span>
          <h2>Women's PG / Hostel</h2>
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
                <p><b>{pgs.length}</b> PGs {from && <>• from <b>{money(from)}</b></>}</p>
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
  if (!pg) return <div className="ss-page">PG not found.</div>;

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
  const [form, setForm] = useState({
    name: user?.name || "", place: "", phone: "", email: user?.email || "", joinDate: "",
  });

  if (!pg) return <div className="ss-page">PG not found.</div>;
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
            <Link to={`/pg/${pg.id}`} className="ss-btn ss-btn-ghost">Back to PG</Link>
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

  const confirm = () => {
    if (!getUser()) {
      setAuthRequired(true);
      return;
    }
    if (!option || bedsLeft(pg, option) === 0) return;
    const saved = addBooking({
      pgId: pg.id, pgName: pg.name, location: pg.location, category: pg.category,
      sharing: option.type, rent: option.rent, ...form,
    });
    setDone(saved);
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
            <Link to={`/pg/${pg.id}`} className="ss-btn ss-btn-ghost">Back to PG</Link>
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
            <dt>PG</dt><dd>{pg.name}, {pg.location}</dd>
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
            <button className="ss-btn ss-btn-primary" onClick={confirm}>Confirm Booking</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- MY BOOKINGS ---------------- */
export function MyBookings() {
  const [list, setList] = useState(getBookings());
  const cancel = (id) => { cancelBooking(id); setList(getBookings()); };

  return (
    <div className="ss-page">
      <h1>My Bookings</h1>
      {list.length === 0 && (
        <div className="ss-empty"><div>🛏️</div><h3>No bookings yet</h3><Link to="/stay" className="ss-btn ss-btn-primary">Find a stay</Link></div>
      )}
      <div className="ss-grid-2">
        {list.map((b) => (
          <div key={b.id} className="ss-card ss-pad">
            <div className="ss-row ss-between">
              <h3>{b.pgName}</h3>
              <span className={"ss-badge " + (b.status === "Confirmed" ? "ss-badge-green" : "ss-badge-red")}>{b.status}</span>
            </div>
            <p className="ss-muted">📍 {b.location} • {sharingLabel(b.sharing)} • {money(b.rent)}/mo</p>
            <p>Booking ID: <b>{b.id}</b></p>
            <p className="ss-muted">Joining: {b.joinDate}</p>
            {b.status === "Confirmed" && <button className="ss-btn ss-btn-ghost" onClick={() => cancel(b.id)}>Cancel booking</button>}
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
            {residents.length === 0 && <tr><td colSpan="5" className="ss-muted ss-center">No registered students yet for this PG.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- AUTH (frontend demo) ---------------- */
function AuthForm({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const isReg = mode === "register";

  const submit = () => {
    if (isReg && !f.name.trim()) return setErr("Enter your name");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email");
    if (f.password.length < 6) return setErr("Password must be at least 6 characters");
    setUser({ name: f.name.trim() || f.email.split("@")[0], email: f.email });
    window.dispatchEvent(new Event("ss-auth"));
    navigate(location.state?.from || "/stay");
  };

  return (
    <div className="ss-auth">
      <div className="ss-auth-art ss-grad-men"><h2>🏠 StudentStay</h2><p>Your next home is a few clicks away.</p></div>
      <div className="ss-auth-form">
        <h1>{isReg ? "Create account" : "Welcome back"}</h1>
        {isReg && <div className="ss-field"><label>Full name</label><input className="ss-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>}
        <div className="ss-field"><label>Email</label><input className="ss-input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="ss-field"><label>Password</label><input className="ss-input" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        {err && <small className="ss-error">{err}</small>}
        <button className="ss-btn ss-btn-primary ss-full" onClick={submit}>{isReg ? "Create account" : "Login"}</button>
        <p className="ss-muted ss-center">
          {isReg ? <>Already registered? <Link to="/login">Login</Link></> : <>New here? <Link to="/register">Register</Link></>}
        </p>
      </div>
    </div>
  );
}
export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
