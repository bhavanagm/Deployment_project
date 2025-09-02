// utils/achievementService.js
const Achievement = require('../models/achievement');
const Notification = require('../models/notification');
const User = require('../models/user');

// Achievement definitions
const ACHIEVEMENTS = {
  'first-book': {
    title: 'First Book Shared',
    description: 'Shared your first book with the community',
    icon: '📚',
    points: 10
  },
  'bookworm': {
    title: 'Bookworm',
    description: 'Shared 10 books',
    icon: '🐛',
    points: 50
  },
  'generous-donor': {
    title: 'Generous Donor',
    description: 'Donated 5 books to the community',
    icon: '💝',
    points: 30
  },
  'active-swapper': {
    title: 'Active Swapper',
    description: 'Completed 5 book swaps',
    icon: '🔄',
    points: 40
  },
  'reviewer': {
    title: 'Book Reviewer',
    description: 'Left 10 book reviews',
    icon: '⭐',
    points: 25
  },
  'community-helper': {
    title: 'Community Helper',
    description: 'Helped 20 people find books',
    icon: '🤝',
    points: 60
  },
  'book-collector': {
    title: 'Book Collector',
    description: 'Added 25 books to your collection',
    icon: '📖',
    points: 75
  },
  'veteran': {
    title: 'BookSwap Veteran',
    description: 'Active member for 6 months',
    icon: '🏆',
    points: 100
  }
};

class AchievementService {
  // Award achievement to user
  async awardAchievement(userId, badgeType) {
    try {
      const achievementData = ACHIEVEMENTS[badgeType];
      if (!achievementData) {
        console.log(`Unknown achievement type: ${badgeType}`);
        return false;
      }

      // Check if user already has this achievement
      const existing = await Achievement.findOne({ userId, badge: badgeType });
      if (existing) {
        return false; // Already awarded
      }

      // Create achievement
      const achievement = new Achievement({
        userId,
        badge: badgeType,
        title: achievementData.title,
        description: achievementData.description,
        icon: achievementData.icon,
        points: achievementData.points
      });

      await achievement.save();

      // Update user's total points and badges
      await User.findByIdAndUpdate(userId, {
        $inc: { totalPoints: achievementData.points },
        $push: { badges: badgeType }
      });

      // Create notification
      await this.createAchievementNotification(userId, achievement);

      console.log(`✅ Achievement awarded: ${achievementData.title} to user ${userId}`);
      return achievement;

    } catch (error) {
      console.error('❌ Error awarding achievement:', error);
      return false;
    }
  }

  // Create notification for achievement
  async createAchievementNotification(userId, achievement) {
    const notification = new Notification({
      userId,
      type: 'achievement-unlocked',
      title: `🏆 Achievement Unlocked!`,
      message: `Congratulations! You've earned the "${achievement.title}" badge!`,
      relatedId: achievement._id,
      relatedModel: 'Achievement',
      priority: 'high'
    });

    await notification.save();
  }

  // Check and award achievements based on user activity
  async checkUserAchievements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // First book achievement
      if (user.totalBooksShared >= 1) {
        await this.awardAchievement(userId, 'first-book');
      }

      // Bookworm achievement
      if (user.totalBooksShared >= 10) {
        await this.awardAchievement(userId, 'bookworm');
      }

      // Generous donor achievement
      if (user.totalBooksDonated >= 5) {
        await this.awardAchievement(userId, 'generous-donor');
      }

      // Active swapper achievement
      if (user.totalBooksSwapped >= 5) {
        await this.awardAchievement(userId, 'active-swapper');
      }

      // Reviewer achievement
      if (user.totalReviews >= 10) {
        await this.awardAchievement(userId, 'reviewer');
      }

      // Book collector achievement
      if (user.totalBooksShared >= 25) {
        await this.awardAchievement(userId, 'book-collector');
      }

      // Veteran achievement (6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (user.createdAt <= sixMonthsAgo) {
        await this.awardAchievement(userId, 'veteran');
      }

    } catch (error) {
      console.error('❌ Error checking achievements:', error);
    }
  }

  // Get user's achievements
  async getUserAchievements(userId) {
    try {
      return await Achievement.find({ userId }).sort({ unlockedAt: -1 });
    } catch (error) {
      console.error('❌ Error fetching user achievements:', error);
      return [];
    }
  }

  // Get leaderboard
  async getLeaderboard(limit = 10) {
    try {
      return await User.find({ isActive: true })
        .select('username totalPoints level badges')
        .sort({ totalPoints: -1, level: -1 })
        .limit(limit);
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      return [];
    }
  }
}

module.exports = new AchievementService();
