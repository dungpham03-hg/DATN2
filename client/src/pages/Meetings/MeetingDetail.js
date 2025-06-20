import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Dropdown, Modal, Form, ListGroup, InputGroup,
  Spinner, Alert, OverlayTrigger, Tooltip,
  Accordion, Nav, Tab
} from 'react-bootstrap';
import { 
  FaUsers, FaClock, FaMapMarkerAlt, FaEdit, FaTrash,
  FaCalendarAlt, FaFileAlt, FaPaperclip, FaUserPlus,
  FaStickyNote, FaComments, FaSave, FaDownload
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './MeetingDetail.css';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState('');
  
  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [summary, setSummary] = useState('');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [newSummaryText, setNewSummaryText] = useState('');
  const [selectedSummaryFiles, setSelectedSummaryFiles] = useState([]);
  
  // File upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchMeetingDetail();
    fetchUsers();
  }, [id]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Lọc bỏ current user khỏi danh sách
      const filteredUsers = response.data.users.filter(u => u._id !== user._id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMeetingDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Xử lý URL ảnh summary từ database
      const meetingData = response.data.meeting;
      if (meetingData.summaryImage && !meetingData.summaryImage.startsWith('http')) {
        meetingData.summaryImage = `${API_BASE_URL}${meetingData.summaryImage}`;
      }
      
      setMeeting(meetingData);
      console.log('Meeting data:', meetingData);
      console.log('Attachments:', meetingData.attachments);
      setSummary(meetingData.summary || '');
      setNotes(meetingData.notes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin cuộc họp');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSummary = async () => {
    try {
      await axios.put(`${API_BASE_URL}/meetings/${id}/summary`, 
        { summary },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Lưu tóm tắt thành công!');
    } catch (err) {
      alert('Lỗi khi lưu tóm tắt: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/meetings/${id}/notes`,
        { text: newNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes([...notes, response.data.note]);
      setNewNote('');
    } catch (err) {
      alert('Lỗi khi thêm ghi chú: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleInviteUser = async () => {
    if (!searchUser.trim()) return;
    
    // Tìm user từ danh sách hoặc email
    const foundUser = users.find(u => 
      u.email.toLowerCase() === searchUser.toLowerCase().trim() ||
      u.fullName.toLowerCase().includes(searchUser.toLowerCase().trim())
    );
    
    if (!foundUser) {
      alert('Không tìm thấy người dùng với thông tin này');
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/meetings/${id}/invite`, 
        { email: foundUser.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Mời thành công!');
      setSearchUser('');
      setShowInviteModal(false);
      setShowUserDropdown(false);
      fetchMeetingDetail(); // Refresh để cập nhật danh sách attendees
    } catch (err) {
      alert('Lỗi khi mời: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleAddUser = (selectedUser) => {
    setSearchUser(selectedUser.fullName);
    setShowUserDropdown(false);
  };

  const filteredUsers = users.filter(user => {
    const search = searchUser.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.department && user.department.toLowerCase().includes(search))
    ) && !meeting?.attendees?.find(a => a._id === user._id);
  });

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      setUploadProgress(0);
      await axios.post(`${API_BASE_URL}/meetings/${id}/files`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      alert('Upload thành công!');
      setSelectedFile(null);
      setShowFileModal(false);
      fetchMeetingDetail();
    } catch (err) {
      alert('Lỗi upload: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('summaryImage', file);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/meetings/${id}/summary-image`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Tạo full URL cho ảnh
      const fullImageUrl = `${API_BASE_URL}${response.data.imageUrl}`;
      setMeeting(prev => ({ ...prev, summaryImage: fullImageUrl }));
      alert('Upload ảnh tóm tắt thành công!');
    } catch (err) {
      console.error('Upload image error:', err);
      alert('Lỗi upload ảnh: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleViewFile = (fileId) => {
    console.log('View file clicked, fileId:', fileId);
    console.log('Meeting ID:', id);
    const url = `${API_BASE_URL}/meetings/${id}/files/${fileId}/view`;
    console.log('View URL:', url);
    
    // Mở file trong tab mới với authentication
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('View response status:', response.status);
      if (!response.ok) {
        throw new Error('Không thể xem file');
      }
      return response.blob();
    })
    .then(blob => {
      console.log('Blob received:', blob);
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');
    })
    .catch(error => {
      console.error('View file error:', error);
      alert('Lỗi khi xem file: ' + error.message);
    });
  };

  const handleDownloadFile = (fileId, fileName) => {
    console.log('Download file clicked, fileId:', fileId, 'fileName:', fileName);
    const url = `${API_BASE_URL}/meetings/${id}/files/${fileId}/download`;
    console.log('Download URL:', url);
    
    // Tạo element link ẩn để download
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('Download response status:', response.status);
      if (!response.ok) {
        throw new Error('Không thể tải file');
      }
      return response.blob();
    })
    .then(blob => {
      console.log('Download blob received:', blob);
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    })
    .catch(error => {
      console.error('Download file error:', error);
      alert('Lỗi khi tải file: ' + error.message);
    });
  };

  // Helper function để truncate tên file
  const truncateFileName = (fileName, maxLength) => {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
    
    return `${truncatedName}...${extension}`;
  };

  // Helper function để lấy icon theo loại file
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const iconMap = {
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
      'ppt': 'fa-file-powerpoint',
      'pptx': 'fa-file-powerpoint',
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'gif': 'fa-file-image',
      'txt': 'fa-file-alt',
      'zip': 'fa-file-archive',
      'rar': 'fa-file-archive'
    };
    
    return iconMap[extension] || 'fa-file';
  };

  const renderParticipantAvatars = () => {
    if (!meeting?.attendees) return null;
    
    const displayCount = 6;
    const totalAttendees = meeting.attendees.length;
    const visibleAttendees = meeting.attendees.slice(0, displayCount);
    const remainingCount = totalAttendees - displayCount;

    return (
      <div className="participant-avatars d-flex align-items-center">
        {visibleAttendees.map((attendee, index) => (
          <OverlayTrigger
            key={attendee._id}
            placement="top"
            overlay={<Tooltip>{attendee.fullName}</Tooltip>}
          >
            <div className="avatar-wrapper" style={{ zIndex: displayCount - index }}>
              {attendee.avatar ? (
                <img 
                  src={attendee.avatar} 
                  alt={attendee.fullName}
                  className="participant-avatar"
                />
              ) : (
                <div className="participant-avatar avatar-placeholder">
                  {attendee.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </OverlayTrigger>
        ))}
        
        {remainingCount > 0 && (
          <div className="avatar-wrapper remaining-count">
            <div className="participant-avatar avatar-count">
              +{remainingCount}
            </div>
          </div>
        )}
        
        <span className="ms-3 text-muted">
          {totalAttendees} người tham gia
        </span>
      </div>
    );
  };

  const canEditSummary = user && ['admin', 'manager', 'secretary'].includes(user.role);

  // Summary messages functions
  const handleSummaryFileUpload = (files) => {
    setSelectedSummaryFiles(prev => [...prev, ...files]);
  };

  const handleAddSummaryMessage = async () => {
    if (!newSummaryText.trim() && selectedSummaryFiles.length === 0) return;
    
    try {
      const formData = new FormData();
      if (newSummaryText.trim()) {
        formData.append('text', newSummaryText);
      }
      
      selectedSummaryFiles.forEach((file, index) => {
        formData.append('attachments', file);
      });
      
      const response = await axios.post(`${API_BASE_URL}/meetings/${id}/summary-message`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Refresh meeting data để lấy summary messages mới
      fetchMeetingDetail();
      setNewSummaryText('');
      setSelectedSummaryFiles([]);
      
    } catch (err) {
      console.error('Add summary message error:', err);
      alert('Lỗi khi thêm tóm tắt: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return imageTypes.includes(extension) ? 'image' : 'file';
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Đang tải thông tin cuộc họp...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!meeting) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Không tìm thấy cuộc họp</Alert>
      </Container>
    );
  }

  return (
    <div className="meeting-detail-page">
      {/* Header Section */}
      <div className="meeting-header-compact">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center mb-2">
                <h2 className="meeting-title-compact me-3">{meeting.title}</h2>
                <div className="meeting-date-badge">
                  <div className="date-number">{new Date(meeting.startTime).getDate()}</div>
                  <div className="date-month">Th{new Date(meeting.startTime).getMonth() + 1}</div>
                  <div className="date-time">{new Date(meeting.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              <div className="meeting-subtitle">
                {meeting.location}
              </div>
              <div className="meeting-time-info">
                {new Date(meeting.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}-{new Date(meeting.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(meeting.startTime).toLocaleDateString('vi-VN')} · {meeting.attendees?.length || 0} Người được mời
              </div>
            </Col>
            <Col md={4} className="text-end">
              {renderParticipantAvatars()}
              <div className="participation-status mt-2">
                <span className="status-indicator me-2">
                  <div className="status-dot online"></div>
                  1 Người tham dự
                </span>
                <Button variant="primary" size="sm" className="attend-btn">
                  <i className="fas fa-check me-1"></i>
                  Đã tham dự
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="mt-3">
        <Row>
          {/* Main Content */}
          <Col lg={8}>
            {/* Meeting Summary with Image */}
            <div className="meeting-summary-section">
              <div className="summary-header">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="summary-author">
                    <i className="fas fa-clipboard-list me-2"></i>
                    Tóm tắt cuộc họp
                  </span>
                  {canEditSummary && (
                    <Badge bg="success" className="secretary-badge">
                      <i className="fas fa-edit me-1"></i>
                      Có thể chỉnh sửa
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Summary Messages Thread */}
              <div className="summary-messages-container">
                {meeting.summaryMessages?.length > 0 ? (
                  meeting.summaryMessages.map((message, index) => (
                    <div key={index} className="summary-message">
                      <div className="message-header">
                        <div className="d-flex align-items-center">
                          <div className="author-avatar">
                            {message.author?.avatar ? (
                              <img src={message.author.avatar} alt="" />
                            ) : (
                              <div className="avatar-placeholder">
                                {message.author?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="message-meta">
                            <span className="author-name">{message.author?.fullName || 'Người dùng'}</span>
                            <span className="message-time">
                              {new Date(message.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="message-content">
                        {message.text && (
                          <div className="message-text">
                            {message.text.split('\n').map((line, i) => (
                              <p key={i}>{line || '\u00A0'}</p>
                            ))}
                          </div>
                        )}
                        
                        {message.attachments?.map((attachment, i) => (
                          <div key={i} className="message-attachment">
                            {attachment.type === 'image' ? (
                              <div className="attachment-image">
                                <img 
                                  src={`${API_BASE_URL}${attachment.path}`} 
                                  alt={attachment.name}
                                  onClick={() => window.open(`${API_BASE_URL}${attachment.path}`, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="attachment-file">
                                <i className={`fas ${getFileIcon(attachment.name)} me-2`}></i>
                                <span className="file-name">{attachment.name}</span>
                                <div className="file-actions ms-auto">
                                  <Button 
                                    variant="outline-secondary" 
                                    size="sm"
                                    onClick={() => window.open(`${API_BASE_URL}${attachment.path}`, '_blank')}
                                  >
                                    <i className="fas fa-eye"></i>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="summary-empty-state">
                    <i className="fas fa-clipboard-list fa-3x mb-3"></i>
                    <h5>Chưa có tóm tắt cuộc họp</h5>
                    <p className="text-muted">
                      {canEditSummary 
                        ? "Hãy thêm nội dung tóm tắt, hình ảnh hoặc tài liệu bên dưới"
                        : "Người ghi chép sẽ cập nhật tóm tắt cuộc họp tại đây"
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Summary Input for Editors */}
              {canEditSummary && (
                <div className="summary-input-area">
                  <div className="input-container">
                    <div className="d-flex align-items-start">
                      <div className="user-avatar me-3">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" />
                        ) : (
                          <div className="avatar-placeholder">
                            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow-1">
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={newSummaryText}
                          onChange={(e) => setNewSummaryText(e.target.value)}
                          placeholder="Thêm nội dung tóm tắt cuộc họp..."
                          className="summary-input"
                        />
                        
                        <div className="input-actions mt-2">
                          <div className="attachment-controls">
                            <input
                              type="file"
                              multiple
                              accept="*/*"
                              style={{ display: 'none' }}
                              id="summary-file-upload"
                              onChange={(e) => handleSummaryFileUpload(Array.from(e.target.files))}
                            />
                            <label htmlFor="summary-file-upload" className="attach-btn">
                              <i className="fas fa-paperclip me-1"></i>
                              Đính kèm
                            </label>
                            
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              id="summary-image-upload"
                              onChange={(e) => handleSummaryFileUpload(Array.from(e.target.files))}
                            />
                            <label htmlFor="summary-image-upload" className="attach-btn">
                              <i className="fas fa-image me-1"></i>
                              Hình ảnh
                            </label>
                          </div>
                          
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={handleAddSummaryMessage}
                            disabled={!newSummaryText.trim() && selectedSummaryFiles.length === 0}
                          >
                            <i className="fas fa-paper-plane me-1"></i>
                            Gửi
                          </Button>
                        </div>
                        
                        {/* Selected files preview */}
                        {selectedSummaryFiles.length > 0 && (
                          <div className="selected-files-preview mt-2">
                            {selectedSummaryFiles.map((file, index) => (
                              <div key={index} className="selected-file-item">
                                <i className={`fas ${getFileIcon(file.name)} me-2`}></i>
                                <span className="file-name">{file.name}</span>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="text-danger p-0 ms-2"
                                  onClick={() => setSelectedSummaryFiles(prev => prev.filter((_, i) => i !== index))}
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="notes-section mt-4">
              <div className="notes-input">
                <div className="d-flex align-items-start">
                  <div className="user-avatar-small me-3">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="rounded-circle" />
                    ) : (
                      <div className="avatar-placeholder-small">
                        {user?.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Nhập ghi chú tại đây..."
                      className="note-input"
                    />
                    <div className="note-actions mt-2">
                      <Button variant="link" size="sm" className="text-muted">
                        <i className="fas fa-smile"></i>
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleAddNote} className="ms-2">
                        Gửi
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Notes */}
              <div className="notes-list mt-3">
                {notes.map((note, index) => (
                  <div key={index} className="note-item">
                    <div className="d-flex align-items-start">
                      <div className="user-avatar-small me-3">
                        {note.author?.avatar ? (
                          <img src={note.author.avatar} alt="" className="rounded-circle" />
                        ) : (
                          <div className="avatar-placeholder-small">
                            {note.author?.fullName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="note-content">{note.text}</div>
                        <div className="note-meta">
                          <small className="text-muted">
                            {note.author?.fullName} · {new Date(note.createdAt).toLocaleString('vi-VN')}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            <div className="meeting-sidebar-compact">
              {/* Schedule Dropdown */}
              <div className="sidebar-section">
                <div 
                  className="sidebar-toggle w-100 text-start"
                  onClick={() => setExpandedSection(expandedSection === 'schedule' ? '' : 'schedule')}
                >
                  <i className="fas fa-calendar-alt me-2"></i>
                  LỊCH HỌP
                  <i className={`fas fa-chevron-${expandedSection === 'schedule' ? 'up' : 'down'} float-end mt-1`}></i>
                </div>
                {expandedSection === 'schedule' && (
                  <div className="sidebar-content">
                    <div className="dropdown-content p-3">
                      <h6>Lịch họp gần đây</h6>
                      <div className="schedule-item">
                        <div className="schedule-time">10:00 - 11:30</div>
                        <div className="schedule-title">Họp nhóm Marketing</div>
                        <div className="schedule-location">Phòng A101</div>
                      </div>
                      <div className="schedule-item">
                        <div className="schedule-time">14:00 - 15:00</div>
                        <div className="schedule-title">Review dự án Q4</div>
                        <div className="schedule-location">Online</div>
                      </div>
                      <div className="mt-3">
                        <Button variant="link" size="sm" className="p-0">
                          Xem tất cả lịch họp →
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Meeting Overview Dropdown */}
              <div className="sidebar-section">
                <div 
                  className="sidebar-toggle w-100 text-start"
                  onClick={() => setExpandedSection(expandedSection === 'overview' ? '' : 'overview')}
                >
                  <i className="fas fa-file-alt me-2"></i>
                  TỔNG QUAN CUỘC HỌP
                  <i className={`fas fa-chevron-${expandedSection === 'overview' ? 'up' : 'down'} float-end mt-1`}></i>
                </div>
                {expandedSection === 'overview' && (
                  <div className="sidebar-content">
                    <div className="dropdown-content p-3">
                      <div className="overview-item">
                        <i className="fas fa-clock me-2"></i>
                        <strong>THỜI GIAN VÀ ĐỊA ĐIỂM</strong>
                      </div>
                      <div className="overview-details">
                        <div>{new Date(meeting.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}-{new Date(meeting.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(meeting.startTime).toLocaleDateString('vi-VN')}</div>
                        <div>{meeting.location}</div>
                      </div>
                      <div className="overview-agenda mt-3">
                        <div className="overview-item mb-2">
                          <i className="fas fa-list me-2"></i>
                          <strong>CHƯƠNG TRÌNH</strong>
                        </div>
                        <ul className="agenda-list">
                          <li></li>
                          <li></li>
                        </ul>
                      </div>
                      <div className="overview-participants mt-3">
                        <div className="overview-item mb-2">
                          <i className="fas fa-users me-2"></i>
                          <strong>NGƯỜI THAM GIA</strong>
                        </div>
                        <div className="participants-summary">
                          {meeting.attendees?.length || 0} người được mời
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Attachments */}
              <div className="sidebar-section">
                <div className="section-header">
                  <i className="fas fa-paperclip me-2"></i>
                  TỆP ĐÍNH KÈM
                  <Button variant="link" size="sm" className="float-end p-0" onClick={() => setShowFileModal(true)}>
                    TẢI LÊN
                  </Button>
                </div>
                <div className="attachments-area">
                  {meeting.attachments?.length > 0 ? (
                    meeting.attachments.map((file, index) => (
                      <div key={file._id || index} className="attachment-item">
                        <div className="attachment-content">
                          <div className="file-icon-name">
                            <i className={`fas ${getFileIcon(file.name)} me-2 file-type-icon`}></i>
                            <div className="file-info">
                              <div className="file-name" title={file.name}>
                                {truncateFileName(file.name, 30)}
                              </div>
                              <small className="text-muted file-size">
                                {file.size ? (file.size / 1024 / 1024 > 1 
                                  ? (file.size / 1024 / 1024).toFixed(1) + ' MB' 
                                  : (file.size / 1024).toFixed(1) + ' KB') : 'N/A'}
                              </small>
                            </div>
                          </div>
                          <div className="file-actions">
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              className="action-btn view-btn"
                              onClick={() => handleViewFile(file._id)}
                              title="Xem file"
                            >
                              <i className="fas fa-eye"></i>
                              <span className="btn-text"></span>
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="action-btn download-btn"
                              onClick={() => handleDownloadFile(file._id, file.name)}
                              title="Tải xuống"
                            >
                              <i className="fas fa-download"></i>
                              <span className="btn-text"></span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted small">Chưa có tệp đính kèm</p>
                  )}
                </div>
              </div>

              {/* Invite Members */}
              <div className="sidebar-section">
                <div 
                  className="sidebar-toggle w-100 text-start"
                  onClick={() => setExpandedSection(expandedSection === 'invite' ? '' : 'invite')}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  LỜI MỜI
                  <i className={`fas fa-chevron-${expandedSection === 'invite' ? 'up' : 'down'} float-end mt-1`}></i>
                </div>
                {expandedSection === 'invite' && (
                  <div className="sidebar-content">
                    <div className="dropdown-content p-3">
                      <div className="invite-section">
                        <h6>Thành viên</h6>
                        {meeting.attendees?.slice(0, 3).map(attendee => (
                          <div key={attendee._id} className="member-item">
                            <div className="d-flex align-items-center">
                              {attendee.avatar ? (
                                <img src={attendee.avatar} alt="" className="member-avatar me-2" />
                              ) : (
                                <div className="member-avatar-placeholder me-2">
                                  {attendee.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                              <div className="flex-grow-1">
                                <div className="member-name">{attendee.fullName}</div>
                                <div className="member-role">{attendee.role || 'Nhân viên'}</div>
                              </div>
                              <Button variant="link" size="sm" className="text-muted">
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button variant="link" size="sm" className="p-0 mt-2" onClick={() => setShowInviteModal(true)}>
                          + Thêm người
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Invite User Modal */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mời thêm người tham gia</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="position-relative">
            <Form.Label>Tìm kiếm người dùng</Form.Label>
            <Form.Control
              type="text"
              value={searchUser}
              onChange={(e) => {
                setSearchUser(e.target.value);
                setShowUserDropdown(true);
              }}
              onFocus={() => setShowUserDropdown(true)}
              placeholder="Nhập tên hoặc email người muốn mời..."
            />
            
            {showUserDropdown && searchUser && (
              <Card className="position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                <Card.Body className="p-2">
                  {loadingUsers ? (
                    <div className="text-center py-2">
                      <Spinner size="sm" />
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div 
                        key={user._id}
                        className="p-2 hover-bg-light cursor-pointer"
                        onClick={() => handleAddUser(user)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="fw-bold">{user.fullName}</div>
                        <small className="text-muted">{user.email} • {user.department || 'N/A'}</small>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted text-center py-2">
                      Không tìm thấy người dùng
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowInviteModal(false);
            setSearchUser('');
            setShowUserDropdown(false);
          }}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleInviteUser}>
            Gửi lời mời
          </Button>
        </Modal.Footer>
      </Modal>

      {/* File Upload Modal */}
      <Modal show={showFileModal} onHide={() => setShowFileModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Đính kèm tệp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Chọn tệp</Form.Label>
            <Form.Control
              type="file"
              multiple
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <Form.Text className="text-muted">
              Hỗ trợ các định dạng: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (tối đa 10MB)
            </Form.Text>
          </Form.Group>
          {uploadProgress > 0 && (
            <div className="mt-2">
              <small className="text-muted">Đang tải lên...</small>
              <div className="progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${uploadProgress}%` }}
                >
                  {uploadProgress}%
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFileModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleFileUpload}
            disabled={!selectedFile || uploadProgress > 0}
          >
            {uploadProgress > 0 ? 'Đang tải...' : 'Tải lên'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MeetingDetail; 