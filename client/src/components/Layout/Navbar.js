import React from 'react';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import NotificationPopup from '../Notifications/NotificationPopup';
import { FaCalendarAlt, FaBell } from 'react-icons/fa';
import './Navbar.css';

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount } = useNotification();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <Navbar expand="lg" className="navbar" fixed="top">
        <Container>
          {/* Brand */}
          <LinkContainer to="/dashboard">
            <Navbar.Brand className="brand-gradient">
              <FaCalendarAlt className="me-2" />
              Meeting Pro
            </Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            {/* Navigation Links */}
            <Nav className="me-auto">
              <LinkContainer to="/dashboard">
                <Nav.Link>Trang chủ</Nav.Link>
              </LinkContainer>
              
              <LinkContainer to="/meetings">
                <Nav.Link>Cuộc họp</Nav.Link>
              </LinkContainer>
              
              <LinkContainer to="/meeting-rooms">
                <Nav.Link>Phòng họp</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/archives">
                <Nav.Link>Lưu trữ</Nav.Link>
              </LinkContainer>
            </Nav>

            {/* Right side - Notifications and User */}
            <Nav className="ms-auto d-flex align-items-center">
              {/* Notifications */}
              <div className="notification-container">
                <NotificationPopup />
              </div>

              {/* User Dropdown */}
              {user && (
                <NavDropdown 
                  title={
                    <div className="user-dropdown-title">
                      <img 
                        src={
                          user.avatar && user.avatar.startsWith('/uploads') 
                            ? `${API_BASE_URL.replace('/api', '')}${user.avatar}`
                            : user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=667eea&color=fff&bold=true`
                        }
                        alt="Avatar" 
                        className="avatar avatar-sm rounded-circle me-2"
                        style={{ width: '32px', height: '32px' }}
                        onError={(e) => {
                          // Fallback to UI Avatars if server image fails to load
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=667eea&color=fff&bold=true`;
                        }}
                      />
                      <span>{user.fullName || user.email}</span>
                    </div>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Hồ sơ</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Đăng xuất
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default NavigationBar; 