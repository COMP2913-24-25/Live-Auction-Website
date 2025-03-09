const knex = require("knex");
const knexConfig = require("../knexfile"); // Import knexfile.js configuration

const db = knex(knexConfig.development); // Use development environment

module.exports = db;