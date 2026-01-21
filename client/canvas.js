const socket = io();

//Defining Canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


//Store Strokes as data
let currStroke = null;
// let strokes = [];
const strokeMap = new Map();
let drawing = false;

//Defining user
let users = {};
let myUser = null;

//Defining Cursors
let myCursor = null;
let mySocketId = null;

//Defining tools
let tool = "brush";
let strokeColor = "#ffffff";
let strokeWidth = 2;


//Creating necessary functions

//1. Normalises points (coordinates: x, y)
/* The moment another user has a different screen size, the window is resized (or mobile joins) drawings will shift, stretch, or break.
    => So we store percentages of the canvas. */
function normalisePoints(x, y){
    return{
        x: x/canvas.width,
        y: y/canvas.height
    };
};

//2. Denormalises points (coordinates: x, y)
function denormalisePoints(x, y){
    return {
        x: x*canvas.width,
        y: y*canvas.height
    };
};

//3. Helps Create Strokes
function drawStroke(stroke){
    if(!stroke || !stroke.points) return;

    const {color, width, points} = stroke;

    if(points.length<2) return;

    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;

    ctx.beginPath();

    // Start from first point
    const start = denormalisePoints(points[0].x, points[0].y);//Denormalising Points
    ctx.moveTo(start.x, start.y);

    // Draw lines through all remaining points
    for(let i=1;i<points.length; i++){
        const p = denormalisePoints(points[i].x, points[i].y);//Denormalising Points
        ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
};

function redrawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokeMap.values()) {
    if (stroke.active) {
      drawStroke(stroke);
    }
  }
};


//Websockets to receive and render remote strokes
socket.on("stroke:segment", (segment)=>{
    drawStroke(segment);
});

socket.on("stroke:end", (stroke) => {
    if(!stroke || !stroke.points) return;
    // strokes.push(stroke);
});

socket.on("stroke:commit", (stroke) => {
  strokeMap.set(stroke.id, stroke);
  redrawAll();
});

socket.on("stroke:undo", (strokeId) => {
  const stroke = strokeMap.get(strokeId);
  if (stroke) {
    stroke.active = false;
    redrawAll();
  }
});

socket.on("stroke:redo", (stroke) => {
  strokeMap.set(stroke.id, stroke);
  redrawAll();
});


socket.on("user:init", (user)=>{
    myUser = user;
    users[user.id] = user;

    //Initial Cursor
    myCursor = document.createElement("div");
    myCursor.className = "cursor";
    myCursor.style.backgroundColor = myUser ? myUser.color : "white";
    myCursor.id = "cursor-me";
    
    document.getElementById("canvas-container").appendChild(myCursor);
});

socket.on("user:existing", (existingUsers) => {
    users = {...users, ...existingUsers};
})

socket.on("connect", () => {
    mySocketId = socket.id;
});

socket.on("user:join", (user)=>{
    users[user.id] = user;
});

socket.on("user:leave", (userId)=>{
    delete users[userId];

    const cursor = document.getElementById(`cursor-${userId}`);
    if(cursor) cursor.remove();
});

    //Client rendering
socket.on("cursor:move", ({userId, x, y})=>{
    if(userId===mySocketId) return;
    if(!users[userId]) return;

    let cursor = document.getElementById(`cursor-${userId}`);

    if(!cursor){
        cursor = document.createElement("div");
        cursor.id = `cursor-${userId}`;
        cursor.className = "cursor";
        cursor.style.backgroundColor = users[userId].color;
        document.getElementById("canvas-container").appendChild(cursor);
    }

    cursor.style.left = `${x*canvas.width}px`;
    cursor.style.top = `${y*canvas.height}px`;
});


//Setting Tools properties
const colorPicker = document.getElementById("colorPicker");
const widthPicker = document.getElementById("widthPicker");
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");

colorPicker.addEventListener("change", (e) => {
  strokeColor = e.target.value;
});

widthPicker.addEventListener("input", (e) => {
  strokeWidth = Number(e.target.value);
});

brushBtn.addEventListener("click", () => {
  tool = "brush";
  brushBtn.classList.add("active");
  eraserBtn.classList.remove("active");
});

eraserBtn.addEventListener("click", () => {
  tool = "eraser";
  eraserBtn.classList.add("active");
  brushBtn.classList.remove("active");
});


//windows event handlers
window.addEventListener("resize", () => {
    if(drawing) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // strokes.forEach(drawStroke);
    redrawAll();
});

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") {
    socket.emit("undo");
  }

  if (e.ctrlKey && e.key === "y") {
    socket.emit("redo");
  }
});


canvas.addEventListener("mousedown", (e)=>{
    if(!myUser) return;

    drawing = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currStroke = {
        color: tool === "eraser" ? "black" : strokeColor,
        width: strokeWidth,
        points: [normalisePoints(x, y)]
    }
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // MOVE YOUR CURSOR LOCALLY (IMMEDIATE)
    if (myCursor) {
        myCursor.style.left = `${x}px`;
        myCursor.style.top  = `${y}px`;
    }

    // SEND TO OTHERS
    if (myUser) {
        socket.emit("cursor:move", normalisePoints(x, y));
    }

    // ---- drawing ----
    if (!drawing || !currStroke) return;

    currStroke.points.push(normalisePoints(x, y));

    const pts = currStroke.points;
    if (pts.length < 2) return;

    const segment = {
        color: currStroke.color,
        width: currStroke.width,
        points: pts.slice(-2)
    };

    drawStroke(segment);
    socket.emit("stroke:segment", segment);
});

canvas.addEventListener("mouseup", ()=>{
    if(!currStroke){
        drawing = false;
        return;
    }
    
    drawing = false;

    // strokes.push(currStroke);
    socket.emit("stroke:end", currStroke);

    currStroke = null;
});

canvas.addEventListener("mouseleave", () => {
    if(!currStroke){
        drawing = false;
        return;
    }
    
    if(!drawing) return;
    drawing = false;

    // strokes.push(currStroke);
    socket.emit("stroke:end", currStroke);

    currStroke = null;
});