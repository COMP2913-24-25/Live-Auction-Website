const knex = require("knex");
const knexConfig = require("../knexfile"); // Import knexfile.js configuration

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]); // Allows switching between development, testing, and production automatically

module.exports = db;