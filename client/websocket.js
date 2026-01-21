export const socket = io();

export function initSocket(callbacks) {
    const {
        onStrokeSegment,
        onStrokeCommit,
        onStrokeUndo,
        onStrokeRedo,
        onUserInit,
        onUserExisting,
        onUserJoin,
        onUserLeave,
        onCursorMove,
        onConnect
    } = callbacks;

    socket.on("stroke:segment", onStrokeSegment);
    socket.on("stroke:end", (stroke) => {/*Handled locally*/});
    socket.on("stroke:commit", onStrokeCommit);
    socket.on("stroke:undo", onStrokeUndo);
    socket.on("stroke:redo", onStrokeRedo);

    socket.on("user:init", onUserInit);
    socket.on("user:existing", onUserExisting);
    socket.on("user:join", onUserJoin);
    socket.on("user:leave", onUserLeave);

    socket.on("cursor:move", onCursorMove);
    socket.on("connect", onConnect);

    socket.on("canvas:sync", (strokes) => {
        strokes.forEach(stroke => {
            callbacks.onStrokeCommit(stroke);
        });
    });
}