import React from 'react';
import './Loading.css';

const Loading = ({ 
  size = 'medium', 
  text = 'Đang tải...', 
  overlay = false,
  className = '' 
}) => {
  const sizeClass = {
    small: 'loading-small',
    medium: 'loading-medium', 
    large: 'loading-large'
  }[size];

  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className="loading-container">
          <div className={`loading-spinner ${sizeClass}`}>
            <div className="loading-ring"></div>
            <div className="loading-ring"></div>
            <div className="loading-ring"></div>
            <div className="loading-ring"></div>
          </div>
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`loading-inline ${className}`}>
      <div className={`loading-spinner ${sizeClass}`}>
        <div className="loading-ring"></div>
        <div className="loading-ring"></div>
        <div className="loading-ring"></div>
        <div className="loading-ring"></div>
      </div>
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
};

export default Loading; 