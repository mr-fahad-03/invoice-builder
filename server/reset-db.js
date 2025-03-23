import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database file path
const dbFile = path.join(__dirname, "database.sqlite")

// Check if database file exists
if (fs.existsSync(dbFile)) {
  console.log(`Removing existing database file: ${dbFile}`)

  try {
    // Delete the database file
    fs.unlinkSync(dbFile)
    console.log("Database file deleted successfully.")
    console.log("The database will be recreated when you restart the server.")
  } catch (error) {
    console.error("Error deleting database file:", error)
  }
} else {
  console.log("No database file found. Nothing to reset.")
}

