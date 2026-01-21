const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const rooms = require("./rooms");
const drawingState = require("./drawing-state");

// Locate client folder relative to this file
const CLIENT_DIR = path.join(__dirname, "..", "client");

const server = http.createServer((req, res) => {
  let filePath = path.join(
    CLIENT_DIR,
    req.url === "/" ? "index.html" : req.url
  );

  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css"
  };

  const contentType = mimeTypes[ext] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  // --- User Management ---
  const user = rooms.addUser(socket.id);

  socket.emit("user:init", user);
  socket.emit("canvas:sync", drawingState.getAllStrokes());
  socket.emit("user:existing", rooms.getAllUsers());
  socket.broadcast.emit("user:join", user);

  // --- Cursors ---
  socket.on("cursor:move", (pos) => {
    socket.broadcast.emit("cursor:move", {
      userId: socket.id,
      x: pos.x,
      y: pos.y
    });
  });

  // --- Drawing ---
  socket.on("stroke:segment", (segment) => {
    socket.broadcast.emit("stroke:segment", segment);
  });

  socket.on("stroke:end", (stroke) => {
    const committedStroke = drawingState.addStroke(stroke, socket.id);
    if (committedStroke) {
      io.emit("stroke:commit", committedStroke);
    }
  });

  // --- Undo/Redo ---
  socket.on("undo", () => {
    const undoneStrokeId = drawingState.undo();
    if (undoneStrokeId) {
      io.emit("stroke:undo", undoneStrokeId);
    }
  });

  socket.on("redo", () => {
    const redoneStroke = drawingState.redo();
    if (redoneStroke) {
      io.emit("stroke:redo", redoneStroke);
    }
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    rooms.removeUser(socket.id);
    socket.broadcast.emit("user:leave", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});