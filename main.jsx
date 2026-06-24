import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'
import AdminProducts from './pages/AdminProducts.jsx'
import AdminCategories from './pages/AdminCategories.jsx'
import TrackOrder from './pages/TrackOrder.jsx'
import CategoryCatalog from './pages/CategoryCatalog.jsx'
import CatalogProductDetail from './pages/CatalogProductDetail.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/catalog/:slug" element={<CategoryCatalog />} />
        <Route path="/catalog/:slug/:productId" element={<CatalogProductDetail />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)