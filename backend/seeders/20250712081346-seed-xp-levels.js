'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const xpLevels = [
      { level: 1, min_xp: 0, max_xp: 100, title: 'Novice', badge_icon: 'badge-novice' },
      { level: 2, min_xp: 101, max_xp: 250, title: 'Beginner', badge_icon: 'badge-beginner' },
      { level: 3, min_xp: 251, max_xp: 500, title: 'Learner', badge_icon: 'badge-learner' },
      { level: 4, min_xp: 501, max_xp: 850, title: 'Student', badge_icon: 'badge-student' },
      { level: 5, min_xp: 851, max_xp: 1300, title: 'Scholar', badge_icon: 'badge-scholar' },
      { level: 6, min_xp: 1301, max_xp: 1900, title: 'Adept', badge_icon: 'badge-adept' },
      { level: 7, min_xp: 1901, max_xp: 2650, title: 'Proficient', badge_icon: 'badge-proficient' },
      { level: 8, min_xp: 2651, max_xp: 3550, title: 'Advanced', badge_icon: 'badge-advanced' },
      { level: 9, min_xp: 3551, max_xp: 4650, title: 'Expert', badge_icon: 'badge-expert' },
      { level: 10, min_xp: 4651, max_xp: 6000, title: 'Master', badge_icon: 'badge-master' },
      { level: 11, min_xp: 6001, max_xp: 7600, title: 'Grandmaster', badge_icon: 'badge-grandmaster' },
      { level: 12, min_xp: 7601, max_xp: 9500, title: 'Champion', badge_icon: 'badge-champion' },
      { level: 13, min_xp: 9501, max_xp: 11700, title: 'Virtuoso', badge_icon: 'badge-virtuoso' },
      { level: 14, min_xp: 11701, max_xp: 14300, title: 'Elite', badge_icon: 'badge-elite' },
      { level: 15, min_xp: 14301, max_xp: 17300, title: 'Sage', badge_icon: 'badge-sage' },
      { level: 16, min_xp: 17301, max_xp: 20800, title: 'Oracle', badge_icon: 'badge-oracle' },
      { level: 17, min_xp: 20801, max_xp: 24800, title: 'Savant', badge_icon: 'badge-savant' },
      { level: 18, min_xp: 24801, max_xp: 29400, title: 'Luminary', badge_icon: 'badge-luminary' },
      { level: 19, min_xp: 29401, max_xp: 34600, title: 'Transcendent', badge_icon: 'badge-transcendent' },
      { level: 20, min_xp: 34601, max_xp: 40500, title: 'Immortal', badge_icon: 'badge-immortal' },
      { level: 21, min_xp: 40501, max_xp: 47200, title: 'Mythic', badge_icon: 'badge-mythic' },
      { level: 22, min_xp: 47201, max_xp: 54700, title: 'Legendary', badge_icon: 'badge-legendary' },
      { level: 23, min_xp: 54701, max_xp: 63100, title: 'Eternal', badge_icon: 'badge-eternal' },
      { level: 24, min_xp: 63101, max_xp: 72500, title: 'Cosmic', badge_icon: 'badge-cosmic' },
      { level: 25, min_xp: 72501, max_xp: 999999, title: 'Quiz God', badge_icon: 'badge-god' }
    ];

    const levelsWithTimestamps = xpLevels.map(level => ({
      ...level,
      perks: JSON.stringify({
        xpMultiplier: 1 + (level.level - 1) * 0.02,
        dailyBonus: level.level * 10
      }),
      created_at: now,
      updated_at: now
    }));

    await queryInterface.bulkInsert('xp_levels', levelsWithTimestamps, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('xp_levels', null, {});
  }
};
