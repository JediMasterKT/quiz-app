'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const achievements = [
      // Gameplay Achievements
      {
        code: 'first_win',
        name: 'First Victory',
        description: 'Win your first quiz game',
        icon: 'trophy',
        category: 'gameplay',
        rarity: 'common',
        xp_reward: 25,
        criteria: JSON.stringify({ type: 'games_won', value: 1 }),
        display_order: 1
      },
      {
        code: 'perfect_score',
        name: 'Perfectionist',
        description: 'Get a perfect score in any quiz',
        icon: 'star',
        category: 'gameplay',
        rarity: 'common',
        xp_reward: 50,
        criteria: JSON.stringify({ type: 'perfect_games', value: 1 }),
        display_order: 2
      },
      {
        code: 'speed_demon',
        name: 'Speed Demon',
        description: 'Answer a question in under 3 seconds',
        icon: 'lightning',
        category: 'gameplay',
        rarity: 'rare',
        xp_reward: 75,
        criteria: JSON.stringify({ type: 'speed_demon', value: 3 }),
        display_order: 3
      },
      {
        code: 'accuracy_master',
        name: 'Accuracy Master',
        description: 'Maintain 90% accuracy over 100 questions',
        icon: 'target',
        category: 'gameplay',
        rarity: 'epic',
        xp_reward: 200,
        criteria: JSON.stringify({ type: 'accuracy', value: 90, minQuestions: 100 }),
        display_order: 4
      },
      {
        code: 'quiz_marathon',
        name: 'Quiz Marathon',
        description: 'Answer 1000 questions',
        icon: 'infinity',
        category: 'gameplay',
        rarity: 'epic',
        xp_reward: 500,
        criteria: JSON.stringify({ type: 'questions_answered', value: 1000, trackProgress: true }),
        display_order: 5
      },

      // Progression Achievements
      {
        code: 'level_5',
        name: 'Scholar',
        description: 'Reach level 5',
        icon: 'graduation-cap',
        category: 'progression',
        rarity: 'common',
        xp_reward: 100,
        criteria: JSON.stringify({ type: 'level', value: 5 }),
        display_order: 10
      },
      {
        code: 'level_10',
        name: 'Master',
        description: 'Reach level 10',
        icon: 'medal',
        category: 'progression',
        rarity: 'rare',
        xp_reward: 250,
        criteria: JSON.stringify({ type: 'level', value: 10 }),
        display_order: 11
      },
      {
        code: 'level_25',
        name: 'Quiz Legend',
        description: 'Reach level 25',
        icon: 'crown',
        category: 'progression',
        rarity: 'legendary',
        xp_reward: 1000,
        criteria: JSON.stringify({ type: 'level', value: 25 }),
        display_order: 12
      },
      {
        code: 'xp_milestone_5000',
        name: 'Experience Collector',
        description: 'Earn 5000 total XP',
        icon: 'gem',
        category: 'progression',
        rarity: 'rare',
        xp_reward: 300,
        criteria: JSON.stringify({ type: 'total_xp', value: 5000, trackProgress: true }),
        display_order: 13
      },

      // Streak Achievements
      {
        code: 'week_streak',
        name: 'Dedicated Player',
        description: 'Play for 7 days in a row',
        icon: 'fire',
        category: 'streak',
        rarity: 'common',
        xp_reward: 150,
        criteria: JSON.stringify({ type: 'current_streak', value: 7 }),
        display_order: 20
      },
      {
        code: 'month_streak',
        name: 'Quiz Addict',
        description: 'Play for 30 days in a row',
        icon: 'flame',
        category: 'streak',
        rarity: 'epic',
        xp_reward: 1000,
        criteria: JSON.stringify({ type: 'current_streak', value: 30 }),
        display_order: 21
      },
      {
        code: 'comeback_king',
        name: 'Comeback King',
        description: 'Return after a 7-day break',
        icon: 'return',
        category: 'streak',
        rarity: 'rare',
        xp_reward: 100,
        criteria: JSON.stringify({ type: 'comeback', daysAway: 7 }),
        display_order: 22
      },

      // Social Achievements
      {
        code: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Play 10 multiplayer games',
        icon: 'users',
        category: 'social',
        rarity: 'common',
        xp_reward: 100,
        criteria: JSON.stringify({ type: 'multiplayer_games', value: 10 }),
        display_order: 30
      },
      {
        code: 'leaderboard_top_10',
        name: 'Elite Player',
        description: 'Reach top 10 in weekly leaderboard',
        icon: 'chart-bar',
        category: 'social',
        rarity: 'epic',
        xp_reward: 500,
        criteria: JSON.stringify({ type: 'leaderboard_rank', value: 10, period: 'weekly' }),
        display_order: 31
      },

      // Special Achievements
      {
        code: 'early_bird',
        name: 'Early Bird',
        description: 'Play a quiz before 6 AM',
        icon: 'sun',
        category: 'special',
        rarity: 'rare',
        xp_reward: 100,
        criteria: JSON.stringify({ type: 'time_based', hourBefore: 6 }),
        display_order: 40
      },
      {
        code: 'night_owl',
        name: 'Night Owl',
        description: 'Play a quiz after midnight',
        icon: 'moon',
        category: 'special',
        rarity: 'rare',
        xp_reward: 100,
        criteria: JSON.stringify({ type: 'time_based', hourAfter: 0 }),
        display_order: 41
      }
    ];

    const achievementsWithTimestamps = achievements.map(achievement => ({
      ...achievement,
      is_active: true,
      created_at: now,
      updated_at: now
    }));

    await queryInterface.bulkInsert('achievements', achievementsWithTimestamps, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('achievements', null, {});
  }
};