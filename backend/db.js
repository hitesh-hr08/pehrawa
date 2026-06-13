require("dotenv").config({ path: __dirname + "/.env" });

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

pool.query("SELECT 1").catch(err => console.error("DB connection error:", err.message));

module.exports = pool;
