import { useState, useEffect, useCallback } from 'react'

const API_BASE = '/api'

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Request failed')
  }

  return data.data
}

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true)
    setError(null)

    try {
      const data = await apiRequest(endpoint, options)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, request }
}

export function usePolls() {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/polls')
      setPolls(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPolls()
  }, [fetchPolls])

  return { polls, loading, error, refetch: fetchPolls }
}

export function usePoll(pollId) {
  const [poll, setPoll] = useState(null)
  const [results, setResults] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPoll = useCallback(async () => {
    if (!pollId) return

    try {
      setLoading(true)
      const [pollData, resultsData, statusData] = await Promise.all([
        apiRequest(`/polls/${pollId}`),
        apiRequest(`/polls/${pollId}/results`),
        apiRequest(`/polls/${pollId}/status`),
      ])
      setPoll(pollData)
      setResults(resultsData)
      setStatus(statusData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pollId])

  useEffect(() => {
    fetchPoll()
  }, [fetchPoll])

  return { poll, results, status, loading, error, refetch: fetchPoll }
}

export function useVoterStatus(pollId, address) {
  const [voterStatus, setVoterStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
    if (!pollId || !address) return

    try {
      setLoading(true)
      const data = await apiRequest(`/votes/${pollId}/voter/${address}`)
      setVoterStatus(data)
    } catch (err) {
      console.error('Failed to fetch voter status:', err)
    } finally {
      setLoading(false)
    }
  }, [pollId, address])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  return { voterStatus, loading, refetch: fetchStatus }
}
