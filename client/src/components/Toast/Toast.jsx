import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ 
  id,
  type = 'info', 
  message, 
  duration = 4000, 
  onRemove 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '!';
      default: return 'i';
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-message">
        {message}
      </div>
      <button 
        className="toast-close"
        onClick={() => onRemove(id)}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
};

export default Toast; 