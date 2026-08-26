// =====================================================
// 🚀 SKY MULTIPLIER - VIRTUAL DEMO
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    // =================================================
    // ELEMENTS
    // =================================================

    const balanceEl =
        document.getElementById("balance");

    const multiplierEl =
        document.getElementById("multiplier");

    const infoMultiplierEl =
        document.getElementById("infoMultiplier");

    const statusEl =
        document.getElementById("status");

    const gameStatusEl =
        document.getElementById("gameStatus");

    const countdownEl =
        document.getElementById("countdown");

    const planeEl =
        document.getElementById("plane");

    const gameAreaEl =
        document.getElementById("gameArea");

    const gameHistoryEl =
        document.getElementById("gameHistory");


    const betAmountEl =
        document.getElementById("betAmount");

    const betButton =
        document.getElementById("betButton");

    const cashOutButton =
        document.getElementById("cashOutButton");

    const cancelButton =
        document.getElementById("cancelButton");

    const depositButton =
        document.getElementById("depositButton");


    const soundButton =
        document.getElementById("soundButton");

    const resetButton =
        document.getElementById("resetButton");


    const autoBetAmountEl =
        document.getElementById("autoBetAmount");

    const autoCashOutEl =
        document.getElementById("autoCashOut");

    const autoRoundsEl =
        document.getElementById("autoRounds");

    const stopOnLossEl =
        document.getElementById("stopOnLoss");

    const stopOnProfitEl =
        document.getElementById("stopOnProfit");


    const autoPlayButton =
        document.getElementById("autoPlayButton");

    const stopAutoButton =
        document.getElementById("stopAutoButton");

    const autoStatusEl =
        document.getElementById("autoStatus");


    // =================================================
    // VARIABLES
    // =================================================

    let balance = 1000;

    let multiplier = 1.00;

    let currentBet = 0;

    let hasBet = false;

    let gameState = "ready";

    let gameTimer = null;

    let countdownTimer = null;

    let soundEnabled = true;

    let history = [];

    let crashPoint = 0;

    let autoPlaying = false;

    let autoRoundsLeft = 0;

    let autoTimer = null;

    let audioContext = null;


    // =================================================
    // COUNTDOWN
    // 1 → GO
    // =================================================

    const TAKEOFF_COUNTDOWN = 1;


    // =================================================
    // FORMAT
    // =================================================

    function money(value) {

        return Number(value).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    function multiplierText(value) {

        return Number(value).toFixed(2) + "x";
    }


    // =================================================
    // BALANCE
    // =================================================

    function updateBalance() {

        balanceEl.textContent =
            money(balance);
    }


    // =================================================
    // MULTIPLIER
    // =================================================

    function updateMultiplier() {

        const text =
            multiplierText(multiplier);

        multiplierEl.textContent =
            text;

        infoMultiplierEl.textContent =
            text;
    }


    // =================================================
    // STATUS
    // =================================================

    function setStatus(
        text,
        type = ""
    ) {

        statusEl.className = "";

        statusEl.textContent =
            text;

        if (type === "win") {

            statusEl.classList.add(
                "win-text"
            );
        }

        if (type === "crash") {

            statusEl.classList.add(
                "crash-text"
            );
        }
    }


    function updateGameStatus(text) {

        gameStatusEl.textContent =
            text;
    }


    // =================================================
    // PLANE RESET
    // =================================================

    function resetPlane() {

        planeEl.classList.remove(
            "plane-flying",
            "plane-crashed"
        );

        planeEl.style.opacity =
            "1";

        planeEl.style.left =
            "0px";

        planeEl.style.bottom =
            "0px";

        planeEl.style.transform =
            "rotate(-5deg)";
    }


    // =================================================
    // PLANE MOVEMENT
    // =================================================

    function movePlane() {

        if (gameState !== "flying") {
            return;
        }

        const width =
            gameAreaEl.clientWidth;

        const height =
            gameAreaEl.clientHeight;


        const progress =
            Math.min(
                (multiplier - 1) / 8,
                1
            );


        const x =
            Math.min(
                width - 80,
                20 +
                progress *
                (width - 110)
            );


        const yProgress =
            Math.min(
                (multiplier - 1) / 6,
                1
            );


        const y =
            Math.min(
                height - 75,
                yProgress *
                (height - 120)
            );


        planeEl.style.left =
            x + "px";

        planeEl.style.bottom =
            y + "px";


        const rotation =
            -5 -
            progress * 20;


        planeEl.style.transform =
            `rotate(${rotation}deg)`;


        planeEl.classList.add(
            "plane-flying"
        );
    }


    // =================================================
    // CRASH POINT
    // =================================================

    function generateCrashPoint() {

        const random =
            Math.random();

        let point;


        if (random < 0.12) {

            point =
                1.05 +
                Math.random() *
                0.45;

        } else if (random < 0.35) {

            point =
                1.50 +
                Math.random();

        } else if (random < 0.75) {

            point =
                2.00 +
                Math.random() *
                2.50;

        } else {

            point =
                4.50 +
                Math.random() *
                7.00;
        }


        return Number(
            point.toFixed(2)
        );
    }


    // =================================================
    // COUNTDOWN
    // =================================================

    function startCountdown() {

        gameState =
            "countdown";

        updateGameStatus(
            "Countdown"
        );

        countdownEl.style.display =
            "block";


        let count =
            TAKEOFF_COUNTDOWN;


        countdownEl.textContent =
            count;


        setStatus(
            "⏱️ Takeoff in 1 second..."
        );


        countdownEl.classList.remove(
            "countdown-pop"
        );

        void countdownEl.offsetWidth;

        countdownEl.classList.add(
            "countdown-pop"
        );


        playBeep();


        countdownTimer =
            setTimeout(() => {

                countdownEl.textContent =
                    "🚀 GO!";


                countdownEl.classList.remove(
                    "countdown-pop"
                );

                void countdownEl.offsetWidth;

                countdownEl.classList.add(
                    "go-pop"
                );


                playBeep();


                setTimeout(() => {

                    countdownEl.style.display =
                        "none";

                    startFlying();

                }, 650);

            }, 1000);
    }


    // =================================================
    // START FLYING
    // =================================================

    function startFlying() {

        gameState =
            "flying";

        multiplier =
            1.00;

        crashPoint =
            generateCrashPoint();


        resetPlane();

        updateMultiplier();

        updateGameStatus(
            "Flying"
        );


        setStatus(
            hasBet
                ? "✈️ Flying — Cash out anytime!"
                : "✈️ Plane is flying..."
        );


        gameTimer =
            setInterval(() => {

                multiplier +=
                    0.01 +
                    multiplier * 0.003;


                multiplier =
                    Number(
                        multiplier.toFixed(2)
                    );


                updateMultiplier();

                movePlane();


                multiplierEl.classList.remove(
                    "multiplier-pop"
                );

                void multiplierEl.offsetWidth;

                multiplierEl.classList.add(
                    "multiplier-pop"
                );


                // AUTO CASH OUT

                if (
                    autoPlaying &&
                    hasBet &&
                    multiplier >=
                    Number(
                        autoCashOutEl.value
                    )
                ) {

                    cashOut();

                    return;
                }


                // CRASH

                if (
                    multiplier >=
                    crashPoint
                ) {

                    crashGame();
                }

            }, 100);
    }


    // =================================================
    // PLACE BET
    // =================================================

    function placeBet() {

        if (
            gameState !== "ready" &&
            gameState !== "crashed" &&
            gameState !== "cashedout"
        ) {

            setStatus(
                "⚠️ Please wait for the next round."
            );

            return;
        }


        const amount =
            Number(
                betAmountEl.value
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            setStatus(
                "⚠️ Enter a valid bet amount."
            );

            return;
        }


        if (amount > balance) {

            setStatus(
                "❌ Insufficient virtual balance."
            );

            return;
        }


        currentBet =
            amount;


        balance -=
            amount;


        balance =
            Number(
                balance.toFixed(2)
            );


        hasBet =
            true;


        updateBalance();


        betButton.disabled =
            true;

        cashOutButton.disabled =
            false;

        cancelButton.disabled =
            false;


        setStatus(
            `🟢 Bet placed: ${money(currentBet)} credits`
        );


        startCountdown();
    }


    // =================================================
    // CASH OUT
    // =================================================

    function cashOut() {

        if (
            !hasBet ||
            gameState !== "flying"
        ) {

            return;
        }


        const payout =
            currentBet *
            multiplier;


        const profit =
            payout -
            currentBet;


        balance +=
            payout;


        balance =
            Number(
                balance.toFixed(2)
            );


        updateBalance();


        gameState =
            "cashedout";

        hasBet =
            false;


        clearGameTimer();


        cashOutButton.disabled =
            true;

        cancelButton.disabled =
            true;

        betButton.disabled =
            false;


        setStatus(
            `🎉 CASH OUT at ${multiplierText(multiplier)} — +${money(profit)} credits`,
            "win"
        );


        updateGameStatus(
            "Cashed Out"
        );


        gameAreaEl.classList.add(
            "win-flash"
        );


        setTimeout(() => {

            gameAreaEl.classList.remove(
                "win-flash"
            );

        }, 700);


        createConfetti();


        addHistory(
            multiplier,
            currentBet,
            payout,
            "CASH OUT"
        );


        currentBet =
            0;


        finishRound();


        handleAutoAfterRound(
            true
        );
    }


    // =================================================
    // CANCEL
    // =================================================

    function cancelBet() {

        if (!hasBet) {
            return;
        }


        if (
            gameState !== "countdown" &&
            gameState !== "ready"
        ) {

            setStatus(
                "⚠️ Bet can only be cancelled before takeoff."
            );

            return;
        }


        balance +=
            currentBet;


        balance =
            Number(
                balance.toFixed(2)
            );


        updateBalance();


        currentBet =
            0;

        hasBet =
            false;


        clearCountdown();


        countdownEl.style.display =
            "none";


        gameState =
            "ready";


        betButton.disabled =
            false;

        cashOutButton.disabled =
            true;

        cancelButton.disabled =
            true;


        updateGameStatus(
            "Ready"
        );


        setStatus(
            "❌ Bet cancelled."
        );
    }


    // =================================================
    // CRASH
    // =================================================

    function crashGame() {

        if (
            gameState !== "flying"
        ) {

            return;
        }


        gameState =
            "crashed";


        clearGameTimer();


        planeEl.classList.remove(
            "plane-flying"
        );

        planeEl.classList.add(
            "plane-crashed"
        );


        gameAreaEl.classList.add(
            "crash-flash"
        );

        document.body.classList.add(
            "screen-shake"
        );


        setTimeout(() => {

            gameAreaEl.classList.remove(
                "crash-flash"
            );

            document.body.classList.remove(
                "screen-shake"
            );

        }, 600);


        if (hasBet) {

            setStatus(
                `💥 CRASHED at ${multiplierText(multiplier)} — Bet lost.`,
                "crash"
            );


            addHistory(
                multiplier,
                currentBet,
                0,
                "CRASH"
            );


            currentBet =
                0;

            hasBet =
                false;

        } else {

            setStatus(
                `💥 Plane crashed at ${multiplierText(multiplier)}`,
                "crash"
            );


            addHistory(
                multiplier,
                0,
                0,
                "NO BET"
            );
        }


        updateGameStatus(
            "Crashed"
        );


        cashOutButton.disabled =
            true;

        cancelButton.disabled =
            true;

        betButton.disabled =
            false;


        handleAutoAfterRound(
            false
        );


        setTimeout(() => {

            if (
                gameState === "crashed"
            ) {

                prepareNextRound();
            }

        }, 2200);
    }


    // =================================================
    // NEXT ROUND
    // =================================================

    function prepareNextRound() {

        gameState =
            "ready";


        multiplier =
            1.00;


        updateMultiplier();


        resetPlane();


        updateGameStatus(
            "Ready"
        );


        setStatus(
            "🎮 Game Ready — Place your bet."
        );


        betButton.disabled =
            false;

        cashOutButton.disabled =
            true;

        cancelButton.disabled =
            true;


        if (
            autoPlaying &&
            autoRoundsLeft > 0
        ) {

            autoTimer =
                setTimeout(() => {

                    autoPlaceBet();

                }, 1000);
        }
    }


    function finishRound() {

        setTimeout(() => {

            if (
                gameState === "cashedout"
            ) {

                prepareNextRound();
            }

        }, 1200);
    }


    // =================================================
    // CLEAR TIMERS
    // =================================================

    function clearGameTimer() {

        if (gameTimer) {

            clearInterval(
                gameTimer
            );

            gameTimer =
                null;
        }
    }


    function clearCountdown() {

        if (countdownTimer) {

            clearTimeout(
                countdownTimer
            );

            countdownTimer =
                null;
        }
    }


    // =================================================
    // HISTORY
    // =================================================

    function addHistory(
        multiplierValue,
        bet,
        payout,
        result
    ) {

        history.unshift({

            multiplier:
                multiplierValue,

            bet:
                bet,

            payout:
                payout,

            result:
                result
        });


        if (history.length > 20) {

            history.pop();
        }


        renderHistory();
    }


    function renderHistory() {

        if (
            history.length === 0
        ) {

            gameHistoryEl.innerHTML = `
                <div class="history-empty">
                    📜 History: Empty
                </div>
            `;

            return;
        }


        gameHistoryEl.innerHTML =
            history.map(
                (item, index) => {

                    return `
                        <div class="history-row">

                            <div>
                                #${history.length - index}
                            </div>

                            <div>
                                ${multiplierText(item.multiplier)}
                            </div>

                            <div>
                                ${money(item.bet)}
                            </div>

                            <div>
                                ${money(item.payout)}
                            </div>

                            <div>
                                ${item.result}
                            </div>

                        </div>
                    `;
                }
            ).join("");
    }


    // =================================================
    // HALF BET
    // =================================================

    window.halfBet =
        function () {

            const value =
                Number(
                    betAmountEl.value
                );


            betAmountEl.value =
                Math.max(
                    1,
                    Number(
                        (
                            value / 2
                        ).toFixed(2)
                    )
                );
        };


    // =================================================
    // DOUBLE BET
    // =================================================

    window.doubleBet =
        function () {

            const value =
                Number(
                    betAmountEl.value
                );


            betAmountEl.value =
                Math.min(
                    balance,
                    Number(
                        (
                            value * 2
                        ).toFixed(2)
                    )
                );
        };


    // =================================================
    // DEPOSIT
    // =================================================

    function depositDemoCredits() {

        balance +=
            500;


        balance =
            Number(
                balance.toFixed(2)
            );


        updateBalance();


        setStatus(
            "💵 +500 virtual credits added."
        );


        playBeep();
    }


    // =================================================
    // SOUND
    // =================================================

    function playBeep() {

        if (!soundEnabled) {
            return;
        }


        try {

            if (!audioContext) {

                audioContext =
                    new (
                        window.AudioContext ||
                        window.webkitAudioContext
                    )();
            }


            const oscillator =
                audioContext.createOscillator();


            const gain =
                audioContext.createGain();


            oscillator.type =
                "sine";


            oscillator.frequency.value =
                600;


            gain.gain.setValueAtTime(
                0.05,
                audioContext.currentTime
            );


            gain.gain.exponentialRampToValueAtTime(
                0.001,
                audioContext.currentTime + 0.12
            );


            oscillator.connect(
                gain
            );


            gain.connect(
                audioContext.destination
            );


            oscillator.start();


            oscillator.stop(
                audioContext.currentTime + 0.12
            );

        } catch (error) {

            // Sound is optional.
        }
    }


    function toggleSound() {

        soundEnabled =
            !soundEnabled;


        soundButton.textContent =
            soundEnabled
                ? "🔊 SOUND ON"
                : "🔇 SOUND OFF";


        if (soundEnabled) {

            playBeep();
        }
    }


    // =================================================
    // RESET
    // =================================================

    function resetGame() {

        clearGameTimer();

        clearCountdown();


        if (autoTimer) {

            clearTimeout(
                autoTimer
            );

            autoTimer =
                null;
        }


        autoPlaying =
            false;

        autoRoundsLeft =
            0;


        currentBet =
            0;

        hasBet =
            false;


        balance =
            1000;

        multiplier =
            1.00;


        gameState =
            "ready";


        history =
            [];


        countdownEl.style.display =
            "none";


        updateBalance();

        updateMultiplier();

        resetPlane();

        renderHistory();


        betButton.disabled =
            false;

        cashOutButton.disabled =
            true;

        cancelButton.disabled =
            true;


        updateGameStatus(
            "Ready"
        );


        autoStatusEl.textContent =
            "🤖 Auto Play: OFF";


        setStatus(
            "🔄 Game has been reset."
        );
    }


    // =================================================
    // AUTO PLAY
    // =================================================

    function startAutoPlay() {

        if (autoPlaying) {

            setStatus(
                "🤖 Auto Play is already running."
            );

            return;
        }


        const rounds =
            Number(
                autoRoundsEl.value
            );


        const amount =
            Number(
                autoBetAmountEl.value
            );


        const cashOut =
            Number(
                autoCashOutEl.value
            );


        if (
            !Number.isFinite(rounds) ||
            rounds < 1
        ) {

            setStatus(
                "⚠️ Enter valid auto rounds."
            );

            return;
        }


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            setStatus(
                "⚠️ Enter valid auto bet."
            );

            return;
        }


        if (
            !Number.isFinite(cashOut) ||
            cashOut < 1
        ) {

            setStatus(
                "⚠️ Enter valid auto cash out."
            );

            return;
        }


        if (amount > balance) {

            setStatus(
                "❌ Insufficient virtual balance."
            );

            return;
        }


        autoPlaying =
            true;


        autoRoundsLeft =
            rounds;


        autoStatusEl.textContent =
            `🤖 Auto Play: ON — ${autoRoundsLeft} rounds left`;


        autoPlaceBet();
    }


    function autoPlaceBet() {

        if (!autoPlaying) {
            return;
        }


        if (autoRoundsLeft <= 0) {

            stopAutoPlay();

            return;
        }


        if (gameState !== "ready") {

            return;
        }


        const amount =
            Number(
                autoBetAmountEl.value
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > balance
        ) {

            setStatus(
                "❌ Auto Play stopped: insufficient balance."
            );

            stopAutoPlay();

            return;
        }


        betAmountEl.value =
            amount;


        autoRoundsLeft--;


        autoStatusEl.textContent =
            `🤖 Auto Play: ON — ${autoRoundsLeft} rounds left`;


        placeBet();
    }


    function handleAutoAfterRound(
        won
    ) {

        if (!autoPlaying) {
            return;
        }


        const stopOnLoss =
            stopOnLossEl.checked;


        const stopOnProfit =
            Number(
                stopOnProfitEl.value
            );


        if (
            !won &&
            stopOnLoss
        ) {

            autoStatusEl.textContent =
                "🛑 Auto Play stopped on loss.";


            stopAutoPlay();

            return;
        }


        if (
            stopOnProfit > 0 &&
            balance >=
            1000 + stopOnProfit
        ) {

            autoStatusEl.textContent =
                "🎯 Auto Play stopped on profit.";


            stopAutoPlay();

            return;
        }


        if (
            autoRoundsLeft <= 0
        ) {

            autoStatusEl.textContent =
                "✅ Auto Play completed.";


            stopAutoPlay();

            return;
        }


        autoStatusEl.textContent =
            `🤖 Auto Play: ON — ${autoRoundsLeft} rounds left`;
    }


    function stopAutoPlay() {

        autoPlaying =
            false;

        autoRoundsLeft =
            0;


        if (autoTimer) {

            clearTimeout(
                autoTimer
            );

            autoTimer =
                null;
        }


        autoStatusEl.textContent =
            "🤖 Auto Play: OFF";
    }


    // =================================================
    // CONFETTI
    // =================================================

    function createConfetti() {

        const container =
            document.createElement(
                "div"
            );


        container.className =
            "confetti-container";


        const symbols = [
            "🎉",
            "✨",
            "⭐",
            "💰",
            "🎊"
        ];


        for (
            let i = 0;
            i < 35;
            i++
        ) {

            const piece =
                document.createElement(
                    "div"
                );


            piece.className =
                "confetti-piece";


            piece.textContent =
                symbols[
                    Math.floor(
                        Math.random() *
                        symbols.length
                    )
                ];


            piece.style.left =
                Math.random() *
                100 +
                "%";


            piece.style.animationDelay =
                Math.random() *
                0.5 +
                "s";


            container.appendChild(
                piece
            );
        }


        document.body.appendChild(
            container
        );


        setTimeout(() => {

            container.remove();

        }, 2600);
    }


    // =================================================
    // BUTTON EVENTS
    // =================================================

    betButton.addEventListener(
        "click",
        placeBet
    );


    cashOutButton.addEventListener(
        "click",
        cashOut
    );


    cancelButton.addEventListener(
        "click",
        cancelBet
    );


    depositButton.addEventListener(
        "click",
        depositDemoCredits
    );


    soundButton.addEventListener(
        "click",
        toggleSound
    );


    resetButton.addEventListener(
        "click",
        resetGame
    );


    autoPlayButton.addEventListener(
        "click",
        startAutoPlay
    );


    stopAutoButton.addEventListener(
        "click",
        stopAutoPlay
    );


    // =================================================
    // ENTER KEY
    // =================================================

    betAmountEl.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                placeBet();
            }
        }
    );


    // =================================================
    // INITIALIZE
    // =================================================

    updateBalance();

    updateMultiplier();

    resetPlane();

    renderHistory();

    updateGameStatus(
        "Ready"
    );


    betButton.disabled =
        false;

    cashOutButton.disabled =
        true;

    cancelButton.disabled =
        true;


    setStatus(
        "🎮 Game Ready — Place your bet."
    );

});
