const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;
require("dotenv").config();
require("./config/database").connect();
const User = require("./model/user");
const MongoClient = require("mongodb").MongoClient;
const moment = require("moment");
let db;

function now() {
  return moment().format("YYYY-MM-DD HH:mm:ss");
}

MongoClient.connect(
  "mongodb://127.0.0.1:27042/my_irc",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  function (err, client) {
    db = client.db();
  }
);
app.use("/", express.static(__dirname + "/public"));
const usernames = {},
  rooms = [
    { name: "global", creator: "Anonymous", created_at: now() },
    {
      name: "chess",
      creator: "Anonymous",
      created_at: now(),
    },
    { name: "globuleux", creator: "Anonymous", created_at: now() },
  ];
io.on("connection", (socket) => {
  socket.on("register", async (username) => {
    username = username.replace("/register", "");
    username = username.trim();
    console.warn(username);
    try {
      await User.findOne({ user_login: username }),
        await User.create({ login: username });
      socket.username = username;
      usernames[username] = username;
      socket.currentRoom = "global";
      socket.join("global");
      console.log(`User ${username} created on server successfully.`);

      socket.emit("updateChat", "INFO", "You have joined global room");
      socket.broadcast
        .to("global")
        .emit("updateChat", "INFO", username + " has joined global room");
      io.sockets.emit("updateUsers", usernames);
      socket.emit("updateRooms", rooms, "global");
    } catch (err) {
      11000 === err.code && console.warn("User alredy exists... login ?");
    }
  });
  socket.on("sendMessage", function (data) {
    io.sockets.to(socket.currentRoom).emit("updateChat", socket.username, data);
  });
  socket.on("message", function (message) {
    io.sockets.emit("message", socket.username, message);
  });
  socket.on("login", function (username) {
    username = username.replace("/login", "");
    username = username.trim();
    try {
      let user = User.findOne({ login: username })
        .exec()
        .then((user) => {
          // console.log(user);
          if (user) {
            console.log(user);
            username = user.login;
            socket.username = username;
            usernames[username] = username;
            socket.currentRoom = "global";
            socket.join("global");
            console.log(`User ${username} logged on server successfully.`);
            socket.emit("updateChat", "You have joined global room");
            socket.broadcast
              .to("global")
              .emit("updateChat", "INFO", username + " has joined global room");
            io.sockets.emit("updateUsers", usernames);
            socket.emit("updateRooms", rooms, "global");
          } else {
            console.warn("User not found");
          }
        });
      console.warn(user);
    } catch (err) {
      console.warn(err.code + " :" + err);
    }
  });
  socket.on("createRoom", function (room) {
    console.warn(room);
    socket.username || (socket.username = "Anonymous");
    if (room != null) {
      rooms.push({ name: room, creator: socket.username, created_at: now() });
      io.sockets.emit("updateRooms", rooms, null);
    }
    console.warn(rooms);
  });
  socket.on("create", function (room) {
    room = room.replace("/create", "");
    room = room.trim();
    console.warn(room);
    socket.username || (socket.username = "Anonymous");
    if (room != null) {
      rooms.push({ name: room, creator: socket.username, created_at: now() });
      io.sockets.emit("updateRooms", rooms, null);
    }
    console.warn(rooms);
  });
  socket.on("join", function (room) {
    room = room.replace("/join", "");
    room = room.trim();
    socket.join(room);
    console.warn(rooms);
    socket.emit("updateChat", "You have joined " + room + " room");
    socket.broadcast
      .to(room)
      .emit("updateChat", socket.username + " has joined " + room + " room");
  });
  socket.on("delete", function (room) {
    room = room.replace("/delete", "");
    room = room.trim();
    for (let i = 0; i < rooms.length; i++) {
      console.log(rooms[i].name),
        rooms[i].name === room && (rooms.splice(i, 1), console.log(rooms));
    }
  });
  socket.on("users", function (room) {
    room = room.replace("/users", "");
    room = room.trim();
    console.warn(io.sockets.adapter.rooms);
  });
  socket.on("leave", function (room) {
    try {
      console.log("[socket]", "leave room :", room);
      socket.broadcast
        .to(room)
        .emit("updateChat", socket.username + " has left " + room + " room");
      socket.broadcast.emit("[socket]", "leave room :", room);
      socket.leave(room);
      socket.to(room).emit("user left", socket.id);
    } catch (e) {
      console.log("[error]", "leave room :", e);
      socket.emit("error", "couldnt perform requested action");
    }
  });
  socket.on("nick", function (nickname) {
    nickname = nickname.replace("/nick", "");
    nickname = nickname.trim();
    socket.username = nickname;
  });
  socket.on("list", function (room) {
    room = room.replace("/list", "");
    room = room.trim();
    if (room === "" || room === null) {
      socket.emit("updateChat", "List of rooms : " + rooms.map((r) => r.name));
    }
    const regex = new RegExp(room, "i");
    room = rooms.filter((r) => r.name.match(regex));
    console.warn(room);
    socket.emit("updateChat", "List of rooms : " + room.map((r) => r.name));
  });
  socket.on("updateRooms", function (room) {
    socket.broadcast
      .to(socket.currentRoom)
      .emit("updateChat", "INFO", socket.username + " left room");
    socket.leave(socket.currentRoom);
    socket.currentRoom = room;
    socket.join(room);
    socket.emit("updateChat", "INFO", "You have joined " + room + " room");
    socket.broadcast
      .to(room)
      .emit(
        "updateChat",
        "INFO",
        socket.username + " has joined " + room + " room"
      );
  });
  socket.on("disconnect", () => {
    console.log(`User ${socket.username} disconnected from server.`);
    delete usernames[socket.username];
    io.sockets.emit("updateUsers", usernames);
    socket.broadcast.emit(
      "updateChat",
      "INFO",
      socket.username + " has disconnected"
    );
  });
});
http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
