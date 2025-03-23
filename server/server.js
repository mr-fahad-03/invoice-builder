import express from "express"
import cors from "cors"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"))
    }
  },
})

// Database setup
const dbFile = path.join(__dirname, "database.sqlite")
let db

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Initialize database
async function initializeDatabase() {
  try {
    db = await open({
      filename: dbFile,
      driver: sqlite3.Database,
    })

    console.log("Connected to database")

    // Drop and recreate the invoices table to ensure clean schema
    await db.exec(`
      DROP TABLE IF EXISTS invoices;
      
      CREATE TABLE invoices (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_address TEXT,
        date TEXT NOT NULL,
        items TEXT NOT NULL,
        subtotal REAL,
        tax REAL,
        total REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    console.log("Invoices table recreated")

    // Create other tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        image TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Check if admin user exists, if not create one
    const adminUser = await db.get("SELECT * FROM users WHERE email = ?", ["shahidsharif520@gmail.com"])

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("admin@520", 10)
      await db.run("INSERT INTO users (email, password) VALUES (?, ?)", ["shahidsharif520@gmail.com", hashedPassword])
      console.log("Admin user created")
    }
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" })
    }

    req.user = user
    next()
  })
}

// Routes

// Auth routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email])

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      id: user.id,
      email: user.email,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Product routes
app.get("/api/products", async (req, res) => {
  try {
    const products = await db.all("SELECT * FROM products ORDER BY created_at DESC")
    res.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await db.get("SELECT * FROM products WHERE id = ?", [req.params.id])

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/products", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body

    if (!name || !price || !req.file) {
      return res.status(400).json({ message: "Name, price, and image are required" })
    }

    const imagePath = `uploads/${req.file.filename}`

    const result = await db.run("INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)", [
      name,
      price,
      description || "",
      imagePath,
    ])

    const newProduct = await db.get("SELECT * FROM products WHERE id = ?", [result.lastID])

    res.status(201).json(newProduct)
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/products/:id", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body
    const productId = req.params.id

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" })
    }

    const existingProduct = await db.get("SELECT * FROM products WHERE id = ?", [productId])

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    let imagePath = existingProduct.image

    if (req.file) {
      // Delete old image if it exists
      if (existingProduct.image && fs.existsSync(path.join(__dirname, existingProduct.image))) {
        fs.unlinkSync(path.join(__dirname, existingProduct.image))
      }

      imagePath = `uploads/${req.file.filename}`
    }

    await db.run("UPDATE products SET name = ?, price = ?, description = ?, image = ? WHERE id = ?", [
      name,
      price,
      description || "",
      imagePath,
      productId,
    ])

    const updatedProduct = await db.get("SELECT * FROM products WHERE id = ?", [productId])

    res.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/products/:id", authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id

    const existingProduct = await db.get("SELECT * FROM products WHERE id = ?", [productId])

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Delete image file
    if (existingProduct.image && fs.existsSync(path.join(__dirname, existingProduct.image))) {
      fs.unlinkSync(path.join(__dirname, existingProduct.image))
    }

    await db.run("DELETE FROM products WHERE id = ?", [productId])

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Invoice routes
app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await db.all("SELECT * FROM invoices ORDER BY date DESC")

    // Parse items JSON
    const parsedInvoices = invoices.map((invoice) => ({
      ...invoice,
      items: JSON.parse(invoice.items),
    }))

    res.json(parsedInvoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/invoices/:id", async (req, res) => {
  try {
    const invoice = await db.get("SELECT * FROM invoices WHERE id = ?", [req.params.id])

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" })
    }

    // Parse items JSON
    invoice.items = JSON.parse(invoice.items)

    res.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/invoices", async (req, res) => {
  try {
    const { id, customerName, customerPhone, customerAddress, date, items, subtotal, tax, total } = req.body

    // Log the entire request body for debugging
    console.log("Invoice request body:", JSON.stringify(req.body, null, 2))

    if (!id || !customerName || !date || !items || !total) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const itemsJson = JSON.stringify(items)

    // Log the values being inserted into the database
    console.log("Inserting invoice with values:", {
      id,
      customerName,
      customerPhone: customerPhone || "",
      customerAddress: customerAddress || "",
      date,
      itemsCount: items.length,
      subtotal: subtotal || 0,
      tax: tax || 0,
      total,
    })

    try {
      await db.run(
        "INSERT INTO invoices (id, customer_name, customer_phone, customer_address, date, items, subtotal, tax, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, customerName, customerPhone || "", customerAddress || "", date, itemsJson, subtotal || 0, tax || 0, total],
      )

      console.log("Invoice inserted successfully")
      res.status(201).json({ message: "Invoice created successfully" })
    } catch (dbError) {
      console.error("Database error:", dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }
  } catch (error) {
    console.error("Error creating invoice:", error)
    console.error("Error stack:", error.stack)
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    })
  }
})

app.delete("/api/invoices/:id", async (req, res) => {
  try {
    const invoiceId = req.params.id

    const existingInvoice = await db.get("SELECT * FROM invoices WHERE id = ?", [invoiceId])

    if (!existingInvoice) {
      return res.status(404).json({ message: "Invoice not found" })
    }

    await db.run("DELETE FROM invoices WHERE id = ?", [invoiceId])

    res.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Stats route
app.get("/api/stats", async (req, res) => {
  try {
    const totalProducts = await db.get("SELECT COUNT(*) as count FROM products")
    const totalInvoices = await db.get("SELECT COUNT(*) as count FROM invoices")
    const totalRevenue = await db.get("SELECT SUM(total) as sum FROM invoices")

    res.json({
      totalProducts: totalProducts.count || 0,
      totalInvoices: totalInvoices.count || 0,
      totalRevenue: totalRevenue.sum || 0,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Test endpoint to verify database connection
app.get("/api/test", async (req, res) => {
  try {
    // Try a simple query
    const result = await db.get("SELECT 1 as test")
    res.json({
      message: "Database connection successful",
      result,
      tables: await db.all("SELECT name FROM sqlite_master WHERE type='table'"),
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    })
  }
})

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  console.error("Error stack:", err.stack)
  res.status(500).json({
    message: "An unexpected error occurred",
    error: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  })
})

// Start server with better error handling
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err)
    console.error("Error stack:", err.stack)
    process.exit(1)
  })

