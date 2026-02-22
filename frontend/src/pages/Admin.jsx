import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useWallet } from '../hooks/useWallet'

export default function Admin() {
  const { account, isConnected, connectWallet } = useWallet()
  const { loading, request } = useApi()

  const [voterAddress, setVoterAddress] = useState('')
  const [votingPower, setVotingPower] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleAssignPower = async (e) => {
    e.preventDefault()

    if (!voterAddress || !votingPower) {
      showMessage('error', 'Please fill in all fields')
      return
    }

    try {
      await request('/voting-power/assign', {
        method: 'POST',
        body: JSON.stringify({
          voter: voterAddress,
          power: parseInt(votingPower),
        }),
      })
      showMessage('success', 'Voting power assigned successfully!')
      setVoterAddress('')
      setVotingPower('')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const handleBatchAssign = async (e) => {
    e.preventDefault()

    if (!batchInput.trim()) {
      showMessage('error', 'Please enter addresses and powers')
      return
    }

    try {
      const lines = batchInput.trim().split('\n')
      const voters = []
      const powers = []

      for (const line of lines) {
        const [address, power] = line.split(',').map((s) => s.trim())
        if (address && power) {
          voters.push(address)
          powers.push(parseInt(power))
        }
      }

      if (voters.length === 0) {
        showMessage('error', 'Invalid input format')
        return
      }

      await request('/voting-power/assign-batch', {
        method: 'POST',
        body: JSON.stringify({ voters, powers }),
      })

      showMessage('success', `Assigned voting power to ${voters.length} addresses!`)
      setBatchInput('')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Panel</h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to access admin functions
          </p>
          <button onClick={connectWallet} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Panel</h1>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Assign Voting Power */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Assign Voting Power
        </h2>
        <form onSubmit={handleAssignPower} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Voter Address
            </label>
            <input
              type="text"
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              className="input-field"
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Voting Power
            </label>
            <input
              type="number"
              value={votingPower}
              onChange={(e) => setVotingPower(e.target.value)}
              className="input-field"
              placeholder="100"
              min="1"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Processing...' : 'Assign Voting Power'}
          </button>
        </form>
      </div>

      {/* Batch Assign */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Batch Assign Voting Power
        </h2>
        <form onSubmit={handleBatchAssign} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Addresses and Powers
            </label>
            <textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              className="input-field"
              rows={6}
              placeholder="address1, power1&#10;address2, power2&#10;..."
            />
            <p className="text-gray-500 text-sm mt-1">
              One address per line, format: address, power
            </p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Processing...' : 'Batch Assign'}
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          <strong>Note:</strong> Only the contract admin can assign voting power.
          Make sure your connected wallet is the admin address.
        </p>
      </div>
    </div>
  )
}
