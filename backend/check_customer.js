const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:pehrawa8898@localhost:5432/pehrawa' });
pool.query("SELECT id, name, email FROM customers ORDER BY id LIMIT 5")
  .then(r => { r.rows.forEach(c => console.log(c.id, c.name, c.email)); pool.end(); })
  .catch(e => { console.log('Error:', e.message); pool.end(); });
