import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaCalendarAlt, FaUsers, FaClock, FaCheckCircle, FaPlus, FaList } from 'react-icons/fa';
import './Dashboard.css';
import axios from 'axios';

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Lấy tất cả meetings
      const response = await axios.get(`${API_BASE_URL}/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const meetings = response.data.meetings || [];
      // Backend đã filter meetings theo quyền:
      // - Admin: thấy tất cả
      // - Manager/Secretary: thấy tất cả công khai + riêng tư cùng phòng ban + được mời
      // - Employee: chỉ thấy công khai + được mời (không thấy riêng tư cùng phòng ban)
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Tính toán stats
      const todayMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.startTime);
        return meetingDate >= today && meetingDate < tomorrow;
      });
      
      const upcomingMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.startTime);
        return meetingDate >= tomorrow;
      });
      
      const completedMeetings = meetings.filter(meeting => 
        meeting.status === 'completed'
      );
      
      // Tính tổng số người tham gia
      const totalAttendees = meetings.reduce((total, meeting) => {
        return total + (meeting.attendees ? meeting.attendees.length : 0);
      }, 0);
      
      setStats({
        today: todayMeetings.length,
        upcoming: upcomingMeetings.length,
        completed: completedMeetings.length,
        total: totalAttendees
      });
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Nếu lỗi, dùng dữ liệu demo
      try {
        const demoStats = { today: 2, upcoming: 3, completed: 5, total: 15 };
        setStats(demoStats);
      } catch (demoError) {
        console.error('Demo stats error:', demoError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const handleCardClick = (type) => {
    // Navigate đến trang meetings với filter tương ứng
    switch(type) {
      case 'today':
        navigate('/meetings?filter=today');
        break;
      case 'upcoming':
        navigate('/meetings?filter=upcoming');
        break;
      case 'completed':
        navigate('/meetings?filter=completed');
        break;
      case 'all':
        navigate('/meetings');
        break;
      default:
        navigate('/meetings');
    }
  };

  return (
    <div className="dashboard-container">
      <Container>
        {/* Welcome Card */}
        <Card className="welcome-card">
          <Card.Body>
            <h1 className="welcome-title">
              Chào mừng trở lại, {user?.fullName || 'Quản trị viên'}! 👋
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
          <Card 
            className="stat-card stat-primary" 
            onClick={() => handleCardClick('today')}
            style={{ cursor: 'pointer' }}
          >
            <Card.Body>
              <div className="stat-icon">
                <FaCalendarAlt />
              </div>
              <div className="stat-number">
                {loading ? '...' : stats.today}
              </div>
              <div className="stat-label">Cuộc họp hôm nay</div>
            </Card.Body>
          </Card>
          
          <Card 
            className="stat-card stat-warning"
            onClick={() => handleCardClick('upcoming')}
            style={{ cursor: 'pointer' }}
          >
            <Card.Body>
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-number">
                {loading ? '...' : stats.upcoming}
              </div>
              <div className="stat-label">Cuộc họp sắp tới</div>
            </Card.Body>
          </Card>
          
          <Card 
            className="stat-card stat-success"
            onClick={() => handleCardClick('completed')}
            style={{ cursor: 'pointer' }}
          >
            <Card.Body>
              <div className="stat-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-number">
                {loading ? '...' : stats.completed}
              </div>
              <div className="stat-label">Đã hoàn thành</div>
            </Card.Body>
          </Card>
          
          <Card 
            className="stat-card stat-info"
            onClick={() => handleCardClick('all')}
            style={{ cursor: 'pointer' }}
          >
            <Card.Body>
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-number">
                {loading ? '...' : stats.total}
              </div>
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
                    <strong>Vai trò:</strong> {user?.role || 'employee'}
                  </div>
                  <div className="quick-stat-item">
                    <strong>Email:</strong> {user?.email || 'user@example.com'}
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