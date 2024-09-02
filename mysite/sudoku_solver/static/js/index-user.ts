import { start } from "./index.js";
import { UserBoard } from "./board.js";
import { CanvasRenderer } from "./canvas-renderer.js";
import { WinPopupNotification } from "./win-notification.js";

window.addEventListener("load", () => start(new UserBoard(new CanvasRenderer(), new WinPopupNotification())));