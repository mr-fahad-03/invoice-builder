"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Package, FileText, BarChart2 } from "lucide-react"

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch stats from server
      const response = await fetch("https://invoice-builder-iota.vercel.app/api/stats")
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/products" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Manage Products →
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-4">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalInvoices}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/invoices" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  View Invoices →
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-4">
                  <BarChart2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs{stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
              <div className="space-y-4">
                <Link
                  to="/admin/products"
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Manage Products</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit or remove products</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/admin/invoices"
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">View Invoices</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Browse and manage customer invoices</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">System Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Version</span>
                  <span className="text-gray-900 dark:text-white">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Database</span>
                  <span className="text-gray-900 dark:text-white">SQLite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Backup</span>
                  <span className="text-gray-900 dark:text-white">Never</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard

