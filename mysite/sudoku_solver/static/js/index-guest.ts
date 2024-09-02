import { start } from "./index.js";
import { GuestBoard } from "./board.js";
import { CanvasRenderer } from "./canvas-renderer.js";
import { WinPopupNotification } from "./win-notification.js";

window.addEventListener("load", () => start(new GuestBoard(new CanvasRenderer(), new WinPopupNotification())));