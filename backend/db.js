// const { Pool } = require('pg');

// // The Pool will use the environment variables we set in .env
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });


// const logEvent = (eventType, details = {}) => {
//   try {
//     const queryText = 'INSERT INTO event_logs(event_type, details) VALUES($1, $2)';
//     pool.query(queryText, [eventType, details]);
//   } catch (error) {
//     console.error('Failed to log event:', error);
//   }
// };

// module.exports = {
//   query: (text, params) => pool.query(text, params),
//   logEvent,
// };

const { Pool } = require('pg');
require('dotenv').config();

// This new configuration is smarter.
// It will use the DATABASE_URL from Render when deployed.
// For local development, it falls back to your .env variables.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const logEvent = (eventType, details = {}) => {
  try {
    const queryText = 'INSERT INTO event_logs(event_type, details) VALUES($1, $2)';
    pool.query(queryText, [eventType, JSON.stringify(details)]);
  } catch (error) {
    console.error('Failed to log event:', error);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  logEvent,
};
