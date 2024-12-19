
import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import multer from "multer";
import cors from "cors";
import records from "./routes/record.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5050;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/record", records);

app.use(express.static(path.join(__dirname, '/client/dist')));

// Define uploads directory using Render's persistent disk if available
const UPLOADS_DIR = process.env.RENDER_DISK_PATH 
  ? path.join(process.env.RENDER_DISK_PATH, "uploads")
  : path.join(__dirname, "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve static files for uploaded images
app.use("/uploads", express.static(UPLOADS_DIR));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Image upload endpoint
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// render client
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '/client/dist/index.html')));

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5050;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/record", records);

app.use(express.static(path.join(__dirname, '/client/dist')));

// render client
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '/client/dist/index.html')));


// Serve static files for uploaded images
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}
app.use("/uploads", express.static(UPLOADS_DIR));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Image upload endpoint
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const imageUrl = `https://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
