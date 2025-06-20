import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from 'react-bootstrap';

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Hiển thị spinner khi đang tải
  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
      </div>
    );
  }

  // Chưa đăng nhập => chuyển hướng tới /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền truy cập
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Đủ quyền => render con
  return children;
};

export default RoleRoute; 