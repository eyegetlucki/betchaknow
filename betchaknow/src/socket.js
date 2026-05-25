// Singleton Socket.io client — import getSocket() anywhere to use it
import { io } from "socket.io-client";

const SERVER = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

let _socket = null;
let _connectedToken = null;

export function getSocket() {
  if (!_socket) {
    _socket = io(SERVER, {
      autoConnect: false,
      transports: ["polling", "websocket"],
    });
  }
  return _socket;
}

export function connectSocket() {
  const token = localStorage.getItem("bk_token") || "";
  const s = getSocket();

  // If the token changed since the last connection (e.g. user just logged in,
  // or was previously connected as guest), force a reconnect so the server
  // receives the updated identity in the handshake auth.
  if (s.connected && token !== _connectedToken) {
    s.disconnect();
  }

  s.auth = {
    token,
    avatar:    localStorage.getItem("bk_avatar")             || "",
    character: localStorage.getItem("bk_equipped_character") || "",
  };
  _connectedToken = token;

  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
