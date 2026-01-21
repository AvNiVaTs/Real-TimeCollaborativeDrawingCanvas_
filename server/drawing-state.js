const crypto = require("crypto");

const strokes = [];

function addStroke(stroke, userId) {
    if (!stroke || !stroke.points) return null;

    const committedStroke = {
        ...stroke,
        id: crypto.randomUUID(),
        userId: userId,
        active: true,
        timestamp: Date.now()
    };

    strokes.push(committedStroke);
    return committedStroke;
}

function undo() {
    for (let i = strokes.length - 1; i >= 0; i--) {
        if (strokes[i].active) {
            strokes[i].active = false;
            return strokes[i].id;
        }
    }
    return null;
}

function redo() {
    for (let i = strokes.length - 1; i >= 0; i--) {
        if (!strokes[i].active) {
            strokes[i].active = true;
            return strokes[i];
        }
    }
    return null;
}

module.exports = {
    addStroke,
    undo,
    redo
};