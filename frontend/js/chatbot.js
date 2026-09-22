/**
 * SmartClean Assistant
 * Page-aware civic help, quick navigation, status guidance, and voice input.
 */

(function () {
    "use strict";

    const path = window.location.pathname.toLowerCase();
    if (path.includes("admin-dashboard") || path.includes("admin-login")) return;

    document.addEventListener("DOMContentLoaded", initSmartCleanAssistant);

    function initSmartCleanAssistant() {
        if (document.getElementById("smartcleanChatRoot")) return;

        const state = {
            language: localStorage.getItem("smartcleanLanguage") || "en",
            voiceEnabled: false,
            recognition: null,
            listening: false,
            user: getCitizenContext()
        };

        document.body.insertAdjacentHTML("beforeend", buildAssistantHTML(state));

        const root = document.getElementById("smartcleanChatRoot");
        const toggle = document.getElementById("smartcleanChatToggle");
        const windowEl = document.getElementById("smartcleanChatWindow");
        const body = document.getElementById("smartcleanChatBody");
        const form = document.getElementById("smartcleanChatForm");
        const input = document.getElementById("smartcleanChatInput");
        const close = document.getElementById("smartcleanChatClose");
        const clear = document.getElementById("smartcleanChatClear");
        const voice = document.getElementById("smartcleanChatVoiceToggle");
        const mic = document.getElementById("smartcleanChatMic");
        const badge = document.getElementById("smartcleanChatBadge");
        const lang = document.getElementById("smartcleanChatLang");

        renderWelcome(body, state);
        setupSpeech(state, mic, input);

        toggle.addEventListener("click", function () {
            const open = windowEl.classList.toggle("active");
            windowEl.setAttribute("aria-hidden", String(!open));
            if (badge) badge.style.display = "none";
            if (open) input.focus();
            if (!open && window.speechSynthesis) window.speechSynthesis.cancel();
        });

        close.addEventListener("click", function () {
            windowEl.classList.remove("active");
            windowEl.setAttribute("aria-hidden", "true");
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        });

        clear.addEventListener("click", function () {
            body.innerHTML = "";
            renderWelcome(body, state);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        });

        voice.addEventListener("click", function () {
            state.voiceEnabled = !state.voiceEnabled;
            voice.classList.toggle("active", state.voiceEnabled);
            voice.title = state.voiceEnabled ? "Voice readout is on" : "Voice readout is off";
            if (state.voiceEnabled) speak("Voice readout is now enabled.", state.language);
            else if (window.speechSynthesis) window.speechSynthesis.cancel();
        });

        lang.addEventListener("change", function () {
            state.language = lang.value;
            localStorage.setItem("smartcleanLanguage", state.language);
            addBotMessage(body, getLanguageMessage(state.language), [
                chip("Report issue", "How do I report an issue?"),
                chip("Track status", "How do I track my report?")
            ], state);
        });

        mic.addEventListener("click", function () {
            if (!state.recognition) {
                addBotMessage(body, "Voice input is not supported in this browser. You can type your request below.", null, state);
                return;
            }
            if (state.listening) stopListening(state, mic, input);
            else startListening(state, mic, input);
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            input.value = "";
            handleUserMessage(text, body, state);
        });

        root.addEventListener("click", function (event) {
            const chipButton = event.target.closest("[data-chat-query]");
            if (chipButton) {
                handleUserMessage(chipButton.getAttribute("data-chat-query"), body, state);
                return;
            }

            const actionButton = event.target.closest("[data-chat-action]");
            if (actionButton) {
                handleAction(actionButton.getAttribute("data-chat-action"), body, state);
            }
        });
    }

    function buildAssistantHTML(state) {
        return `
            <div id="smartcleanChatRoot" class="smartclean-assistant-root">
                <button id="smartcleanChatToggle" class="smartclean-chat-toggle smartclean-chat-toggle-prominent" aria-label="Open SmartClean Assistant" title="Open SmartClean Assistant">
                    <div class="chat-toggle-inner">
                        <span class="chat-toggle-symbol">AI</span>
                        <span class="chat-toggle-leaf">●</span>
                    </div>
                    <span class="chat-badge" id="smartcleanChatBadge">1</span>
                </button>

                <section id="smartcleanChatWindow" class="smartclean-chat-window smartclean-chat-window-prominent" role="dialog" aria-labelledby="chatBotTitle" aria-hidden="true">
                    <header class="smartclean-chat-header smartclean-chat-header-prominent">
                        <div class="chat-header-info">
                            <div class="chat-avatar chat-avatar-prominent">SC</div>
                            <div class="chat-header-text">
                                <h4 id="chatBotTitle">SmartClean Assistant <span class="chat-ai-pill">LIVE</span></h4>
                                <p><span class="chat-status-dot"></span> Reports, drone requests, OTP help</p>
                            </div>
                        </div>
                        <div class="chat-header-actions">
                            <select id="smartcleanChatLang" class="chat-lang-select" title="Assistant language">
                                <option value="en" ${state.language === "en" ? "selected" : ""}>EN</option>
                                <option value="hi" ${state.language === "hi" ? "selected" : ""}>हिन्दी</option>
                                <option value="or" ${state.language === "or" ? "selected" : ""}>ଓଡ଼ିଆ</option>
                            </select>
                            <button type="button" class="chat-header-btn" id="smartcleanChatVoiceToggle" title="Voice readout">🔊</button>
                            <button type="button" class="chat-header-btn" id="smartcleanChatClear" title="Restart chat">↻</button>
                            <button type="button" class="chat-header-btn" id="smartcleanChatClose" title="Minimize">×</button>
                        </div>
                    </header>

                    <div class="smartclean-chat-body smartclean-chat-body-prominent" id="smartcleanChatBody"></div>

                    <form class="smartclean-chat-footer" id="smartcleanChatForm">
                        <button type="button" class="chat-mic-btn" id="smartcleanChatMic" title="Voice input">🎙</button>
                        <div class="chat-input-wrapper">
                            <input type="text" id="smartcleanChatInput" class="chat-input" placeholder="Ask about reports, OTP, drone, tracking..." autocomplete="off">
                        </div>
                        <button type="submit" class="chat-send-btn" id="smartcleanChatSend" title="Send">➤</button>
                    </form>
                    <div class="chat-footer-brand">SmartClean Assistant • Fast civic guidance</div>
                </section>
            </div>
        `;
    }

    function renderWelcome(body, state) {
        const firstName = state.user.name || "Citizen";
        const page = getPageContext();

        body.insertAdjacentHTML("beforeend", `<div class="chat-day-divider">Today</div>`);
        addBotMessage(
            body,
            `
                <p><strong>Hello ${escapeHTML(firstName)}.</strong> I can help you move around SMARTCLEAN quickly.</p>
                <p class="chat-muted-line">${escapeHTML(page.summary)}</p>
                <div class="chat-command-grid">
                    ${command("Report issue", "Submit a sanitation complaint", "report")}
                    ${command("Track reports", "Check complaint progress", "track")}
                    ${command("Drone scan", "Request aerial inspection", "drone")}
                    ${command("OTP help", "Fix login verification", "otp")}
                </div>
            `,
            [
                chip("Report issue", "How do I report an issue?"),
                chip("Track my reports", "How do I track my report?"),
                chip("Open drone request", "Open drone request"),
                chip("OTP not received", "OTP is not coming")
            ],
            state
        );
    }

    function command(title, subtitle, action) {
        return `
            <button type="button" class="chat-command-card" data-chat-action="${action}">
                <strong>${escapeHTML(title)}</strong>
                <span>${escapeHTML(subtitle)}</span>
            </button>
        `;
    }

    function chip(label, query) {
        return { label, query };
    }

    function handleUserMessage(text, body, state) {
        addUserMessage(body, text);
        const typing = showTyping(body);

        window.setTimeout(function () {
            typing.remove();
            const response = buildResponse(text);
            addBotMessage(body, response.html, response.chips, state, response.speak);
        }, 350);
    }

    function handleAction(action, body, state) {
        const actionMap = {
            report: "Open report page",
            track: "Open track reports page",
            drone: "Open drone request",
            otp: "OTP is not coming",
            dashboard: "Open dashboard"
        };
        handleUserMessage(actionMap[action] || action, body, state);
    }

    function buildResponse(text) {
        const q = text.toLowerCase();

        if (matches(q, ["open report", "report issue", "submit complaint", "new complaint", "garbage", "waste issue", "complain"])) {
            return {
                html: `
                    <p><strong>Report an issue</strong></p>
                    <p>Use the report page to submit category, description, GPS location, and photos.</p>
                    <div class="chat-action-row">
                        <a class="chat-action-btn primary" href="report.html">Open Report Page</a>
                        <button class="chat-action-btn" data-chat-query="What details should I add in a report?">What to include?</button>
                    </div>
                `,
                chips: [
                    chip("Track after submitting", "How do I track my report?"),
                    chip("Photo upload help", "Photo upload is not working")
                ],
                speak: "Open the report page to submit the issue with location, description, and photos."
            };
        }

        if (matches(q, ["track", "status", "my reports", "complaints", "progress", "resolved", "pending"])) {
            return {
                html: `
                    <p><strong>Track reports</strong></p>
                    <p>The tracking page shows every submitted report with status, priority, photos, and resolution evidence.</p>
                    <ul>
                        <li><strong>Pending:</strong> received and waiting for review.</li>
                        <li><strong>Assigned / In Progress:</strong> team action has started.</li>
                        <li><strong>Resolved:</strong> completed with verification proof.</li>
                    </ul>
                    <div class="chat-action-row">
                        <a class="chat-action-btn primary" href="complaints.html">Open Track Reports</a>
                        <a class="chat-action-btn" href="dashboard.html">Dashboard</a>
                    </div>
                `,
                chips: [
                    chip("Report a new issue", "Open report page"),
                    chip("What does resolved mean?", "What does resolved status mean?")
                ],
                speak: "You can track all reports from the Track Reports page."
            };
        }

        if (matches(q, ["drone", "aerial", "scan", "inspection", "uav"])) {
            return {
                html: `
                    <p><strong>Drone inspection</strong></p>
                    <p>Drone requests are for large dump sites, drainage canals, illegal dumping zones, and hard-to-inspect sanitation areas.</p>
                    <div class="chat-action-row">
                        <a class="chat-action-btn primary" href="drone.html?return=dashboard.html">Open Drone Request</a>
                    </div>
                `,
                chips: [
                    chip("Capture GPS help", "How do I use GPS for drone request?"),
                    chip("Report normal issue", "Open report page")
                ],
                speak: "Use the drone page to request an aerial sanitation inspection."
            };
        }

        if (matches(q, ["otp", "login", "verification", "sms", "message", "call", "not coming", "not received"])) {
            return {
                html: `
                    <p><strong>OTP help</strong></p>
                    <p>SMARTCLEAN now uses the working 2Factor OTP call for citizen login and registration.</p>
                    <div class="chat-help-stack">
                        <span>1. Keep the backend running.</span>
                        <span>2. Use a valid Indian 10-digit mobile number.</span>
                        <span>3. Answer the OTP call and enter the spoken 6-digit code.</span>
                    </div>
                    <div class="chat-action-row">
                        <a class="chat-action-btn primary" href="login.html">Open Login</a>
                        <a class="chat-action-btn" href="otp.html">OTP Page</a>
                    </div>
                `,
                chips: [
                    chip("Why call OTP?", "Why are we using OTP call?"),
                    chip("OTP not received", "OTP call is not coming")
                ],
                speak: "SmartClean now uses the working 2Factor OTP call for login and registration."
            };
        }

        if (matches(q, ["photo", "image", "upload", "camera"])) {
            return {
                html: `
                    <p><strong>Photo upload help</strong></p>
                    <p>Use JPG, PNG, or WebP images under 5 MB. Clear location photos help the municipal team verify and resolve the issue faster.</p>
                    <div class="chat-action-row">
                        <a class="chat-action-btn primary" href="report.html">Go to Upload</a>
                    </div>
                `,
                chips: [
                    chip("GPS help", "How do I capture GPS?"),
                    chip("Submit report", "Open report page")
                ]
            };
        }

        if (matches(q, ["gps", "location", "map", "address"])) {
            return {
                html: `
                    <p><strong>Location guidance</strong></p>
                    <p>You can use GPS, map selection, or a manually typed address. Add a landmark if the area is hard to find.</p>
                    <div class="chat-action-row">
                        <a class="chat-action-btn primary" href="report.html">Open Location Form</a>
                        <a class="chat-action-btn" href="drone.html?return=dashboard.html">Drone GPS Request</a>
                    </div>
                `,
                chips: [
                    chip("Photo help", "Photo upload is not working"),
                    chip("Track reports", "How do I track my report?")
                ]
            };
        }

        if (matches(q, ["dashboard", "home", "main page"])) {
            return {
                html: `
                    <p><strong>Dashboard shortcut</strong></p>
                    <p>The citizen dashboard summarizes your submitted reports, quick actions, and service status.</p>
                    <div class="chat-action-row">
                        <a class="chat-action-btn primary" href="dashboard.html">Open Dashboard</a>
                        <a class="chat-action-btn" href="index.html">Home</a>
                    </div>
                `,
                chips: [
                    chip("Report issue", "Open report page"),
                    chip("Drone request", "Open drone request")
                ]
            };
        }

        if (matches(q, ["hello", "hi", "hey", "help", "namaste"])) {
            return {
                html: `
                    <p><strong>I am here.</strong> Ask me anything about SMARTCLEAN.</p>
                    <p>I can help with complaint submission, tracking, drone inspection, OTP login, GPS, and photo upload.</p>
                `,
                chips: [
                    chip("Report issue", "Open report page"),
                    chip("Track report", "How do I track my report?"),
                    chip("Drone request", "Open drone request"),
                    chip("OTP help", "OTP is not coming")
                ]
            };
        }

        return {
            html: `
                <p><strong>Here is what I can do:</strong></p>
                <div class="chat-command-grid">
                    ${command("Report", "Submit waste or sanitation issue", "report")}
                    ${command("Track", "Check status and resolution proof", "track")}
                    ${command("Drone", "Request aerial inspection", "drone")}
                    ${command("OTP", "Login verification help", "otp")}
                </div>
            `,
            chips: [
                chip("Report issue", "Open report page"),
                chip("Track status", "How do I track my report?"),
                chip("Drone request", "Open drone request"),
                chip("OTP help", "OTP is not coming")
            ]
        };
    }

    function addUserMessage(body, text) {
        appendMessage(body, "user", `<p>${escapeHTML(text)}</p>`);
    }

    function addBotMessage(body, html, chips, state, speakText) {
        const chipHTML = chips && chips.length
            ? `<div class="chat-quick-chips">${chips.map(function (item) {
                return `<button type="button" class="chat-chip" data-chat-query="${escapeAttribute(item.query)}">${escapeHTML(item.label)}</button>`;
            }).join("")}</div>`
            : "";

        appendMessage(
            body,
            "bot",
            `${html}<span class="chat-timestamp">${getCurrentTime()}</span>${chipHTML}`
        );

        if (state.voiceEnabled) speak(speakText || stripHTML(html), state.language);
    }

    function appendMessage(body, sender, html) {
        const avatar = sender === "bot" ? "SC" : "You";
        const item = document.createElement("div");
        item.className = `chat-message ${sender}`;
        item.innerHTML = `
            <div class="chat-msg-avatar">${avatar}</div>
            <div class="chat-msg-bubble">${html}</div>
        `;
        body.appendChild(item);
        body.scrollTop = body.scrollHeight;
    }

    function showTyping(body) {
        const item = document.createElement("div");
        item.className = "chat-message bot typing-message";
        item.innerHTML = `
            <div class="chat-msg-avatar">SC</div>
            <div class="chat-msg-bubble chat-typing">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        body.appendChild(item);
        body.scrollTop = body.scrollHeight;
        return item;
    }

    function setupSpeech(state, mic, input) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            mic.style.display = "none";
            return;
        }

        state.recognition = new SpeechRecognition();
        state.recognition.continuous = false;
        state.recognition.interimResults = false;

        state.recognition.onstart = function () {
            state.listening = true;
            mic.classList.add("listening");
            input.placeholder = "Listening...";
        };

        state.recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            stopListening(state, mic, input);
            input.form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        };

        state.recognition.onerror = function () {
            stopListening(state, mic, input);
        };

        state.recognition.onend = function () {
            stopListening(state, mic, input);
        };
    }

    function startListening(state, mic, input) {
        try {
            state.recognition.lang = state.language === "hi" ? "hi-IN" : state.language === "or" ? "or-IN" : "en-IN";
            state.recognition.start();
        } catch (error) {
            stopListening(state, mic, input);
        }
    }

    function stopListening(state, mic, input) {
        state.listening = false;
        mic.classList.remove("listening");
        input.placeholder = "Ask about reports, OTP, drone, tracking...";
        try {
            if (state.recognition) state.recognition.stop();
        } catch (error) {}
    }

    function speak(text, language) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(String(text || ""));
        utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
    }

    function getCitizenContext() {
        try {
            const user = typeof getSmartcleanUser === "function" ? getSmartcleanUser() : null;
            if (user) {
                return {
                    name: user.name || "Citizen",
                    mobile: user.mobile || "",
                    email: user.email || ""
                };
            }
        } catch (error) {}

        return { name: "Citizen", mobile: "", email: "" };
    }

    function getPageContext() {
        const page = window.location.pathname.split("/").pop() || "index.html";
        const summaries = {
            "index.html": "You are on the public home page.",
            "login.html": "You are on the citizen login page.",
            "register.html": "You are creating a citizen account.",
            "otp.html": "You are on the OTP verification page.",
            "dashboard.html": "You are on the citizen dashboard.",
            "report.html": "You are submitting a sanitation report.",
            "complaints.html": "You are tracking submitted reports.",
            "drone.html": "You are requesting drone inspection."
        };
        return { page, summary: summaries[page] || "You are using SMARTCLEAN." };
    }

    function getLanguageMessage(language) {
        if (language === "hi") return "भाषा हिन्दी पर सेट है। मैं रिपोर्ट, OTP, ड्रोन और स्टेटस में मदद कर सकता हूँ।";
        if (language === "or") return "ଭାଷା ଓଡ଼ିଆରେ ସେଟ୍ ହୋଇଛି। ମୁଁ ରିପୋର୍ଟ, OTP, ଡ୍ରୋନ୍ ଏବଂ ସ୍ଥିତିରେ ସହାୟତା କରିପାରିବି।";
        return "Language set to English. I can help with reports, OTP, drone requests, and status tracking.";
    }

    function matches(value, words) {
        return words.some(function (word) {
            return value.includes(word);
        });
    }

    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function stripHTML(value) {
        const div = document.createElement("div");
        div.innerHTML = value;
        return div.textContent || div.innerText || "";
    }

    function escapeHTML(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHTML(value).replaceAll("`", "&#096;");
    }
})();
