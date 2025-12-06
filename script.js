// ------------------------------
// Find first repeated Hebrew word
// ------------------------------
function findDoubleWord(text) {
    const words = text.trim().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
        if (words[i] === words[i + 1]) {
            return words[i];
        }
    }
    return "";
}

// ------------------------------
// Speech Recognition Setup
// ------------------------------
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let sttTimeout = null;
let lastPartialText = ""; // save partial / final results

function setupRecognition() {
    if (!SpeechRecognition) {
        document.getElementById("status").innerText =
            "Speech Recognition not supported.";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "he-IL"; // Hebrew
    recognition.interimResults = true; // so we can capture partial words
    recognition.continuous = false;
}

setupRecognition();

// ------------------------------
// Start Listening (triggered by shake only)
// ------------------------------
function startListening() {
    if (!recognition) return;

    document.getElementById("status").innerText = "Listening…";

    lastPartialText = "";
    recognition.start();

    // Stop STT automatically after 10 seconds
    sttTimeout = setTimeout(() => {
        recognition.stop();
        processSpeech(lastPartialText);
    }, 10000);

    recognition.onresult = function (event) {
        // always store latest partial or final result
        lastPartialText = event.results[0][0].transcript;
    };

    recognition.onerror = function () {
        clearTimeout(sttTimeout);
        processSpeech(lastPartialText);
    };

    recognition.onend = function () {
        // STT ended naturally (not because of timeout)
        clearTimeout(sttTimeout);
        processSpeech(lastPartialText);
    };
}

// ------------------------------
// Process speech (whether timeout or finished)
// ------------------------------
function processSpeech(text) {
    if (!text || text.trim() === "") {
        return;
    }

    const repeated = findDoubleWord(text);

    if (repeated !== "") {
        window.location.href =
            "https://www.google.com/search?q=" + encodeURIComponent(repeated);
    }
}

// ------------------------------
// Fullscreen activation
// ------------------------------
async function activateFullscreen() {
    try {
        await document.documentElement.requestFullscreen();
    } catch (e) {
        console.warn("Fullscreen failed:", e);
    }
}

// ------------------------------
// Shake Detection
// ------------------------------
let shakeEnabled = false;
let lastShake = Date.now();

function enableShake() {
    shakeEnabled = true;

    activateFullscreen(); // <-- full screen

    document.getElementById("blackout").style.display = "block";
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("status").style.display = "none";
}

function handleMotion(event) {
    if (!shakeEnabled) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const strength =
        Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);

    if (strength > 25) {
        const now = Date.now();
        if (now - lastShake > 1500) {
            lastShake = now;
            startListening();
        }
    }
}

// iOS motion permission
if (typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function") {
    document.body.addEventListener("click", () => {
        DeviceMotionEvent.requestPermission()
            .then((state) => {
                if (state === "granted") {
                    window.addEventListener("devicemotion", handleMotion);
                }
            });
    });
} else {
    window.addEventListener("devicemotion", handleMotion);
}

// ------------------------------
// BUTTON — only activates shake mode
// ------------------------------
document.getElementById("startBtn").addEventListener("click", enableShake);
