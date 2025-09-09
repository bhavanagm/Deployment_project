// Test Pickup Creation Script
require('dotenv').config();

const mongoose = require('mongoose');
const Pickup = require('../models/pickup');
const Book = require('../models/book');
const User = require('../models/user');

async function createTestPickups() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/donatebooks");
    console.log('✅ Connected to MongoDB');

    // Find a test book and user
    const book = await Book.findOne();
    const user = await User.findOne();
    
    if (!book || !user) {
      console.log('❌ Need at least one book and one user in database');
      return;
    }

    console.log(`📚 Using book: "${book.title}" by ${book.author}`);
    console.log(`👤 Using user: ${user.username}`);

    // Create test pickup requests with different statuses
    const testPickups = [
      {
        name: 'John Doe',
        book: book.title,
        email: 'john.doe@example.com',
        mobile: '+1234567890',
        address: '123 Main Street, New York, NY 10001',
        pickupType: 'single',
        preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        preferredTime: '09:00-12:00',
        specialInstructions: 'Please ring doorbell twice',
        bookId: book._id,
        requesterId: user._id,
        bookOwnerId: user._id,
        status: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          notes: 'Pickup request submitted',
          updatedBy: 'requester'
        }]
      },
      {
        name: 'Jane Smith',
        book: 'Test Book 2\nAnother Test Book\nThird Book',
        email: 'jane.smith@example.com',
        mobile: '+1987654321',
        address: '456 Oak Avenue, Los Angeles, CA 90210',
        pickupType: 'multiple',
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        preferredTime: '15:00-18:00',
        specialInstructions: 'Call before arriving',
        status: 'confirmed',
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            notes: 'Pickup request submitted',
            updatedBy: 'requester'
          },
          {
            status: 'confirmed',
            timestamp: new Date(),
            notes: 'Pickup confirmed by book owner',
            updatedBy: 'owner'
          }
        ]
      },
      {
        name: 'Bob Wilson',
        book: 'Test Book 3',
        email: 'bob.wilson@example.com',
        mobile: '+1555123456',
        address: '789 Pine Street, Chicago, IL 60601',
        pickupType: 'donation',
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        preferredTime: '12:00-15:00',
        status: 'in-transit',
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            notes: 'Pickup request submitted',
            updatedBy: 'requester'
          },
          {
            status: 'confirmed',
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            notes: 'Pickup confirmed',
            updatedBy: 'owner'
          },
          {
            status: 'in-transit',
            timestamp: new Date(),
            notes: 'Pickup team dispatched',
            updatedBy: 'system'
          }
        ]
      }
    ];

    // Create pickup records
    for (const pickupData of testPickups) {
      const pickup = new Pickup(pickupData);
      await pickup.save();
      
      console.log(`✅ Created pickup: ${pickup.trackingId} for "${pickup.book}"`);
      console.log(`   Status: ${pickup.status}`);
      console.log(`   Tracking URL: http://localhost:3000/pickup-track?id=${pickup.trackingId}`);
    }

    console.log('\n🎉 Test pickup records created successfully!');
    console.log('\n📋 Test Tracking IDs:');
    
    const allPickups = await Pickup.find().sort({ createdAt: -1 }).limit(10);
    allPickups.forEach(pickup => {
      console.log(`   ${pickup.trackingId} - ${pickup.name} - Status: ${pickup.status}`);
    });

  } catch (error) {
    console.error('❌ Error creating test pickups:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
if (require.main === module) {
  createTestPickups();
}

module.exports = createTestPickups;
