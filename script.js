/* =========================================================
   AVIATOR STYLE DEMO GAME
   Virtual credits only
   ========================================================= */

"use strict";

/* =========================================================
   1. GAME SETTINGS
   ========================================================= */

const CONFIG = {
    startingBalance: 1000,

    // Multiplier starts here
    startMultiplier: 1.00,

    // Display/animation maximum
    maxMultiplier: 1000.00,

    // Crash point requested: approximately 1x - 11x
    minCrashPoint: 1.00,
    maxCrashPoint: 11.00,

    // Multiplier growth speed
    multiplierSpeed: 0.018,

    // Countdown
    countdownSeconds: 3,

    // History
    maxHistory: 10,

    // Auto play defaults
    autoBetAmount: 50,
    autoCashOut: 2.00,
    autoRounds: 4,

    // Demo deposit
    depositAmount: 500
};


/* =========================================================
   2. GAME STATE
   ========================================================= */

let balance = CONFIG.startingBalance;
let betAmount = 100;

let multiplier = CONFIG.startMultiplier;
let crashPoint = 1.00;

let hasBet = false;
let cashedOut = false;
let gameRunning = false;
let countdownRunning = false;

let roundNumber = 0;
let gameTimer = null;
let countdownTimer = null;

let gameHistory = [];


/* =========================================================
   3. AUTO PLAY STATE
   ========================================================= */

let autoPlay = false;
let autoRounds = CONFIG.autoRounds;
let autoRoundsPlayed = 0;

let autoBetAmount = CONFIG.autoBetAmount;
let autoCashOut = CONFIG.autoCashOut;

let stopOnLoss = false;
let stopOnProfit = false;

let autoStartBalance = balance;


/* =========================================================
   4. DOM HELPER
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   5. DOM ELEMENTS
   ========================================================= */

const UI = {
    multiplier: $("multiplier"),
    plane: $("plane"),
    countdown: $("countdown"),
    status: $("status"),

    balance: $("balance"),
    betAmount: $("betAmount"),

    betButton: $("betButton"),
    cashOutButton: $("cashOutButton"),
    cancelButton: $("cancelButton"),
    depositButton: $("depositButton"),

    resetButton: $("resetButton"),

    history: $("gameHistory"),

    soundButton: $("soundButton"),

    autoPlayButton: $("autoPlayButton"),
    stopAutoButton: $("stopAutoButton"),

    autoBetAmount: $("autoBetAmount"),
    autoCashOut: $("autoCashOut"),
    autoRounds: $("autoRounds"),

    stopOnLoss: $("stopOnLoss"),
    stopOnProfit: $("stopOnProfit"),

    autoStatus: $("autoStatus"),

    gameArea: $("gameArea")
};


/* =========================================================
   6. SOUND SYSTEM
   ========================================================= */

let soundEnabled = true;

const sounds = {
    click: new Audio("sounds/click.mp3"),
    countdown: new Audio("sounds/countdown.mp3"),
    crash: new Audio("sounds/crash.mp3"),
    win: new Audio("sounds/win.mp3")
};

Object.values(sounds).forEach(sound => {
    sound.preload = "auto";
    sound.volume = 0.5;
});


function playSound(name) {
    if (!soundEnabled || !sounds[name]) return;

    try {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(() => {
            // Browser may block audio until user interaction.
        });
    } catch (error) {
        console.warn("Sound error:", error);
    }
}


/* =========================================================
   7. OPTIONAL GENERATED SOUNDS
   Engine/beep fallback using Web Audio
   ========================================================= */

let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        const AudioCtx =
            window.AudioContext ||
            window.webkitAudioContext;

        if (AudioCtx) {
            audioContext = new AudioCtx();
        }
    }

    return audioContext;
}


function beep(
    frequency = 440,
    duration = 0.08,
    type = "sine",
    volume = 0.04
) {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
}


function countdownSound() {
    playSound("countdown");
    beep(650, 0.12, "sine", 0.05);
}


function startSound() {
    beep(500, 0.08, "triangle", 0.04);

    setTimeout(() => {
        beep(800, 0.12, "triangle", 0.04);
    }, 100);
}


