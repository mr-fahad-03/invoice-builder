"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { Sun, Moon, LogOut, User } from "lucide-react"

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { darkMode, toggleTheme } = useTheme()

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold ml-9 text-blue-600 dark:text-blue-400">
              Pak Madina Solar Energy
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/admin"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-gray-700 dark:text-gray-200">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

