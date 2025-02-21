import AuctionForm from './components/auction/AuctionForm'
import AuthenticationForm from './components/authentication/AuthenticationForm'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-off-white text-charcoal pt-16">
            <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-navy via-teal to-gold z-50" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <AuctionForm />
            </div>
          </div>
        } />
        <Route path="/request-authentication" element={<AuthenticationForm />} />
      </Routes>
    </Router>
  )
}

export default App
