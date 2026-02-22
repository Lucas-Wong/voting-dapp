import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { useApi } from '../hooks/useApi'

export default function CreatePoll() {
  const navigate = useNavigate()
  const { isConnected, connectWallet } = useWallet()
  const { loading, request } = useApi()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    startTime: '',
    endTime: '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData((prev) => ({ ...prev, options: newOptions }))
  }

  const addOption = () => {
    setFormData((prev) => ({ ...prev, options: [...prev.options, ''] }))
  }

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, options: newOptions }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.options.filter((opt) => opt.trim()).length < 2) {
      newErrors.options = 'At least 2 options are required'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required'
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime).getTime() / 1000
      const end = new Date(formData.endTime).getTime() / 1000
      const now = Date.now() / 1000

      if (start < now) {
        newErrors.startTime = 'Start time must be in the future'
      }
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isConnected) {
      await connectWallet()
      return
    }

    if (!validate()) return

    try {
      const startTime = Math.floor(new Date(formData.startTime).getTime() / 1000)
      const endTime = Math.floor(new Date(formData.endTime).getTime() / 1000)

      const result = await request('/polls', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          options: formData.options.filter((opt) => opt.trim()),
          startTime,
          endTime,
        }),
      })

      navigate(`/poll/${result.pollId}`)
    } catch (err) {
      console.error('Failed to create poll:', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Poll</h1>

      <form onSubmit={handleSubmit} className="card">
        {/* Title */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Poll Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`input-field ${errors.title ? 'border-red-500' : ''}`}
            placeholder="Enter poll title"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Describe your poll (optional)"
          />
        </div>

        {/* Options */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Voting Options *
          </label>
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="input-field flex-1"
                placeholder={`Option ${index + 1}`}
              />
              {formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-primary-600 hover:text-primary-700 font-medium mt-2"
          >
            + Add Option
          </button>
          {errors.options && (
            <p className="text-red-500 text-sm mt-1">{errors.options}</p>
          )}
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Start Time *
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={`input-field ${errors.startTime ? 'border-red-500' : ''}`}
            />
            {errors.startTime && (
              <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              End Time *
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={`input-field ${errors.endTime ? 'border-red-500' : ''}`}
            />
            {errors.endTime && (
              <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Creating...' : isConnected ? 'Create Poll' : 'Connect Wallet'}
          </button>
        </div>
      </form>
    </div>
  )
}
