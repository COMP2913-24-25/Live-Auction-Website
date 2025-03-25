const cron = require('node-cron');
const knex = require('../db'); // Import your database connection

async function getCurrentSunday() {
    const today = new Date();
    today.setDate(today.getDate() - today.getDay()); // Move back to the most recent Sunday
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

async function cleanupOldAvailability() {
    try {
        const currentWeekStart = await getCurrentSunday();

        const deletedRows = await knex('expert_availability')
            .where('week_start_date', '<', currentWeekStart)
            .del();

        console.log(`✅ Deleted ${deletedRows} outdated availability records.`);
    } catch (error) {
        console.error('❌ Error deleting old availability records:', error);
    }
}

// Schedule the cleanup job to run **every Sunday at 00:00 (midnight)**
cron.schedule('0 0 * * 0', async () => {
    console.log('🕛 Running scheduled cleanup job...');
    await cleanupOldAvailability();
});

module.exports = { cleanupOldAvailability };
