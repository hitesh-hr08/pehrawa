const pool = require('./backend/db');
(async () => {
  try {
    const r = await pool.query("SELECT DISTINCT category FROM products");
    console.log('Categories:', JSON.stringify(r.rows));
    const r2 = await pool.query("SELECT id, name, category FROM products");
    console.log('All products:', JSON.stringify(r2.rows));
  } catch(e) {
    console.log('Error:', e.message);
  }
  pool.end();
})();
