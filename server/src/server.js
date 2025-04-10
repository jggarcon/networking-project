const path = require("path");
const express = require("express");
const http = require("http");
const app = express();
const socketio = require("socket.io");
const xss = require("xss");

const PORT = process.env.PORT || 2000;

app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/css",
  express.static(
    path.join(__dirname, "..", "..", "node_modules", "bootstrap", "dist", "css")
  )
);

const server = http.createServer(app);
const io = socketio(server);
const tweets = [];

//let users = [];

io.on("connection", (socket) => {
  // when a new user joins
  socket.on("userJoin", (tweet) => {
    const { user } = JSON.parse(tweet);

    // send the tweets history to the new user
    socket.emit("tweetHistory", tweets);

    newUser(user, socket, io);
  });

  // this say: when someone sends a new tweet
  socket.on("tweetText", (tweetText) => {
    tweetText = JSON.parse(tweetText);

    // clean up the tweet using xss
    const cleanTweet = {
      user: tweetText.user,
      tweet: xss(tweetText.tweet),
    };

    // store the tweet in memory
    tweets.push(cleanTweet);

    // broadcast to all users
    io.sockets.emit(
      "chatMessageBroadcast",
      JSON.stringify({ tweetText: cleanTweet })
    );
  });
});

const newUser = (user, socket, io) => {
  //users.push({ user, id: socket.id });
  socket.emit("userJoined");
  socket.emit("tweetHistory", tweets);
};

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
