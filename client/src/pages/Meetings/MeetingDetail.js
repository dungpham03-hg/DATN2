import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';

const MeetingDetail = () => {
  const { id } = useParams();

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
                <h1 className="meetings-title">Chi tiết cuộc họp</h1>
                <p className="meetings-subtitle">ID: {id}</p>
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
                  <h5 className="meetings-empty-title">Trang chi tiết cuộc họp đang được phát triển</h5>
                  <p className="meetings-empty-text">Meeting ID: {id}</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MeetingDetail; 