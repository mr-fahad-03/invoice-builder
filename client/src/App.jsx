import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import InvoiceBuilder from "./pages/InvoiceBuilder"
import AdminDashboard from "./pages/AdminDashboard"
import ProductManagement from "./pages/ProductManagement"
import InvoiceManagement from "./pages/InvoiceManagement"
import Navbar from "./components/Navbar"

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Toaster position="top-right" />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<InvoiceBuilder />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute>
                      <ProductManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/invoices"
                  element={
                    <ProtectedRoute>
                      <InvoiceManagement />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>

  )
}

export default App

