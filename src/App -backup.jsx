import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./index.css";

const API_URL =
  "https://studentstay-backend-production.up.railway.app/api/properties";

function useProperties() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        setProperties(
          data.map((property) => ({
            ...property,
            type: property.roomType,
            available: property.availableBeds,
            facilities: property.facilities
              ? property.facilities.split(",").map((item) => item.trim())
              : [],
          }))
        );
      })
      .catch((error) => console.error("Error loading properties:", error));
  }, []);

  return properties;
}

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        🏠 StudentStay
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/properties">PGs & Hostels</Link>
        <Link to="/login">Login</Link>
        <Link to="/register" className="register-btn">
          Register
        </Link>
      </div>
    </nav>
  );
}

function Home() {
  const properties = useProperties();
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="tagline">SMART STUDENT ACCOMMODATION</p>

          <h1>
            Find Your Perfect
            <span> Student Stay</span>
          </h1>

          <p className="description">
            Discover affordable PGs and hostels near your college.
            Check room availability, apply for accommodation and
            manage your stay in one place.
          </p>

          <div className="search-box">
            <input placeholder="📍 Enter location" />

            <select>
              <option>Room Type</option>
              <option>Single</option>
              <option>Double Sharing</option>
              <option>Triple Sharing</option>
            </select>

            <button>Search</button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="small-title">EXPLORE</p>
            <h2>Popular Student Stays</h2>
          </div>

          <Link to="/properties" className="view-link">
            View All →
          </Link>
        </div>

        <div className="property-grid">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
            />
          ))}
        </div>
      </section>

      <section className="features-section">
        <h2>Everything You Need for Your Stay</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Easy Search</h3>
            <p>
              Find PGs and hostels using location, rent,
              room type and facilities.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛏️</div>
            <h3>Room Availability</h3>
            <p>
              Check available rooms and beds before
              submitting your application.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Easy Application</h3>
            <p>
              Apply for accommodation and track your
              application status.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure Platform</h3>
            <p>
              Separate dashboards for students, owners
              and administrators.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function PropertyCard({ property }) {
  return (
    <div className="property-card">
      <div className="property-image">
        🏠
      </div>

      <div className="property-content">
        <div className="available">
          {property.available} beds available
        </div>

        <h3>{property.name}</h3>

        <p className="location">
          📍 {property.location}
        </p>

        <div className="facility-list">
          {property.facilities.map((facility) => (
            <span key={facility}>{facility}</span>
          ))}
        </div>

        <div className="property-bottom">
          <div>
            <strong>₹{property.rent}</strong>
            <small>/month</small>
          </div>

          <Link
            to={`/property/${property.id}`}
            className="details-btn"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function Properties() {
  const properties = useProperties();
  return (
    <div className="page">
      <div className="page-header">
        <p className="small-title">STUDENTSTAY</p>
        <h1>PGs & Hostels</h1>
        <p>
          Find comfortable and affordable accommodation
          for your student life.
        </p>
      </div>

      <div className="filter-bar">
        <input placeholder="Search location..." />

        <select>
          <option>All Room Types</option>
          <option>Single</option>
          <option>Double Sharing</option>
          <option>Triple Sharing</option>
        </select>

        <select>
          <option>Rent Range</option>
          <option>Below ₹7,000</option>
          <option>₹7,000 - ₹10,000</option>
          <option>Above ₹10,000</option>
        </select>
      </div>

      <div className="property-grid">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
          />
        ))}
      </div>
    </div>
  );
}

function PropertyDetails() {
  const properties = useProperties();
  const propertyId = Number(window.location.pathname.split("/").pop());
  const property = properties.find((item) => item.id === propertyId);

  if (!property) {
    return <div className="page">Loading property details...</div>;
  }
  return (
    <div className="page">
      <div className="details-layout">
        <div className="large-property-image">
          🏠
        </div>

        <div>
          <p className="small-title">PROPERTY DETAILS</p>

          <h1>{property.name}</h1>

          <p className="location">
              📍 {property.location}
          </p>

          <h2 className="price">
            ₹{property.rent} <small>/month</small>
          </h2>

          <p className="details-text">
            {property.description}
          </p>

          <h3>Facilities</h3>

          <div className="facility-list large">
            {property.facilities.map((facility, index) => (
              <span key={index}>{facility}</span>
            ))}
          </div>

          <div className="availability-box">
            <strong>{property.available} Beds Available</strong>
            <p>{property.type} rooms</p>
          </div>

          <Link to="/login" className="apply-btn">
            Apply for Room
          </Link>
        </div>
      </div>
    </div>
  );
}

function Login() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">🏠</div>

        <h1>Welcome Back</h1>

        <p>Login to your StudentStay account</p>

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
        />

        <button className="auth-btn">
          Login
        </button>

        <p className="auth-footer">
          Don't have an account?
          <Link to="/register"> Register</Link>
        </p>
      </div>
    </div>
  );
}

function Register() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">🎓</div>

        <h1>Create Account</h1>

        <p>Join StudentStay today</p>

        <label>Full Name</label>
        <input placeholder="Enter your name" />

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Create a password"
        />

        <label>Register as</label>
        <select>
          <option>Student</option>
          <option>PG / Hostel Owner</option>
        </select>

        <button className="auth-btn">
          Create Account
        </button>

        <p className="auth-footer">
          Already have an account?
          <Link to="/login"> Login</Link>
        </p>
      </div>
    </div>
  );
}

function StudentDashboard() {
  return (
    <div className="dashboard page">
      <div className="dashboard-header">
        <div>
          <p className="small-title">STUDENT DASHBOARD</p>
          <h1>Welcome, Student 👋</h1>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Applications</span>
          <strong>2</strong>
        </div>

        <div className="stat-card">
          <span>Approved</span>
          <strong>1</strong>
        </div>

        <div className="stat-card">
          <span>Room Status</span>
          <strong>Allocated</strong>
        </div>

        <div className="stat-card">
          <span>Payment</span>
          <strong>Pending</strong>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Current Accommodation</h2>

        <div className="current-stay">
          <div className="stay-icon">🏠</div>

          <div>
            <h3>Sunrise Student PG</h3>
            <p>Room 204 • Double Sharing</p>
            <p>📍 Madhapur, Hyderabad</p>
          </div>

          <span className="status">
            Allocated
          </span>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/properties"
          element={<Properties />}
        />
        <Route
          path="/property/:id"
          element={<PropertyDetails />}
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/dashboard"
          element={<StudentDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;