import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Dropdown, Modal, Form, ListGroup, InputGroup,
  Spinner, Alert, OverlayTrigger, Tooltip,
  Accordion, Nav, Tab, Tabs
} from 'react-bootstrap';
import { 
  FaUsers, FaClock, FaMapMarkerAlt, FaEdit, FaTrash,
  FaCalendarAlt, FaFileAlt, FaPaperclip, FaUserPlus,
  FaStickyNote, FaComments, FaSave, FaDownload
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import EmojiPicker from 'emoji-picker-react';
import ConfirmModal from '../../components/ConfirmModal';
import useConfirm from '../../hooks/useConfirm';
import useApiCall from '../../hooks/useApiCall';
import MinutesContent from '../../components/Minutes/MinutesContent';
import './MeetingDetail.css';

// Component hiển thị ảnh với state management
const ImageAttachment = ({ src, alt, fileName, onClick }) => {
  const [imageState, setImageState] = useState('loading'); // loading, loaded, error

  const handleImageLoad = () => {
    setImageState('loaded');
  };

  const handleImageError = (e) => {
    setImageState('error');
  };

  const getImageClasses = () => {
    let classes = 'attachment-image';
    if (imageState === 'loading') classes += ' loading';
    if (imageState === 'error') classes += ' error';
    return classes;
  };

  if (imageState === 'error') {
    return (
      <div className={getImageClasses()}>
        <div className="error-content">
          <i className="fas fa-exclamation-triangle mb-2"></i>
          <div>Không thể tải ảnh</div>
          <small className="text-muted">{fileName}</small>
          <Button 
            variant="link" 
            size="sm" 
            className="mt-2"
            onClick={onClick}
          >
            Thử mở trong tab mới
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={getImageClasses()}>
      {imageState === 'loading' && (
        <div className="loading-overlay">
          <Spinner animation="border" size="sm" />
          <small className="ms-2">Đang tải...</small>
        </div>
      )}
      <img 
        src={src} 
        alt={alt}
        onClick={onClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ 
          display: imageState === 'loaded' ? 'block' : 'none' 
        }}
      />
    </div>
  );
};

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { success, error: notify, warning } = useNotification();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
  const STATIC_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Confirm modal hook
  const { confirmState, showConfirm, handleConfirm, handleCancel } = useConfirm();
  
  // API call hook với loading
  const { call, submitForm } = useApiCall();

  // React Quill configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike', 
    'color', 'background',
    'list', 'bullet', 'indent',
    'align', 'link'
  ];

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState('');
  const [activeTab, setActiveTab] = useState('meeting-info'); // New state for sidebar tabs
  
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
  const [summaryMessages, setSummaryMessages] = useState([]);
  const [newSummaryText, setNewSummaryText] = useState('');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editSummaryText, setEditSummaryText] = useState('');
  const [summaryFiles, setSummaryFiles] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [isEditingAgenda, setIsEditingAgenda] = useState(false);
  const [editAgendaText, setEditAgendaText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPositionNote, setCursorPositionNote] = useState(0);
  const [showGifModal, setShowGifModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  
  // File upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Upcoming meetings for sidebar
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);



  useEffect(() => {
    fetchMeetingDetail();
    fetchUsers();
    fetchUpcomingMeetings();
  }, [id]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container') && !event.target.closest('.fa-smile')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const fetchUsers = async () => {
    const loadUsersCall = call.loading(async () => {
      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.users;
    });

    try {
      setLoadingUsers(true);
      const allUsers = await loadUsersCall();
      // Lọc bỏ current user khỏi danh sách
      const filteredUsers = allUsers.filter(u => u._id !== user._id);
      setUsers(filteredUsers);
    } catch (error) {
      setUsers([]);
      notify('Không thể tải danh sách người dùng');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMeetingDetail = async () => {
    const loadMeetingCall = call.loading(async () => {
      const response = await axios.get(`${API_BASE_URL}/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.meeting;
    });

    try {
      setLoading(true);
      const meetingData = await loadMeetingCall();
      
      // Xử lý URL ảnh summary từ database
      if (meetingData.summaryImage && !meetingData.summaryImage.startsWith('http')) {
        meetingData.summaryImage = `${STATIC_BASE_URL}${meetingData.summaryImage}`;
      }
      
      setMeeting(meetingData);
      setSummary(meetingData.summary || '');
      setSummaryMessages(meetingData.summaryMessages || []);
      setNotes(meetingData.notes || []);
      setSummaryFiles(meetingData.summaryFiles || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin cuộc họp');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingMeetings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          limit: 10, // Lấy nhiều hơn để filter
          page: 1
        }
      });
      
      // Filter chỉ lấy meetings trong tương lai và khác meeting hiện tại
      const now = new Date();
      const futureMeetings = (response.data.meetings || [])
        .filter(meeting => {
          const meetingStart = new Date(meeting.startTime);
          return meetingStart > now && meeting._id !== id; // Loại bỏ meeting hiện tại
        })
        .slice(0, 5); // Chỉ lấy 5 meeting đầu
      
      setUpcomingMeetings(futureMeetings);
    } catch (err) {
      setUpcomingMeetings([]);
    }
  };

  const handleSaveSummary = async (mode = 'append') => {
    if (!newSummaryText.trim()) {
      warning('Vui lòng nhập nội dung tóm tắt');
      return;
    }

    try {
      // Thêm message mới vào summaryMessages thay vì chỉnh sửa summary text
      const response = await axios.post(`${API_BASE_URL}/meetings/${id}/summary-message`, 
        { text: newSummaryText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      success('Thêm tóm tắt thành công!');
      
      // Clear input và refresh meeting data
      setNewSummaryText('');
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi khi lưu tóm tắt: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleAddSummaryMessage = async (text, files = []) => {
    // Strip HTML tags to check if there's actual content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!textContent.trim() && (!files || files.length === 0)) {
      warning('Vui lòng nhập nội dung hoặc đính kèm file');
      return;
    }

    try {
      const formData = new FormData();
      if (textContent.trim()) {
        formData.append('text', text);
      }
      
      if (files && files.length > 0) {
        Array.from(files).forEach(file => {
          formData.append('attachments', file);
        });
      }

      const response = await axios.post(`${API_BASE_URL}/meetings/${id}/summary-message`, 
        formData,
        { headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } }
      );
      
      success('Thêm tóm tắt thành công!');
      setNewSummaryText('');
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi khi thêm tóm tắt: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleEditMessage = (messageId, currentText) => {
    setEditingMessageId(messageId);
    setEditMessageText(currentText);
  };

  const handleSaveEditMessage = async (messageId) => {
    // Strip HTML tags to check if there's actual content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editMessageText;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!textContent.trim()) {
      warning('Vui lòng nhập nội dung');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/meetings/${id}/summary-message/${messageId}`, 
        { text: editMessageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      success('Cập nhật tóm tắt thành công!');
      setEditingMessageId(null);
      setEditMessageText('');
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi khi cập nhật: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmed = await showConfirm({
      title: 'Xóa tóm tắt',
      message: 'Bạn có chắc muốn xóa tóm tắt này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      icon: '🗑️'
    });

    if (!confirmed) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/meetings/${id}/summary-message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success('Xóa tóm tắt thành công!');
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi khi xóa: ' + (err.response?.data?.message || 'Lỗi không xác định'));
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
      notify('Lỗi khi thêm ghi chú: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleEditNote = (noteId, currentText) => {
    setEditingNoteId(noteId);
    setEditNoteText(currentText);
  };

  const handleSaveEditNote = async (noteId) => {
    if (!editNoteText.trim()) {
      warning('Vui lòng nhập nội dung ghi chú');
      return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/meetings/${id}/notes/${noteId}`, 
        { text: editNoteText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Cập nhật note trong state
      const updatedNotes = notes.map(note => 
        note._id === noteId ? response.data.note : note
      );
      setNotes(updatedNotes);
      
      success('Cập nhật ghi chú thành công!');
      setEditingNoteId(null);
      setEditNoteText('');
    } catch (err) {
      notify('Lỗi khi cập nhật ghi chú: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditNoteText('');
  };

  const handleDeleteNote = async (noteId) => {
    const confirmed = await showConfirm({
      title: 'Xóa ghi chú',
      message: 'Bạn có chắc muốn xóa ghi chú này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      icon: '📝'
    });

    if (!confirmed) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/meetings/${id}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Xóa note khỏi state
      const filteredNotes = notes.filter(note => note._id !== noteId);
      setNotes(filteredNotes);
      
      success('Xóa ghi chú thành công!');
    } catch (err) {
      notify('Lỗi khi xóa ghi chú: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleEmojiClick = (emojiObject) => {
    const textarea = document.querySelector('.note-input');
    if (textarea) {
      const start = cursorPositionNote;
      const end = cursorPositionNote;
      const newText = newNote.slice(0, start) + emojiObject.emoji + newNote.slice(end);
      setNewNote(newText);
      setCursorPositionNote(start + emojiObject.emoji.length);
      setShowEmojiPicker(false);
      
      // Focus back to textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emojiObject.emoji.length, start + emojiObject.emoji.length);
      }, 100);
    }
  };

  const handleNoteTextareaChange = (e) => {
    setNewNote(e.target.value);
    setCursorPositionNote(e.target.selectionStart);
  };

  const handleNoteTextareaSelect = (e) => {
    setCursorPositionNote(e.target.selectionStart);
  };



  const insertGif = (gifText) => {
    const textarea = document.querySelector('.note-input');
    if (textarea) {
      const start = cursorPositionNote;
      const newText = newNote.slice(0, start) + gifText + newNote.slice(start);
      setNewNote(newText);
      setCursorPositionNote(start + gifText.length);
      setShowGifModal(false);
      
      // Focus back to textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + gifText.length, start + gifText.length);
      }, 100);
    }
  };

  const insertSticker = (stickerText) => {
    const textarea = document.querySelector('.note-input');
    if (textarea) {
      const start = cursorPositionNote;
      const newText = newNote.slice(0, start) + stickerText + newNote.slice(start);
      setNewNote(newText);
      setCursorPositionNote(start + stickerText.length);
      setShowStickerModal(false);
      
      // Focus back to textarea
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + stickerText.length, start + stickerText.length);
      }, 100);
    }
  };

  const handleEditAgenda = () => {
    setEditAgendaText(meeting.agenda || '');
    setIsEditingAgenda(true);
  };

  const handleSaveAgenda = async () => {
    // Strip HTML tags to check if there's actual content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editAgendaText;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!textContent.trim()) {
      warning('Vui lòng nhập nội dung chương trình');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/meetings/${id}`, 
        { agenda: editAgendaText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      success('Cập nhật chương trình thành công!');
      setIsEditingAgenda(false);
      setEditAgendaText('');
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi khi cập nhật chương trình: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleCancelEditAgenda = () => {
    setIsEditingAgenda(false);
    setEditAgendaText('');
  };

  const handleInviteUser = async () => {
    if (!searchUser.trim()) {
      warning('Vui lòng nhập tên hoặc email người muốn mời');
      return;
    }
    
    // Tìm user từ danh sách hoặc email
    const foundUser = users.find(u => 
      u.email.toLowerCase() === searchUser.toLowerCase().trim() ||
      u.fullName.toLowerCase().includes(searchUser.toLowerCase().trim())
    );
    
    if (!foundUser) {
      warning('Không tìm thấy người dùng với thông tin này. Vui lòng kiểm tra lại tên hoặc email.');
      return;
    }

    // Kiểm tra user đã được mời chưa
    const alreadyInvited = meeting?.attendees?.find(a => a.user._id === foundUser._id);
    if (alreadyInvited) {
      warning(`${foundUser.fullName} đã được mời tham gia cuộc họp này`);
      return;
    }
    
    try {
      await submitForm(async () => {
        const response = await axios.post(`${API_BASE_URL}/meetings/${id}/invite`, 
        { email: foundUser.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
        return response.data;
      }, {
        loadingText: `Đang mời ${foundUser.fullName}...`,
        successMessage: `Đã mời ${foundUser.fullName} tham gia cuộc họp!`
      });
      
      // Reset form và refresh data
      setSearchUser('');
      setShowInviteModal(false);
      setShowUserDropdown(false);
      fetchMeetingDetail(); // Refresh để cập nhật danh sách attendees
    } catch (err) {
      // Lỗi đã được xử lý bởi submitForm
    }
  };

  const handleAddUser = (selectedUser) => {
    setSearchUser(selectedUser.fullName);
    setShowUserDropdown(false);
  };

  const handleRemoveAttendee = async (userId, userName) => {
    const confirmed = await showConfirm({
      title: 'Loại bỏ thành viên',
      message: `Bạn có chắc chắn muốn loại bỏ ${userName} khỏi cuộc họp?`,
      confirmText: 'Loại bỏ',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      icon: '🗑️'
    });

    if (!confirmed) return;

    const removeAttendeeCall = call.deleting(async () => {
      const response = await axios.delete(`${API_BASE_URL}/meetings/${id}/attendees/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
      });
      
    try {
      await removeAttendeeCall();
      success(`Đã loại bỏ ${userName} khỏi cuộc họp!`);
      fetchMeetingDetail(); // Refresh để cập nhật danh sách
    } catch (err) {
      // Lỗi đã được xử lý bởi call.deleting
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchUser.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.department && user.department.toLowerCase().includes(search))
    ) && !meeting?.attendees?.find(a => a.user._id === user._id);
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
      success('Upload thành công!');
      setSelectedFile(null);
      setShowFileModal(false);
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi upload: ' + (err.response?.data?.message || 'Lỗi không xác định'));
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
      const fullImageUrl = `${STATIC_BASE_URL}${response.data.imageUrl}`;
      setMeeting(prev => ({ ...prev, summaryImage: fullImageUrl }));
      
      // Nếu đang trong edit mode, chèn image reference vào vị trí cursor
      if (isEditingSummary) {
        const imageReference = `[🖼️Hình ảnh tóm tắt]`;
        const textBefore = editSummaryText.substring(0, cursorPosition);
        const textAfter = editSummaryText.substring(cursorPosition);
        const newText = textBefore + ' ' + imageReference + ' ' + textAfter;
        
        setEditSummaryText(newText);
        setCursorPosition(cursorPosition + imageReference.length + 2);
      }
      
      success('Upload ảnh tóm tắt thành công!');
    } catch (err) {
      notify('Lỗi upload ảnh: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleDeleteSummaryImage = async () => {
    const confirmed = await showConfirm({
      title: 'Xóa hình ảnh',
      message: 'Bạn có chắc muốn xóa hình ảnh tóm tắt?',
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      icon: '🖼️'
    });

    if (!confirmed) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/meetings/${id}/summary-image`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMeeting(prev => ({ ...prev, summaryImage: null }));
      success('Xóa hình ảnh thành công!');
    } catch (err) {
      notify('Lỗi khi xóa hình ảnh: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleEditSummary = () => {
    setEditSummaryText(meeting.summary || '');
    setIsEditingSummary(true);
  };

  const handleCancelEditSummary = () => {
    setIsEditingSummary(false);
    setEditSummaryText('');
  };

  const handleSaveEditSummary = async () => {
    try {
      await axios.put(`${API_BASE_URL}/meetings/${id}/summary`, 
        { summary: editSummaryText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      success('Cập nhật tóm tắt thành công!');
      setIsEditingSummary(false);
      setEditSummaryText('');
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi khi cập nhật tóm tắt: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleDeleteSummary = async () => {
    const confirmed = await showConfirm({
      title: 'Xóa toàn bộ tóm tắt',
      message: 'Bạn có chắc muốn xóa toàn bộ tóm tắt cuộc họp? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa toàn bộ',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      icon: '⚠️'
    });

    if (!confirmed) return;
    
    try {
      await axios.put(`${API_BASE_URL}/meetings/${id}/summary`, 
        { summary: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      success('Xóa tóm tắt thành công!');
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi khi xóa tóm tắt: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleSummaryFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('type', 'summary'); // Distinguish from regular attachments
      
            const response = await axios.post(`${API_BASE_URL}/meetings/${id}/summary-files`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Tạo file references với khoảng cách phù hợp
      const fileReferences = Array.from(files).map(file => 
        `[📎${file.name}]`
      ).join(' ');
      
      // Luôn luôn cập nhật summary với file references
      const currentSummary = meeting.summary || '';
      const newSummary = currentSummary 
        ? `${currentSummary} ${fileReferences}`
        : fileReferences;
      
      if (isEditingSummary) {
        // Edit mode: Chèn vào vị trí cursor TRONG textarea
        const textBefore = editSummaryText.substring(0, cursorPosition);
        const textAfter = editSummaryText.substring(cursorPosition);
        const newEditText = textBefore + ' ' + fileReferences + ' ' + textAfter;
        
        setEditSummaryText(newEditText);
        setCursorPosition(cursorPosition + fileReferences.length + 2);
      }
      
      // Cập nhật summary trong database cho cả 2 trường hợp
      try {
        const updateResponse = await axios.put(`${API_BASE_URL}/meetings/${id}/summary`, 
          { summary: newSummary },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Force refresh meeting data after successful update
        setTimeout(() => {
          fetchMeetingDetail();
        }, 500);
        
      } catch (updateError) {
        // Silent failure for now
      }
      
      notify(`Upload ${files.length} file thành công!`);
      fetchMeetingDetail(); // Refresh to get new files
    } catch (err) {
      notify('Lỗi upload file: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleTextareaChange = (e) => {
    setEditSummaryText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleTextareaSelect = (e) => {
    setCursorPosition(e.target.selectionStart);
  };

  const handleDeleteSummaryFile = async (fileId, fileName) => {
    const confirmed = await showConfirm({
      title: 'Xóa file đính kèm',
      message: `Bạn có chắc muốn xóa file "${fileName}"?`,
      confirmText: 'Xóa file',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
      icon: '📎'
    });

    if (!confirmed) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/meetings/${id}/summary-files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success('Xóa file thành công!');
      fetchMeetingDetail();
    } catch (err) {
      notify('Lỗi khi xóa file: ' + (err.response?.data?.message || 'Lỗi không xác định'));
    }
  };

  const handleViewSummaryFile = (fileId) => {
    const url = `${API_BASE_URL}/meetings/${id}/summary-files/${fileId}/view`;
    
    // Mở file trong tab mới với authentication
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Không thể xem file');
      }
      return response.blob();
    })
    .then(blob => {
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');
    })
    .catch(error => {
      notify('Lỗi khi xem file: ' + error.message);
    });
  };

  const handleDownloadSummaryFile = (fileId, fileName) => {
    const url = `${API_BASE_URL}/meetings/${id}/summary-files/${fileId}/download`;
    
    // Download file
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Không thể tải file');
      }
      return response.blob();
    })
    .then(blob => {
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
      notify('Lỗi khi tải file: ' + error.message);
    });
  };

  const handleViewFile = (fileId) => {
    const url = `${API_BASE_URL}/meetings/${id}/files/${fileId}/view`;
    
    // Mở file trong tab mới với authentication
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Không thể xem file');
      }
      return response.blob();
    })
    .then(blob => {
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');
    })
    .catch(error => {
      notify('Lỗi khi xem file: ' + error.message);
    });
  };

  const handleDownloadFile = (fileId, fileName) => {
    const url = `${API_BASE_URL}/meetings/${id}/files/${fileId}/download`;
    
    // Tạo element link ẩn để download
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Không thể tải file');
      }
      return response.blob();
    })
    .then(blob => {
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
      notify('Lỗi khi tải file: ' + error.message);
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
            key={attendee.user._id}
            placement="top"
            overlay={<Tooltip>{attendee.user.fullName}</Tooltip>}
          >
            <div className="avatar-wrapper" style={{ zIndex: displayCount - index }}>
              {attendee.user.avatar ? (
                <img 
                  src={
                    attendee.user.avatar && attendee.user.avatar.startsWith('/uploads') 
                      ? `${API_BASE_URL.replace('/api', '')}${attendee.user.avatar}`
                      : attendee.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.user.fullName)}&background=667eea&color=fff&bold=true`
                  }
                  alt={attendee.user.fullName}
                  className="participant-avatar"
                />
              ) : (
                <div className="participant-avatar avatar-placeholder">
                  {attendee.user.fullName?.charAt(0)?.toUpperCase() || 'U'}
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
  const canEditAgenda = user && ['admin', 'manager', 'secretary'].includes(user.role);
  const canRemoveAttendees = user && (
    meeting?.organizer?._id === user._id || 
    ['admin', 'manager'].includes(user.role)
  );

  // Group messages by author for better display
  const groupMessagesByAuthor = (messages) => {
    if (!messages || messages.length === 0) return [];
    
    const groups = [];
    let currentGroup = null;
    
    messages.forEach((message) => {
      const authorId = message.author._id;
      
      if (!currentGroup || currentGroup.authorId !== authorId) {
        // Start new group
        currentGroup = {
          authorId,
          author: message.author,
          messages: [message]
        };
        groups.push(currentGroup);
      } else {
        // Add to current group
        currentGroup.messages.push(message);
      }
    });
    
    return groups;
  };

  // Render summary messages in chat-like format
  const renderSummaryMessages = () => {
    if (!summaryMessages || summaryMessages.length === 0) {
      return (
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
      );
    }

    const messageGroups = groupMessagesByAuthor(summaryMessages);
    
    return messageGroups.map((group, groupIndex) => (
      <div key={`group-${groupIndex}`} className="message-group">
        {/* Group Header with Author Info */}
        <div className="group-header">
          <div className="author-avatar">
            {group.author.avatar ? (
              <img 
                src={
                  group.author.avatar.startsWith('/uploads') 
                    ? `${API_BASE_URL.replace('/api', '')}${group.author.avatar}`
                    : group.author.avatar
                } 
                alt={group.author.fullName}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="avatar-placeholder" 
              style={{ 
                display: group.author.avatar ? 'none' : 'flex',
                background: '#007bff',
                color: 'white',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              {group.author.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
          <div className="author-info">
            <div className="author-name">{group.author.fullName}</div>
            <div className="author-role">{group.author.role || 'Thành viên'}</div>
          </div>
        </div>

        {/* Messages from this author */}
        {group.messages.map((message, messageIndex) => (
          <div key={message._id} className="message-item">
            {editingMessageId === message._id ? (
              // Edit mode
              <div className="message-edit-mode">
                <ReactQuill
                  theme="snow"
                  value={editMessageText}
                  onChange={setEditMessageText}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Nhập nội dung tóm tắt..."
                  className="message-rich-editor"
                />
                <div className="message-edit-actions">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={handleCancelEditMessage}
                  >
                    Hủy
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleSaveEditMessage(message._id)}
                  >
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <>
                {/* Message Content */}
                <div className="message-content">
                  {message.text && (
                    <div 
                      className="ql-editor" 
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    />
                  )}
                </div>

                {/* Message Files */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="message-files">
                    {message.attachments.map((file, fileIndex) => (
                      <div key={fileIndex} className="message-file-item">
                        <i className={`fas ${getFileIcon(file.name)} message-file-icon`}></i>
                        <span className="message-file-name" title={file.name}>
                          {truncateFileName(file.name, 20)}
                        </span>
                        <div className="message-file-actions">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => handleViewSummaryFile(file._id)}
                            title="Xem file"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleDownloadSummaryFile(file._id, file.name)}
                            title="Tải xuống"
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Timestamp */}
                <div className="message-timestamp">
                  {new Date(message.createdAt).toLocaleString('vi-VN')}
                </div>

                {/* Message Actions */}
                {canEditSummary && (group.author._id === user._id || user.role === 'admin') && (
                  <div className="message-actions">
                    <Button 
                      variant="outline-primary" 
                      className="message-action-btn"
                      onClick={() => handleEditMessage(message._id, message.text)}
                      title="Chỉnh sửa"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      className="message-action-btn"
                      onClick={() => handleDeleteMessage(message._id)}
                      title="Xóa"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    ));
  };

  // Function to render summary with inline files (legacy support)
  const renderSummaryWithFiles = (summaryText) => {
    if (!summaryText) return null;
    
    const lines = summaryText.split('\n');
    return lines.map((line, i) => {
      // Check if line contains file reference [📎filename]
      const fileMatch = line.match(/\[📎(.+?)\]/g);
      if (fileMatch) {
        const parts = line.split(/(\[📎.+?\])/g);
        return (
          <p key={i} className="summary-line-with-files">
            {parts.map((part, j) => {
              const match = part.match(/\[📎(.+?)\]/);
              if (match) {
                const fileName = match[1];
                // Find the actual file in summaryFiles
                const file = summaryFiles.find(f => f.name === fileName);
                if (file) {
                  return (
                    <div key={j} className="inline-file-component">
                      <div className="inline-file-item">
                        <div className="file-info">
                          <i className={`fas ${getFileIcon(file.name)} me-2 file-icon`}></i>
                          <div className="file-details">
                            <div className="file-name" title={file.name}>
                              {truncateFileName(file.name, 30)}
                            </div>
                            <div className="file-size">
                              {file.size ? (file.size / 1024 / 1024 > 1 
                                ? (file.size / 1024 / 1024).toFixed(1) + ' MB' 
                                : (file.size / 1024).toFixed(1) + ' KB') : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="file-actions">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => handleViewSummaryFile(file._id)}
                            title="Xem file"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleDownloadSummaryFile(file._id, file.name)}
                            title="Tải xuống"
                            className="ms-1"
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                          {canEditSummary && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteSummaryFile(file._id, file.name)}
                              title="Xóa file"
                              className="ms-1"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // File reference exists but file not found
                  return (
                    <span key={j} className="missing-file-reference">
                      {part} <small className="text-muted">(file không tìm thấy)</small>
                    </span>
                  );
                }
              }
              return part;
            })}
          </p>
        );
      }
      
      // Check if line contains image reference [🖼️...]
      const imageMatch = line.match(/\[🖼️.+?\]/);
      if (imageMatch && meeting.summaryImage) {
        const parts = line.split(/(\[🖼️.+?\])/g);
        return (
          <p key={i} className="summary-line-with-image">
            {parts.map((part, j) => {
              if (part.match(/\[🖼️.+?\]/)) {
                return (
                  <div key={j} className="inline-image-component">
                    <div className="position-relative d-inline-block">
                      <img 
                        src={meeting.summaryImage}
                        alt="Hình ảnh tóm tắt"
                        className="img-fluid summary-attached-image"
                        onClick={() => window.open(meeting.summaryImage, '_blank')}
                        style={{ cursor: 'pointer', maxWidth: '100%', borderRadius: '8px' }}
                      />
                      {canEditSummary && (
                        <Button 
                          variant="danger" 
                          size="sm"
                          className="position-absolute top-0 end-0 m-2"
                          onClick={handleDeleteSummaryImage}
                          style={{ borderRadius: '50%', width: '30px', height: '30px', padding: '0' }}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }
              return part;
            })}
          </p>
        );
      }
      
      // Regular text line
      return <p key={i}>{line || '\u00A0'}</p>;
    });
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
                <Button variant="primary" size="sm" className="attend-btn me-2">
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
          {/* Left Sidebar - Minutes */}
          <Col lg={3} md={12} className="order-lg-1 order-md-1">
            <div className="minutes-left-sidebar">
              <div className="minutes-sidebar-header">
                <h5 className="mb-0 minutes-sidebar-title">
                  <i className="fas fa-file-contract me-2"></i>
                  BIÊN BẢN
                </h5>
              </div>
              
              <div className="minutes-sidebar-content">
                <MinutesContent meetingId={id} user={user} />
              </div>
            </div>
          </Col>

          {/* Main Content */}
          <Col lg={6} md={12} className="order-lg-2 order-md-2">
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
                {renderSummaryMessages()}
              </div>

              {/* Summary Input for Editors */}
              {canEditSummary && (
                <div className="summary-input-area">
                  <div className="input-container">
                    <div className="d-flex align-items-start">
                      <div className="user-avatar me-3">
                        {user?.avatar ? (
                          <img src={
                            user.avatar.startsWith('/uploads') 
                              ? `${API_BASE_URL.replace('/api', '')}${user.avatar}`
                              : user.avatar
                          } alt="" />
                        ) : (
                          <div className="avatar-placeholder">
                            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow-1">
                        <ReactQuill
                          theme="snow"
                          value={newSummaryText}
                          onChange={setNewSummaryText}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Nhập nội dung tóm tắt mới..."
                          className="summary-rich-editor"
                        />
                        
                        <div className="input-actions mt-2">
                          <div className="attachment-controls">
                            <input
                              type="file"
                              multiple
                              accept="*/*"
                              style={{ display: 'none' }}
                              id="summary-message-file-upload"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleAddSummaryMessage(newSummaryText, e.target.files);
                                  e.target.value = ''; // Reset input
                                }
                              }}
                            />
                            <label htmlFor="summary-message-file-upload" className="attach-btn">
                              <i className="fas fa-paperclip me-1"></i>
                              Đính kèm file
                            </label>
                          </div>
                          
                          <div className="d-flex gap-2">
                          <Button 
                            variant="primary" 
                            size="sm" 
                              onClick={() => handleAddSummaryMessage(newSummaryText)}
                              disabled={(() => {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = newSummaryText;
                                const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                return !textContent.trim();
                              })()}
                          >
                            <i className="fas fa-paper-plane me-1"></i>
                              Gửi tóm tắt
                          </Button>
                        </div>
                              </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section - Modern Layout */}
            <div className="notes-section-modern mt-4">
              {/* Gradient Header */}
              <div className="notes-gradient-header"></div>
              
              {/* Notes Card */}
              <div className="notes-card">
                <div className="notes-card-header">
                  <div className="notes-title-modern">
                    <i className="fas fa-sticky-note me-2"></i>
                    GHI CHÚ CUỘC HỌP
                  </div>
                </div>
                
                <div className="notes-card-body">
                  {/* Input Area */}
                  <div className="notes-input-modern">
                    <div className="input-header">
                      <div className="user-avatar-modern">
                        {user?.avatar ? (
                          <img src={
                            user.avatar.startsWith('/uploads') 
                              ? `${API_BASE_URL.replace('/api', '')}${user.avatar}`
                              : user.avatar
                          } alt="" />
                        ) : (
                          <div className="avatar-placeholder-modern">
                            {user?.fullName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="input-content">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={newNote}
                        onChange={handleNoteTextareaChange}
                        onSelect={handleNoteTextareaSelect}
                        placeholder="Nhập ghi chú tại đây..."
                        className="note-textarea-modern"
                      />
                      
                      {/* Action Buttons */}
                      <div className="note-actions-modern">
                        <div className="action-buttons-left">
                          <button 
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="action-btn emoji-btn"
                            title="Emoji"
                          >
                            <i className="fas fa-smile"></i>
                            <span>Emoji</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setShowGifModal(true)}
                            className="action-btn gif-btn"
                            title="GIF"
                          >
                            <i className="fas fa-video"></i>
                            <span>GIF</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setShowStickerModal(true)}
                            className="action-btn sticker-btn"
                            title="Sticker"
                          >
                            <i className="fas fa-sticky-note"></i>
                            <span>Sticker</span>
                          </button>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="send-btn-modern"
                        >
                          <i className="fas fa-paper-plane me-1"></i>
                          Gửi
                        </button>
                      </div>
                      
                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div className="emoji-picker-modern">
                          {typeof EmojiPicker !== 'undefined' ? (
                            <EmojiPicker
                              onEmojiClick={handleEmojiClick}
                              width={300}
                              height={400}
                              previewConfig={{
                                showPreview: false
                              }}
                            />
                          ) : (
                            <div className="fallback-emoji-picker">
                              {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', 
                                '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                                '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟'].map(emoji => (
                                <button 
                                  key={emoji}
                                  onClick={() => handleEmojiClick({emoji})}
                                  className="fallback-emoji-btn"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              
              {/* Existing Notes */}
              {notes.length > 0 && (
                <div className="notes-list-modern">
                  {notes.map((note, index) => (
                    <div key={note._id || index} className="note-item-modern">
                      <div className="note-header-modern">
                        <div className="note-author-avatar">
                          {note.author?.avatar ? (
                            <img src={
                              note.author.avatar && note.author.avatar.startsWith('/uploads') 
                                ? `${API_BASE_URL.replace('/api', '')}${note.author.avatar}`
                                : note.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(note.author.fullName)}&background=667eea&color=fff&bold=true`
                            } alt="" />
                          ) : (
                            <div className="author-avatar-placeholder">
                              {note.author?.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="note-author-info">
                          <div className="author-name">{note.author?.fullName}</div>
                          <div className="note-time">{new Date(note.createdAt).toLocaleString('vi-VN')}</div>
                        </div>
                        {(note.author?._id === user?._id || user?.role === 'admin') && (
                          <div className="note-actions-menu">
                            <button 
                              className="note-action-btn edit-btn"
                              onClick={() => handleEditNote(note._id, note.text)}
                              title="Chỉnh sửa"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="note-action-btn delete-btn"
                              onClick={() => handleDeleteNote(note._id)}
                              title="Xóa"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="note-content-modern">
                        {editingNoteId === note._id ? (
                          <div className="note-edit-modern">
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              placeholder="Chỉnh sửa ghi chú..."
                              className="edit-textarea-modern"
                            />
                            <div className="edit-actions-modern">
                              <button 
                                className="edit-cancel-btn"
                                onClick={handleCancelEditNote}
                              >
                                Hủy
                              </button>
                              <button 
                                className="edit-save-btn"
                                onClick={() => handleSaveEditNote(note._id)}
                              >
                                Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="note-text-modern">
                            {note.text}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </Col>

          {/* Right Sidebar */}
          <Col lg={3} md={12} className="order-lg-3 order-md-3">
            <div className="meeting-sidebar-compact">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
                fill
              >
                <Tab eventKey="meeting-info" title="Thông tin cuộc họp">
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
                      <h6>Lịch họp sắp tới</h6>
                      {upcomingMeetings.length > 0 ? (
                        <>
                          {upcomingMeetings.map((upcomingMeeting) => (
                            <div 
                              key={upcomingMeeting._id} 
                              className="schedule-item"
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/meetings/${upcomingMeeting._id}`)}
                            >
                              <div className="schedule-time">
                                {new Date(upcomingMeeting.startTime).toLocaleTimeString('vi-VN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} - {new Date(upcomingMeeting.endTime).toLocaleTimeString('vi-VN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div className="schedule-title">{upcomingMeeting.title}</div>
                              <div className="schedule-location">{upcomingMeeting.location}</div>
                            </div>
                          ))}
                          <div className="mt-3">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0"
                              onClick={() => navigate('/meetings')}
                            >
                              Xem tất cả lịch họp →
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-muted small">
                          <i className="fas fa-calendar-check me-2"></i>
                          Không có cuộc họp sắp tới
                        </div>
                      )}
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
                        <div className="overview-item mb-2 d-flex justify-content-between align-items-center">
                          <div>
                          <i className="fas fa-list me-2"></i>
                          <strong>CHƯƠNG TRÌNH</strong>
                        </div>
                          {canEditAgenda && !isEditingAgenda && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={handleEditAgenda}
                              title="Chỉnh sửa chương trình"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          )}
                        </div>
                        
                        {isEditingAgenda ? (
                          // Edit mode
                          <div className="agenda-edit-mode">
                            <ReactQuill
                              theme="snow"
                              value={editAgendaText}
                              onChange={setEditAgendaText}
                              modules={quillModules}
                              formats={quillFormats}
                              placeholder="Nhập chương trình cuộc họp..."
                              className="agenda-rich-editor mb-2"
                            />
                            <div className="agenda-edit-actions">
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={handleCancelEditAgenda}
                              >
                                Hủy
                              </Button>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleSaveAgenda}
                                className="ms-2"
                              >
                                Lưu
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="agenda-content">
                            {meeting.agenda ? (
                              <div 
                                className="agenda-text ql-editor" 
                                dangerouslySetInnerHTML={{ __html: meeting.agenda }}
                              />
                            ) : (
                              <div className="agenda-placeholder text-muted">
                                {canEditAgenda 
                                  ? "Nhấn nút chỉnh sửa để thêm chương trình cuộc họp"
                                  : "Chưa có chương trình được thiết lập"
                                }
                              </div>
                            )}
                          </div>
                        )}
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
                          <div key={attendee.user._id} className="member-item">
                            <div className="d-flex align-items-center">
                              {attendee.user.avatar ? (
                                <img src={
                                  attendee.user.avatar && attendee.user.avatar.startsWith('/uploads') 
                                    ? `${API_BASE_URL.replace('/api', '')}${attendee.user.avatar}`
                                    : attendee.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.user.fullName)}&background=667eea&color=fff&bold=true`
                                } alt="" className="member-avatar me-2" />
                              ) : (
                                <div className="member-avatar-placeholder me-2">
                                  {attendee.user.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                              <div className="flex-grow-1">
                                <div className="member-name">{attendee.user.fullName}</div>
                                <div className="member-role">{attendee.user.role || 'Nhân viên'}</div>
                              </div>
                              {canRemoveAttendees && meeting?.organizer?._id !== attendee.user._id && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="text-danger"
                                  onClick={() => handleRemoveAttendee(attendee.user._id, attendee.user.fullName)}
                                  title={`Loại bỏ ${attendee.user.fullName}`}
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              )}
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
                </Tab>
              </Tabs>
            </div>
          </Col>
        </Row>
      </Container>



      {/* Invite User Modal */}
      <Modal show={showInviteModal} onHide={() => {
        setShowInviteModal(false);
        setSearchUser('');
        setShowUserDropdown(false);
      }}>
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title style={{ fontWeight: '600', color: '#212529', fontSize: '1.25rem' }}>
            Mời thêm người tham gia
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Current attendees info */}
          <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px' }}>
            <small className="text-muted">
              Hiện tại có <strong>{meeting?.attendees?.length || 0}</strong> người được mời tham gia cuộc họp
            </small>
          </div>

          <Form.Group className="position-relative">
            <Form.Label>
              Tìm kiếm người dùng
              <span className="text-danger ms-1">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={searchUser}
              onChange={(e) => {
                const value = e?.target?.value || '';
                setSearchUser(value);
                if (value.trim()) {
                setShowUserDropdown(true);
                } else {
                  setShowUserDropdown(false);
                }
              }}
              onFocus={() => {
                if (searchUser.trim()) {
                  setShowUserDropdown(true);
                }
              }}
              onBlur={() => {
                // Delay hiding to allow click on dropdown items
                setTimeout(() => setShowUserDropdown(false), 200);
              }}
              placeholder="Nhập tên hoặc email người muốn mời (ví dụ: Nguyễn Văn A hoặc email@example.com)..."
              autoComplete="off"
            />
            
            {showUserDropdown && searchUser.trim() && (
              <div 
                className="position-absolute w-100 mt-1 bg-white rounded shadow-sm"
                style={{ 
                  zIndex: 1000, 
                  maxHeight: '250px', 
                  overflowY: 'auto', 
                  border: '1px solid #e9ecef',
                  borderRadius: '8px'
                }}
              >
                <div className="p-2">
                  {loadingUsers ? (
                    <div className="text-center py-3">
                      <Spinner size="sm" className="me-2" />
                      <span className="text-muted">Đang tìm kiếm...</span>
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <>
                      <div className="mb-2 px-2">
                        <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {filteredUsers.length} kết quả
                        </small>
                      </div>
                      {filteredUsers.slice(0, 10).map(user => (
                      <div 
                        key={user._id}
                          className="p-3 user-search-item"
                        onClick={() => handleAddUser(user)}
                        style={{ cursor: 'pointer' }}
                      >
                          <div className="d-flex align-items-center">
                            {user.avatar ? (
                              <img 
                                src={user.avatar.startsWith('/uploads') 
                                  ? `${API_BASE_URL.replace('/api', '')}${user.avatar}`
                                  : user.avatar
                                } 
                                alt="" 
                                className="rounded-circle me-3" 
                                style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                                style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  fontSize: '14px', 
                                  fontWeight: '600',
                                  backgroundColor: '#6c757d'
                                }}
                              >
                                {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                            )}
                            <div className="flex-grow-1">
                              <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>
                                {user.fullName}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                {user.email}
                                {user.department && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span className="badge">{user.department}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#f8f9fa',
                                color: '#6c757d'
                              }}
                            >
                              <i className="fas fa-plus" style={{ fontSize: '12px' }}></i>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredUsers.length > 10 && (
                        <div className="text-center mt-2">
                          <small className="text-muted">
                            Hiển thị 10/{filteredUsers.length} kết quả. Hãy nhập chính xác hơn để thu hẹp kết quả.
                          </small>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <i className="fas fa-search text-muted mb-2" style={{ fontSize: '24px' }}></i>
                      <div className="text-muted">
                        <div>Không tìm thấy người dùng với từ khóa "{searchUser}"</div>
                        <small>Hãy thử với tên đầy đủ hoặc email chính xác</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Form.Group>

          {/* Selected user preview */}
          {searchUser && users.find(u => 
            u.email.toLowerCase() === searchUser.toLowerCase().trim() ||
            u.fullName.toLowerCase() === searchUser.toLowerCase().trim()
          ) && (
            <div className="mt-3 p-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px' }}>
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '32px', height: '32px', backgroundColor: '#28a745', color: 'white' }}
                >
                  <i className="fas fa-check" style={{ fontSize: '14px' }}></i>
                </div>
                <div>
                  <div className="fw-bold text-dark">Sẵn sàng mời</div>
                  <small className="text-muted">
                    {users.find(u => 
                      u.email.toLowerCase() === searchUser.toLowerCase().trim() ||
                      u.fullName.toLowerCase() === searchUser.toLowerCase().trim()
                    )?.fullName}
                  </small>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-2">
          <Button 
            variant="outline-secondary" 
            onClick={() => {
            setShowInviteModal(false);
            setSearchUser('');
            setShowUserDropdown(false);
            }}
            style={{ 
              borderColor: '#e9ecef',
              color: '#6c757d',
              fontWeight: '500'
            }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleInviteUser}
            disabled={!searchUser.trim()}
            style={{
              backgroundColor: '#212529',
              borderColor: '#212529',
              color: 'white',
              fontWeight: '500',
              opacity: !searchUser.trim() ? 0.5 : 1
            }}
          >
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
              onChange={(e) => setSelectedFile(e?.target?.files?.[0] || null)}
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

      {/* GIF Modal */}
      <Modal show={showGifModal} onHide={() => setShowGifModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-video me-2"></i>
            Chọn GIF
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="gif-selection">
            <div className="gif-categories mb-3">
              <h6>Danh mục phổ biến:</h6>
              <div className="d-flex flex-wrap gap-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => insertGif('🎉 [GIF: Celebration] 🎉')}
                >
                  Ăn mừng
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => insertGif('👏 [GIF: Applause] 👏')}
                >
                  Vỗ tay
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => insertGif('💃 [GIF: Dancing] 🕺')}
                >
                  Nhảy múa
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => insertGif('😂 [GIF: Laughing] 😂')}
                >
                  Cười
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => insertGif('🤔 [GIF: Thinking] 🤔')}
                >
                  Suy nghĩ
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => insertGif('✅ [GIF: Success] ✅')}
                >
                  Thành công
                </Button>
              </div>
            </div>
            
            <div className="gif-reactions">
              <h6>Reaction GIFs:</h6>
              <div className="gif-grid">
                <div className="gif-item" onClick={() => insertGif('🔥 [Hot GIF] 🔥')}>
                  <div className="gif-preview">🔥</div>
                  <small>Hot</small>
                </div>
                <div className="gif-item" onClick={() => insertGif('⚡ [Fast GIF] ⚡')}>
                  <div className="gif-preview">⚡</div>
                  <small>Nhanh</small>
                </div>
                <div className="gif-item" onClick={() => insertGif('💯 [Perfect GIF] 💯')}>
                  <div className="gif-preview">💯</div>
                  <small>Hoàn hảo</small>
                </div>
                <div className="gif-item" onClick={() => insertGif('🎯 [Target GIF] 🎯')}>
                  <div className="gif-preview">🎯</div>
                  <small>Chính xác</small>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGifModal(false)}>
            Hủy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sticker Modal */}
      <Modal show={showStickerModal} onHide={() => setShowStickerModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-sticky-note me-2"></i>
            Chọn Sticker
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="sticker-selection">
            <div className="sticker-categories mb-3">
              <h6>Sticker cảm xúc:</h6>
              <div className="sticker-grid">
                <div className="sticker-item" onClick={() => insertSticker('😍 [Love Sticker]')}>
                  <div className="sticker-preview">😍</div>
                  <small>Yêu thích</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('🤩 [Star Eyes Sticker]')}>
                  <div className="sticker-preview">🤩</div>
                  <small>Tuyệt vời</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('😎 [Cool Sticker]')}>
                  <div className="sticker-preview">😎</div>
                  <small>Ngầu</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('🥳 [Party Sticker]')}>
                  <div className="sticker-preview">🥳</div>
                  <small>Tiệc tung</small>
                </div>
              </div>
            </div>
            
            <div className="sticker-categories mb-3">
              <h6>Sticker công việc:</h6>
              <div className="sticker-grid">
                <div className="sticker-item" onClick={() => insertSticker('💼 [Business Sticker]')}>
                  <div className="sticker-preview">💼</div>
                  <small>Công việc</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('📊 [Chart Sticker]')}>
                  <div className="sticker-preview">📊</div>
                  <small>Báo cáo</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('⏰ [Time Sticker]')}>
                  <div className="sticker-preview">⏰</div>
                  <small>Thời gian</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('✨ [Sparkle Sticker]')}>
                  <div className="sticker-preview">✨</div>
                  <small>Xuất sắc</small>
                </div>
              </div>
            </div>
            
            <div className="sticker-categories">
              <h6>Sticker hành động:</h6>
              <div className="sticker-grid">
                <div className="sticker-item" onClick={() => insertSticker('🚀 [Rocket Sticker]')}>
                  <div className="sticker-preview">🚀</div>
                  <small>Khởi động</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('💡 [Idea Sticker]')}>
                  <div className="sticker-preview">💡</div>
                  <small>Ý tưởng</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('🎖️ [Medal Sticker]')}>
                  <div className="sticker-preview">🎖️</div>
                  <small>Thành tích</small>
                </div>
                <div className="sticker-item" onClick={() => insertSticker('🏆 [Trophy Sticker]')}>
                  <div className="sticker-preview">🏆</div>
                  <small>Chiến thắng</small>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStickerModal(false)}>
            Hủy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmState.show}
        onHide={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        icon={confirmState.icon}
      />
    </div>
  );
};

export default MeetingDetail; 