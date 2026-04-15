import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: false,
});

type ChatMessage =
  | { system: true; text: string }
  | { name: string; message: string };

export default function ChatApp() {
  const [myName, setMyName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);

  // ✅ Load saved name (optional)
  useEffect(() => {
    const saved = localStorage.getItem("chat-name");
    if (saved) setNameInput(saved);
  }, []);

  // ✅ Connect socket AFTER name is set
  useEffect(() => {
    if (!myName) return;

    socket.io.opts.query = { name: myName };
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("user-joined", (data) => {
      setChat((prev) => [...prev, { system: true, text: data.message }]);
    });

    socket.on("user-left", (data) => {
      setChat((prev) => [...prev, { system: true, text: data }]);
    });

    socket.on("joined-room", (data) => {
      setChat((prev) => [...prev, { system: true, text: data.message }]);
    });

    socket.on("conversation", (data) => {
      setChat((prev) => [...prev, data]);
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [myName]);

  const joinRoom = () => {
    if (!room.trim()) return;
    socket.emit("join-room", room);
    setJoined(true);
    setChat([]);
  };

  const sendMessage = () => {
    if (!message.trim() || !room) return;

    socket.emit("conversation", {
      room,
      message,
    });

    setMessage("");
  };

  // ✅ Name input screen
  if (!myName) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow w-80">
          <h2 className="mb-3 text-lg font-bold text-center">
            Enter your name
          </h2>

          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="border px-2 py-1 mb-3 w-full"
            placeholder="Your name"
          />

          <button
            onClick={() => {
              if (!nameInput.trim()) return;
              setMyName(nameInput);
              localStorage.setItem("chat-name", nameInput);
            }}
            className="bg-blue-500 text-white px-4 py-1 rounded w-full"
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-4">
        <h2 className="text-xl font-bold mb-3 text-center">Chat App</h2>

        {!joined ? (
          <div className="flex gap-2 mb-3">
            <input
              placeholder="Enter room name"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="border px-2 py-1 rounded flex-1"
            />
            <button
              onClick={joinRoom}
              className="bg-green-500 text-white px-3 rounded"
            >
              Join
            </button>
          </div>
        ) : (
          <p className="text-sm text-center mb-2 text-gray-500">
            Room: {room}
          </p>
        )}

        <div className="h-80 overflow-y-auto border p-2 rounded mb-3">
          {chat.map((c, i) => {
            if ("system" in c) {
              return (
                <p key={i} className="text-gray-500 text-sm text-center">
                  {c.text}
                </p>
              );
            }

            const isMe = c.name === myName;

            return (
              <div
                key={i}
                className={`flex mb-2 ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs ${
                    isMe
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-bold">{c.name}</p>
                  )}
                  <p>{c.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {joined && (
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 py-1 rounded"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
