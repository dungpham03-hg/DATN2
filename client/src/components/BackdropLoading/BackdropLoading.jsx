import React from 'react';
import './BackdropLoading.css';

const BackdropLoading = ({ 
  isVisible = false, 
  text = 'Đang xử lý...', 
  type = 'default' // default, error, warning
}) => {
  if (!isVisible) return null;

  // Icon dựa theo type
  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <div className="backdrop-loading-icon error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="backdrop-loading-icon warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`backdrop-loading-overlay ${type}`}>
      <div className="backdrop-loading-container">
        <div className="backdrop-loading-content">
          {/* Icon cho error và warning */}
          {getIcon()}
          
          {/* Spinner cho default hoặc khi có icon */}
          <div className="backdrop-loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          
          {/* Text */}
          <p className="backdrop-loading-text">{text}</p>
          
          {/* Thông tin bổ sung cho error */}
          {type === 'error' && (
            <p className="backdrop-loading-subtext">
              Vui lòng không đóng trang và đợi trong giây lát...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackdropLoading; 