import { Routes, Route, NavLink } from "react-router-dom";
import WorkoutsPage from "./pages/WorkoutsPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import "./App.css";

function App() {
  return (
    <div className="app-wrapper">
      <nav className="navbar">
        <span className="nav-brand">GymTracker</span>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Workouts
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Reports
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Users
          </NavLink>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<WorkoutsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
