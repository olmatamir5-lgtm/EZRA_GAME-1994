const startButton = document.getElementById("start");
const multiplier = document.getElementById("multiplier");
const plane = document.getElementById("plane");

let gameRunning = false;
let value = 1.00;
let timer;

startButton.addEventListener("click", () => {
  if (gameRunning) return;

  gameRunning = true;
  value = 1.00;
  multiplier.textContent = value.toFixed(2) + "x";
  startButton.textContent = "RUNNING...";

  let speed = 0;

  timer = setInterval(() => {
    value += 0.01 + Math.random() * 0.04;
    speed += 2;

    multiplier.textContent = value.toFixed(2) + "x";
    plane.style.left = Math.min(85, 5 + speed / 10) + "%";
    plane.style.bottom = Math.min(80, 10 + speed / 8) + "%";

    // Demo crash
    if (value >= 2 + Math.random() * 6) {
      clearInterval(timer);
      gameRunning = false;
      startButton.textContent = "START GAME";
      multiplier.textContent = "CRASHED 💥";
    }
  }, 100);
});
