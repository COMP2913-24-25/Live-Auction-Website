// Update with your config settings.
const path = require('path');

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database/db.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'database/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'database/seeds')
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database/db.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'database/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'database/seeds')
    }
  }

};
