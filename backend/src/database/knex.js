const knex = require('knex');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

if (!connectionConfig) {
    throw new Error(`No configuration for environment: ${environment}`);
}

console.log('Using database configuration:', {
    client: connectionConfig.client,
    environment: environment
});

module.exports = knex(connectionConfig); 