import { Link } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'

export default function Layout({ children }) {
  const { account, isConnected, connectWallet, disconnectWallet, isConnecting } = useWallet()

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-bg text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              🗳️ Voting DApp
            </Link>

            <nav className="flex items-center space-x-6">
              <Link to="/" className="hover:text-primary-200 transition-colors">
                Home
              </Link>
              <Link to="/create" className="hover:text-primary-200 transition-colors">
                Create Poll
              </Link>
              <Link to="/admin" className="hover:text-primary-200 transition-colors">
                Admin
              </Link>

              <div className="flex items-center space-x-4">
                {isConnected ? (
                  <div className="flex items-center space-x-3">
                    <span className="bg-white/20 px-4 py-2 rounded-lg text-sm">
                      {formatAddress(account)}
                    </span>
                    <button
                      onClick={disconnectWallet}
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>© 2024 Voting DApp. Built with Ethereum & React.</p>
        </div>
      </footer>
    </div>
  )
}
