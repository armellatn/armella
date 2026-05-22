const { Pool } = require('pg')
const p = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/firstoptishop' })

async function run() {
  const client = await p.connect()
  try {
    await client.query('BEGIN')
    await client.query('ALTER TABLE mouvements_stock DROP CONSTRAINT IF EXISTS mouvements_stock_type_mouvement_check')
    const r = await client.query("UPDATE mouvements_stock SET type_mouvement = 'entree' WHERE type_mouvement != 'sortie'")
    console.log('Updated rows:', r.rowCount)
    await client.query("ALTER TABLE mouvements_stock ADD CONSTRAINT mouvements_stock_type_mouvement_check CHECK (type_mouvement = ANY (ARRAY['entree', 'sortie']))")
    await client.query('COMMIT')
    console.log('OK')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e.message)
  } finally {
    client.release()
    p.end()
  }
}
run()
