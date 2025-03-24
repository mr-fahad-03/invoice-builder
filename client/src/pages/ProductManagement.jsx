"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { Plus, Edit, Trash2, X, Save, Image } from "lucide-react"

const ProductManagement = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: "",
    price: "",
    description: "",
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("https://invoice-builder-api.vercel.app/api/products")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch products")
      }

      setProducts(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (product = null) => {
    if (product) {
      setCurrentProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description || "",
      })
      setImagePreview(`https://invoice-builder-api.vercel.app/${product.image}`)
      setIsEditing(true)
    } else {
      setCurrentProduct({
        id: null,
        name: "",
        price: "",
        description: "",
      })
      setImagePreview("")
      setImageFile(null)
      setIsEditing(false)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentProduct({
      id: null,
      name: "",
      price: "",
      description: "",
    })
    setImagePreview("")
    setImageFile(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCurrentProduct((prev) => ({
      ...prev,
      [name]: name === "price" ? Number.parseFloat(value) || "" : value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const validateForm = () => {
    if (!currentProduct.name.trim()) {
      toast.error("Product name is required")
      return false
    }

    if (!currentProduct.price || currentProduct.price <= 0) {
      toast.error("Valid price is required")
      return false
    }

    if (!isEditing && !imageFile) {
      toast.error("Product image is required")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    const formData = new FormData()
    formData.append("name", currentProduct.name)
    formData.append("price", currentProduct.price)
    formData.append("description", currentProduct.description)

    if (imageFile) {
      formData.append("image", imageFile)
    }

    try {
      const url = isEditing
        ? `https://invoice-builder-api.vercel.app/api/products/${currentProduct.id}`
        : "https://invoice-builder-api.vercel.app/api/products"

      const method = isEditing ? "PUT" : "POST"

      // Get the auth token from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const token = user.token

      if (!token) {
        toast.error("Authentication required. Please log in again.")
        return
      }

      const response = await fetch(url, {
        method,
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to save product")
      }

      toast.success(isEditing ? "Product updated successfully" : "Product added successfully")
      fetchProducts()
      closeModal()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      // Get the auth token from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const token = user.token

      if (!token) {
        toast.error("Authentication required. Please log in again.")
        return
      }

      const response = await fetch(`https://invoice-builder-api.vercel.app/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete product")
      }

      toast.success("Product deleted successfully")
      fetchProducts()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No products found</p>
          <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img
                        src={`https://invoice-builder-api.vercel.app/${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">Rs{product.price.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(product)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentProduct.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={currentProduct.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter price"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={currentProduct.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter product description"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Image
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div
                    onClick={triggerFileInput}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="mx-auto h-40 object-contain"
                        />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click to change image</p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click to upload product image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManagement

