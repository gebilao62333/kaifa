const s = require('./src/config/mysql');
s.authenticate()
  .then(() => {
    console.log('MYSQL AUTH OK');
    return s.query('SELECT COUNT(*) AS c FROM xn_admin').then(r => console.log('xn_admin rows:', r[0][0].c));
  })
  .then(() => s.query('SELECT id, nickname, city FROM xn_user ORDER BY id LIMIT 5'))
  .then(r => console.log('users:', JSON.stringify(r[0])))
  .catch(e => console.log('MYSQL FAIL:', e.message))
  .finally(() => process.exit(0));
