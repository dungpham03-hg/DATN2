import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';

const CreateMeeting = () => {
  return (
    <div className="meetings-container">
      <Container>
        <Row>
          <Col>
            <div className="d-flex align-items-center meetings-header">
              <Link to="/meetings" className="btn btn-outline-secondary me-3">
                <FaArrowLeft />
              </Link>
              <div>
                <h1 className="meetings-title">Tạo cuộc họp mới</h1>
                <p className="meetings-subtitle">Lên lịch cuộc họp cho nhóm của bạn</p>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card className="meetings-main-card">
              <Card.Body>
                <div className="meetings-empty-state">
                  <FaPlus className="meetings-empty-icon" />
                  <h5 className="meetings-empty-title">Form tạo cuộc họp đang được phát triển</h5>
                  <p className="meetings-empty-text">Tính năng này sẽ có trong Tuần 2 của kế hoạch phát triển</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="meetings-main-card">
              <Card.Header>
                <h6 className="mb-0">Gợi ý</h6>
              </Card.Header>
              <Card.Body>
                <div className="small text-muted">
                  <p>Khi tạo cuộc họp, hãy nhớ:</p>
                  <ul>
                    <li>Đặt tiêu đề rõ ràng</li>
                    <li>Chọn thời gian phù hợp</li>
                    <li>Thêm agenda chi tiết</li>
                    <li>Mời đúng người tham gia</li>
                  </ul>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CreateMeeting; 