Live Link: [https://real-timecollaborativedrawingcanvas.onrender.com/](https://real-timecollaborativedrawingcanvas.onrender.com/)

# Real Time Collaborative Drawing Canvas

This is a drawing app that lets multiple people draw on the same screen at the same time. It works like a digital whiteboard.

## Setup Instructions

1.  **Install the tools:**
    Open your terminal in this folder and run:
    ```bash
    npm install
    ```

2.  **Start the app:**
    Run this command:
    ```bash
    npm start
    ```

3.  **Open in Browser:**
    Go to `http://localhost:3000` in your web browser.

## How to Test with Multiple Users

1.  Open the link (`http://localhost:3000`) in one tab. This is "User A".
2.  Open the same link in a **new tab** or a **different browser window**. This is "User B".
3.  Move your mouse in one window; you will see a colored dot move in the other window.
4.  Draw something in one window, and it will appear instantly in the other.
5.  Try clicking Ctrl+Z and Ctrl+Y in one window to Undo and Redo the line in both windows.

## Known Limitations and Bugs

* **Global Undo:** If you "Undo", it removes the last line drawn by *anyone*, not necessarily the line *you* just drew.
* **Memory Usage:** If you draw for a very long time without refreshing the page, the browser might get slow because it remembers every single line.
* **No Private Rooms:** Everyone who visits the website sees the exact same drawing. You cannot create a private board.
* **Mobile Scrolling:** On some phones, trying to draw might accidentally scroll the page instead.

## Time Spent
Approximately 10-12 hours.
