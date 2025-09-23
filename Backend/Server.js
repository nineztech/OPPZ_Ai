import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sequelize } from './config/dbConnection.js';
import routes from './routes/index.js';
import dotenv from 'dotenv';
import http from 'http';              // ✅ import http
import { WebSocketServer } from 'ws'; // ✅ import ws

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5006;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Enable CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4000',
    'https://www.oppzai.com',
    'chrome-extension://edejolphacgbhddjeoomiadkgfaocjcj',
    'chrome-extension://hmjkmddeonifkflejbicnapamlfejdim',
    'moz-extension://*',
    process.env.USER_URL,
    process.env.ADMIN_URL,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date(), port: PORT });
});

// ✅ Create HTTP server instead of app.listen
const server = http.createServer(app);

// ✅ Attach WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');

  ws.on('message', (msg) => {
    console.log('📩 Received:', msg.toString());
    ws.send(`Echo: ${msg}`); // test reply
  });

  ws.send('👋 Welcome to OPPZ AI WebSocket!');
});

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync();
    console.log('✅ Models synced');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket running at ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
