import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Form, Button, Pagination, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './Archives.css';

const Archives = () => {
  const { token } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArchives = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/archives`, {
        params: {
          page,
          limit: 10,
          search
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setArchives(response.data.archives || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setError('');
    } catch (err) {
      setError('Không thể tải dữ liệu lưu trữ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArchives(1, searchTerm);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch (e) {
      return 'Invalid';
    }
  };

  return (
    <div className="archives-page page-transition">
      <Container>
        <h2 className="page-title mb-3">Kho lưu trữ cuộc họp</h2>

        <Form onSubmit={handleSearch} className="mb-3">
          <Form.Control
            type="text"
            placeholder="Tìm kiếm lưu trữ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Form>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="loading text-center">Đang tải...</div>
        ) : archives.length === 0 ? (
          <p>Không có lưu trữ nào.</p>
        ) : (
          <Card>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Cuộc họp</th>
                    <th>Loại</th>
                    <th>Ngày lưu</th>
                    <th>Tags</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {archives.map((ar) => (
                    <tr key={ar._id}>
                      <td>
                        <Link to={`/archives/${ar._id}`} className="text-decoration-none">
                          {ar.title}
                        </Link>
                      </td>
                      <td>{ar.meetingSnapshot?.title || '—'}</td>
                      <td><Badge bg="secondary">{ar.archiveType}</Badge></td>
                      <td>{formatDate(ar.archivedAt)}</td>
                      <td>
                        {ar.tags && ar.tags.length > 0 ? (
                          ar.tags.slice(0, 3).map((tag, idx) => (
                            <Badge bg="info" key={idx} className="me-1">{tag}</Badge>
                          ))
                        ) : '—'}
                      </td>
                      <td>
                        <Button as={Link} to={`/archives/${ar._id}`} size="sm" variant="outline-primary">
                          Xem
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-3 justify-content-center">
            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
            {[...Array(totalPages)].map((_, idx) => (
              <Pagination.Item
                key={idx + 1}
                active={idx + 1 === currentPage}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
          </Pagination>
        )}
      </Container>
    </div>
  );
};

export default Archives; 