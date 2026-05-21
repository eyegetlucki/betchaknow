// Singleton Socket.io client — import getSocket() anywhere to use it
import { io } from "socket.io-client";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

let _socket = null;

export function getSocket() {
  if (!_socket) {
    _socket = io(SERVER, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return _socket;
}

export function connectSocket() {
  const token = localStorage.getItem("bk_token") || "";
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
