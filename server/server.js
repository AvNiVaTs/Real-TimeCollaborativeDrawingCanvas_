const http = require("http");
const {Server} = require("socket.io");
const crypto = require("crypto");

const server = http.createServer();
const io = new Server(server, {
    cors: {origin: "*"}
});

const connectedUsers = {};
const strokes = [];

io.on("connection", (socket) => {
  //User
  const user = {
    id: socket.id,
    color: `hsl(${Math.random() * 360}, 100%, 70%)`
  };

  connectedUsers[socket.id] = user;

  socket.emit("user:init", user);
  socket.emit("user:existing", connectedUsers);
  socket.broadcast.emit("user:join", user);

  socket.on("disconnect", () => {
    delete connectedUsers[socket.id];
    socket.broadcast.emit("user:leave", socket.id);
  });

  //Cursor
  socket.on("cursor:move", (pos)=>{
    socket.broadcast.emit("cursor:move", {
      userId: socket.id,
      x: pos.x,
      y: pos.y
    });
  });

  socket.on("stroke:segment", (segment) => {
    socket.broadcast.emit("stroke:segment", segment);
  });

  socket.on("stroke:end", (stroke) => {
    if (!stroke || !stroke.points) return;

    const committedStroke = {
      ...stroke,
      id: crypto.randomUUID(),
      userId: socket.id,
      active: true,
      timestamp: Date.now()
    };

    strokes.push(committedStroke);

    // send to ALL clients (including sender)
    io.emit("stroke:commit", committedStroke);
  });

  socket.on("undo", () => {
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].active) {
        strokes[i].active = false;
        io.emit("stroke:undo", strokes[i].id);
        break;
      }
    }
  });

  socket.on("redo", () => {
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (!strokes[i].active) {
        strokes[i].active = true;
        io.emit("stroke:redo", strokes[i]);
        break;
      }
    }
  });

});

server.listen(3000, ()=>{
    console.log("Websockets server running on port 3000");
});