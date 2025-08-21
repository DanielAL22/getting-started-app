if (process.env.PG_HOST) module.exports = require('./postgres');
else module.exports = require('./sqlite');
