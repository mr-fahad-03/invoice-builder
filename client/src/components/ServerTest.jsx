"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

const ServerTest = () => {
  const [status, setStatus] = useState("Checking server connection...")
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/test")
        const data = await response.json()

        if (response.ok) {
          setStatus("Server connection successful")
          setDetails(data)
          toast.success("Connected to server")
        } else {
          setStatus("Server connection failed")
          setDetails(data)
          toast.error("Failed to connect to server")
        }
      } catch (error) {
        setStatus("Server connection error")
        setDetails({ error: error.message })
        toast.error(`Server error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Server Status</h2>

      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-gray-700 dark:text-gray-300">Checking connection...</span>
        </div>
      ) : (
        <div>
          <div
            className={`text-lg font-medium ${
              status.includes("successful") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {status}
          </div>

          {details && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
              <pre className="text-xs text-gray-800 dark:text-gray-200">{JSON.stringify(details, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ServerTest