/* =========================================================
   8. BALANCE
   ========================================================= */

function updateBalance() {
    if (!UI.balance) return;

    UI.balance.textContent =
        Number(balance).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}


/* =========================================================
   9. BET AMOUNT
   ========================================================= */

function updateBetAmount() {
    if (!UI.betAmount) return;

    let value = Number(UI.betAmount.value);

    if (!Number.isFinite(value) || value < 1) {
        value = 1;
    }

    betAmount = Math.floor(value);

    UI.betAmount.value = betAmount;
}


function setBetAmount(value) {
    value = Number(value);

    if (!Number.isFinite(value)) return;

    value = Math.max(1, Math.floor(value));

    if (value > balance && !hasBet) {
        value = Math.floor(balance);
    }

    betAmount = value;

    if (UI.betAmount) {
        UI.betAmount.value = value;
    }
}


/* =========================================================
   10. CRASH POINT
   ========================================================= */

function generateCrashPoint() {

    const min = CONFIG.minCrashPoint;
    const max = CONFIG.maxCrashPoint;

    const random =
        Math.random() * (max - min) + min;

    return Number(random.toFixed(2));
}


/* =========================================================
   11. MULTIPLIER DISPLAY
   ========================================================= */

function updateMultiplier() {

    if (!UI.multiplier) return;

    UI.multiplier.textContent =
        `${multiplier.toFixed(2)}x`;

    // Glow effect
    UI.multiplier.classList.remove(
        "multiplier-pop"
    );

    void UI.multiplier.offsetWidth;

    UI.multiplier.classList.add(
        "multiplier-pop"
    );
}


/* =========================================================
   12. PLANE ANIMATION
   ========================================================= */

function updatePlane() {

    if (!UI.plane || !UI.gameArea) return;

    const rect =
        UI.gameArea.getBoundingClientRect();

    const width = Math.max(rect.width, 250);
    const height = Math.max(rect.height, 250);

    /*
       Multiplier -> percentage

       1x     = beginning
       2x     = low
       5x     = higher
       10x    = high
       1000x  = maximum animation position
    */

    const normalized =
        Math.min(
            1,
            Math.log(multiplier) /
            Math.log(CONFIG.maxMultiplier)
        );

    const x =
        Math.min(
            width - 80,
            normalized * (width - 100)
        );

    const y =
        Math.min(
            height - 80,
            normalized * (height - 120)
        );

    // Rotation increases gradually
    const rotation =
        -5 - normalized * 20;

    UI.plane.style.transform =
        `translate3d(${x}px, ${-y}px, 0)
         rotate(${rotation}deg)`;

    // Plane trail
    UI.plane.classList.add("plane-flying");
}


/* =========================================================
   13. START POSITION
   ========================================================= */

function resetPlane() {

    if (!UI.plane) return;

    UI.plane.style.transform =
        "translate3d(0, 0, 0) rotate(0deg)";

    UI.plane.classList.remove(
        "plane-flying",
        "plane-crashed"
    );
}


/* =========================================================
   14. COUNTDOWN
   ========================================================= */

function startCountdown() {

    if (countdownRunning) return;

    countdownRunning = true;

    let count =
        CONFIG.countdownSeconds;

    if (UI.countdown) {
        UI.countdown.style.display = "block";
        UI.countdown.textContent =
            "GET READY";
    }

    setTimeout(() => {

        countdownTimer =
            setInterval(() => {

                if (count > 0) {

                    if (UI.countdown) {
                        UI.countdown.textContent =
                            count;
                    }

                    countdownSound();

                    if (UI.countdown) {
                        UI.countdown.classList.remove(
                            "countdown-pop"
                        );

                        void UI.countdown.offsetWidth;

                        UI.countdown.classList.add(
                            "countdown-pop"
                        );
                    }

                    count--;

                } else {

                    clearInterval(countdownTimer);

                    if (UI.countdown) {
                        UI.countdown.textContent =
                            "🚀 GO!";

                        UI.countdown.classList.add(
                            "go-pop"
                        );
                    }

                    startSound();

                    setTimeout(() => {

                        if (UI.countdown) {
                            UI.countdown.style.display =
                                "none";
                        }

                        countdownRunning = false;

                        startRound();

                    }, 700);
                }

            }, 1000);

    }, 500);
}


