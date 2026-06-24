const express = require('express')
const cors = require('cors')
require('dotenv').config()
const pool = require('./config/db')
const ordersRouter = require('./routes/orders')
const catalogRouter = require('./routes/catalog')
const categoriesRouter = require('./routes/categories')

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }))
app.use(express.json())
app.use('/api/catalog', catalogRouter)
app.use('/api/categories', categoriesRouter)


app.get('/', (req, res) => {
  res.json({ message: 'Pioneer Prints API is running!' })
})

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ success: true, time: result.rows[0].now })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.use('/api/orders', ordersRouter)


const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))