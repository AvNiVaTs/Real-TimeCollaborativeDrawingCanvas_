import { socket, initSocket } from './websocket.js';
import { canvas, ctx, drawStroke, redrawAll, normalisePoints } from './canvas.js';

// --- State ---
let currStroke = null;
const strokeMap = new Map();
let drawing = false;
let users = {};
let myUser = null;
let myCursor = null;
let mySocketId = null;

// Tools
let tool = "brush";
let strokeColor = "#000000";
let strokeWidth = 2;

// --- Helper: Render Users ---
function renderUsers() {
    const list = document.getElementById("usersList");
    list.innerHTML = "";
    Object.values(users).forEach((user) => {
        const dot = document.createElement("div");
        dot.className = "user-dot";
        dot.style.backgroundColor = user.color;
        list.appendChild(dot);
    });
}

// --- Helper: Render Cursors ---
function renderCursor(userId, x, y) {
    if (userId === mySocketId) return;
    if (!users[userId]) return;

    let cursor = document.getElementById(`cursor-${userId}`);

    if (!cursor) {
        cursor = document.createElement("div");
        cursor.id = `cursor-${userId}`;
        cursor.className = "cursor";
        cursor.style.backgroundColor = users[userId].color;
        document.getElementById("canvas-container").appendChild(cursor);
    }

    cursor.style.left = `${x * canvas.width}px`;
    cursor.style.top = `${y * canvas.height}px`;
}

// --- Initialize Socket ---
initSocket({
    onConnect: () => {
        mySocketId = socket.id;
    },
    onStrokeSegment: (segment) => {
        drawStroke(segment);
    },
    onStrokeCommit: (stroke) => {
        strokeMap.set(stroke.id, stroke);
        redrawAll(strokeMap);
    },
    onStrokeUndo: (strokeId) => {
        const stroke = strokeMap.get(strokeId);
        if (stroke) {
            stroke.active = false;
            redrawAll(strokeMap);
        }
    },
    onStrokeRedo: (stroke) => {
        strokeMap.set(stroke.id, stroke);
        redrawAll(strokeMap);
    },
    onUserInit: (user) => {
        myUser = user;
        users[user.id] = user;
        renderUsers();
    },
    onUserExisting: (existingUsers) => {
        users = { ...existingUsers };
        renderUsers();
    },
    onUserJoin: (user) => {
        users[user.id] = user;
        renderUsers();
    },
    onUserLeave: (userId) => {
        delete users[userId];
        renderUsers();
        const cursor = document.getElementById(`cursor-${userId}`);
        if(cursor) cursor.remove();
    },
    onCursorMove: ({ userId, x, y }) => {
        renderCursor(userId, x, y);
    }
});

// --- UI Event Listeners ---
const colorPicker = document.getElementById("colorPicker");
const widthPicker = document.getElementById("widthPicker");
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");

colorPicker.addEventListener("change", (e) => strokeColor = e.target.value);
widthPicker.addEventListener("input", (e) => strokeWidth = Number(e.target.value));

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

window.addEventListener("resize", () => {
    if (drawing) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawAll(strokeMap);
});

window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") socket.emit("undo");
    if (e.ctrlKey && e.key === "y") socket.emit("redo");
});

// --- Drawing Event Listeners ---
canvas.addEventListener("mousedown", (e) => {
    if (!myUser) return;
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currStroke = {
        tool,
        color: strokeColor,
        width: strokeWidth,
        points: [normalisePoints(x, y)]
    };
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Local cursor
    if (myCursor) {
        myCursor.style.left = `${x}px`;
        myCursor.style.top = `${y}px`;
    }

    // Network cursor
    if (myUser) {
        socket.emit("cursor:move", normalisePoints(x, y));
    }

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

const endDrawing = () => {
    if (!currStroke) {
        drawing = false;
        return;
    }
    drawing = false;
    socket.emit("stroke:end", currStroke);
    currStroke = null;
};

canvas.addEventListener("mouseup", endDrawing);
canvas.addEventListener("mouseleave", endDrawing);