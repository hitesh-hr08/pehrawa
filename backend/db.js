require("dotenv").config({ path: __dirname + "/.env" });

const { Pool } = require("pg");

var config = {};

if (process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
  config.ssl = { rejectUnauthorized: false };
} else {
  config.user = process.env.DB_USER;
  config.host = process.env.DB_HOST;
  config.database = process.env.DB_NAME;
  config.password = process.env.DB_PASSWORD;
  config.port = process.env.DB_PORT;
  config.ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false;
}

const pool = new Pool(config);

pool.query("SELECT 1").catch(function (err) {
  console.error("DB connection error:", err.message);
});

module.exports = pool;