/* =========================================================
   15. START ROUND
   ========================================================= */

function startRound() {

    if (gameRunning) return;

    roundNumber++;

    multiplier =
        CONFIG.startMultiplier;

    crashPoint =
        generateCrashPoint();

    hasBet = false;
    cashedOut = false;

    gameRunning = true;

    resetPlane();
    updateMultiplier();

    setStatus(
        `🚀 Round #${roundNumber} started`
    );

    updateButtons();

    gameTimer =
        setInterval(() => {

            multiplier +=
                CONFIG.multiplierSpeed *
                Math.max(1, multiplier * 0.75);

            multiplier =
                Number(
                    multiplier.toFixed(2)
                );

            if (
                multiplier >=
                CONFIG.maxMultiplier
            ) {
                multiplier =
                    CONFIG.maxMultiplier;
            }

            updateMultiplier();
            updatePlane();

            // Engine sound occasionally
            if (
                Math.random() < 0.035
            ) {
                beep(
                    120 + multiplier * 10,
                    0.04,
                    "sawtooth",
                    0.015
                );
            }

            // AUTO CASH OUT
            if (
                autoPlay &&
                hasBet &&
                !cashedOut &&
                multiplier >= autoCashOut
            ) {
                cashOut();
            }

            // Crash
            if (
                multiplier >= crashPoint
            ) {
                crashRound();
            }

        }, 100);
}


/* =========================================================
   16. BET
   ========================================================= */

function placeBet() {

    if (gameRunning) {

        setStatus(
            "⛔ Betting is closed for this round."
        );

        return;
    }

    updateBetAmount();

    if (betAmount <= 0) return;

    if (betAmount > balance) {

        setStatus(
            "❌ Insufficient virtual balance."
        );

        return;
    }

    playSound("click");

    balance -= betAmount;

    hasBet = true;
    cashedOut = false;

    updateBalance();

    setStatus(
        `🟢 BET ${betAmount} virtual credits`
    );

    updateButtons();
}


/* =========================================================
   17. CANCEL
   ========================================================= */

function cancelBet() {

    if (!hasBet) return;

    if (gameRunning) {

        setStatus(
            "⛔ Bet cannot be cancelled after the round starts."
        );

        return;
    }

    playSound("click");

    balance += betAmount;

    hasBet = false;

    updateBalance();

    setStatus(
        "↩️ Bet cancelled."
    );

    updateButtons();
}


/* =========================================================
   18. CASH OUT
   ========================================================= */

function cashOut() {

    if (!hasBet) return;

    if (!gameRunning) {

        setStatus(
            "⛔ No active round."
        );

        return;
    }

    if (cashedOut) return;

    // Cash out must happen before crash
    if (multiplier >= crashPoint) {
        crashRound();
        return;
    }

    playSound("win");

    const payout =
        Number(
            (betAmount * multiplier)
            .toFixed(2)
        );

    balance += payout;

    cashedOut = true;

    showWinEffect(payout);

    setStatus(
        `🎉 WIN! +${payout.toFixed(2)}`
    );

    addHistory({
        round: roundNumber,
        crash: crashPoint,
        bet: betAmount,
        cashOut: multiplier,
        result: payout,
        win: true
    });

    updateBalance();
    updateButtons();
}


/* =========================================================
   19. CRASH
   ========================================================= */

