const socket = io();

const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");

const message = document.getElementById("messageInput");
const roomInput = document.getElementById("roomInput");
const createRoomBtn = document.getElementById("createRoomBtn");
let myUsername = "";

function uid() {
  let a = new Uint32Array(3);
  window.crypto.getRandomValues(a);
  return (
    performance.now().toString(36) +
    Array.from(a)
      .map((A) => A.toString(36))
      .join("")
  ).replace(/\./g, "");
}

socket.on("connect", function () {
  // myUsername = prompt("Enter name: ");
  myUsername = "Gildas";
  socket.emit("register", myUsername);
});
createRoomBtn.addEventListener("click", function (e) {
  e.preventDefault();
  let roomName = roomInput.value.trim();
  console.warn(roomName);
  if (roomName !== "") {
    socket.emit("createRoom", roomName);
    roomInput.value = "";
  }
});
socket.on("updateChat", function (msg) {
  const item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  let userInput = input.value.trim();

  if (userInput.substring(0, 1) === "/") {
    let test = userInput.match(/^(\/([A-Za-z\d_-]+))/g)[0];
    if (test) {
      test = test.substring(1);
      switch (test) {
        case "register":
          socket.emit("register", input.value);
          break;
        case "login":
          socket.emit("login", input.value);
          break;
        case "create":
          socket.emit("create", input.value);
          break;
        case "delete":
          socket.emit("delete", input.value);
          break;
        case "join":
          socket.emit("join", input.value);
          break;
        case "list":
          socket.emit("list", input.value);
          break;
        case "users":
          socket.emit("users", input.value);
          break;
        case "leave":
          socket.emit("leave", input.value);
          break;
        case "nick":
          socket.emit("nick", input.value);
          break;
        default:
          socket.emit("message", input.value);

          input.value = "";
          break;
      }
    }
  } else {
    socket.emit("message", userInput);
  }
});

socket.on("message", (username, msg) => {
  let item;
  console.warn("message : " + msg);
  item = document.createElement("li");
  item.textContent = username + " :" + msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
