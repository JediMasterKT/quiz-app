'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Technology',
        description: 'Questions about technology, gadgets, and innovation',
        icon_url: '/icons/tech.png',
        color_code: '#007AFF',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Business',
        description: 'Corporate world, finance, and business strategy',
        icon_url: '/icons/business.png',
        color_code: '#FF9500',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'General Knowledge',
        description: 'Mix of topics for general awareness',
        icon_url: '/icons/general.png',
        color_code: '#34C759',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Science',
        description: 'Physics, chemistry, biology, and earth sciences',
        icon_url: '/icons/science.png',
        color_code: '#5856D6',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Sports',
        description: 'Sports, games, and athletic competitions',
        icon_url: '/icons/sports.png',
        color_code: '#FF3B30',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