function crashRound() {

    if (!gameRunning) return;

    clearInterval(gameTimer);

    gameRunning = false;

    playSound("crash");

    if (UI.plane) {
        UI.plane.classList.add(
            "plane-crashed"
        );
    }

    showCrashEffect();

    if (hasBet && !cashedOut) {

        const loss = betAmount;

        setStatus(
            `💥 CRASH ${crashPoint.toFixed(2)}x — LOSS -${loss}`
        );

        addHistory({
            round: roundNumber,
            crash: crashPoint,
            bet: betAmount,
            cashOut: null,
            result: -loss,
            win: false
        });

    } else {

        setStatus(
            `💥 CRASH at ${crashPoint.toFixed(2)}x`
        );
    }

    hasBet = false;

    updateButtons();

    // AUTO PLAY CHECK
    if (autoPlay) {

        const profit =
            balance - autoStartBalance;

        // Stop on loss
        if (
            stopOnLoss &&
            profit < 0
        ) {
            stopAutoPlay();
            return;
        }

        // Stop on profit
        if (
            stopOnProfit &&
            profit >= stopOnProfit
        ) {
            stopAutoPlay();
            return;
        }

        autoRoundsPlayed++;

        if (
            autoRoundsPlayed >=
            autoRounds
        ) {
            stopAutoPlay();
            return;
        }

        setTimeout(() => {

            if (!autoPlay) return;

            betAmount =
                autoBetAmount;

            if (UI.betAmount) {
                UI.betAmount.value =
                    autoBetAmount;
            }

            placeBet();

            setTimeout(() => {
                startCountdown();
            }, 500);

        }, 1800);

        return;
    }

    // Normal next round
    setTimeout(() => {

        if (!gameRunning &&
            !countdownRunning) {

            startCountdown();
        }

    }, 1800);
}


/* =========================================================
   20. STATUS
   ========================================================= */

function setStatus(message) {

    if (!UI.status) return;

    UI.status.textContent =
        message;
}


/* =========================================================
   21. BUTTON STATE
   ========================================================= */

function updateButtons() {

    if (UI.betButton) {
        UI.betButton.disabled =
            gameRunning ||
            hasBet ||
            balance <= 0;
    }

    if (UI.cancelButton) {
        UI.cancelButton.disabled =
            !hasBet ||
            gameRunning;
    }

    if (UI.cashOutButton) {
        UI.cashOutButton.disabled =
            !hasBet ||
            !gameRunning ||
            cashedOut;
    }
}


/* =========================================================
   22. WIN EFFECT
   ========================================================= */

function showWinEffect(payout) {

    document.body.classList.add(
        "win-flash"
    );

    createConfetti();

    setTimeout(() => {
        document.body.classList.remove(
            "win-flash"
        );
    }, 700);

    if (UI.status) {
        UI.status.classList.add(
            "win-text"
        );

        UI.status.textContent =
            `🎉 WIN! +${payout.toFixed(2)}`;

        setTimeout(() => {
            UI.status.classList.remove(
                "win-text"
            );
        }, 1200);
    }
}


/* =========================================================
   23. CRASH EFFECT
   ========================================================= */

function showCrashEffect() {

    document.body.classList.add(
        "crash-flash"
    );

    if (UI.gameArea) {

        UI.gameArea.classList.add(
            "screen-shake"
        );

        setTimeout(() => {
            UI.gameArea.classList.remove(
                "screen-shake"
            );
        }, 700);
    }

    createSmoke();

    if (UI.status) {
        UI.status.classList.add(
            "crash-text"
        );

        setTimeout(() => {
            UI.status.classList.remove(
                "crash-text"
            );
        }, 1500);
    }

    setTimeout(() => {
        document.body.classList.remove(
            "crash-flash"
        );
    }, 600);
}


/* =========================================================
   24. CONFETTI
   ========================================================= */

function createConfetti() {

    const container =
        document.createElement("div");

    container.className =
        "confetti-container";

    document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {

        const piece =
            document.createElement("span");

        piece.className =
            "confetti-piece";

        piece.textContent =
            Math.random() > 0.5
                ? "•"
                : "✦";

        piece.style.left =
            `${Math.random() * 100}%`;

        piece.style.animationDelay =
            `${Math.random() * 0.5}s`;

        piece.style.animationDuration =
            `${1.5 + Math.random() * 2}s`;

        container.appendChild(piece);
    }

    setTimeout(() => {
        container.remove();
    }, 4000);
}


/* =========================================================
   25. SMOKE
   ========================================================= */

