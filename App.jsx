import { useState } from 'react'
import SplashScreen from './components/SplashScreen'
import Navbar from './components/NavBar'
import Hero from './components/Hero'
import Products from './components/Products'

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem('hasSeenSplash')
    if (!seen) {
      sessionStorage.setItem('hasSeenSplash', 'true')
      return true
    }
    return false
  })

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <div style={{ background: '#16271c' }}>
        <Navbar />
        <Hero />
        <Products />
      </div>
    </>
  )
}

export default App