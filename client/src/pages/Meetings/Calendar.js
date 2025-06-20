import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { startOfWeek, parse, format, getDay } from 'date-fns';
import vi from 'date-fns/locale/vi';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const locales = {
  vi: vi
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales
});

const CalendarPage = () => {
  const { token } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 } // lấy nhiều để hiển thị
      });
      const evts = res.data.meetings.map(m => ({
        id: m._id,
        title: m.title,
        start: new Date(m.startTime),
        end: new Date(m.endTime),
        allDay: false,
        resource: m
      }));
      setEvents(evts);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải dữ liệu lịch';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultDate = useMemo(() => new Date(), []);

  return (
    <div className="meetings-container">
      <Container fluid>
        <Row>
          <Col>
            <Card className="meetings-main-card">
              <Card.Body>
                {loading ? (
                  <div className="text-center py-5"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    defaultDate={defaultDate}
                    messages={{
                      today: 'Hôm nay',
                      previous: 'Trước',
                      next: 'Sau',
                      month: 'Tháng',
                      week: 'Tuần',
                      day: 'Ngày',
                      agenda: 'Agenda',
                      date: 'Ngày',
                      time: 'Thời gian',
                      event: 'Sự kiện',
                      noEventsInRange: 'Không có sự kiện'
                    }}
                    onSelectEvent={(event) => {
                      window.location.href = `/meetings/${event.id}`;
                    }}
                  />
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CalendarPage; 