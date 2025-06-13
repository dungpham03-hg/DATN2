import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaCalendarAlt } from 'react-icons/fa';

const Meetings = () => {
  return (
    <div className="meetings-container">
      <Container>
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center meetings-header">
              <div>
                <h1 className="meetings-title">Quản lý các cuộc họp của bạn</h1>
              </div>
              <div className="meetings-actions">
                <Link to="/meetings/create" className="meetings-create-btn">
                  <FaPlus />
                  Tạo cuộc họp
                </Link>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="meetings-main-card">
              <Card.Body>
                <div className="meetings-empty-state">
                  <FaCalendarAlt className="meetings-empty-icon" />
                  <h5 className="meetings-empty-title">Chưa có cuộc họp nào</h5>
                  <p className="meetings-empty-text">Trang danh sách cuộc họp đang được phát triển</p>
                  <Link to="/meetings/create" className="meetings-empty-btn">
                    <FaPlus />
                    Tạo cuộc họp đầu tiên
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Meetings; 