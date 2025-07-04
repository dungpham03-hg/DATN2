import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, Badge, Button, Form, Alert, Modal, Table } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import './Archives.css';

const MinutesTreeView = ({ minutes, idx, total }) => {
  const [expanded, setExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showDecisions, setShowDecisions] = useState(false);
  const [showVotes, setShowVotes] = useState(false);

  return (
    <div className="minutes-item">
      <div 
        className="minutes-header" 
        onClick={() => setExpanded(!expanded)}
        role="button"
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">
              {minutes.title}
              {total > 1 && <span className="text-muted ms-2">#{idx + 1}</span>}
            </h6>
            <div className="time-info">
              Thư ký: {minutes.secretary?.fullName || '—'}
              {minutes.approvedBy && (
                <span className="ms-2">• Phê duyệt: {minutes.approvedBy.fullName}</span>
              )}
            </div>
          </div>
          <Badge bg={minutes.isApproved ? 'success' : 'warning'}>
            {minutes.isApproved ? 'Đã phê duyệt' : 'Chưa phê duyệt'}
          </Badge>
        </div>
      </div>

      {expanded && (
        <div className="minutes-content-wrapper">
          {/* Nội dung biên bản */}
          <div 
            className="section-header"
            onClick={() => setShowContent(!showContent)}
          >
            <span className="toggle">{showContent ? '▼' : '▶'}</span>
            <span>Nội dung biên bản</span>
          </div>
          {showContent && minutes.content && (
            <div className="section-content">
              <div className="minutes-content">
                {minutes.content}
              </div>
            </div>
          )}

          {/* Quyết định */}
          {minutes.decisions && minutes.decisions.length > 0 && (
            <>
              <div 
                className="section-header"
                onClick={() => setShowDecisions(!showDecisions)}
              >
                <span className="toggle">{showDecisions ? '▼' : '▶'}</span>
                <span>Quyết định ({minutes.decisions.length})</span>
              </div>
              {showDecisions && (
                <div className="section-content">
                  <div className="decision-list">
                    {minutes.decisions.map((decision, dIdx) => (
                      <div key={dIdx} className="decision-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{decision.title}</strong>
                            {decision.description && (
                              <p className="mt-1 mb-1">{decision.description}</p>
                            )}
                            {decision.responsible && (
                              <small className="text-muted d-block">
                                Người phụ trách: {decision.responsible.fullName}
                              </small>
                            )}
                          </div>
                          <div className="text-end">
                            <Badge bg="secondary">{decision.type}</Badge>
                            {decision.deadline && (
                              <div className="small text-muted mt-1">
                                Hạn: {dayjs(decision.deadline).format('DD/MM/YYYY')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Kết quả bỏ phiếu */}
          {minutes.votes && minutes.votes.length > 0 && (
            <>
              <div 
                className="section-header"
                onClick={() => setShowVotes(!showVotes)}
              >
                <span className="toggle">{showVotes ? '▼' : '▶'}</span>
                <span>Kết quả bỏ phiếu ({minutes.votes.length})</span>
              </div>
              {showVotes && (
                <div className="section-content">
                  <Row className="vote-list">
                    {minutes.votes.map((vote, vIdx) => (
                      <Col md={6} key={vIdx} className="mb-2">
                        <div className="vote-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>{vote.user.fullName}</span>
                            <Badge bg={vote.voteType === 'agree' ? 'success' : vote.voteType === 'disagree' ? 'danger' : 'warning'}>
                              {vote.voteType === 'agree' ? 'Đồng ý' : 
                                vote.voteType === 'disagree' ? 'Không đồng ý' : 'Đồng ý có ý kiến'}
                            </Badge>
                          </div>
                          {vote.comment && (
                            <small className="text-muted d-block mt-1">{vote.comment}</small>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </>
          )}

          {minutes.approvedBy && (
            <div className="time-info mt-3 text-end">
              Phê duyệt lúc: {dayjs(minutes.approvedAt).format('DD/MM/YYYY HH:mm')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ArchiveDetail = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchArchive = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/archives/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArchive(res.data.archive);
      setError('');
    } catch (e) {
      setError('Không thể tải chi tiết lưu trữ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUploadFiles = async (e) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;
    try {
      setUploading(true);
      const formData = new FormData();
      for (const f of uploadFiles) formData.append('files', f);
      await axios.post(`${API_BASE_URL}/archives/${id}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadFiles([]);
      fetchArchive();
    } catch (e) {
      alert('Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (d) => dayjs(d).format('DD/MM/YYYY');

  if (loading) return <div className="loading text-center mt-5">Đang tải...</div>;
  if (error) return <Alert variant="danger" className="mt-5 text-center">{error}</Alert>;
  if (!archive) return null;

  return (
    <div className="archives-page archive-detail page-transition">
      <div className="container-fluid">
        <h2 className="page-title">{archive.title}</h2>
        <div className="layout-wrapper">
          {/* Left sidebar */}
          <div className="left-sidebar">
            {/* Meeting snapshot */}
            <Card className="bienbanleft">
              <Card.Header>Thông tin cuộc họp</Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  <ListGroup.Item><strong>Tiêu đề:</strong> {archive.meetingSnapshot?.title}</ListGroup.Item>
                  <ListGroup.Item><strong>Thời gian:</strong> {formatDate(archive.meetingSnapshot?.startTime)} - {formatDate(archive.meetingSnapshot?.endTime)}</ListGroup.Item>
                  <ListGroup.Item><strong>Địa điểm:</strong> {archive.meetingSnapshot?.location || '—'}</ListGroup.Item>
                  <ListGroup.Item><strong>Người tổ chức:</strong> {archive.meetingSnapshot?.organizer?.fullName}</ListGroup.Item>
                  <ListGroup.Item><strong>Thư ký:</strong> {archive.meetingSnapshot?.secretary?.fullName || '—'}</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Info */}
            <Card>
              <Card.Header>Thông tin lưu trữ</Card.Header>
              <Card.Body>
                <div className="info-item"><strong>Loại:</strong> {archive.archiveType}</div>
                <div className="info-item"><strong>Ngày lưu:</strong> {formatDate(archive.archivedAt)}</div>
                <div className="info-item"><strong>Tổng tài liệu:</strong> {archive.statistics.totalDocuments}</div>
                <div className="info-item"><strong>Kích thước:</strong> {(archive.statistics.totalSize / (1024*1024)).toFixed(2)} MB</div>
                <div className="info-item"><strong>Lượt xem:</strong> {archive.statistics.viewCount}</div>
                <div className="info-item"><strong>Lượt tải:</strong> {archive.statistics.downloadCount}</div>
              </Card.Body>
            </Card>
          </div>

          {/* Main content */}
          <div className="main-content">
            {/* Documents */}
            {archive.documents && archive.documents.length > 0 && (
              <Card className="mb-3">
                <Card.Header>Tài liệu ({archive.documents.length})</Card.Header>
                <Card.Body className="p-0">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Kích thước</th>
                        <th className="text-center">Tải về</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archive.documents.map((doc, idx) => (
                        <tr key={idx}>
                          <td style={{maxWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={doc.name}>{doc.name}</td>
                          <td style={{width: '25%'}}>{(doc.size / (1024 * 1024)).toFixed(2)} MB</td>
                          <td style={{width: '15%', textAlign: 'center'}}>
                            <Button size="sm" variant="outline-primary" href={doc.archivePath.startsWith('/uploads') ? `${API_BASE_URL.replace('/api','')}${doc.archivePath}` : doc.archivePath} target="_blank" rel="noreferrer">
                              Tải
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* Minutes */}
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Biên bản cuộc họp {archive.minutesSnapshots?.length > 0 ? `(${archive.minutesSnapshots.length})` : ''}</span>
                <Button 
                  size="sm" 
                  variant="outline-primary"
                  onClick={async () => {
                    try {
                      const res = await axios.put(
                        `${API_BASE_URL}/archives/${id}/update-minutes`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setArchive(res.data.archive);
                      alert('Cập nhật biên bản thành công!');
                    } catch (error) {
                      console.error('Update minutes error:', error);
                      alert('Lỗi khi cập nhật biên bản');
                    }
                  }}
                >
                  Cập nhật biên bản
                </Button>
              </Card.Header>
              <Card.Body>
                {!archive.minutesSnapshots || archive.minutesSnapshots.length === 0 ? (
                  <div className="text-center text-muted">Chưa có biên bản nào.</div>
                ) : (
                  <div className="minutes-tree">
                    {archive.minutesSnapshots.map((minutes, idx) => (
                      <MinutesTreeView 
                        key={minutes._id || idx} 
                        minutes={minutes} 
                        idx={idx}
                        total={archive.minutesSnapshots.length}
                      />
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Notes */}
            <Card>
              <Card.Header>Ghi chú ({archive.notes.length})</Card.Header>
              <Card.Body>
                {archive.notes.length === 0 ? (
                  <div className="text-center text-muted">Chưa có ghi chú.</div>
                ) : (
                  archive.notes.map((note, idx) => (
                    <div key={idx} className={`note-item ${note.isImportant ? 'important' : ''}`}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          {note.isImportant && <Badge bg="warning" className="me-2">Quan trọng</Badge>}
                          <div>{note.text}</div>
                          <small className="text-muted">{dayjs(note.createdAt).format('DD/MM/YYYY HH:mm')} • {note.author?.fullName || '—'}</small>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="side-content">
            {/* Upload documents */}
            <Card>
              <Card.Header>Tải tài liệu lên</Card.Header>
              <Card.Body>
                <Form onSubmit={handleUploadFiles}>
                  <Form.Group className="mb-2">
                    <Form.Control type="file" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files))} />
                  </Form.Group>
                  <Button type="submit" disabled={uploading || uploadFiles.length === 0} size="sm">
                    {uploading ? 'Đang tải...' : 'Upload'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveDetail; 