const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'pioneer-prints-catalog', resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
})
const upload = multer({ storage })

// GET all products for a category (customer-facing, only active)
router.get('/category/:category', async (req, res) => {
  try {
    const { rows: products } = await pool.query(
      `SELECT * FROM catalog_products WHERE category = $1 AND is_active = TRUE ORDER BY display_order ASC, created_at DESC`,
      [req.params.category]
    )
    for (const p of products) {
      const { rows: images } = await pool.query(
        `SELECT image_url, is_primary FROM catalog_product_images WHERE product_id = $1 ORDER BY is_primary DESC, display_order ASC`,
        [p.id]
      )
      p.images = images
    }
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single product with images
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM catalog_products WHERE id = $1`, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const product = rows[0]
    const { rows: images } = await pool.query(
      `SELECT id, image_url, is_primary FROM catalog_product_images WHERE product_id = $1 ORDER BY is_primary DESC, display_order ASC`,
      [product.id]
    )
    product.images = images
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: GET all products (including inactive) for any category
router.get('/admin/all', async (req, res) => {
  try {
    const { rows: products } = await pool.query(`SELECT * FROM catalog_products ORDER BY category, display_order ASC, created_at DESC`)
    for (const p of products) {
      const { rows: images } = await pool.query(
        `SELECT id, image_url, is_primary FROM catalog_product_images WHERE product_id = $1 ORDER BY is_primary DESC, display_order ASC`,
        [p.id]
      )
      p.images = images
    }
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Create product
router.post('/', async (req, res) => {
  const { category, name, description, base_price, paper_options, size_options } = req.body
  try {
    const { rows } = await pool.query(
      `INSERT INTO catalog_products (category, name, description, base_price, paper_options, size_options)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category, name, description, base_price, JSON.stringify(paper_options || []), JSON.stringify(size_options || [])]
    )
    res.json({ success: true, product: rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Update product
router.put('/:id', async (req, res) => {
  const { name, description, base_price, paper_options, size_options, is_active, display_order } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE catalog_products SET name=$1, description=$2, base_price=$3, paper_options=$4, size_options=$5, is_active=$6, display_order=$7
       WHERE id=$8 RETURNING *`,
      [name, description, base_price, JSON.stringify(paper_options || []), JSON.stringify(size_options || []), is_active, display_order || 0, req.params.id]
    )
    res.json({ success: true, product: rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Delete product
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM catalog_products WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Upload image for a product
router.post('/:id/images', upload.single('image'), async (req, res) => {
  try {
    const { is_primary } = req.body
    if (is_primary === 'true') {
      await pool.query(`UPDATE catalog_product_images SET is_primary = FALSE WHERE product_id = $1`, [req.params.id])
    }
    const { rows } = await pool.query(
      `INSERT INTO catalog_product_images (product_id, image_url, is_primary) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.file.path, is_primary === 'true']
    )
    res.json({ success: true, image: rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Delete an image
router.delete('/images/:imageId', async (req, res) => {
  try {
    await pool.query(`DELETE FROM catalog_product_images WHERE id = $1`, [req.params.imageId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router