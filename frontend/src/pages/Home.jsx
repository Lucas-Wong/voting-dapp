import { Link } from 'react-router-dom'
import { usePolls } from '../hooks/useApi'

function StatusBadge({ status }) {
  const colors = {
    Active: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Ended: 'bg-gray-100 text-gray-800',
    Canceled: 'bg-red-100 text-red-800',
    Inactive: 'bg-gray-100 text-gray-600',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.Inactive}`}>
      {status}
    </span>
  )
}

function PollCard({ poll }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{poll.title}</h3>
          <p className="text-gray-500 text-sm mt-1">
            ID: #{poll.id} • Created by {poll.creator.slice(0, 8)}...
          </p>
        </div>
        <StatusBadge status={poll.isActive ? 'Active' : 'Inactive'} />
      </div>

      {poll.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">{poll.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {poll.options.slice(0, 4).map((option, index) => (
          <span
            key={index}
            className="bg-primary-50 text-primary-700 px-3 py-1 rounded-lg text-sm"
          >
            {option}
          </span>
        ))}
        {poll.options.length > 4 && (
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm">
            +{poll.options.length - 4} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>🗳️ {poll.totalVotes} votes</span>
        <span>📅 {formatDate(poll.endTime)}</span>
      </div>

      <Link
        to={`/poll/${poll.id}`}
        className="btn-primary w-full text-center block"
      >
        View Details
      </Link>
    </div>
  )
}

export default function Home() {
  const { polls, loading, error, refetch } = usePolls()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading polls...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button onClick={refetch} className="btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Active Polls</h1>
          <p className="text-gray-600 mt-2">
            Participate in decentralized voting on the blockchain
          </p>
        </div>
        <Link to="/create" className="btn-primary">
          + Create New Poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No polls available yet.</p>
          <Link to="/create" className="btn-primary">
            Create the First Poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  )
}
