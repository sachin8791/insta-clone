require("dotenv").config({ path: "./config/dev.env" });
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const UserRouter = require("./routes/User");
const PostRouter = require("./routes/Post");
require("./db/mongoose");

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://192.168.93.78:5173"];

// Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

const server = http.createServer(app);

// Configure Socket.IO
const io = socketio(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});
app.set("socketio", io);

app.use(express.json());
app.use(bodyParser.json());

// Routers
app.use(uploadRoutes);
app.use(UserRouter);
app.use(PostRouter);
app.use("/api/auth", authRoutes);

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start Server
const PORT = process.env.SERVER_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
