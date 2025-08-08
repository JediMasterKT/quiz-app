#!/usr/bin/env node

const achievementService = require('./src/services/DatabaseAchievementService');

async function seed() {
  console.log('🌱 Seeding achievements...');
  await achievementService.seedAchievements();
  console.log('✅ Done!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});