import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components";
import { Home, Category, Locations, PGList, PGDetails, Booking, MyBookings, Residents, Login, Register, Dashboard } from "./pages";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stay" element={<Category />} />
        <Route path="/stay/:cat" element={<Locations />} />
        <Route path="/stay/:cat/:loc" element={<PGList />} />
        <Route path="/pg/:id" element={<PGDetails />} />
        <Route path="/book/:id" element={<Booking />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/residents" element={<Residents />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
