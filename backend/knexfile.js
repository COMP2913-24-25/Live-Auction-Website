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
    }
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
    }
  },

  staging: {
    client: 'pg',
    connection: {
      host: process.env.STAGING_DB_HOST || 'localhost',
      database: process.env.STAGING_DB_NAME || 'staging_db',
      user: process.env.STAGING_DB_USER || 'staging_user',
      password: process.env.STAGING_DB_PASSWORD || 'staging_password',
      port: process.env.STAGING_DB_PORT || 5432
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './database/seeds'
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.PROD_DB_HOST || 'localhost',
      database: process.env.PROD_DB_NAME || 'production_db',
      user: process.env.PROD_DB_USER || 'production_user',
      password: process.env.PROD_DB_PASSWORD || 'production_password',
      port: process.env.PROD_DB_PORT || 5432
    },
    pool: {
      min: 2,
      max: 20
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './database/seeds'
    }
  }

};
