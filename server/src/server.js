const path = require("path");
const express = require("express");
const http = require("http");
const app = express();
const socketio = require("socket.io");
const xss = require("xss");

const PORT = process.env.PORT || 2000;

const session = require("express-session");

const sessionMiddleware = session({
  secret: "secret",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 600000 },
});

app.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, "public")));
app.use("/static", express.static(path.join(__dirname, "..", "static")));

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

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on("connection", (socket) => {
  const req = socket.request;
  console.log("🧠 Session on connect:", req.session);

  // 🔁 If the user is already stored in session, auto-log them in
  if (req.session.username) {
    const user = req.session.username;
    socket.emit("userJoined", user);
    socket.emit("tweetHistory", tweets);
  }

  // 🆕 When a new user joins
  socket.on("userJoin", (tweet) => {
    console.log("👉 userJoin received:", tweet);
    const { user } = JSON.parse(tweet);

    // store user in session
    req.session.username = user;
    req.session.save(); // important: make sure it's saved

    socket.emit("userJoined", user);
    socket.emit("tweetHistory", tweets);

    //newUser(user, socket, io);
  });

  // when someone tweets
  socket.on("tweetText", (tweetText) => {
    tweetText = JSON.parse(tweetText);

    const cleanTweet = {
      user: tweetText.user,
      tweet: xss(tweetText.tweet),
    };

    tweets.push(cleanTweet);

    io.sockets.emit(
      "chatMessageBroadcast",
      JSON.stringify({ tweetText: cleanTweet })
    );
  });

  socket.on("logout", () => {
    socket.request.session.username = null;
    socket.request.session.save();
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
