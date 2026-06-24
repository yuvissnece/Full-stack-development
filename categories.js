const express = require('express')
const router = express.Router()
const pool = require('../config/db')

// GET all active categories (customer-facing, for homepage)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM categories WHERE is_active = TRUE ORDER BY display_order ASC, created_at ASC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: GET all categories including inactive
router.get('/admin/all', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM categories ORDER BY display_order ASC, created_at ASC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single category by slug (used to load the right form/catalog)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM categories WHERE slug = $1`, [req.params.slug])
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Create category
router.post('/', async (req, res) => {
  const { slug, display_name, description, icon, form_type } = req.body
  if (!slug || !display_name) return res.status(400).json({ error: 'Slug and display name are required' })

  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  try {
    const { rows: maxOrder } = await pool.query(`SELECT COALESCE(MAX(display_order), 0) as max FROM categories`)
    const { rows } = await pool.query(
      `INSERT INTO categories (slug, display_name, description, icon, form_type, display_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cleanSlug, display_name, description || '', icon || 'Printer', form_type || 'catalog', maxOrder[0].max + 1]
    )
    res.json({ success: true, category: rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'A category with this slug already exists' })
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Update category
router.put('/:id', async (req, res) => {
  const { display_name, description, icon, form_type, is_active, display_order } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE categories SET display_name=$1, description=$2, icon=$3, form_type=$4, is_active=$5, display_order=$6
       WHERE id=$7 RETURNING *`,
      [display_name, description, icon, form_type, is_active, display_order, req.params.id]
    )
    res.json({ success: true, category: rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Delete category (blocked if products exist under it)
router.delete('/:id', async (req, res) => {
  try {
    const { rows: products } = await pool.query(`SELECT COUNT(*) FROM catalog_products WHERE category_id = $1`, [req.params.id])
    if (parseInt(products[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete — this category still has products. Delete or move them first.' })
    }
    await pool.query(`DELETE FROM categories WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Reorder categories (drag and drop support)
router.post('/reorder', async (req, res) => {
  const { orderedIds } = req.body // array of category ids in new order
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await pool.query(`UPDATE categories SET display_order = $1 WHERE id = $2`, [i, orderedIds[i]])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router