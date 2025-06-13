const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề cuộc họp là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
  },
  startTime: {
    type: Date,
    required: [true, 'Thời gian bắt đầu là bắt buộc']
  },
  endTime: {
    type: Date,
    required: [true, 'Thời gian kết thúc là bắt buộc']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Địa điểm không được vượt quá 200 ký tự']
  },
  meetingLink: {
    type: String,
    trim: true,
    match: [/^https?:\/\//, 'Link cuộc họp phải là URL hợp lệ']
  },
  meetingType: {
    type: String,
    enum: ['offline', 'online', 'hybrid'],
    default: 'offline'
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người tổ chức là bắt buộc']
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'tentative', 'attended'],
      default: 'invited'
    },
    responseDate: {
      type: Date
    },
    note: {
      type: String,
      maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
    }
  }],
  agenda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agenda'
  },
  minutes: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Minutes'
  },
  attachments: [{
    name: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    interval: {
      type: Number,
      min: 1,
      default: 1
    },
    endDate: {
      type: Date
    },
    parentMeeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting'
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification'],
      required: true
    },
    timing: {
      type: Number, // phút trước cuộc họp
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag không được vượt quá 50 ký tự']
  }],
  department: {
    type: String,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index để tối ưu hóa truy vấn
meetingSchema.index({ startTime: 1 });
meetingSchema.index({ organizer: 1 });
meetingSchema.index({ 'attendees.user': 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ department: 1 });
meetingSchema.index({ tags: 1 });

// Virtual cho duration (thời lượng cuộc họp tính bằng phút)
meetingSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return 0;
});

// Virtual để kiểm tra cuộc họp có đang diễn ra không
meetingSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now;
});

// Virtual để kiểm tra cuộc họp đã qua chưa
meetingSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Virtual để kiểm tra cuộc họp sắp tới
meetingSchema.virtual('isUpcoming').get(function() {
  return this.startTime > new Date();
});

// Middleware để validate thời gian
meetingSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('Thời gian kết thúc phải sau thời gian bắt đầu'));
  }
  next();
});

// Static method để tìm cuộc họp theo organizer
meetingSchema.statics.findByOrganizer = function(organizerId) {
  return this.find({ organizer: organizerId }).populate('organizer attendees.user');
};

// Static method để tìm cuộc họp theo attendee
meetingSchema.statics.findByAttendee = function(userId) {
  return this.find({ 'attendees.user': userId }).populate('organizer attendees.user');
};

// Static method để tìm cuộc họp trong khoảng thời gian
meetingSchema.statics.findInDateRange = function(startDate, endDate) {
  return this.find({
    $or: [
      { startTime: { $gte: startDate, $lte: endDate } },
      { endTime: { $gte: startDate, $lte: endDate } },
      { startTime: { $lte: startDate }, endTime: { $gte: endDate } }
    ]
  });
};

// Method để thêm attendee
meetingSchema.methods.addAttendee = function(userId, note = '') {
  const existingAttendee = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (!existingAttendee) {
    this.attendees.push({
      user: userId,
      note: note,
      status: 'invited'
    });
  }
  
  return this.save();
};

// Method để cập nhật trạng thái attendee
meetingSchema.methods.updateAttendeeStatus = function(userId, status) {
  const attendee = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (attendee) {
    attendee.status = status;
    attendee.responseDate = new Date();
    return this.save();
  }
  
  throw new Error('Người dùng không có trong danh sách tham gia');
};

// Add pagination plugin
meetingSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Meeting', meetingSchema); 