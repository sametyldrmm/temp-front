import { Pool } from 'pg';

const pool = new Pool({
  user: 'bilal',
  host: 'localhost',
  database: 'emindb',
  password: '123',
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM sensor_data');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Veri çekme hatası' });
    }
  } else {
    res.status(405).json({ error: 'Sadece GET isteği desteklenmektedir.' });
  }
}