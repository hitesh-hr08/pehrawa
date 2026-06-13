const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:pehrawa8898@localhost:5432/pehrawa' });
pool.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='orders'")
  .then(r => { r.rows.forEach(c => console.log(c.column_name + ' ' + c.data_type)); pool.end(); })
  .catch(e => { console.log('Error:', e.message); pool.end(); });
