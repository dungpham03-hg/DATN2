import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaCalendarAlt, FaUsers, FaClock, FaCheckCircle, FaPlus, FaList, FaCalendarCheck, FaHourglassHalf, FaUser, FaMapMarkerAlt, FaUserPlus, FaEdit } from 'react-icons/fa';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0,
    total: 0
  });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch meetings data
      const meetingsResponse = await axios.get(`${API_BASE_URL}/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const meetings = meetingsResponse.data.meetings || [];
      
      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.startTime);
        return meetingDate >= today && meetingDate < tomorrow;
      });
      
      const upcomingMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.startTime);
        return meetingDate > now;
      });
      
      const completedMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.startTime);
        return meetingDate < now;
      });
      
      setStats({
        today: todayMeetings.length,
        upcoming: upcomingMeetings.length,
        completed: completedMeetings.length,
        total: meetings.length
      });
      
      // Get recent meetings (last 7 days or upcoming)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recent = meetings
        .filter(meeting => {
          const meetingDate = new Date(meeting.startTime);
          return meetingDate >= sevenDaysAgo;
        })
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 5);
      
      setRecentMeetings(recent);
      
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleStatCardClick = (type) => {
    switch (type) {
      case 'today':
        navigate('/meetings?filter=today');
        break;
      case 'upcoming':
        navigate('/meetings?filter=upcoming');
        break;
      case 'completed':
        navigate('/meetings?filter=completed');
        break;
      case 'total':
        navigate('/meetings');
        break;
      default:
        navigate('/meetings');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);
    
    if (now < startTime) return { text: 'Sắp diễn ra', variant: 'primary' };
    if (now >= startTime && now <= endTime) return { text: 'Đang diễn ra', variant: 'warning' };
    return { text: 'Đã kết thúc', variant: 'success' };
  };

  if (authLoading || loading) {
    return (
      <div className="dashboard-container">
        <Container>
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <h3 className="mt-3">Đang tải Dashboard...</h3>
          </div>
        </Container>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <Container>
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h3>❌ Không tìm thấy thông tin người dùng.</h3>
            <p>Vui lòng đăng nhập lại.</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="dashboard-container page-transition no-hover-effects">
      <Container>
        {/* Welcome Section */}
        <Row className="mb-4">
          <Col>
            <Card className="welcome-card shadow-hover">
              <Card.Body>
                <Row className="align-items-center">
                  <Col>
                    <h1 className="welcome-title">
                      Chào mừng trở lại, <span className="text-gradient">{user.fullName}</span>!
                      <span className="welcome-emoji">👋</span>
                    </h1>
                    <p className="welcome-subtitle">
                      Hãy bắt đầu ngày mới với việc quản lý cuộc họp hiệu quả
                    </p>
                    <div className="quick-actions">
                      <Button 
                        className="quick-action-btn btn-primary"
                        onClick={() => navigate('/meetings/create')}
                      >
                        <FaPlus className="me-2" />
                        Tạo cuộc họp mới
                      </Button>
                      <Button 
                        className="quick-action-btn btn-outline"
                        variant="outline-light"
                        onClick={() => navigate('/meetings')}
                      >
                        <FaList className="me-2" />
                        Xem tất cả cuộc họp
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Stats Grid */}
        <Row className="mb-4">
          <Col sm={6} lg={3} className="mb-3">
            <Card 
              className="stat-card stat-primary shadow-hover clickable" 
              onClick={() => handleStatCardClick('today')}
            >
              <Card.Body>
                <div className="stat-icon">
                  <FaCalendarCheck />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{stats.today}</div>
                  <div className="stat-label">Cuộc họp hôm nay</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col sm={6} lg={3} className="mb-3">
            <Card 
              className="stat-card stat-warning shadow-hover clickable"
              onClick={() => handleStatCardClick('upcoming')}
            >
              <Card.Body>
                <div className="stat-icon">
                  <FaHourglassHalf />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{stats.upcoming}</div>
                  <div className="stat-label">Cuộc họp sắp tới</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col sm={6} lg={3} className="mb-3">
            <Card 
              className="stat-card stat-success shadow-hover clickable"
              onClick={() => handleStatCardClick('completed')}
            >
              <Card.Body>
                <div className="stat-icon">
                  <FaCheckCircle />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{stats.completed}</div>
                  <div className="stat-label">Đã hoàn thành</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col sm={6} lg={3} className="mb-3">
            <Card 
              className="stat-card stat-info shadow-hover clickable"
              onClick={() => handleStatCardClick('total')}
            >
              <Card.Body>
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{stats.total}</div>
                  <div className="stat-label">Tổng cuộc họp</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Content Section */}
        <Row>
          <Col lg={8} className="mb-4">
            <Card className="content-card shadow-hover">
              <Card.Header>
                <h5>
                  <FaClock className="me-2" />
                  Cuộc họp gần đây
                  <Badge bg="secondary" className="ms-2">{recentMeetings.length}</Badge>
                </h5>
              </Card.Header>
              <Card.Body>
                {recentMeetings.length > 0 ? (
                  <div className="recent-meetings-list">
                    {recentMeetings.map((meeting) => {
                      const status = getMeetingStatus(meeting);
                      return (
                        <div 
                          key={meeting._id} 
                          className="recent-meeting-item"
                          onClick={() => navigate(`/meetings/${meeting._id}`)}
                        >
                          <div className="meeting-info">
                            <h6 className="meeting-title">{meeting.title}</h6>
                            <div className="meeting-details">
                              <span className="meeting-time">
                                <FaClock className="me-1" />
                                {formatDate(meeting.startTime)} • {formatTime(meeting.startTime)}
                              </span>
                              {meeting.location && (
                                <span className="meeting-location">
                                  <FaMapMarkerAlt className="me-1" />
                                  {meeting.location}
                                </span>
                              )}
                              <span className="meeting-participants">
                                <FaUsers className="me-1" />
                                {meeting.participants?.length || 0} người tham gia
                              </span>
                            </div>
                          </div>
                          <div className="meeting-status">
                            <Badge bg={status.variant}>{status.text}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FaCalendarAlt className="empty-state-icon" />
                    <p>Chưa có cuộc họp nào trong 7 ngày gần đây.</p>
                    <p>Hãy tạo cuộc họp đầu tiên của bạn!</p>
                    <Button 
                      variant="primary" 
                      onClick={() => navigate('/meetings/create')}
                      className="mt-2"
                    >
                      <FaPlus className="me-2" />
                      Tạo cuộc họp ngay
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} className="mb-4">
            <Card className="content-card user-info-card shadow-hover">
              <Card.Header>
                <h5>
                  <FaUser className="me-2" />
                  Thông tin cá nhân
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="user-profile">
                  <div className="user-avatar-container">
                    <img
                      src={
                        user.avatar && user.avatar.startsWith('/uploads') 
                          ? `${API_BASE_URL.replace('/api', '')}${user.avatar}`
                          : user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=667eea&color=fff&bold=true&size=80`
                      }
                      alt="Avatar"
                      className="user-avatar"
                      onError={(e) => {
                        // Fallback to UI Avatars if server image fails to load
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=667eea&color=fff&bold=true&size=80`;
                      }}
                    />
                  </div>
                  <div className="user-details">
                    <h6 className="user-name">{user.fullName}</h6>
                    
                    <div className="user-info-item">
                      <span className="info-label">Vai trò</span>
                      <span className={`role-badge role-${user.role || 'employee'}`}>
                        {user.role === 'admin' && 'Quản trị viên'}
                        {user.role === 'manager' && 'Quản lý'}
                        {user.role === 'secretary' && 'Thư ký'}
                        {(user.role === 'employee' || !user.role) && 'Nhân viên'}
                      </span>
                    </div>
                    
                    <div className="user-info-item">
                      <span className="info-label">Email</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                    
                    <div className="user-info-item">
                      <span className="info-label">Trạng thái</span>
                      <span className="status-badge status-active">
                        <span className="status-dot"></span>
                        Đang hoạt động
                      </span>
                    </div>
                  </div>
                  
                  <div className="user-actions mt-3">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => navigate('/profile')}
                      className="w-100"
                    >
                      <FaEdit className="me-1" />
                      Chỉnh sửa hồ sơ
                    </Button>
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