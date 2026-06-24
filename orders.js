const express = require('express')
const router = express.Router()
const pool = require('../config/db')

// Create a new order
router.post('/', async (req, res) => {
  const {
    customer_name, customer_phone, delivery_address,
    product_type, option_type, quantity, unit_price, total_amount, file_url
  } = req.body

  try {
    const result = await pool.query(
      `INSERT INTO orders 
        (customer_name, customer_phone, delivery_address, product_type, option_type, quantity, unit_price, total_amount, file_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [customer_name, customer_phone, delivery_address, product_type, option_type, quantity, unit_price, total_amount, file_url]
    )
    res.json({ success: true, order: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Get all orders (for admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get a single order by id (for tracking)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update order status (for admin)
router.patch('/:id', async (req, res) => {
  const { status } = req.body
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    res.json({ success: true, order: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
router.post('/quick', async (req, res) => {
  const { customer_name, product_type } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO orders (customer_name, customer_phone, delivery_address, product_type, option_type, quantity, unit_price, total_amount)
       VALUES ($1, '', '', $2, '', 1, 0, 0)
       RETURNING *`,
      [customer_name, product_type]
    )
    res.json({ success: true, order: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router