function createSmoke() {

    if (!UI.gameArea) return;

    for (let i = 0; i < 12; i++) {

        const smoke =
            document.createElement("span");

        smoke.className =
            "smoke-particle";

        smoke.style.left =
            `${45 + Math.random() * 15}%`;

        smoke.style.top =
            `${40 + Math.random() * 15}%`;

        smoke.style.animationDelay =
            `${Math.random() * 0.3}s`;

        UI.gameArea.appendChild(smoke);

        setTimeout(() => {
            smoke.remove();
        }, 1800);
    }
}


/* =========================================================
   26. GAME HISTORY
   ========================================================= */

function addHistory(data) {

    gameHistory.unshift(data);

    if (
        gameHistory.length >
        CONFIG.maxHistory
    ) {
        gameHistory.pop();
    }

    renderHistory();
}


function renderHistory() {

    if (!UI.history) return;

    if (gameHistory.length === 0) {

        UI.history.innerHTML =
            `<div class="history-empty">
                📜 History: Empty
             </div>`;

        return;
    }

    UI.history.innerHTML =
        gameHistory.map(item => {

            const result =
                item.win
                    ? `🟢 +${item.result.toFixed(2)}`
                    : `🔴 -${Math.abs(item.result).toFixed(2)}`;

            const cashOut =
                item.cashOut === null
                    ? "—"
                    : `${item.cashOut.toFixed(2)}x`;

            return `
                <div class="history-row">
                    <span>#${String(item.round).padStart(2, "0")}</span>
                    <span>${item.crash.toFixed(2)}x</span>
                    <span>${item.bet}</span>
                    <span>${cashOut}</span>
                    <span>${result}</span>
                </div>
            `;

        }).join("");
}


/* =========================================================
   27. AUTO PLAY
   ========================================================= */

function startAutoPlay() {

    if (autoPlay) return;

    autoBetAmount =
        Number(
            UI.autoBetAmount?.value ||
            CONFIG.autoBetAmount
        );

    autoCashOut =
        Number(
            UI.autoCashOut?.value ||
            CONFIG.autoCashOut
        );

    autoRounds =
        Number(
            UI.autoRounds?.value ||
            CONFIG.autoRounds
        );

    stopOnLoss =
        Boolean(
            UI.stopOnLoss?.checked
        );

    const stopProfitValue =
        Number(
            UI.stopOnProfit?.value || 0
        );

    stopOnProfit =
        stopProfitValue > 0
            ? stopProfitValue
            : false;

    if (
        autoBetAmount <= 0 ||
        autoCashOut < 1 ||
        autoRounds <= 0
    ) {
        setStatus(
            "❌ Check Auto Play settings."
        );

        return;
    }

    autoPlay = true;

    autoRoundsPlayed = 0;

    autoStartBalance =
        balance;

    if (UI.autoStatus) {
        UI.autoStatus.textContent =
            "🤖 Auto Play: ON";
    }

    playSound("click");

    setStatus(
        `🤖 Auto Play ON — ${autoRounds} rounds`
    );

    // First auto bet
    betAmount =
        autoBetAmount;

    if (UI.betAmount) {
        UI.betAmount.value =
            autoBetAmount;
    }

    placeBet();

    setTimeout(() => {
        startCountdown();
    }, 500);
}


function stopAutoPlay() {

    autoPlay = false;

    if (UI.autoStatus) {
        UI.autoStatus.textContent =
            "⏹️ Auto Play: OFF";
    }

    if (UI.stopAutoButton) {
        UI.stopAutoButton.disabled = true;
    }

    setStatus(
        "⏹️ Auto Play stopped."
    );
}


/* =========================================================
   28. DEPOSIT
   ========================================================= */

function demoDeposit() {

    /*
       Virtual/demo deposit only.
       No real-money payment system.
    */

    balance +=
        CONFIG.depositAmount;

    updateBalance();

    playSound("click");

    setStatus(
        `💰 +${CONFIG.depositAmount} virtual credits`
    );
}


/* =========================================================
   29. RESET GAME
   ========================================================= */

