// routes/pickup-routes.js
const express = require('express');
const Pickup = require('../models/pickup');
const Book = require('../models/book');
const User = require('../models/user');
const Notification = require('../models/notification');
const emailService = require('../utils/emailService');

const router = express.Router();

// ===============================
// 🚚 POST /api/pickup-request - Enhanced pickup with validation and tracking
// ===============================
router.post('/', async (req, res) => {
  const { 
    userName, 
    bookTitle, 
    email, 
    mobile,
    pickupAddress, 
    pickupType,
    preferredDate,
    preferredTime,
    specialInstructions,
    bookId,
    notificationPreferences
  } = req.body;

  console.log('📦 Pickup request received:', { userName, bookTitle, email, mobile });

  // Enhanced validation
  const errors = {};
  
  if (!userName || userName.trim().length < 2) {
    errors.userName = 'Name must be at least 2 characters long';
  } else if (!/^[A-Za-z\s.-]{2,50}$/.test(userName.trim())) {
    errors.userName = 'Name must contain only letters, spaces, dots, and hyphens (2-50 characters)';
  }
  
  if (!bookTitle || bookTitle.trim().length === 0) {
    errors.bookTitle = 'Book title is required';
  }
  
  if (!email || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!mobile || !/^[+]?[0-9]{10,15}$/.test(mobile.replace(/\s/g, ''))) {
    errors.mobile = 'Please enter a valid mobile number (10-15 digits)';
  }
  
  if (!pickupAddress || pickupAddress.trim().length < 10) {
    errors.pickupAddress = 'Address must be at least 10 characters long';
  }
  
  if (!pickupType || !['single', 'multiple', 'donation', 'swap'].includes(pickupType)) {
    errors.pickupType = 'Please select a valid pickup type';
  }
  
  if (!preferredDate || new Date(preferredDate) < new Date().setHours(0, 0, 0, 0)) {
    errors.preferredDate = 'Pickup date cannot be in the past';
  }
  
  if (!preferredTime || !['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'].includes(preferredTime)) {
    errors.preferredTime = 'Please select a valid time slot';
  }

  if (Object.keys(errors).length > 0) {
    console.log('❌ Validation errors:', errors);
    return res.status(400).json({ 
      success: false, 
      message: 'Validation errors',
      errors 
    });
  }

  try {
    const userId = req.session.user?.id;
    
    // Find the book being requested
    let book = null;
    if (bookId) {
      book = await Book.findById(bookId).populate('userId');
    }
    
    const newPickup = new Pickup({
      name: userName.trim(),
      book: bookTitle.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      address: pickupAddress.trim(),
      pickupType,
      preferredDate: new Date(preferredDate),
      preferredTime,
      specialInstructions: specialInstructions?.trim() || '',
      bookId: bookId || null,
      requesterId: userId || null,
      bookOwnerId: book?.userId?._id || null,
      notificationPreferences: notificationPreferences || {
        sms: true,
        email: true,
        push: true
      },
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        notes: 'Pickup request submitted',
        updatedBy: 'requester'
      }]
    });

    await newPickup.save();
    
    // Create notification for book owner if book is found
    if (book && book.userId) {
      const notification = new Notification({
        userId: book.userId._id,
        type: 'pickup-request',
        title: 'New Pickup Request',
        message: `${userName} has requested to pick up your book "${bookTitle}"`,
        relatedId: newPickup._id,
        relatedModel: 'Pickup',
        priority: 'high'
      });
      await notification.save();
      
      // Send email notification to book owner
      if (book.userId.email) {
        try {
          await emailService.sendPickupNotification(book.userId, {
            name: userName,
            email: email,
            address: pickupAddress
          }, bookTitle);
        } catch (emailErr) {
          console.log('⚠️ Email notification failed:', emailErr.message);
        }
      }
    }
    
    console.log(`✅ Pickup request submitted: ${newPickup.trackingId} for "${bookTitle}" by ${userName}`);
    
    return res.status(200).json({ 
      success: true,
      message: '✅ Pickup request submitted successfully!',
      trackingId: newPickup.trackingId,
      estimatedTime: '24-48 hours',
      pickup: {
        id: newPickup._id,
        trackingId: newPickup.trackingId,
        status: newPickup.status,
        preferredDate: newPickup.preferredDate,
        preferredTime: newPickup.preferredTime
      }
    });
  } catch (err) {
    console.error('❌ Error submitting pickup:', err.message);
    console.error('❌ Full error:', err);
    
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in err.errors) {
        validationErrors[field] = err.errors[field].message;
      }
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error processing pickup request',
      error: err.message 
    });
  }
});

// ===============================
// 🔍 GET /api/pickup-track/:trackingId - Track pickup status
// ===============================
router.get('/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    if (!trackingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tracking ID is required' 
      });
    }
    
    const pickup = await Pickup.findOne({ trackingId })
      .populate('bookId', 'title author image')
      .populate('requesterId', 'username email')
      .populate('bookOwnerId', 'username email location');
    
    if (!pickup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pickup request not found' 
      });
    }
    
    // Calculate estimated delivery time based on status
    let estimatedDelivery = '';
    switch (pickup.status) {
      case 'pending':
        estimatedDelivery = 'Waiting for confirmation (24-48 hours)';
        break;
      case 'confirmed':
        estimatedDelivery = 'Pickup scheduled';
        break;
      case 'in-transit':
        estimatedDelivery = 'In transit (2-4 hours)';
        break;
      case 'delivered':
        estimatedDelivery = 'Delivered';
        break;
      default:
        estimatedDelivery = 'Status update pending';
    }
    
    res.json({ 
      success: true, 
      pickup: {
        trackingId: pickup.trackingId,
        status: pickup.status,
        bookTitle: pickup.book,
        requesterName: pickup.name,
        preferredDate: pickup.preferredDate,
        preferredTime: pickup.preferredTime,
        address: pickup.address,
        specialInstructions: pickup.specialInstructions,
        statusHistory: pickup.statusHistory,
        estimatedDelivery,
        book: pickup.bookId,
        createdAt: pickup.createdAt
      }
    });
  } catch (err) {
    console.error('❌ Error tracking pickup:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error tracking pickup',
      error: err.message 
    });
  }
});

// ===============================
// 🔄 PUT /api/pickup/:id/status - Update pickup status
// ===============================
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to update pickup status.' });
    }
    
    const validStatuses = ['pending', 'confirmed', 'in-transit', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }
    
    const pickup = await Pickup.findById(id)
      .populate('requesterId', 'username email')
      .populate('bookOwnerId', 'username email');
    
    if (!pickup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pickup request not found' 
      });
    }
    
    // Check if user has permission to update (book owner or admin)
    if (pickup.bookOwnerId && pickup.bookOwnerId._id.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this pickup request' 
      });
    }
    
    // Update the pickup status using the model method
    await pickup.updateStatus(status, notes, req.session.user.username || 'user');
    
    console.log(`📦 Pickup ${pickup.trackingId} status updated to: ${status}`);
    
    res.json({ 
      success: true, 
      message: 'Pickup status updated successfully',
      pickup: {
        id: pickup._id,
        trackingId: pickup.trackingId,
        status: pickup.status,
        statusHistory: pickup.statusHistory
      }
    });
  } catch (err) {
    console.error('❌ Error updating pickup status:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating pickup status',
      error: err.message 
    });
  }
});

module.exports = router;
