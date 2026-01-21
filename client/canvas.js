export const canvas = document.getElementById("canvas");
export const ctx = canvas.getContext("2d");

// Set initial size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

export function normalisePoints(x, y) {
    return {
        x: x / canvas.width,
        y: y / canvas.height
    };
}

export function denormalisePoints(x, y) {
    return {
        x: x * canvas.width,
        y: y * canvas.height
    };
}

export function drawStroke(stroke) {
    if (!stroke || !stroke.points) return;
    if (!stroke.active) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.width;

    if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
    }

    ctx.beginPath();
    const start = denormalisePoints(stroke.points[0].x, stroke.points[0].y);
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < stroke.points.length; i++) {
        const p = denormalisePoints(stroke.points[i].x, stroke.points[i].y);
        ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
    ctx.restore();
}

export function redrawAll(strokeMap) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokeMap.values()) {
        if (stroke.active) {
            drawStroke(stroke);
        }
    }
}