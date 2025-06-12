
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';

export function PublicRoute() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}