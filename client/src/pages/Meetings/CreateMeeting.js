import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, InputGroup, Dropdown, ButtonGroup, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTimes, FaUsers, FaLock, FaGlobe, FaBuilding, FaVideo, FaMagic, FaCopy, FaChevronDown, FaFolder, FaFolderOpen, FaUser, FaSearch, FaSitemap } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

// Custom CSS for scrollbars
const scrollbarStyle = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    transition: background 0.2s;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.4);
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }
  
  .rotate-180 {
    transform: rotate(180deg);
  }
  
  .transition-transform {
    transition: transform 0.2s ease;
  }
  
  .department-header {
    transition: background-color 0.2s ease;
  }
  
  .mode-switcher-button {
    pointer-events: auto !important;
    position: relative;
    z-index: 10;
  }
  
  .mode-switcher-container {
    pointer-events: auto !important;
  }
  
  .draggable-modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: none !important;
    pointer-events: none;
    z-index: 1050;
  }
  
  .draggable-modal .modal-backdrop,
  .draggable-modal .modal-content::before,
  .draggable-modal .modal-content::after {
    display: none !important;
  }
  
  .draggable-modal .modal-fade {
    background: none !important;
  }
  
  .draggable-modal .modal-dialog {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    max-width: none;
    width: 600px;
    height: auto;
    pointer-events: auto;
  }
  
  .draggable-modal .modal-content {
    position: relative;
    resize: both;
    overflow: auto;
    min-width: 400px;
    min-height: 300px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 40px);
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    border: 1px solid #ddd;
  }
  
  .draggable-modal .modal-header {
    cursor: move;
    user-select: none;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    border-radius: 8px 8px 0 0;
    position: relative;
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 15px;
    border-bottom: 1px solid rgba(255,255,255,0.2);
  }
  
  .draggable-modal .modal-header.secretary-header {
    background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
  }
  
  .draggable-modal .modal-header.dragging {
    background: linear-gradient(135deg, #495057 0%, #343a40 100%) !important;
  }
  
  .draggable-modal.dragging .modal-content {
    box-shadow: 0 15px 35px rgba(0,0,0,0.4);
    z-index: 9999;
  }
  
  .window-controls {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  
  .window-control-btn {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .window-control-btn:hover {
    background-color: rgba(255,255,255,0.2);
  }
  
  .window-control-btn.close:hover {
    background-color: #e81123;
  }
  
  .modal-title-bar {
    display: flex;
    align-items: center;
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }
  
  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    background: linear-gradient(-45deg, transparent 40%, #ccc 40%, #ccc 60%, transparent 60%);
    cursor: se-resize;
    border-top-left-radius: 4px;
  }
  
  .modal-body-custom {
    padding: 0;
    max-height: calc(90vh - 120px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  /* FORCE remove all modal backgrounds - HIGHEST PRIORITY */
  .modal.show .modal-backdrop,
  .modal-backdrop,
  .modal.draggable-modal::before,
  .modal.draggable-modal::after,
  .modal.draggable-modal,
  .fade.modal.show,
  .modal.fade.show {
    background: none !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    opacity: 1 !important;
    display: block !important;
  }
  
  .draggable-modal.show {
    background: transparent !important;
  }
  
  /* Override Bootstrap modal backdrop completely */
  body .modal-backdrop.show {
    opacity: 0 !important;
    visibility: hidden !important;
    display: none !important;
  }
  
  /* Animations and smooth transitions */
  .draggable-modal .modal-dialog {
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  
  .draggable-modal.dragging .modal-dialog {
    transition: none;
  }
  
  /* Ghost effect when dragging */
  .draggable-modal.dragging {
    opacity: 0.95;
  }
  
  /* Prevent text selection during drag */
  .draggable-modal.dragging * {
    user-select: none !important;
  }
  
  /* Enhanced resize handle */
  .resize-handle::after {
    content: '↘';
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 12px;
    color: #999;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarStyle;
  if (!document.head.querySelector('style[data-scrollbar]')) {
    styleElement.setAttribute('data-scrollbar', 'true');
    document.head.appendChild(styleElement);
  }
}

const CreateMeeting = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { success, error } = useNotification();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingLink: '',
    meetingType: 'offline',
    priority: 'medium',
    isPrivate: false,
    attendees: [],
    organizer: null,
    secretary: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  
  // States cho người dùng
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // States cho organizer và secretary search
  const [searchOrganizer, setSearchOrganizer] = useState('');
  const [searchSecretary, setSearchSecretary] = useState('');
  
  // States cho department tree view
  const [organizerViewMode, setOrganizerViewMode] = useState('search'); // 'search' | 'department'
  const [secretaryViewMode, setSecretaryViewMode] = useState('search'); // 'search' | 'department'
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  
  // States cho modal popup
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [showSecretaryModal, setShowSecretaryModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  
  // States cho attendees modal
  const [attendeesViewMode, setAttendeesViewMode] = useState('search'); // 'search' | 'department'
  const [searchAttendees, setSearchAttendees] = useState('');
  
  // States cho window-like modal
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [beforeMaximize, setBeforeMaximize] = useState({ x: 0, y: 0, width: 600, height: 400 });
  const [modalSize, setModalSize] = useState({ width: 600, height: 400 });

  // Debug logs - temporary for testing
  // console.log('CreateMeeting render - organizerViewMode:', organizerViewMode);
  // console.log('CreateMeeting render - secretaryViewMode:', secretaryViewMode);
  
  // States cho phòng họp
  const [availableRooms, setAvailableRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);

  // States cho meeting link generation
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

  // Function để tạo link meeting tự động
  const generateMeetingLink = (platform = 'jitsi') => {
    setGeneratingLink(true);
    
    try {
      // Tạo room name thân thiện và unique
      const sanitizedTitle = formData.title
        ? formData.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
            .replace(/[^a-z0-9\s]/g, '') // Chỉ giữ chữ, số và space
            .replace(/\s+/g, '-') // Thay space thành -
            .slice(0, 30) // Giới hạn độ dài
        : 'meeting';
      
      const timestamp = Date.now().toString().slice(-8); // 8 số cuối của timestamp
      const roomName = `${sanitizedTitle}-${timestamp}`;
      
      let meetingLink = '';
      
      switch (platform) {
        case 'jitsi':
          meetingLink = `https://meet.jit.si/${roomName}`;
          break;
        case 'whereby':
          meetingLink = `https://whereby.com/${roomName}`;
          break;
        case 'meet8x8':
          meetingLink = `https://8x8.vc/${roomName}`;
          break;
        default:
          meetingLink = `https://meet.jit.si/${roomName}`;
      }
      
      setFormData(prev => ({
        ...prev,
        meetingLink: meetingLink
      }));
      
      success(`Đã tạo link ${platform === 'jitsi' ? 'Jitsi Meet' : platform} tự động!`);
    } catch (err) {
      console.error('Error generating meeting link:', err);
      error('Không thể tạo link meeting. Vui lòng thử lại.');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Function để copy meeting link
  const copyMeetingLink = async () => {
    if (formData.meetingLink) {
      try {
        await navigator.clipboard.writeText(formData.meetingLink);
        success('Đã copy link meeting!');
      } catch (err) {
        console.error('Error copying link:', err);
        error('Không thể copy link.');
      }
    }
  };

  // Function để test meeting link (mở trong tab mới)
  const testMeetingLink = () => {
    if (formData.meetingLink) {
      window.open(formData.meetingLink, '_blank');
    }
  };

  // Lấy danh sách người dùng từ hệ thống và set organizer mặc định
  useEffect(() => {
    fetchUsers();
    fetchAllRooms();
    
    // Set current user làm organizer mặc định
    if (user) {
      setFormData(prev => ({
        ...prev,
        organizer: user
      }));
    }
  }, [user]);

  // Handle click outside để đóng dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on mode switcher buttons - don't close dropdown
      if (event.target.closest('.mode-switcher-button') || 
          event.target.closest('.mode-switcher-container')) {
        return;
      }
      
      // Check if click is inside any dropdown container
      if (event.target.closest('.position-relative') ||
          event.target.closest('.dropdown-container') ||
          event.target.closest('.dropdown-parent')) {
        return;
      }
      
      // Click is outside - modals handle their own closing via ESC/buttons
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Lấy tất cả phòng họp
  const fetchAllRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await axios.get(`${API_BASE_URL}/meeting-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching all rooms:', error);
      setAllRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Tìm phòng họp khả dụng khi thay đổi ngày/giờ
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (formData.startTime && formData.endTime) {
        try {
          setLoadingRooms(true);
          const response = await axios.get(`${API_BASE_URL}/meeting-rooms`, {
            params: {
              startTime: formData.startTime,
              endTime: formData.endTime
            },
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const availableRoomsList = response.data.rooms || response.data || [];
          setAvailableRooms(availableRoomsList);
          
          // Kiểm tra nếu phòng đã chọn không còn khả dụng
          if (selectedRoom && !availableRoomsList.some(room => room.name === selectedRoom)) {
            setSelectedRoom(''); // Clear selection nếu phòng không còn khả dụng
            setFormData(prev => ({ ...prev, location: '' })); // Clear location cũ
          }
        } catch (error) {
          console.error('Error fetching available rooms:', error);
          setAvailableRooms([]);
          // Clear selection khi có lỗi
          if (selectedRoom) {
            setSelectedRoom('');
            setFormData(prev => ({ ...prev, location: '' }));
          }
        } finally {
          setLoadingRooms(false);
        }
      } else {
        // Khi chưa có thời gian, không hiển thị phòng nào
        setAvailableRooms([]);
        setSelectedRoom(''); // Clear selection
      }
    };

    fetchAvailableRooms();
  }, [formData.startTime, formData.endTime, token, selectedRoom]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Lọc bỏ current user khỏi danh sách
      const allUsers = response.data.users || [];
      const filteredUsers = allUsers.filter(u => u._id !== user._id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Nếu API không có, dùng demo data
      const demoUsers = [
        { _id: 'demo1', fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', department: 'IT' },
        { _id: 'demo2', fullName: 'Trần Thị B', email: 'tranthib@example.com', department: 'HR' },
        { _id: 'demo3', fullName: 'Lê Văn C', email: 'levanc@example.com', department: 'Sales' },
        { _id: 'demo4', fullName: 'Phạm Thị D', email: 'phamthid@example.com', department: 'Marketing' }
      ];
      setUsers(demoUsers);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    if (!e?.target) return;
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRemoveAttendee = (userId) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a._id !== userId)
    }));
  };

  // Handle organizer selection
  const handleSelectOrganizer = (selectedUser) => {
    setFormData(prev => ({
      ...prev,
      organizer: selectedUser
    }));
    setSearchOrganizer('');
  };

  // Handle secretary selection
  const handleSelectSecretary = (selectedUser) => {
    setFormData(prev => ({
      ...prev,
      secretary: selectedUser
    }));
    setSearchSecretary('');
  };

  // Clear secretary
  const handleClearSecretary = () => {
    setFormData(prev => ({
      ...prev,
      secretary: null
    }));
  };

  // Detect web header height
  const getWebHeaderHeight = () => {
    // Try to find navbar element
    const navbar = document.querySelector('.navbar, [class*="navbar"], .header, [class*="header"]');
    if (navbar) {
      return navbar.offsetHeight;
    }
    // Fallback to common header height
    return 60;
  };

  // Window-like modal functions
  const centerModal = () => {
    const headerHeight = getWebHeaderHeight();
    const availableHeight = window.innerHeight - headerHeight;
    const centerX = (window.innerWidth - modalSize.width) / 2;
    const centerY = headerHeight + (availableHeight - modalSize.height) / 2;
    setModalPosition({ x: centerX, y: Math.max(headerHeight, centerY) });
  };

  const handleShowOrganizerModal = () => {
    setShowOrganizerModal(true);
    setIsMaximized(false);
    centerModal();
  };

  const handleShowSecretaryModal = () => {
    setShowSecretaryModal(true);
    setIsMaximized(false);
    centerModal();
  };

  const handleShowAttendeesModal = () => {
    setShowAttendeesModal(true);
    setIsMaximized(false);
    centerModal();
  };

  const handleMaximize = () => {
    if (isMaximized) {
      // Restore
      setModalPosition({ x: beforeMaximize.x, y: beforeMaximize.y });
      setModalSize({ width: beforeMaximize.width, height: beforeMaximize.height });
      setIsMaximized(false);
    } else {
      // Maximize - account for web header/navbar
      setBeforeMaximize({ 
        x: modalPosition.x, 
        y: modalPosition.y, 
        width: modalSize.width, 
        height: modalSize.height 
      });
      
      // Calculate available space dynamically
      const headerHeight = getWebHeaderHeight();
      const availableHeight = window.innerHeight - headerHeight;
      
      setModalPosition({ x: 0, y: headerHeight });
      setModalSize({ width: window.innerWidth, height: availableHeight });
      setIsMaximized(true);
    }
  };

  const handleDoubleClickHeader = () => {
    handleMaximize();
  };

  const handleMouseDown = (e) => {
    // Only start dragging if clicking on window header, not on buttons
    const windowHeader = e.target.closest('[data-window-header]');
    const isButton = e.target.closest('button');
    
    if (windowHeader && !isButton && !isMaximized) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      
      const startX = e.clientX - modalPosition.x;
      const startY = e.clientY - modalPosition.y;
      
      setDragStart({ x: startX, y: startY });

      // Windows-like cursor and selection prevention
      document.body.style.cursor = 'move';
      document.body.style.userSelect = 'none';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isMaximized) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Allow free movement like Windows Explorer
    // Only constrain to keep some part visible
    const headerHeight = getWebHeaderHeight();
    const minVisible = 100;
    const maxX = window.innerWidth - minVisible;
    const minX = -modalSize.width + minVisible;
    const maxY = window.innerHeight - 40; // Keep title bar accessible
    const minY = headerHeight; // Don't go above web header
    
    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));
    
    setModalPosition({
      x: constrainedX,
      y: constrainedY
    });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Auto-maximize if dragged to top edge (like Windows)
    // Use header height instead of 5px to avoid web header
    const headerHeight = getWebHeaderHeight();
    if (modalPosition.y <= headerHeight + 5 && !isMaximized) {
      handleMaximize();
    }
  };

  // Enhanced event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleMouseMove(e);
      };
      
      const handleGlobalMouseUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleMouseUp();
      };
      
      const preventSelect = (e) => e.preventDefault();
      
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false });
      document.addEventListener('selectstart', preventSelect);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('selectstart', preventSelect);
      };
    }
  }, [isDragging]);



  // Windows-like keyboard shortcuts for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showOrganizerModal || showSecretaryModal || showAttendeesModal) {
        // ESC to close modal (like Windows)
        if (e.key === 'Escape') {
          setShowOrganizerModal(false);
          setShowSecretaryModal(false);
          setShowAttendeesModal(false);
        }
        
        // Alt+F4 to close (Windows style)
        if (e.key === 'F4' && e.altKey) {
          e.preventDefault();
          setShowOrganizerModal(false);
          setShowSecretaryModal(false);
          setShowAttendeesModal(false);
        }
        
        // Windows key + Up Arrow to maximize
        if (e.key === 'ArrowUp' && e.metaKey) {
          e.preventDefault();
          if (!isMaximized) handleMaximize();
        }
        
        // Windows key + Down Arrow to restore/minimize
        if (e.key === 'ArrowDown' && e.metaKey) {
          e.preventDefault();
          if (isMaximized) handleMaximize();
        }
        
        // Ctrl+R to center window
        if (e.key.toLowerCase() === 'r' && e.ctrlKey) {
          e.preventDefault();
          centerModal();
        }
        
        // Arrow keys to move window (with Windows key)
        if (e.key.startsWith('Arrow') && e.metaKey && !isMaximized) {
          e.preventDefault();
          const step = e.shiftKey ? 50 : 20;
          setModalPosition(prev => ({
            x: prev.x + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0),
            y: prev.y + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0)
          }));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showOrganizerModal, showSecretaryModal, showAttendeesModal, isMaximized]);

  // Center modal when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (!isMaximized) {
        centerModal();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMaximized, modalSize]);

  // Enhanced select functions to close modal
  const handleSelectOrganizerFromModal = (selectedUser) => {
    setFormData(prev => ({
      ...prev,
      organizer: selectedUser
    }));
    setSearchOrganizer('');
    setShowOrganizerModal(false);
  };

  const handleSelectSecretaryFromModal = (selectedUser) => {
    setFormData(prev => ({
      ...prev,
      secretary: selectedUser
    }));
    setSearchSecretary('');
    setShowSecretaryModal(false);
  };

  // Enhanced select functions for attendees
  const handleSelectAttendeesFromModal = (selectedUser) => {
    // Check if user is already in attendees
    const isAlreadyAttendee = formData.attendees.find(a => a._id === selectedUser._id);
    
    if (!isAlreadyAttendee) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, selectedUser]
      }));
    }
    // Don't close modal for attendees - allow multiple selection
  };

  // Handle adding entire department
  const handleAddDepartment = (department) => {
    const departmentUsers = usersByDepartment[department] || [];
    const newAttendees = [...formData.attendees];
    let addedCount = 0;
    
    departmentUsers.forEach(user => {
      // Only add if not already in attendees
      const isAlreadyAttendee = newAttendees.find(a => a._id === user._id);
      if (!isAlreadyAttendee) {
        newAttendees.push(user);
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      setFormData(prev => ({
        ...prev,
        attendees: newAttendees
      }));
      
      // Show success notification
      success(`Đã thêm ${addedCount} người từ phòng ban ${department}!`);
    } else {
      // Show info if no new users added
      error(`Tất cả nhân viên trong ${department} đã được mời!`);
    }
  };

  // Department tree functions
  const toggleDepartment = (department) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(department)) {
        newSet.delete(department);
      } else {
        newSet.add(department);
      }
      return newSet;
    });
  };

  // Group users by department
  const usersByDepartment = users.reduce((acc, user) => {
    const dept = user.department || 'Không có phòng ban';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(user);
    return acc;
  }, {});

  // Sort departments alphabetically, but put "Không có phòng ban" last
  const sortedDepartments = Object.keys(usersByDepartment).sort((a, b) => {
    if (a === 'Không có phòng ban') return 1;
    if (b === 'Không có phòng ban') return -1;
    return a.localeCompare(b);
  });

  // Department icon mapping
  const getDepartmentIcon = (department) => {
    const iconMap = {
      'IT': '',
      'HR': '',
      'Sales': '', 
      'Marketing': '',
      'Finance': '',
      'Operations': '',
      'Administration': '',
      'Không có phòng ban': ''
    };
    return iconMap[department] || '';
  };

  // Render user selection modal
  const renderUserSelectionModal = (show, onHide, title, viewMode, setViewMode, searchValue, setSearchValue, onSelectUser, isSecretary = false, isAttendees = false) => {
    const filteredUsers = viewMode === 'search' 
      ? users.filter(user => {
          if (!searchValue.trim()) return true;
          const search = searchValue.toLowerCase();
          return (
            user.fullName.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            (user.department && user.department.toLowerCase().includes(search))
          );
        })
      : [];

    return show ? (
      <div 
        className={`custom-popup-window ${isDragging ? 'dragging' : ''}`}
        style={{
          position: 'fixed',
          top: modalPosition.y,
          left: modalPosition.x,
          width: `${modalSize.width}px`,
          height: `${modalSize.height}px`,
          zIndex: 1050,
          transition: isDragging ? 'none' : 'all 0.2s ease',
          resize: isMaximized ? 'none' : 'both',
          minWidth: isMaximized ? 'none' : '400px',
          minHeight: isMaximized ? 'none' : '300px',
          maxWidth: isMaximized ? 'none' : '90vw',
          maxHeight: isMaximized ? 'none' : '90vh',
          backgroundColor: 'white',
          borderRadius: isMaximized ? '0' : '8px',
          boxShadow: isMaximized ? 'none' : '0 10px 30px rgba(0,0,0,0.3)',
          border: isMaximized ? 'none' : '1px solid #ddd',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Window header */}
        <div 
          data-window-header="true"
          style={{ 
            cursor: isMaximized ? 'pointer' : (isDragging ? 'move' : 'move'),
            height: '40px',
            background: isAttendees 
              ? 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)'
              : isSecretary 
                ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)'
                : 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 15px',
            borderRadius: isMaximized ? '0' : '8px 8px 0 0',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            flexShrink: 0,
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClickHeader}
        >
          {/* Title bar content */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <span className="me-2">
              {isAttendees ? '👥' : isSecretary ? '📝' : '🎯'}
            </span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{title}</span>
            <span 
              style={{ 
                fontSize: '10px', 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                padding: '2px 6px', 
                borderRadius: '4px', 
                marginLeft: '8px' 
              }}
            >
              {viewMode === 'search' ? `${filteredUsers.length}` : `${sortedDepartments.length} pb`}
            </span>
            {isAttendees && formData.attendees.length > 0 && (
              <span 
                style={{ 
                  fontSize: '10px', 
                  background: 'rgba(76, 175, 80, 0.8)', 
                  color: 'white',
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  marginLeft: '8px' 
                }}
              >
                ✓ {formData.attendees.length} đã chọn
              </span>
            )}
          </div>
          
          {/* Window control buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                centerModal();
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              title="Center window"
            >
              📍
            </button>
            <button 
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleMaximize();
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? '🗗' : '🗖'}
            </button>
            <button 
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              onMouseEnter={(e) => e.target.style.background = '#e81123'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Window body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ 
            padding: '8px', 
            borderBottom: '1px solid #ddd', 
            backgroundColor: '#f8f9fa',
            flexShrink: 0 
          }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Button
                variant={viewMode === 'search' ? (isSecretary ? 'success' : 'primary') : 'outline-secondary'}
                size="sm"
                className="flex-fill"
                onClick={() => setViewMode('search')}
              >
                <FaSearch className="me-1" size={10} />
                Tìm kiếm
              </Button>
              <Button
                variant={viewMode === 'department' ? (isSecretary ? 'success' : 'primary') : 'outline-secondary'}
                size="sm"
                className="flex-fill"
                onClick={() => setViewMode('department')}
              >
                <FaSitemap className="me-1" size={10} />
                Phòng ban
              </Button>
            </div>
            
            {viewMode === 'search' && (
              <Form.Control
                type="text"
                placeholder="Tìm kiếm tên, email, phòng ban..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                size="sm"
                autoFocus
              />
            )}
          </div>
          
          {/* Drop zone for attendees */}
          {isAttendees && (
            <div 
              style={{ 
                padding: '12px', 
                borderBottom: '1px solid #ddd', 
                backgroundColor: '#e3f2fd',
                textAlign: 'center',
                fontSize: '12px',
                color: '#1976d2',
                flexShrink: 0
              }}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  if (data.type === 'department') {
                    handleAddDepartment(data.department);
                  }
                } catch (error) {
                  console.error('Drop error:', error);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = '#bbdefb';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
              }}
            >
              📦 <strong>Kéo thả phòng ban vào đây để thêm tất cả nhân viên!</strong>
            </div>
          )}

          {/* Main content area */}
          <div style={{ flex: 1, overflow: 'auto' }} className="custom-scrollbar">
            {loadingUsers ? (
              <div className="text-center py-4">
                <Spinner size="sm" />
                <div className="small mt-2">Đang tải...</div>
              </div>
            ) : viewMode === 'search' ? (
              // Search results
              filteredUsers.length > 0 ? (
                <>
                  {filteredUsers.map(user => (
                    <div 
                      key={user._id}
                      className="p-3 border-bottom"
                      onClick={() => onSelectUser(user)}
                      style={{ 
                        cursor: 'pointer',
                        minHeight: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                        userSelect: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      <div className="fw-bold text-dark d-flex align-items-center">
                        👤 {user.fullName}
                        {formData.organizer && user._id === formData.organizer._id && (
                          <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>Chủ trì</Badge>
                        )}
                        {formData.secretary && user._id === formData.secretary._id && (
                          <Badge bg="success" className="ms-2" style={{ fontSize: '10px' }}>Thư ký</Badge>
                        )}
                      </div>
                      <small className="text-muted ms-3">
                        {user.email} • {user.department || 'N/A'}
                      </small>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-muted text-center py-4">
                  {searchValue ? '🔍 Không tìm thấy kết quả' : '💡 Nhập từ khóa để tìm kiếm'}
                </div>
              )
            ) : (
              // Department tree view
              sortedDepartments.length > 0 ? (
                renderDepartmentTree(onSelectUser, isAttendees)
              ) : (
                <div className="text-muted text-center py-4">
                  📁 Không có phòng ban nào
                </div>
              )
            )}
          </div>
          
          {/* Status bar */}
          <div 
            data-window-header="true"
            style={{ 
              padding: '8px', 
              borderTop: '1px solid #ddd', 
              backgroundColor: '#f8f9fa',
              textAlign: 'center',
              fontSize: '11px',
              color: '#666',
              flexShrink: 0,
              cursor: isMaximized ? 'pointer' : 'move',
              userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClickHeader}
          >
            {isAttendees 
              ? '🖱️ Kéo header/footer để di chuyển • Kéo phòng ban vào drop zone để thêm tất cả • ESC để đóng'
              : '🖱️ Kéo header hoặc footer để di chuyển • Double-click để maximize • Kéo góc để resize'
            }
          </div>
        </div>
        
        {/* Resize handle - only show when not maximized */}
        {!isMaximized && (
          <div 
            className="resize-handle" 
            title="Resize window"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              background: 'linear-gradient(-45deg, transparent 40%, #ccc 40%, #ccc 60%, transparent 60%)',
              cursor: 'se-resize',
              borderTopLeftRadius: '4px'
            }}
          ></div>
        )}
      </div>
    ) : null;
  };

  // Render department tree view
  const renderDepartmentTree = (onSelectUser, allowDepartmentDrag = false) => {
    return (
      <div>
        {sortedDepartments.map(department => {
          const isExpanded = expandedDepartments.has(department);
          const departmentUsers = usersByDepartment[department];
          
          return (
            <div key={department}>
              {/* Department header */}
              <div 
                className="p-2 border-bottom bg-light d-flex align-items-center justify-content-between department-header"
                onClick={() => toggleDepartment(department)}
                style={{ 
                  cursor: allowDepartmentDrag ? 'grab' : 'pointer', 
                  userSelect: 'none',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                
                // Drag & Drop functionality for departments
                draggable={allowDepartmentDrag}
                onDragStart={(e) => {
                  if (allowDepartmentDrag) {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                      type: 'department',
                      department: department,
                      users: departmentUsers
                    }));
                    e.currentTarget.style.opacity = '0.5';
                  }
                }}
                onDragEnd={(e) => {
                  if (allowDepartmentDrag) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                title={allowDepartmentDrag ? `Kéo thả để thêm tất cả ${departmentUsers.length} người từ ${department}` : 'Click để mở/đóng'}
              >
                <div className="d-flex align-items-center">
                  {allowDepartmentDrag && (
                    <span className="me-2 text-muted" style={{ fontSize: '12px' }}>⋮⋮</span>
                  )}
                  {isExpanded ? <FaFolderOpen className="me-2 text-warning" /> : <FaFolder className="me-2 text-secondary" />}
                  <span className="me-2">{getDepartmentIcon(department)}</span>
                  <strong className="small">{department}</strong>
                  <Badge bg="secondary" className="ms-2">{departmentUsers.length}</Badge>
                  {allowDepartmentDrag && (
                    <span className="ms-2 text-muted" style={{ fontSize: '10px' }}>📦</span>
                  )}
                </div>
                <FaChevronDown 
                  className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  style={{ 
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>
              
              {/* Department users */}
              {isExpanded && (
                <div className="bg-white">
                  {departmentUsers.map(user => (
                    <div 
                      key={user._id}
                      className="p-3 border-bottom"
                      onClick={() => onSelectUser(user)}
                      style={{ 
                        cursor: 'pointer',
                        paddingLeft: '2.5rem', // Indent for tree effect
                        minHeight: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                        userSelect: 'none',
                        pointerEvents: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <FaUser className="me-2 text-info" size={12} />
                        <div className="fw-bold text-dark">{user.fullName}</div>
                        {formData.organizer && user._id === formData.organizer._id && (
                          <small className="text-warning ms-2">(Chủ trì hiện tại)</small>
                        )}
                        {formData.secretary && user._id === formData.secretary._id && (
                          <small className="text-success ms-2">(Thư ký hiện tại)</small>
                        )}
                      </div>
                      <small className="text-muted" style={{ paddingLeft: '1rem' }}>
                        {user.email}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };



  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề là bắt buộc';
    if (!formData.startTime) newErrors.startTime = 'Thời gian bắt đầu là bắt buộc';
    if (!formData.endTime) newErrors.endTime = 'Thời gian kết thúc là bắt buộc';
    if (formData.startTime && new Date(formData.startTime) <= new Date()) newErrors.startTime = 'Thời gian bắt đầu phải trong tương lai';
    if (formData.endTime && formData.startTime && new Date(formData.endTime) <= new Date(formData.startTime)) newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';

    // Organizer validation
    if (!formData.organizer) {
      newErrors.organizer = 'Người chủ trì là bắt buộc';
    }

    // Meeting link validation
    if (formData.meetingType !== 'offline' && !formData.meetingLink.trim()) {
      newErrors.meetingLink = 'Link họp bắt buộc cho cuộc họp online/hybrid';
    }
    
    // Location validation - chỉ yêu cầu cho offline và hybrid
    if (formData.meetingType !== 'online' && !selectedRoom && !formData.location.trim()) {
      newErrors.location = 'Địa điểm là bắt buộc cho cuộc họp offline/hybrid';
    }

    if (formData.meetingType === 'offline') {
      // Không cho phép nhập link cho offline
      formData.meetingLink = '';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = { 
        ...formData,
        // Chỉ gửi ID của attendees, organizer và secretary
        attendees: formData.attendees.map(a => a._id),
        organizer: formData.organizer._id,
        secretary: formData.secretary ? formData.secretary._id : null
      };
      
      // Xử lý location: chỉ gửi cho offline/hybrid
      if (formData.meetingType !== 'online') {
        payload.location = selectedRoom || formData.location;
      } else {
        delete payload.location;
      }
      
      // Xử lý meeting link: chỉ gửi cho online/hybrid
      if (payload.meetingType === 'offline' || !payload.meetingLink.trim()) {
        delete payload.meetingLink;
      }

      const res = await axios.post(`${API_BASE_URL}/meetings`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate(`/meetings/${res.data.meeting._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Tạo cuộc họp thất bại';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-meeting-container" style={{ 
      minHeight: '100vh', 
      backgroundColor: '#fafafa',
      padding: '1rem'
    }}>
      <Container style={{ maxWidth: '800px' }}>
        {/* Header gọn gàng */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e5e5'
        }}>
          <Link 
            to="/meetings" 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'white',
              border: '1px solid #e5e5e5',
              textDecoration: 'none',
              color: '#6b7280',
              marginRight: '0.75rem'
            }}
          >
            <FaArrowLeft size={14} />
          </Link>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Tạo cuộc họp mới
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0.125rem 0 0 0'
            }}>
              Lên lịch cuộc họp cho team
            </p>
          </div>
        </div>

        {/* Form Card gọn gàng */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e5e5',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '1.5rem' }}>
            <Form onSubmit={handleSubmit}>
              {serverError && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  {serverError}
                </div>
              )}

              {/* Basic Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  Thông tin cơ bản
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Tiêu đề <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      isInvalid={!!errors.title}
                      placeholder="Nhập tiêu đề cuộc họp"
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    {errors.title && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {errors.title}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Mô tả
                    </label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Mô tả cuộc họp (tùy chọn)"
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Time & Type */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  Thời gian & Loại
                </h3>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Bắt đầu <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Form.Control
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      isInvalid={!!errors.startTime}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    {errors.startTime && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {errors.startTime}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Kết thúc <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Form.Control
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      isInvalid={!!errors.endTime}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    {errors.endTime && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {errors.endTime}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Loại
                    </label>
                    <Form.Select 
                      name="meetingType" 
                      value={formData.meetingType} 
                      onChange={(e) => {
                        const newType = e?.target?.value;
                        handleChange(e);
                        
                        if (newType === 'offline') {
                          setFormData(prev => ({...prev, meetingLink: ''}));
                        } else if (newType === 'online') {
                          setFormData(prev => ({...prev, location: ''}));
                          setSelectedRoom('');
                          if (!formData.meetingLink) {
                            setTimeout(() => generateMeetingLink(), 100);
                          }
                        } else if (newType === 'hybrid' && !formData.meetingLink) {
                          setTimeout(() => generateMeetingLink(), 100);
                        }
                      }}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="offline">🏢 Offline</option>
                      <option value="online">💻 Online</option>
                      <option value="hybrid">🔄 Hybrid</option>
                    </Form.Select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Ưu tiên
                    </label>
                    <Form.Select 
                      name="priority" 
                      value={formData.priority} 
                      onChange={handleChange}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="low">🟢 Thấp</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="high">🟠 Cao</option>
                      <option value="urgent">🔴 Khẩn cấp</option>
                    </Form.Select>
                  </div>
                </div>
              </div>

              {/* Location/Link */}
              {(formData.meetingType !== 'online' || formData.meetingType !== 'offline') && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    {formData.meetingType === 'offline' ? 'Địa điểm' : 
                     formData.meetingType === 'online' ? 'Link meeting' : 'Địa điểm & Link'}
                  </h3>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Location */}
                    {formData.meetingType !== 'online' && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Địa điểm
                          {formData.startTime && formData.endTime && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: '400',
                              color: '#10b981',
                              marginLeft: '0.5rem'
                            }}>
                              ⚡ Đã lọc theo thời gian
                            </span>
                          )}
                        </label>
                        
                        {loadingRooms ? (
                          <div style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            marginBottom: '0.75rem'
                          }}>
                            🔄 Đang tìm phòng khả dụng...
                          </div>
                        ) : !formData.startTime || !formData.endTime ? (
                          <div style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            border: '2px dashed #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: '#f9fafb',
                            marginBottom: '0.75rem'
                          }}>
                            📅 Vui lòng chọn thời gian trước để xem phòng khả dụng
                          </div>
                        ) : availableRooms.length > 0 ? (
                          <Form.Select 
                            value={selectedRoom}
                            onChange={(e) => setSelectedRoom(e?.target?.value || '')}
                            style={{
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '0.75rem',
                              fontSize: '0.875rem',
                              marginBottom: '0.75rem'
                            }}
                          >
                            <option value="">Chọn phòng họp khả dụng ({availableRooms.length} phòng)</option>
                            {availableRooms.map(room => (
                              <option key={room._id} value={room.name}>
                                {room.name} - {room.capacity} người
                                {room.location?.floor && ` (Tầng ${room.location.floor})`}
                              </option>
                            ))}
                          </Form.Select>
                        ) : (
                          <div style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            backgroundColor: '#fef2f2',
                            marginBottom: '0.75rem'
                          }}>
                            ❌ Không có phòng nào khả dụng trong thời gian này
                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#7f1d1d' }}>
                              Vui lòng chọn thời gian khác hoặc nhập địa điểm thủ công
                            </div>
                          </div>
                        )}
                        
                        {!selectedRoom && (
                          <Form.Control
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Nhập địa điểm cuộc họp"
                            isInvalid={!!errors.location}
                            style={{
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '0.75rem',
                              fontSize: '0.875rem'
                            }}
                          />
                        )}
                        
                        {errors.location && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {errors.location}
                          </div>
                        )}

                        {selectedRoom && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            marginTop: '0.5rem'
                          }}>
                            ✓ {selectedRoom}
                            <button
                              type="button"
                              onClick={() => setSelectedRoom('')}
                              style={{
                                marginLeft: '0.5rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'inherit'
                              }}
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meeting Link */}
                    {formData.meetingType !== 'offline' && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Link meeting <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Form.Control
                            type="url"
                            name="meetingLink"
                            value={formData.meetingLink}
                            onChange={handleChange}
                            isInvalid={!!errors.meetingLink}
                            placeholder="Nhập link meeting"
                            style={{
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '0.75rem',
                              fontSize: '0.875rem',
                              flex: 1
                            }}
                          />
                          
                          <button
                            type="button"
                            onClick={() => generateMeetingLink('jitsi')}
                            disabled={generatingLink}
                            style={{
                              padding: '0.75rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              minWidth: '44px'
                            }}
                            title="Tạo link tự động"
                          >
                            {generatingLink ? <Spinner size="sm" /> : <FaMagic size={16} />}
                          </button>
                        </div>
                        
                        {errors.meetingLink && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {errors.meetingLink}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* People */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  Người tham gia
                </h3>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Organizer */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Người chủ trì <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    
                    {formData.organizer ? (
                      <div style={{
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#111827' }}>
                              {formData.organizer.fullName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {formData.organizer.email}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleShowOrganizerModal}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Thay đổi
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleShowOrganizerModal}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px dashed #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}
                      >
                        <FaUsers size={16} />
                        Chọn người chủ trì
                      </button>
                    )}
                    
                    {errors.organizer && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {errors.organizer}
                      </div>
                    )}
                  </div>

                  {/* Secretary */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Thư ký <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>(Tùy chọn)</span>
                    </label>
                    
                    {formData.secretary ? (
                      <div style={{
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#111827' }}>
                              {formData.secretary.fullName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {formData.secretary.email}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              type="button"
                              onClick={handleShowSecretaryModal}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Thay đổi
                            </button>
                            <button
                              type="button"
                              onClick={handleClearSecretary}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: '#fee2e2',
                                border: '1px solid #fecaca',
                                borderRadius: '4px',
                                color: '#dc2626',
                                cursor: 'pointer'
                              }}
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleShowSecretaryModal}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px dashed #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}
                      >
                        <FaUsers size={16} />
                        Chọn thư ký
                      </button>
                    )}
                  </div>
                </div>

                {/* Attendees */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Người tham gia khác
                  </label>
                  
                  <button
                    type="button"
                    onClick={handleShowAttendeesModal}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px dashed #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <FaUsers size={16} />
                    Chọn người tham gia
                    {formData.attendees.length > 0 && (
                      <span style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem'
                      }}>
                        {formData.attendees.length}
                      </span>
                    )}
                  </button>

                  {/* Attendees List */}
                  {formData.attendees.length > 0 && (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: '#f9fafb',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      padding: '0.75rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                          {formData.attendees.length} người đã chọn
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, attendees: [] }))}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            color: '#dc2626',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {formData.attendees.map(attendee => (
                          <span
                            key={attendee._id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          >
                            {attendee.fullName}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttendee(attendee._id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'inherit',
                                padding: '0'
                              }}
                            >
                              <FaTimes size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings & Submit */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                {/* Privacy Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {formData.isPrivate ? <FaLock size={16} /> : <FaGlobe size={16} />}
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {formData.isPrivate ? 'Cuộc họp riêng tư' : 'Cuộc họp công khai'}
                    </span>
                  </div>
                  <Form.Check 
                    type="switch"
                    id="private-switch"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleChange}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading && <Spinner size="sm" />}
                  {loading ? 'Đang tạo cuộc họp...' : 'Tạo cuộc họp'}
                </button>
              </div>
            </Form>
          </div>
        </div>
        
        {/* Popup Modals - giữ nguyên */}
        {renderUserSelectionModal(
          showOrganizerModal,
          () => setShowOrganizerModal(false),
          'Chọn người chủ trì',
          organizerViewMode,
          setOrganizerViewMode,
          searchOrganizer,
          setSearchOrganizer,
          handleSelectOrganizerFromModal,
          false
        )}
        
        {renderUserSelectionModal(
          showSecretaryModal,
          () => setShowSecretaryModal(false),
          'Chọn thư ký',
          secretaryViewMode,
          setSecretaryViewMode,
          searchSecretary,
          setSearchSecretary,
          handleSelectSecretaryFromModal,
          true
        )}
        
        {renderUserSelectionModal(
          showAttendeesModal,
          () => setShowAttendeesModal(false),
          'Chọn người tham gia',
          attendeesViewMode,
          setAttendeesViewMode,
          searchAttendees,
          setSearchAttendees,
          handleSelectAttendeesFromModal,
          false,
          true
        )}
      </Container>
    </div>
  );
};

export default CreateMeeting; 