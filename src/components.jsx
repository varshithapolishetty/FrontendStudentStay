import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FACILITIES, FAC, BUDGETS, SHARING_TYPES, PRESETS, COVERS, WOMEN_COVERS, sharingLabel } from "./data";
import { getUser, logout, bedsLeft } from "./store";

export const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

export function Navbar() {
  const navigate = useNavigate();
  const [user, setUserState] = useState(getUser());
  const [dark, setDark] = useState(localStorage.getItem("ss_theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("ss_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const sync = () => setUserState(getUser());
    window.addEventListener("ss-auth", sync);
    return () => window.removeEventListener("ss-auth", sync);
  }, []);

  const doLogout = () => {
    logout();
    window.dispatchEvent(new Event("ss-auth"));
    navigate("/");
  };

  return (
    <nav className="ss-nav">
      <Link to="/" className="ss-logo">🏠 StudentStay</Link>
      <div className="ss-nav-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/stay">Find a Stay</NavLink>
        <NavLink to="/my-bookings">My Bookings</NavLink>
        <NavLink to="/residents">Residents</NavLink>
        <button className="ss-icon-btn" onClick={() => setDark(!dark)} title="Toggle theme">
          {dark ? "☀️" : "🌙"}
        </button>
        {user ? (
          <button className="ss-btn ss-btn-ghost" onClick={doLogout}>Logout ({user.name.split(" ")[0]})</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="ss-btn ss-btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export function Breadcrumb({ items }) {
  return (
    <div className="ss-crumb">
      {items.map((it, i) => (
        <span key={i}>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <b>{it.label}</b>}
          {i < items.length - 1 && " › "}
        </span>
      ))}
    </div>
  );
}

const hueOf = (k) => (FACILITIES.findIndex((f) => f.key === k) * 29) % 360;

export function FacilityBadges({ keys, max = 5 }) {
  const shown = keys.slice(0, max);
  return (
    <div className="ss-chips">
      {shown.map((k) => (
        <span key={k} className="ss-chip" style={{ "--h": hueOf(k) }} title={FAC[k].label}>{FAC[k].icon} {FAC[k].label}</span>
      ))}
      {keys.length > max && <span className="ss-chip ss-chip-more">+{keys.length - max}</span>}
    </div>
  );
}

const getFavs = () => {
  try { return JSON.parse(localStorage.getItem("ss_favs")) || []; } catch { return []; }
};

export function PGCard({ pg, options }) {
  const [fav, setFav] = useState(getFavs().includes(pg.id));
  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const all = getFavs();
    const next = all.includes(pg.id) ? all.filter((x) => x !== pg.id) : [...all, pg.id];
    localStorage.setItem("ss_favs", JSON.stringify(next));
    setFav(!fav);
  };

  const opts = options && options.length ? options : pg.sharing;
  const minRent = Math.min(...opts.map((o) => o.rent));
  const left = pg.sharing.reduce((s, o) => s + bedsLeft(pg, o), 0);
  const covers = pg.category === "women" ? WOMEN_COVERS : COVERS;
  const cover = covers[pg.id % covers.length];

  return (
    <Link to={`/pg/${pg.id}`} className="ss-card ss-pg-card">
      <div className="ss-pg-img" style={{ background: cover }}>
        <button className={"ss-heart " + (fav ? "on" : "")} onClick={toggleFav} title="Save">{fav ? "❤️" : "🤍"}</button>
        <span className="ss-pg-emoji">{pg.category === "women" ? "🏡" : "🏠"}</span>
        <span className="ss-rating">⭐ {pg.rating}</span>
        <span className="ss-blob b1" /><span className="ss-blob b2" />
        {left <= 3 && left > 0 && <span className="ss-few">Only {left} left</span>}
        {left === 0 && <span className="ss-few ss-soldout">Full</span>}
      </div>
      <div className="ss-pg-body">
        <h3>{pg.name}</h3>
        <p className="ss-muted">📍 {pg.location} • {pg.category === "women" ? "Women" : "Men"}</p>
        <div className="ss-badges">
          {pg.facilities.includes("biometric") && <span className="ss-badge ss-badge-blue">🖐️ Biometric</span>}
          {pg.facilities.includes("cooking") && <span className="ss-badge ss-badge-orange">🍳 Self Cooking</span>}
        </div>
        <FacilityBadges keys={pg.facilities.filter((k) => k !== "biometric" && k !== "cooking")} max={4} />
        <div className="ss-pg-foot">
          <div><small>from</small> <strong>{money(minRent)}</strong><small>/mo</small></div>
          <span className="ss-link">View →</span>
        </div>
      </div>
    </Link>
  );
}

export function FilterSidebar({ f, setF, onClose, resultCount }) {
  const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const reset = () => setF({ sharing: [], budget: "any", facilities: [], sort: "rating" });

  return (
    <aside className="ss-filters">
      <div className="ss-filters-head">
        <h3>Filters</h3>
        <button className="ss-link-btn" onClick={reset}>Clear all</button>
        {onClose && <button className="ss-icon-btn ss-only-mobile" onClick={onClose}>✕</button>}
      </div>

      <div className="ss-fgroup">
        <h4>Quick picks</h4>
        <div className="ss-chips">
          {PRESETS.map((p) => (
            <button key={p.label} className="ss-pill"
              onClick={() => setF({ ...f, facilities: p.facilities, budget: p.budget || f.budget })}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ss-fgroup">
        <h4>Sharing</h4>
        <div className="ss-chips">
          {SHARING_TYPES.map((n) => (
            <button key={n}
              className={"ss-pill " + (f.sharing.includes(n) ? "on" : "")}
              onClick={() => setF({ ...f, sharing: toggle(f.sharing, n) })}>
              {sharingLabel(n)}
            </button>
          ))}
        </div>
      </div>

      <div className="ss-fgroup">
        <h4>Budget / month</h4>
        {BUDGETS.map((b) => (
          <label key={b.key} className="ss-radio">
            <input type="radio" name="budget" checked={f.budget === b.key} onChange={() => setF({ ...f, budget: b.key })} />
            {b.label}
          </label>
        ))}
      </div>

      <div className="ss-fgroup">
        <h4>Facilities <small className="ss-muted">(pick any combination)</small></h4>
        <div className="ss-chips">
          {FACILITIES.map((x) => (
            <button key={x.key}
              className={"ss-pill " + (f.facilities.includes(x.key) ? "on" : "")}
              onClick={() => setF({ ...f, facilities: toggle(f.facilities, x.key) })}>
              {x.icon} {x.label}
            </button>
          ))}
        </div>
      </div>

      {onClose && (
        <button className="ss-btn ss-btn-primary ss-full ss-only-mobile" onClick={onClose}>
          Show {resultCount} stays
        </button>
      )}
    </aside>
  );
}

export function Stepper({ steps, current }) {
  return (
    <div className="ss-stepper">
      {steps.map((s, i) => (
        <div key={s} className={"ss-step " + (i <= current ? "done" : "")}>
          <span>{i < current ? "✓" : i + 1}</span>
          <label>{s}</label>
        </div>
      ))}
    </div>
  );
}

export function OccupancyBar({ total, left }) {
  const filled = total - left;
  const pct = total ? Math.round((filled / total) * 100) : 0;
  return (
    <div className="ss-occ">
      <div className="ss-occ-top">
        <span><b>{filled}</b> of {total} beds filled</span>
        <span>{left} vacant</span>
      </div>
      <div className="ss-bar"><div style={{ width: pct + "%" }} /></div>
    </div>
  );
}
