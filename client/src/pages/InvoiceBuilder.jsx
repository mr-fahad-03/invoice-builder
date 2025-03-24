"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { Search, ShoppingCart, Download, Trash2, Plus, Minus } from "lucide-react"

const InvoiceBuilder = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")

  useEffect(() => {
    fetchProducts()

    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const fetchProducts = async () => {
    try {
      const response = await fetch("https://invoice-builder-iota.vercel.app/api/products")
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

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })

    toast.success(`Added ${product.name} to invoice`)
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item)))
  }

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
    toast.success("Item removed from invoice")
  }

  const clearCart = () => {
    setCart([])
    setCustomerName("")
    setCustomerPhone("")
    setCustomerAddress("")
    toast.success("Invoice cleared")
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const generateInvoicePDF = () => {
    if (cart.length === 0) {
      toast.error("Cannot generate empty invoice")
      return
    }

    if (!customerName) {
      toast.error("Please enter customer name")
      return
    }

    try {
      const doc = new jsPDF({
        format: "a5",
        unit: "mm",
      })
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Set white background
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, "F")

      // Set text color to black
      doc.setTextColor(0, 0, 0)

      // Company info at top right
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Pak Madina Solar Energy", pageWidth - 10, 15, { align: "right" })
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text("Iqbal Nagar Road, Near Pso Pump, 90-Morr Tehsil Chichawatni,Dist Sahiwal", pageWidth - 10, 20, {
        align: "right",
      })
      doc.text("Tel: 0342-8674296", pageWidth - 10, 25, { align: "right" })
      doc.text("Tel: 0307-7554307", pageWidth - 10, 30, { align: "right" })

      // Invoice heading
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("INVOICE", 10, 40)

      // Invoice details
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text("Invoice No:", 10, 50)
      doc.text("Date:", pageWidth - 40, 50)
      doc.text("Bill to:   Name :", 10, 60)
      doc.text("Adress :", 20, 65)
    

      doc.setFont("helvetica", "normal")
      doc.text(invoiceNumber, 35, 50)
      doc.text(date, pageWidth - 30, 50)

      // Customer info
      doc.text(customerName, 35, 60)
      if (customerAddress) {
        const addressLines = doc.splitTextToSize(customerAddress, 80)
        for (let i = 0; i < addressLines.length; i++) {
          doc.text(addressLines[i], 35, 65 + i * 5)
        }
      }
      if (customerPhone) {
        doc.text(`Tel: ${customerPhone}`, 35, 75)
      }

      // Draw line separator
      doc.setDrawColor(0, 0, 0)
      doc.line(10, 80, pageWidth - 10, 80)

      // Invoice items table
      const tableHeaders = [["Item", "Description", "Qty", "Price", "Amount"]]
      const tableData = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity
        return [
          (index + 1).toString(),
          item.name,
          item.quantity.toString(),
          `Rs${item.price.toFixed(2)}`,
          `Rs${itemTotal.toFixed(2)}`,
        ]
      })

      doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: 85,
        theme: "plain",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 60 },
          2: { cellWidth: 10, halign: "center" },
          3: { cellWidth: 15, halign: "right" },
          4: { cellWidth: 15, halign: "right" },
        },
        margin: { left: 10, right: 10 },
        didDrawCell: (data) => {
          // Add border to each cell
          if (data.section === "head" || data.section === "body") {
            const { x, y, width, height } = data.cell
            doc.setDrawColor(0, 0, 0)
            doc.rect(x, y, width, height, "S")
          }
        },
      })

      const finalY = doc.lastAutoTable.finalY || 180

      // Payment terms
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.text("Payment Terms:", 10, finalY + 10)
      doc.setFont("helvetica", "italic")
      doc.text("Payment due within 30 days", 40, finalY + 10)

      // Bank details
      doc.setFont("helvetica", "bold")
      doc.text("Payment Method:", 10, finalY + 15)
      doc.text("For Online Payment ", 10, finalY + 20)
      doc.text("Bank Account:", 10, finalY + 25)

      doc.setFont("helvetica", "normal")
      doc.text(" Cash / Online Payment", 40, finalY + 15)
      doc.text("_____________________", 40, finalY + 25)

      // Totals
      doc.setFontSize(9)
      doc.text("Subtotal", pageWidth - 50, finalY + 10)
      doc.text("Tax (0%)", pageWidth - 50, finalY + 15)
      doc.setFont("helvetica", "bold")
      doc.text("Total", pageWidth - 50, finalY + 20)

      const subtotal = calculateTotal()
      const tax = 0
      const total = subtotal + tax

      doc.setFont("helvetica", "normal")
      doc.text(`Rs${subtotal.toFixed(2)}`, pageWidth - 10, finalY + 10, { align: "right" })
      doc.text(`Rs${tax.toFixed(2)}`, pageWidth - 10, finalY + 15, { align: "right" })
      doc.setFont("helvetica", "bold")
      doc.text(`Rs${total.toFixed(2)}`, pageWidth - 10, finalY + 20, { align: "right" })

      // Signature
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text("Signature", pageWidth - 20, finalY + 32, { align: "right" })
      doc.line(pageWidth - 50, finalY + 28, pageWidth - 10, finalY + 28)

      // Footer
      doc.setDrawColor(0, 0, 0)
      doc.line(10, finalY + 35, pageWidth - 10, finalY + 35)
      doc.setFontSize(7)
      doc.text("If you want to creat such Payment Invoice System Please Contact Us", pageWidth / 2, finalY + 40, {
        align: "center",
      })
      doc.text("Phone Number: 0342-0072298",pageWidth / 2, finalY + 43, {
        align: "center",})

      // Instead of just saving, we'll both download and open the PDF
      const pdfOutput = doc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfOutput)

      // Create a link element to trigger download
      const downloadLink = document.createElement("a")
      downloadLink.href = pdfUrl
      downloadLink.download = `Invoice_${invoiceNumber}.pdf`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      // Open the PDF in a new tab
      window.open(pdfUrl, "_blank")

      toast.success("Invoice PDF generated")

      // Save invoice to local storage and server
      saveInvoice(invoiceNumber)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error(`Error generating PDF: ${error.message}`)
    }
  }

  const saveInvoice = (invoiceNumber) => {
    try {
      const subtotal = calculateTotal()
      const tax = 0
      const total = subtotal + tax

      const invoice = {
        id: invoiceNumber,
        date: new Date().toISOString(),
        customerName,
        customerPhone: customerPhone || "",
        customerAddress: customerAddress || "",
        items: cart,
        subtotal: subtotal,
        tax: tax,
        total: total,
      }

      console.log("Preparing to save invoice:", invoice) // Debug log

      // Get existing invoices
      const savedInvoices = JSON.parse(localStorage.getItem("invoices") || "[]")
      savedInvoices.push(invoice)

      // Save updated invoices
      localStorage.setItem("invoices", JSON.stringify(savedInvoices))

      // Also save to server
      saveInvoiceToServer(invoice)
    } catch (error) {
      console.error("Error in saveInvoice:", error)
      toast.error(`Error preparing invoice: ${error.message}`)
    }
  }

  const saveInvoiceToServer = async (invoice) => {
    try {
      console.log("Sending to server:", JSON.stringify(invoice)) // Debug log

      const response = await fetch("https://invoice-builder-iota.vercel.app/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      })

      // Get the response text regardless of status
      const responseText = await response.text()

      // Try to parse as JSON if possible
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        data = { message: responseText }
      }

      if (!response.ok) {
        throw new Error(data.message || `Server returned ${response.status}: ${responseText}`)
      }

      toast.success("Invoice saved successfully")
    } catch (error) {
      console.error("Full error details:", error)
      toast.error(`Error saving invoice: ${error.message}`)
    }
  }

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Grid */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Products</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => addToCart(product)}
              >
                <div className="h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <img
                    src={`https://invoice-builder-iota.vercel.app/${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=160&width=320"
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">Rs{product.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Current Invoice</h2>
          <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={customerPhone || ""}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea
              value={customerAddress || ""}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter customer address"
              rows="2"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={customerEmail || ""}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter email"
            />
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8 border-t border-b border-gray-200 dark:border-gray-700 my-4">
            <p className="text-gray-500 dark:text-gray-400">No items in invoice</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Click on products to add them to the invoice
            </p>
          </div>
        ) : (
          <div className="border-t border-gray-200 dark:border-gray-700 my-4">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {cart.map((item) => (
                <li key={item.id} className="py-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-800 dark:text-white">{item.name}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-gray-700 dark:text-gray-300">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Rs{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <div className="flex justify-between items-center font-bold text-lg">
                <span className="text-gray-800 dark:text-white">Total:</span>
                <span className="text-blue-600 dark:text-blue-400">Rs{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-3 mt-6">
          <button
            onClick={generateInvoicePDF}
            disabled={cart.length === 0}
            className="flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5 mr-2" />
            Generate PDF
          </button>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="flex items-center justify-center py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Clear Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceBuilder

