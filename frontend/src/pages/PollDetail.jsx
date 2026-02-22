import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useWallet } from '../hooks/useWallet'
import { usePoll, useVoterStatus, useApi } from '../hooks/useApi'

function ResultsChart({ results }) {
  const maxVotes = Math.max(...results.voteCounts, 1)

  return (
    <div className="space-y-4">
      {results.options.map((option, index) => {
        const percentage = (results.voteCounts[index] / results.totalVotes) * 100 || 0
        const width = (results.voteCounts[index] / maxVotes) * 100

        return (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{option}</span>
              <span className="text-gray-500">
                {results.voteCounts[index]} votes ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PollDetail() {
  const { id } = useParams()
  const { account, isConnected, connectWallet } = useWallet()
  const { poll, results, status, loading, error, refetch } = usePoll(id)
  const { voterStatus, refetch: refetchVoterStatus } = useVoterStatus(id, account)
  const { loading: votingLoading, request } = useApi()

  const [selectedOption, setSelectedOption] = useState(null)

  const canVote = () => {
    if (!isConnected) return false
    if (!poll) return false
    if (poll.isCanceled) return false
    if (!poll.isActive) return false
    if (voterStatus?.hasVoted) return false
    if (voterStatus?.votingPower <= 0) return false

    const now = Math.floor(Date.now() / 1000)
    if (now < poll.startTime || now > poll.endTime) return false

    return true
  }

  const handleVote = async () => {
    if (selectedOption === null) return

    try {
      await request('/votes', {
        method: 'POST',
        body: JSON.stringify({
          pollId: parseInt(id),
          optionIndex: selectedOption,
        }),
      })

      refetch()
      refetchVoterStatus()
    } catch (err) {
      console.error('Failed to vote:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error: {error || 'Poll not found'}</p>
        <button onClick={refetch} className="btn-primary">
          Retry
        </button>
      </div>
    )
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{poll.title}</h1>
            <p className="text-gray-500 mt-2">
              Poll #{poll.id} • Status: <span className="font-medium">{status?.status}</span>
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-lg font-medium ${
              poll.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {poll.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {poll.description && (
          <p className="text-gray-600 mb-6">{poll.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500">Start Time</p>
            <p className="font-medium text-gray-800">{formatDate(poll.startTime)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500">End Time</p>
            <p className="font-medium text-gray-800">{formatDate(poll.endTime)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500">Total Votes</p>
            <p className="font-medium text-gray-800">{poll.totalVotes}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500">Creator</p>
            <p className="font-medium text-gray-800 font-mono text-xs">
              {poll.creator}
            </p>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      {voterStatus && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Status</h2>
          <div className="flex items-center gap-4">
            <div className="bg-primary-50 px-4 py-2 rounded-lg">
              <span className="text-primary-700">
                Voting Power: {voterStatus.votingPower}
              </span>
            </div>
            {voterStatus.hasVoted && (
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-green-700">
                  ✓ Voted for: {results?.options[voterStatus.optionIndex]}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vote Options */}
      {canVote() && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Cast Your Vote</h2>
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  selectedOption === index
                    ? 'bg-primary-100 border-2 border-primary-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <span className="font-medium text-gray-800">{option}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleVote}
            disabled={selectedOption === null || votingLoading}
            className="btn-primary w-full mt-4"
          >
            {votingLoading ? 'Voting...' : 'Submit Vote'}
          </button>
        </div>
      )}

      {!isConnected && (
        <div className="card mb-6 text-center">
          <p className="text-gray-600 mb-4">Connect your wallet to vote</p>
          <button onClick={connectWallet} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Results</h2>
          <ResultsChart results={results} />
        </div>
      )}
    </div>
  )
}
