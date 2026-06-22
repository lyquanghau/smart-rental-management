import { Link, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { RoomsPage } from './pages/RoomsPage.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Smart Rental</div>
        <nav className="nav">
          <Link to="/">Tổng quan</Link>
          <Link to="/rooms">Phòng</Link>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
        </Routes>
      </main>
    </div>
  );
}
