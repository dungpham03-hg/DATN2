import React from 'react';
import NavigationBar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      {/* Thanh điều hướng chung */}
      <NavigationBar />
      {/* Nội dung trang cụ thể */}
      <div className="container my-4">
        <Outlet />
      </div>
    </>
  );
};

export default Layout; 