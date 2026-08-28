import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!socket || !socket.connected) {
    socket = io("http://localhost:3000", {
      auth: { token },
      query: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("⚡ Connected to Battle Socket Server:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
