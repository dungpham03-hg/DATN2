import React, { useState, useEffect } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './WeeklyCalendar.css';

const WeeklyCalendar = ({ meetings = [], currentWeek = new Date() }) => {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  // Lấy thứ 2 của tuần hiện tại
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  // Tạo array 7 ngày từ thứ 2 đến CN
  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const daysOfWeek = getDaysOfWeek();

  // Get all meetings trong tuần hiện tại - khai báo sớm để tránh lỗi reference
  const weekMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.startTime);
    const startOfWeek = new Date(weekStart);
    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // End of day
    
    return meetingDate >= startOfWeek && meetingDate <= endOfWeek;
  });

  // Update calendar when meetings or week changes
  useEffect(() => {
    // Calendar auto-updates when meetings data changes
  }, [meetings, weekStart, weekMeetings.length]);

  // Các khung giờ trong ngày - không có khoảng trưa
  const timeSlots = [
    { label: 'Sáng', times: ['7h00 - 8h00', '8h00 - 9h00', '9h00 - 10h00', '10h00 - 11h00', '11h00 - 12h00'] },
    { label: 'Chiều', times: ['13h00 - 14h00', '14h00 - 15h00', '15h00 - 16h00', '16h00 - 17h00', '17h00 - 18h00'] },
    { label: 'Tối', times: ['18h00 - 19h00', '19h00 - 20h00', '20h00 - 21h00', '21h00 - 22h00'] }
  ];

  // Parse time slot thành start hour và end hour
  const parseTimeSlot = (timeStr) => {
    const [startTime, endTime] = timeStr.split(' - ');
    return {
      start: parseInt(startTime.replace('h', '')),
      end: parseInt(endTime.replace('h', ''))
    };
  };

  // Tính position và size của meeting trong calendar (skip khoảng 12h-13h)
  const getMeetingPosition = (meeting, day) => {
    const meetingStart = new Date(meeting.startTime);
    const meetingEnd = new Date(meeting.endTime);
    
    // Kiểm tra meeting có trong ngày này không
    const meetingDay = new Date(meetingStart.getFullYear(), meetingStart.getMonth(), meetingStart.getDate());
    const calendarDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    if (meetingDay.getTime() !== calendarDay.getTime()) return null;
    
    // Tính toán vị trí theo thời gian
    const startHour = meetingStart.getHours();
    const startMinute = meetingStart.getMinutes();
    const endHour = meetingEnd.getHours();
    const endMinute = meetingEnd.getMinutes();
    
    // Nếu meeting ngoài khung giờ calendar (7h-22h), skip
    if (startHour < 7 || startHour > 22) return null;
    
    // Skip meetings trong khoảng 12h-13h
    if (startHour === 12 || (startHour === 11 && startMinute > 0 && endHour >= 13)) {
      return null; // Không hiển thị meetings trong khoảng trưa
    }
    
    // Tính position, adjust cho việc không có khoảng 12h-13h
    let adjustedTop = 0;
    
    if (startHour <= 11) {
      // Meeting trong buổi sáng (7h-12h)
      adjustedTop = (startHour - 7) * 60 + startMinute;
    } else if (startHour >= 13) {
      // Meeting trong buổi chiều/tối (13h-22h), skip 1 giờ (12h-13h)
      adjustedTop = (startHour - 7 - 1) * 60 + startMinute; // -1 để bỏ khoảng 12h-13h
    }
    
    // Tính duration
    let duration = (endHour - startHour) * 60 + (endMinute - startMinute);
    
    return {
      top: adjustedTop,
      height: Math.max(duration, 30), // Minimum height 30px
      startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
      endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
      duration: duration
    };
  };

  // Lấy meetings cho một ngày cụ thể với position info
  const getMeetingsForDay = (day) => {
    return meetings
      .map(meeting => {
        const position = getMeetingPosition(meeting, day);
        return position ? { ...meeting, position } : null;
      })
      .filter(Boolean);
  };

  // Navigation tuần
  const goToPreviousWeek = () => {
    const newWeek = new Date(weekStart);
    newWeek.setDate(weekStart.getDate() - 7);
    setWeekStart(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(weekStart);
    newWeek.setDate(weekStart.getDate() + 7);
    setWeekStart(newWeek);
  };

  const goToCurrentWeek = () => {
    setWeekStart(getMonday(new Date()));
  };

  const dayNames = ['Thứ Hai', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };



  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#17a2b8',
      ongoing: '#007bff', 
      completed: '#28a745',
      cancelled: '#dc3545',
      postponed: '#ffc107'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="weekly-calendar">


      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-navigation">
          <Button variant="outline-secondary" size="sm" onClick={goToPreviousWeek}>
            ← 
          </Button>
          <h5 className="week-title">
            {formatDate(daysOfWeek[0])} - {formatDate(daysOfWeek[6])}
          </h5>
          <Button variant="outline-secondary" size="sm" onClick={goToNextWeek}>
             →
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" size="sm" onClick={goToCurrentWeek}>
            Tuần hiện tại
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid" style={{ 
        border: '1px solid #dee2e6', 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        {/* Header Row */}
        <div className="calendar-row header-row" style={{ 
          display: 'flex', 
          backgroundColor: '#f8f9fa', 
          borderBottom: '2px solid #dee2e6',
          padding: '12px 0'
        }}>
          <div className="session-column header-cell" style={{ 
            width: '80px', 
            borderRight: '1px solid #dee2e6', 
            textAlign: 'center', 
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#495057'
          }}>
            Buổi
          </div>
          <div className="time-column header-cell" style={{ 
            width: '120px', 
            borderRight: '1px solid #dee2e6', 
            textAlign: 'center', 
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#495057'
          }}>
            Thời gian
          </div>
          {dayNames.map((dayName, index) => (
            <div key={dayName} className="day-column header-cell" style={{ 
              flex: 1, 
              textAlign: 'center', 
              borderRight: index < 6 ? '1px solid #dee2e6' : 'none',
              padding: '0 8px'
            }}>
              <div className="day-name" style={{ 
                fontWeight: 'bold', 
                fontSize: '14px', 
                color: '#495057',
                marginBottom: '4px'
              }}>
                {dayName}
              </div>
              <div className="day-date" style={{ 
                fontSize: '12px', 
                color: '#6c757d' 
              }}>
                {formatDate(daysOfWeek[index])}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Content - Time Grid */}
        <div className="calendar-content" style={{ position: 'relative', display: 'flex' }}>
          {/* Session Column - Buổi */}
          <div className="session-labels-column" style={{ width: '80px', borderRight: '2px solid #dee2e6' }}>
            {timeSlots.map((session, index) => {
              const sessionHeight = session.times.length * 60; // Tính chiều cao theo số time slots
              return (
                <div 
                  key={session.label} 
                  style={{ 
                    height: `${sessionHeight}px`, 
                    borderBottom: index < timeSlots.length - 1 ? '2px solid #dee2e6' : 'none',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 'bold', 
                    fontSize: '14px', 
                    color: '#495057',
                    backgroundColor: '#f8f9fa',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: 'inset 1px 0 0 rgba(0,0,0,0.05)'
                  }}
                >
                  {session.label}
                </div>
              );
            })}
          </div>

          {/* Time Column - Thời gian */}
          <div className="time-labels-column" style={{ width: '120px', borderRight: '2px solid #dee2e6' }}>
            {timeSlots.map((session) => 
              session.times.map((timeSlot, timeIndex) => (
                <div 
                  key={timeSlot} 
                  style={{ 
                    height: '60px', 
                    borderBottom: '1px solid #e9ecef', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '10px', 
                    color: '#495057',
                    padding: '8px 4px',
                    backgroundColor: timeIndex % 2 === 0 ? '#fafafa' : 'white',
                    fontWeight: '500'
                  }}
                >
                  {timeSlot}
                </div>
              ))
            )}
          </div>

          {/* Day Columns với Positioned Meetings */}
          {daysOfWeek.map((day, dayIndex) => {
            const dayMeetings = getMeetingsForDay(day);
            
            return (
              <div 
                key={day.toDateString()}
                className="day-column-positioned" 
                style={{ 
                  flex: 1, 
                  position: 'relative', 
                  borderRight: dayIndex < 6 ? '1px solid #dee2e6' : 'none',
                  minHeight: `${timeSlots.reduce((acc, session) => acc + session.times.length, 0) * 60}px`
                }}
              >
                {/* Background Grid Lines */}
                {timeSlots.map((session) => 
                  session.times.map((timeSlot) => (
                    <div 
                      key={timeSlot}
                      style={{ 
                        height: '60px', 
                        borderBottom: '1px solid #e9ecef',
                        position: 'relative'
                      }}
                    />
                  ))
                )}

                {/* Positioned Meetings */}
                {dayMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="positioned-meeting"
                    style={{
                      position: 'absolute',
                      top: `${meeting.position.top}px`,
                      left: '2px',
                      right: '2px',
                      height: `${meeting.position.height}px`,
                      backgroundColor: getStatusColor(meeting.status),
                      borderRadius: '4px',
                      padding: '4px 6px',
                      zIndex: 2,
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      overflow: 'hidden'
                    }}
                  >
                    <Link 
                      to={`/meetings/${meeting._id}`} 
                      style={{ 
                        color: 'white', 
                        textDecoration: 'none',
                        display: 'block',
                        height: '100%'
                      }}
                    >
                      <div style={{ 
                        fontSize: '10px', 
                        fontWeight: 'bold', 
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {meeting.title}
                      </div>
                      <div style={{ 
                        fontSize: '9px', 
                        opacity: 0.9,
                        marginBottom: '1px'
                      }}>
                        {meeting.position.startTime} - {meeting.position.endTime}
                      </div>
                      {meeting.location && meeting.position.height > 40 && (
                        <div style={{ 
                          fontSize: '9px', 
                          opacity: 0.8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          📍 {meeting.location}
                        </div>
                      )}
                    </Link>
                  </div>
                ))}


              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar; 