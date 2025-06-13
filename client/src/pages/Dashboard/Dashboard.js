import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { FaCalendarAlt, FaUsers, FaClock, FaCheckCircle, FaPlus, FaList } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <Container>
        {/* Welcome Card */}
        <Card className="welcome-card">
          <Card.Body>
            <h1 className="welcome-title">
              Chào mừng trở lại, {user?.fullName || 'Quan tri vien'}! 👋
            </h1>
            <p className="welcome-subtitle">
              Hãy bắt đầu ngày mới với việc quản lý cuộc họp hiệu quả
            </p>
            <div className="quick-actions">
              <a href="/meetings/create" className="quick-action-btn btn-primary">
                <FaPlus />
                Tạo cuộc họp mới
              </a>
              <a href="/meetings" className="quick-action-btn btn-outline">
                <FaList />
                Xem tất cả cuộc họp
              </a>
            </div>
          </Card.Body>
        </Card>

        {/* Stats Grid */}
        <div className="stats-grid">
          <Card className="stat-card stat-primary">
            <Card.Body>
              <div className="stat-icon">
                <FaCalendarAlt />
              </div>
              <div className="stat-number">0</div>
              <div className="stat-label">Cuộc họp hôm nay</div>
            </Card.Body>
          </Card>
          
          <Card className="stat-card stat-warning">
            <Card.Body>
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-number">0</div>
              <div className="stat-label">Cuộc họp sắp tới</div>
            </Card.Body>
          </Card>
          
          <Card className="stat-card stat-success">
            <Card.Body>
              <div className="stat-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-number">0</div>
              <div className="stat-label">Đã hoàn thành</div>
            </Card.Body>
          </Card>
          
          <Card className="stat-card stat-info">
            <Card.Body>
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-number">0</div>
              <div className="stat-label">Tổng tham gia</div>
            </Card.Body>
          </Card>
        </div>

        {/* Content Section */}
        <Row>
          <Col lg={8}>
            <Card className="content-card">
              <Card.Header>
                <h5>Cuộc họp gần đây</h5>
              </Card.Header>
              <Card.Body>
                <div className="empty-state">
                  <FaCalendarAlt className="empty-state-icon" />
                  <p>Chưa có cuộc họp nào.</p>
                  <p>Hãy tạo cuộc họp đầu tiên của bạn!</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="content-card">
              <Card.Header>
                <h5>Thống kê nhanh</h5>
              </Card.Header>
              <Card.Body>
                <div className="quick-stats">
                  <div className="quick-stat-item">
                    <strong>Vai trò:</strong> {user?.role || 'admin'}
                  </div>
                  <div className="quick-stat-item">
                    <strong>Email:</strong> {user?.email || 'admin@example.com'}
                  </div>
                  <div className="quick-stat-item">
                    <strong>Trạng thái:</strong> <span className="badge status-ongoing">Hoạt động</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard; 