import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './hooks/useWallet'
import Layout from './components/Layout'
import Home from './pages/Home'
import CreatePoll from './pages/CreatePoll'
import PollDetail from './pages/PollDetail'
import Admin from './pages/Admin'

function App() {
  return (
    <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/poll/:id" element={<PollDetail />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </Router>
    </WalletProvider>
  )
}

export default App
