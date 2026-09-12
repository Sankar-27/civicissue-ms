import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Outlet />
    </div>
  );
}