function resetGame() {

    // Stop timers
    if (gameTimer) {
        clearInterval(gameTimer);
    }

    if (countdownTimer) {
        clearInterval(countdownTimer);
    }

    // Reset game state
    balance =
        CONFIG.startingBalance;

    betAmount = 100;

    multiplier =
        CONFIG.startMultiplier;

    crashPoint = 1.00;

    hasBet = false;
    cashedOut = false;

    gameRunning = false;
    countdownRunning = false;

    roundNumber = 0;

    // Reset auto play
    autoPlay = false;
    autoRoundsPlayed = 0;

    gameHistory = [];

    if (UI.betAmount) {
        UI.betAmount.value =
            betAmount;
    }

    if (UI.countdown) {
        UI.countdown.style.display =
            "none";

        UI.countdown.textContent =
            "";
    }

    if (UI.autoStatus) {
        UI.autoStatus.textContent =
            "🤖 Auto Play: OFF";
    }

    resetPlane();

    updateBalance();

    updateMultiplier();

    renderHistory();

    updateButtons();

    setStatus(
        "🎮 Game Ready — 1.00x"
    );

    playSound("click");
}


/* =========================================================
   30. 1/2 BET
   ========================================================= */

function halfBet() {

    setBetAmount(
        Math.max(
            1,
            Math.floor(betAmount / 2)
        )
    );

    playSound("click");
}


/* =========================================================
   31. 2X BET
   ========================================================= */

function doubleBet() {

    setBetAmount(
        Math.min(
            Math.floor(balance),
            betAmount * 2
        )
    );

    playSound("click");
}


/* =========================================================
   32. SOUND ON/OFF
   ========================================================= */

function toggleSound() {

    soundEnabled =
        !soundEnabled;

    if (UI.soundButton) {
        UI.soundButton.textContent =
            soundEnabled
                ? "🔊 SOUND ON"
                : "🔇 SOUND OFF";
    }

    if (soundEnabled) {
        beep(700, 0.08);
    }
}


/* =========================================================
   33. BUTTON CLICK EVENTS
   ========================================================= */

if (UI.betButton) {
    UI.betButton.addEventListener(
        "click",
        placeBet
    );
}

if (UI.cashOutButton) {
    UI.cashOutButton.addEventListener(
        "click",
        cashOut
    );
}

if (UI.cancelButton) {
    UI.cancelButton.addEventListener(
        "click",
        cancelBet
    );
}

if (UI.depositButton) {
    UI.depositButton.addEventListener(
        "click",
        demoDeposit
    );
}

if (UI.resetButton) {
    UI.resetButton.addEventListener(
        "click",
        resetGame
    );
}

if (UI.soundButton) {
    UI.soundButton.addEventListener(
        "click",
        toggleSound
    );
}

if (UI.autoPlayButton) {
    UI.autoPlayButton.addEventListener(
        "click",
        startAutoPlay
    );
}

if (UI.stopAutoButton) {
    UI.stopAutoButton.addEventListener(
        "click",
        stopAutoPlay
    );
}


/* =========================================================
   34. BET INPUT
   ========================================================= */

if (UI.betAmount) {

    UI.betAmount.addEventListener(
        "change",
        updateBetAmount
    );

    UI.betAmount.addEventListener(
        "input",
        () => {
            const value =
                Number(
                    UI.betAmount.value
                );

            if (
                Number.isFinite(value) &&
                value > 0
            ) {
                betAmount =
                    Math.floor(value);
            }
        }
    );
}


/* =========================================================
   35. KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            placeBet();
        }

        if (
            event.key === " " &&
            gameRunning
        ) {
            event.preventDefault();
            cashOut();
        }

        if (
            event.key.toLowerCase() === "r"
        ) {
            resetGame();
        }
    }
);


/* =========================================================
   36. BUTTON RIPPLE EFFECT
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest("button");

        if (!button) return;

        button.classList.add(
            "button-pressed"
        );

        setTimeout(() => {
            button.classList.remove(
                "button-pressed"
            );
        }, 150);
    }
);


/* =========================================================
   37. INITIALIZE
   ========================================================= */

function initializeGame() {

    updateBalance();

    updateMultiplier();

    renderHistory();

    updateButtons();

    resetPlane();

    setStatus(
        "🎮 Game Ready — 1.00x"
    );

    if (UI.autoStatus) {
        UI.autoStatus.textContent =
            "🤖 Auto Play: OFF";
    }
}


initializeGame();
