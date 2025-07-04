import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BackdropLoading from '../BackdropLoading';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import './Layout.css';

const Layout = () => {
  const { isLoading, loadingText, loadingType } = useGlobalLoading();

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      
      {/* Backdrop Loading */}
      <BackdropLoading 
        isVisible={isLoading}
        text={loadingText}
        type={loadingType}
      />
    </div>
  );
};

export default Layout; 