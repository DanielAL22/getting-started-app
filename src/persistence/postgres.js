const waitPort = require('wait-port');
const fs = require('fs');
const { Pool } = require('pg');

const {
  PG_HOST: HOST,
  PG_HOST_FILE: HOST_FILE,
  PG_USER: USER,
  PG_USER_FILE: USER_FILE,
  PG_PASSWORD: PASSWORD,
  PG_PASSWORD_FILE: PASSWORD_FILE,
  PG_DB: DB,
  PG_DB_FILE: DB_FILE,
  PG_PORT: PORT = 5432,
  PG_PORT_FILE: PORT_FILE,
} = process.env;

let pool;

async function init() {
  const host = HOST_FILE ? fs.readFileSync(HOST_FILE, 'utf-8').trim() : HOST;
  const user = USER_FILE ? fs.readFileSync(USER_FILE, 'utf-8').trim() : USER;
  const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE, 'utf-8').trim() : PASSWORD;
  const database = DB_FILE ? fs.readFileSync(DB_FILE, 'utf-8').trim() : DB;
  const port = PORT_FILE 
  ? parseInt(fs.readFileSync(PORT_FILE, 'utf-8').trim(), 10) 
  : (PORT ? parseInt(PORT, 10) : 5432);

  await waitPort({
    host,
    port,
    timeout: 10000,
    waitForDns: true,
  });

  pool = new Pool({ host, user, password, database, port });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todo_items (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255),
      completed BOOLEAN
    );
  `);

  console.log(`Connected to PostgreSQL db at host ${host}`);
}

async function teardown() {
  await pool.end();
}

async function getItems() {
  const { rows } = await pool.query('SELECT * FROM todo_items');
  return rows;
}

async function getItem(id) {
  const { rows } = await pool.query('SELECT * FROM todo_items WHERE id=$1', [id]);
  return rows[0];
}

async function storeItem(item) {
  await pool.query(
    'INSERT INTO todo_items (id, name, completed) VALUES ($1, $2, $3)',
    [item.id, item.name, item.completed]
  );
}

async function updateItem(id, item) {
  await pool.query(
    'UPDATE todo_items SET name=$1, completed=$2 WHERE id=$3',
    [item.name, item.completed, id]
  );
}

async function removeItem(id) {
  await pool.query('DELETE FROM todo_items WHERE id=$1', [id]);
}

module.exports = {
  init,
  teardown,
  getItems,
  getItem,
  storeItem,
  updateItem,
  removeItem,
};
