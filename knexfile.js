const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'backend/database/db.sqlite')
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = OFF', cb);
      }
    },
    migrations: {
      directory: path.resolve(__dirname, 'backend/database/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'backend/database/seeds')
    }
  },
  
  production: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'backend/database/db.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'backend/database/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'backend/database/seeds')
    }
  }
}; 