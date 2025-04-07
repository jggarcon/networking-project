const path = require("path");
const express = require("express");
const http = require("http");
const app = express();
const socketio = require("socket.io");
const xss = require("xss");

const PORT = process.env.PORT || 2000;

app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/bootstrap",
  express.static(__dirname + "/node_modules/bootstrap/dist")
);

const server = http.createServer(app);
const io = socketio(server);

let users = [];

io.on("connection", (socket) => {
  socket.on("userJoin", (tweet) => {
    const { user } = JSON.parse(tweet);
    newUser(user, socket, io);
  });

  socket.on("tweetText", (tweetText) => {
    tweetText = JSON.parse(tweetText);
    io.sockets.emit(
      "chatMessageBroadcast",
      JSON.stringify({
        tweetText: { user: tweetText.user, tweet: xss(tweetText.tweet) },
      })
    );
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.id != socket.id);
    io.sockets.emit(
      "userDisconnect",
      JSON.stringify({
        id: socket.id,
      })
    );
  });
});

const newUser = (user, socket, io) => {
  users.push({ user, id: socket.id });
  socket.emit("userJoined");
};

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
