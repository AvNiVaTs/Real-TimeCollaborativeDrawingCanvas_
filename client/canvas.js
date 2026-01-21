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

    const { color, width, points } = stroke;

    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;

    ctx.beginPath();

    const start = denormalisePoints(points[0].x, points[0].y);
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < points.length; i++) {
        const p = denormalisePoints(points[i].x, points[i].y);
        ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
}

export function redrawAll(strokeMap) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokeMap.values()) {
        if (stroke.active) {
            drawStroke(stroke);
        }
    }
}