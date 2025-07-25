// Update with your config settings.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './database/db.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './database/migrations'
    },
    seeds: {
      directory: './database/seeds'
    },
    pool: { min: 2, max: 10 } // Adjust max based on your needs
  },

  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:' // Use in-memory database for tests
    },
    useNullAsDefault: true,
    migrations: {
      directory: './database/migrations'
    },
    seeds: {
      directory: './database/seeds'
    },
    pool: { min: 2, max: 10 } // Adjust max based on your needs
  },
};
