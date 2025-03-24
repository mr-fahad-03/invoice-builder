"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Download, Search } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("https://invoice-builder-iota.vercel.app/api/invoices")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch invoices")
      }

      setInvoices(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const regenerateInvoicePDF = (invoice) => {
    if (!invoice || !invoice.items) {
      toast.error("Invalid invoice data")
      return
    }

    const doc = new jsPDF({
      format: "a5",
      unit: "mm",
    })
    const invoiceNumber = invoice.id
    const date = new Date(invoice.date).toLocaleDateString("en-US", {
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
    doc.text("Date:", pageWidth - 50, 50)
    doc.text("Bill to:", 10, 60)

    doc.setFont("helvetica", "normal")
    doc.text(invoiceNumber, 35, 50)
    doc.text(date, pageWidth - 25, 50)

    // Customer info
    doc.text(invoice.customer_name, 35, 60)
    if (invoice.customer_address) {
      const addressLines = doc.splitTextToSize(invoice.customer_address, 80)
      for (let i = 0; i < addressLines.length; i++) {
        doc.text(addressLines[i], 35, 65 + i * 5)
      }
    }
    if (invoice.customer_phone) {
      doc.text(`Tel: ${invoice.customer_phone}`, 35, 75)
    }

    // Draw line separator
    doc.setDrawColor(0, 0, 0)
    doc.line(10, 80, pageWidth - 10, 80)

    // Invoice items table
    const tableHeaders = [["Item", "Description", "Qty", "Price", "Amount"]]
    const tableData = invoice.items.map((item, index) => {
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
    doc.text("Bank Name:", 10, finalY + 15)
    doc.text("Bank Account:", 10, finalY + 20)

    doc.setFont("helvetica", "normal")
    doc.text("YourBank", 40, finalY + 15)
    doc.text("0123 4567 8901", 40, finalY + 20)

    // Totals
    doc.setFontSize(9)
    doc.text("Subtotal", pageWidth - 50, finalY + 10)
    doc.text("Tax (10%)", pageWidth - 50, finalY + 15)
    doc.setFont("helvetica", "bold")
    doc.text("Total", pageWidth - 50, finalY + 20)

    doc.setFont("helvetica", "normal")
    doc.text(`Rs${invoice.subtotal.toFixed(2)}`, pageWidth - 10, finalY + 10, { align: "right" })
    doc.text(`Rs${invoice.tax.toFixed(2)}`, pageWidth - 10, finalY + 15, { align: "right" })
    doc.setFont("helvetica", "bold")
    doc.text(`Rs${invoice.total.toFixed(2)}`, pageWidth - 10, finalY + 20, { align: "right" })

    // Signature
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("Signature", pageWidth - 20, finalY + 30, { align: "right" })
    doc.line(pageWidth - 50, finalY + 28, pageWidth - 10, finalY + 28)

    // Footer
    doc.setDrawColor(0, 0, 0)
    doc.line(10, finalY + 35, pageWidth - 10, finalY + 35)
    doc.setFontSize(7)
    doc.text("If you have any questions please contact: contact@example.com", pageWidth / 2, finalY + 40, {
      align: "center",
    })

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
  }

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(
    (invoice) => invoice.customer_name && invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Invoice Management</h1>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by customer name..."
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
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No invoices found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{invoice.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{invoice.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Rs{invoice.total.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => regenerateInvoicePDF(invoice)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default InvoiceManagement

