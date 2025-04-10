const q = (selector) => {
  return document.querySelector(selector);
};

let socket = {};

const form = q("#form");
const userDiv = q("#user");
const tweetsDiv = q("#tweets");
const txtUser = q("#txtUser");
const btnLeave = q("#btnLeave");
const btnTweet = q("#btnTweet");
const txtTweet = q("#txtTweet");
const tweetcontainer = q("#tweetcontainer");
const now = new Date().toISOString();

let userList = [];
let currentUser = "";

form.addEventListener("submit", (e) => {
  e.preventDefault();
  currentUser = txtUser.value.trim();

  socket = io();

  socket.emit(
    "userJoin",
    JSON.stringify({
      user: txtUser.value.trim(),
    })
  );

  socket.on("userJoined", () => {
    userDiv.classList.toggle("hide");
    tweetsDiv.classList.toggle("hide");
  });

  socket.on("chatMessageBroadcast", (tweet) => {
    const userMsg = JSON.parse(tweet).tweetText;
    displayTweet(userMsg);
  });

  socket.on("tweetHistory", (allTweets) => {
    allTweets.forEach((tweetObj) => {
      displayTweet(tweetObj);
    });
  });
});

btnLeave.onclick = (e) => {
  userDiv.classList.toggle("hide");
  tweetsDiv.classList.toggle("hide");
  txtUser.value = "";
  txtTweet.value = "";
  socket.disconnect();
};

btnTweet.onclick = (e) => {
  const tweet = txtTweet.value;
  txtTweet.value = "";

  socket.emit(
    "tweetText",
    JSON.stringify({
      user: currentUser,
      tweet,
      timestamp: now,
    })
  );
};

tweetcontainer.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("retweetBtn")) {
    const originalUser = e.target.getAttribute("data-original-user");
    let originalTweet = e.target.getAttribute("data-original-tweet");

    let retweetMsg;

    if (originalTweet.startsWith("Retweeted")) {
      retweetMsg = originalTweet;
    } else {
      retweetMsg = `Retweeted <b>@${originalUser}</b> <br>${originalTweet}`;
    }

    socket.emit(
      "tweetText",
      JSON.stringify({
        user: currentUser,
        tweet: retweetMsg,
      })
    );
  }
});

function timeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function displayTweet(userMsg) {
  const tweetTime = userMsg.timestamp
    ? timeAgo(new Date(userMsg.timestamp))
    : "just now";

  const cleanTweet = userMsg.tweet.replace(/"/g, "&quot;");

  tweetcontainer.innerHTML =
    `
    <div class="card mb-4 shadow-sm border border-secondary rounded">
      <div class="card-body px-4 py-3">
        <p class="card-subtitle mb-2 text-muted">
          <b>@${userMsg.user}</b> · <span class="text-secondary">${tweetTime}</span>
        </p>
        <p class="card-text">${userMsg.tweet}</p>

        <button class="retweetBtn btn btn-sm btn-outline-primary"
          data-original-user="${userMsg.user}" 
          data-original-tweet="${cleanTweet}">
          🔁 Retweet
        </button>

        <button class="likeBtn btn btn-sm btn-outline-primary"
          🔁 Like
        </button>
        
      </div>
    </div>
    ` + tweetcontainer.innerHTML;
}
