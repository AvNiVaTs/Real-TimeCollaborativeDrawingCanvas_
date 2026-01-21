# Architecture

This document explains how the code works.

## Data Flow Diagram

1.  **You Draw:** When you click and drag your mouse, the browser draws a line on your screen immediately so it feels fast.
2.  **Sending:** As you move, your browser sends small pieces of that line to the Server.
3.  **Broadcasting:** The Server immediately sends those pieces to everyone else so they see you drawing live.
4.  **Saving:** When you let go of the mouse, your browser sends the full finished line to the Server.
5.  **Confirming:** The Server saves that line to a list and tells everyone, "Okay, this line is officially done and saved."

## WebSocket Protocol

We use a tool called Socket.io to send messages back and forth. Here are the messages used:

* **`cursor:move`**: "My mouse is at this position (X, Y)."
* **`stroke:segment`**: "I am currently drawing this small piece of a line."
* **`stroke:end`**: "I finished drawing this line. Please save it."
* **`stroke:commit`**: "I (the server) have saved this line. Everyone should add it to their permanent picture."
* **`undo`**: "Please hide the last line that was drawn."
* **`redo`**: "Please show the line we just hid."

## Undo/Redo Strategy

We handle undo and redo globally, meaning it affects the whole board for everyone.

* **The List:** The server keeps a simple list of every line ever drawn, in order.
* **Active Flag:** Each line has a simple "on/off" switch (called `active`).
* **Undo:** When someone clicks Undo, the server looks for the last "on" line and turns it "off." Then it tells everyone to redraw the board.
* **Redo:** The server looks for the last "off" line and turns it back "on."

## Performance Decisions

* **Percentages, not Pixels:** We save points as percentages of the screen (e.g., "50% across" instead of "500 pixels"). This ensures the drawing looks correct whether you are on a big computer monitor or a small phone screen.
* **Segments vs. Whole Lines:** We send the drawing in tiny chunks as it happens. If we waited until you finished the line to send it, other users would not see you drawing in real-time; the line would just pop into existence all at once.

## Conflict Resolution

* **First Come, First Served:** Simple rule: whoever's message reaches the server first gets saved first.
* **Simultaneous Drawing:** If two people draw at the exact same time, the server just adds both lines to the list. Since we just add lines on top of each other, nothing breaks—both drawings will simply appear.