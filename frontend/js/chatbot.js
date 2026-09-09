/**
 * SmartClean AI Multilingual Voice & Chat Assistant (CleanBot)
 * Featuring Speech-to-Text (Voice Input), Text-to-Speech (Voice Output),
 * Multi-lingual Natural Language Understanding (English, Hindi, Odia),
 * and Strict Privacy/Security Guardrails.
 */

(function () {
    // Exclude chatbot on Admin pages
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes("admin-dashboard") || currentPath.includes("admin-login")) {
        return;
    }

    document.addEventListener("DOMContentLoaded", initSmartCleanVoiceChatbot);

    function initSmartCleanVoiceChatbot() {
        if (document.getElementById("smartcleanChatToggle")) return;

        // Current Language State (defaults to site language or 'en')
        let currentLang = localStorage.getItem("smartcleanLanguage") || "en";
        let isAutoVoiceEnabled = false;
        let isListening = false;
        let speechRecognition = null;

        // Initialize Speech Recognition if supported
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const isSpeechSupported = !!SpeechRecognition;

        // 1. Inject Floating Button & Chat Window HTML
        const chatWidgetHTML = `
            <!-- Chatbot Floating Toggle Button with AI + Eco Icon -->
            <button id="smartcleanChatToggle" class="smartclean-chat-toggle" aria-label="Open SmartClean AI Assistant" title="Chat with SmartClean AI Assistant">
                <div class="chat-toggle-inner">
                    <span>🤖</span>
                    <span class="chat-toggle-leaf">🌱</span>
                </div>
                <span class="chat-badge" id="smartcleanChatBadge">1</span>
            </button>

            <!-- Chatbot Window -->
            <div id="smartcleanChatWindow" class="smartclean-chat-window" role="dialog" aria-labelledby="chatBotTitle" aria-hidden="true">
                <div class="smartclean-chat-header">
                    <div class="chat-header-info">
                        <div class="chat-avatar">🤖</div>
                        <div class="chat-header-text">
                            <h4 id="chatBotTitle">SmartClean AI <span class="chat-ai-pill">VOICE</span></h4>
                            <p><span class="chat-status-dot"></span> Online • Civic Sanitation</p>
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        <!-- Language Switcher -->
                        <select id="smartcleanChatLang" class="chat-lang-select" title="Change Assistant Language">
                            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
                            <option value="hi" ${currentLang === 'hi' ? 'selected' : ''}>🇮🇳 हिन्दी</option>
                            <option value="or" ${currentLang === 'or' ? 'selected' : ''}>🇮🇳 ଓଡ଼ିଆ</option>
                        </select>
                        <button class="chat-header-btn" id="smartcleanChatVoiceToggle" title="Toggle Auto Voice Readout (Text-to-Speech)">🔊</button>
                        <button class="chat-header-btn" id="smartcleanChatClear" title="Clear Chat">🗑️</button>
                        <button class="chat-header-btn" id="smartcleanChatClose" title="Minimize Chat">✕</button>
                    </div>
                </div>

                <div class="smartclean-chat-body" id="smartcleanChatBody">
                    <!-- Initial Welcome Message -->
                    <div class="chat-message bot">
                        <div class="chat-msg-avatar">🌱</div>
                        <div class="chat-msg-bubble">
                            <p><strong>Hello! 👋 I am your SmartClean AI Voice & Chat Assistant.</strong></p>
                            <p>I can help you with <em>any</em> waste, sanitation, or website question in <strong>English, हिन्दी, or ଓଡ଼ିଆ</strong>:</p>
                            <ul>
                                <li><strong>Report Waste:</strong> How to report issues with GPS & photo evidence</li>
                                <li><strong>Track Status:</strong> Checking complaint status (Pending ➔ Resolved)</li>
                                <li><strong>Waste Disposal:</strong> Where & how to dispose of specific waste items</li>
                                <li><strong>Voice Queries:</strong> Click the microphone 🎙️ below to speak!</li>
                            </ul>
                            <p>How can I help you today?</p>
                            <button class="chat-speak-btn" onclick="window.smartcleanSpeakText('Hello! I am your SmartClean Assistant. How can I help you today?')">🔊 Listen</button>
                            <div class="chat-quick-chips">
                                <button class="chat-chip" data-query="How do I report a waste issue?">📝 Report Issue</button>
                                <button class="chat-chip" data-query="How do I track my complaint status?">📊 Track Status</button>
                                <button class="chat-chip" data-query="How to segregate wet and dry waste?">🌿 Segregation Rules</button>
                                <button class="chat-chip" data-query="Where should I throw coconut shells and batteries?">🗑️ Item Disposal</button>
                                <button class="chat-chip" data-query="What is the response time?">⏱️ Response Time</button>
                            </div>
                        </div>
                    </div>
                </div>

                <form class="smartclean-chat-footer" id="smartcleanChatForm">
                    <!-- Microphone Button -->
                    <button type="button" class="chat-mic-btn" id="smartcleanChatMic" title="Speak your question (Voice Input)">🎙️</button>
                    <div class="chat-input-wrapper">
                        <input type="text" id="smartcleanChatInput" class="chat-input" placeholder="Type or click 🎙️ to speak..." autocomplete="off" />
                    </div>
                    <button type="submit" class="chat-send-btn" id="smartcleanChatSend" title="Send message">➤</button>
                </form>
                <div class="chat-footer-brand">🌿 SmartClean AI • Multilingual Voice & Civic Intelligence</div>
            </div>
        `;

        const wrapper = document.createElement("div");
        wrapper.id = "smartcleanChatRoot";
        wrapper.innerHTML = chatWidgetHTML;
        document.body.appendChild(wrapper);

        // 2. Setup DOM Elements
        const toggleBtn = document.getElementById("smartcleanChatToggle");
        const chatWindow = document.getElementById("smartcleanChatWindow");
        const closeBtn = document.getElementById("smartcleanChatClose");
        const clearBtn = document.getElementById("smartcleanChatClear");
        const voiceToggleBtn = document.getElementById("smartcleanChatVoiceToggle");
        const langSelect = document.getElementById("smartcleanChatLang");
        const micBtn = document.getElementById("smartcleanChatMic");
        const chatForm = document.getElementById("smartcleanChatForm");
        const chatInput = document.getElementById("smartcleanChatInput");
        const chatBody = document.getElementById("smartcleanChatBody");
        const chatBadge = document.getElementById("smartcleanChatBadge");

        // 3. Setup Voice Input (Speech-to-Text)
        if (isSpeechSupported) {
            speechRecognition = new SpeechRecognition();
            speechRecognition.continuous = false;
            speechRecognition.interimResults = false;

            speechRecognition.onstart = function () {
                isListening = true;
                micBtn.classList.add("listening");
                micBtn.innerHTML = "🔴";
                chatInput.placeholder = currentLang === "hi" ? "🎙️ सुन रहा हूँ... बोलिए" : (currentLang === "or" ? "🎙️ ଶୁଣୁଛି... କୁହନ୍ତୁ" : "🎙️ Listening... Speak now");
            };

            speechRecognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript;
                chatInput.value = transcript;
                stopListening();
                handleUserQuery(transcript);
            };

            speechRecognition.onerror = function (event) {
                console.warn("Speech recognition error:", event.error);
                stopListening();
            };

            speechRecognition.onend = function () {
                stopListening();
            };

            micBtn.addEventListener("click", () => {
                if (isListening) {
                    speechRecognition.stop();
                    stopListening();
                } else {
                    // Set speech language based on selection
                    const langCode = currentLang === "hi" ? "hi-IN" : (currentLang === "or" ? "or-IN" : "en-IN");
                    speechRecognition.lang = langCode;
                    try {
                        speechRecognition.start();
                    } catch (e) {
                        console.warn("Mic start error:", e);
                    }
                }
            });
        } else {
            micBtn.style.display = "none"; // Hide if browser lacks Web Speech API
        }

        function stopListening() {
            isListening = false;
            if (micBtn) {
                micBtn.classList.remove("listening");
                micBtn.innerHTML = "🎙️";
            }
            if (chatInput) {
                chatInput.placeholder = currentLang === "hi" ? "सवाल पूछें या 🎙️ पर बोलें..." : (currentLang === "or" ? "ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ କିମ୍ବା 🎙️ କ୍ଲିକ୍ କରନ୍ତୁ..." : "Type or click 🎙️ to speak...");
            }
        }

        // 4. Setup Text-to-Speech (Voice Output)
        window.smartcleanSpeakText = function (text) {
            if (!("speechSynthesis" in window)) return;
            window.speechSynthesis.cancel(); // Cancel any ongoing speech

            // Strip HTML tags for clean speech
            const cleanText = text.replace(/<[^>]*>?/gm, "").replace(/[•*#]/g, "");
            const utterance = new SpeechSynthesisUtterance(cleanText);

            if (currentLang === "hi") {
                utterance.lang = "hi-IN";
            } else if (currentLang === "or") {
                utterance.lang = "hi-IN"; // Hindi voice fallback for Odia phonetics
            } else {
                utterance.lang = "en-IN";
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        };

        // Voice Readout Toggle in Header
        voiceToggleBtn.addEventListener("click", () => {
            isAutoVoiceEnabled = !isAutoVoiceEnabled;
            if (isAutoVoiceEnabled) {
                voiceToggleBtn.classList.add("active");
                voiceToggleBtn.title = "Auto Voice Readout: ON";
                window.smartcleanSpeakText(currentLang === "hi" ? "वॉइस सहायता चालू है।" : "Voice readout is now enabled.");
            } else {
                voiceToggleBtn.classList.remove("active");
                voiceToggleBtn.title = "Auto Voice Readout: OFF";
                window.speechSynthesis.cancel();
            }
        });

        // Language Selector Change
        langSelect.addEventListener("change", (e) => {
            currentLang = e.target.value;
            localStorage.setItem("smartcleanLanguage", currentLang);
            updateWelcomeForLanguage();
        });

        function updateWelcomeForLanguage() {
            let msg = "";
            let chips = [];
            if (currentLang === "hi") {
                msg = `<p><strong>नमस्ते! 🙏 मैं स्मार्टक्लीन का AI सहायक हूँ।</strong></p>
                       <p>आप मुझसे कचरा रिपोर्टिंग, स्थिति की जांच, कचरा अलग करने के नियम, या वेबसाइट के बारे में कुछ भी पूछ या बोल सकते हैं।</p>`;
                chips = [
                    { label: "📝 कचरा रिपोर्ट करें", query: "कचरा कैसे रिपोर्ट करें?" },
                    { label: "📊 शिकायत की स्थिति", query: "शिकायत की स्थिति कैसे देखें?" },
                    { label: "🌿 गीला और सूखा कचरा", query: "गीला और सूखा कचरा कैसे अलग करें?" }
                ];
            } else if (currentLang === "or") {
                msg = `<p><strong>ନମସ୍କାର! 🙏 ମୁଁ ସ୍ମାର୍ଟକ୍ଲିନ୍ AI ସହାୟକ।</strong></p>
                       <p>ଆପଣ ଆବର୍ଜନା ରିପୋର୍ଟ କରିବା, ସ୍ଥିତି ଯାଞ୍ଚ କରିବା, କିମ୍ବା ୱେବସାଇଟ୍ ବ୍ୟବହାର ବିଷୟରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରିପାରିବେ।</p>`;
                chips = [
                    { label: "📝 ଅଭିଯୋଗ ରିପୋର୍ଟ କରନ୍ତୁ", query: "କଚରା କିପରି ରିପୋର୍ଟ କରିବେ?" },
                    { label: "📊 ଅଭିଯୋଗ ସ୍ଥିତି", query: "ମୋର ଅଭିଯୋଗ ସ୍ଥିତି କିପରି ଯାଞ୍ଚ କରିବି?" },
                    { label: "🌿 ଆବର୍ଜନା ପୃଥକୀକରଣ", query: "ଓଦା ଓ ଶୁଖିଲା କଚରା କିପରି ଅଲଗା କରିବେ?" }
                ];
            } else {
                msg = `<p><strong>Hello! 👋 Language switched to English.</strong></p>
                       <p>How can I assist you with waste reporting, complaint tracking, or sanitation guidelines today?</p>`;
                chips = [
                    { label: "📝 Report Issue", query: "How do I report a waste issue?" },
                    { label: "📊 Track Status", query: "How do I track my complaint status?" },
                    { label: "🌿 Segregation", query: "How to segregate wet and dry waste?" }
                ];
            }
            appendMessage("bot", msg, chips);
        }

        // Toggle chat window
        toggleBtn.addEventListener("click", () => {
            const isActive = chatWindow.classList.contains("active");
            if (!isActive) {
                chatWindow.classList.add("active");
                chatWindow.setAttribute("aria-hidden", "false");
                if (chatBadge) chatBadge.style.display = "none";
                chatInput.focus();
            } else {
                chatWindow.classList.remove("active");
                chatWindow.setAttribute("aria-hidden", "true");
                window.speechSynthesis.cancel();
            }
        });

        closeBtn.addEventListener("click", () => {
            chatWindow.classList.remove("active");
            chatWindow.setAttribute("aria-hidden", "true");
            window.speechSynthesis.cancel();
        });

        // Clear chat
        clearBtn.addEventListener("click", () => {
            window.speechSynthesis.cancel();
            chatBody.innerHTML = `
                <div class="chat-message bot">
                    <div class="chat-msg-avatar">🌱</div>
                    <div class="chat-msg-bubble">
                        <p>Chat cleared! What would you like assistance with?</p>
                        <div class="chat-quick-chips">
                            <button class="chat-chip" data-query="How do I report a waste issue?">📝 Report Issue</button>
                            <button class="chat-chip" data-query="How do I track my complaints?">📊 Track Status</button>
                            <button class="chat-chip" data-query="How to segregate wet and dry waste?">🌿 Segregation</button>
                        </div>
                    </div>
                </div>
            `;
            attachChipListeners();
        });

        function attachChipListeners() {
            const chips = chatBody.querySelectorAll(".chat-chip");
            chips.forEach(chip => {
                chip.onclick = function () {
                    const query = this.getAttribute("data-query");
                    if (query) {
                        handleUserQuery(query);
                    }
                };
            });
        }
        attachChipListeners();

        // Handle Form Submit
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;
            chatInput.value = "";
            handleUserQuery(message);
        });

        function handleUserQuery(userText) {
            appendMessage("user", escapeHTML(userText));

            const typingIndicator = showTypingIndicator();

            setTimeout(() => {
                removeTypingIndicator(typingIndicator);
                const botResponse = generateDynamicSmartCleanResponse(userText, currentLang);
                appendMessage("bot", botResponse.text, botResponse.chips, botResponse.speakableText);
            }, 550);
        }

        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag));
        }

        function appendMessage(sender, htmlContent, chips = null, speakableText = null) {
            const msgDiv = document.createElement("div");
            msgDiv.className = `chat-message ${sender}`;

            const avatar = sender === "bot" ? "🌱" : "👤";

            let chipsHTML = "";
            if (chips && chips.length > 0) {
                chipsHTML = `<div class="chat-quick-chips">` +
                    chips.map(c => `<button class="chat-chip" data-query="${escapeHTML(c.query)}">${escapeHTML(c.label)}</button>`).join("") +
                    `</div>`;
            }

            let speakBtnHTML = "";
            if (sender === "bot") {
                const textToSpeak = (speakableText || htmlContent).replace(/'/g, "\\'").replace(/"/g, '&quot;');
                speakBtnHTML = `<button class="chat-speak-btn" onclick="window.smartcleanSpeakText(this.parentElement.innerText)">🔊 Read Aloud</button>`;
            }

            msgDiv.innerHTML = `
                <div class="chat-msg-avatar">${avatar}</div>
                <div class="chat-msg-bubble">
                    ${htmlContent}
                    ${speakBtnHTML}
                    ${chipsHTML}
                </div>
            `;

            chatBody.appendChild(msgDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
            attachChipListeners();

            if (sender === "bot" && isAutoVoiceEnabled) {
                window.smartcleanSpeakText(speakableText || htmlContent);
            }
        }

        function showTypingIndicator() {
            const typingDiv = document.createElement("div");
            typingDiv.className = "chat-message bot typing-message";
            typingDiv.innerHTML = `
                <div class="chat-msg-avatar">🌱</div>
                <div class="chat-msg-bubble chat-typing">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            chatBody.appendChild(typingDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
            return typingDiv;
        }

        function removeTypingIndicator(indicator) {
            if (indicator && indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }
    }

    /**
     * ADVANCED MULTILINGUAL & OPEN-DOMAIN INTENT ENGINE
     * Handles any user query in English, Hindi, and Odia with strict privacy guardrails.
     */
    function generateDynamicSmartCleanResponse(rawInput, lang) {
        const query = rawInput.toLowerCase().trim();

        // 1. STRICT PRIVACY & CODE LEAKAGE GUARDRAIL
        const securityBreachWords = [
            "source code", "code", "github", "password", "admin password", "secret",
            "api key", "mongodb", "database", "token", "jwt", "system prompt",
            "ignore previous instructions", "env", ".env", "backend route",
            "server.js", "auth.js", "bypass", "leak", "credentials", "connection string",
            "sql injection", "hack", "root password"
        ];

        for (const kw of securityBreachWords) {
            if (query.includes(kw) && (
                query.includes("show") || query.includes("give") || query.includes("what is") ||
                query.includes("tell") || query.includes("print") || query.includes("leak") ||
                query.includes("admin") || query.includes("key") || query.includes("password") ||
                query.includes("code") || query.includes("database") || query.includes("uri")
            )) {
                if (lang === "hi") {
                    return {
                        text: `<p>🔒 <strong>डेटा सुरक्षा एवं गोपनीयता:</strong></p>
                               <p>सुरक्षा नीतियों के तहत मैं वेबसाइट का सोर्स कोड, पासवर्ड, API कुंजी या डेटाबेस की जानकारी साझा नहीं कर सकता।</p>
                               <p>मैं आपकी <strong>कचरा प्रबंधन, शिकायत दर्ज करने और स्वच्छता सेवाओं</strong> में पूरी मदद करने के लिए यहाँ हूँ।</p>`,
                        chips: [{ label: "📝 शिकायत दर्ज करें", query: "कचरा कैसे रिपोर्ट करें?" }]
                    };
                } else if (lang === "or") {
                    return {
                        text: `<p>🔒 <strong>ଡାଟା ସୁରକ୍ଷା ଓ ଗୋପନୀୟତା:</strong></p>
                               <p>ସୁରକ୍ଷା ଦୃଷ୍ଟିକୋଣରୁ ମୁଁ ସୋର୍ସ କୋଡ୍ କିମ୍ବା ପାସୱାର୍ଡ ଦେଇପାରିବି ନାହିଁ। ମୁଁ ଆବର୍ଜନା ପରିଚାଳନା ଏବଂ ସଫେଇ ସମ୍ବନ୍ଧୀୟ ସମସ୍ତ ସହାୟତା ପ୍ରଦାନ କରିବି।</p>`,
                        chips: [{ label: "📝 ଅଭିଯୋଗ ରିପୋର୍ଟ କରନ୍ତୁ", query: "କଚରା କିପରି ରିପୋର୍ଟ କରିବେ?" }]
                    };
                }
                return {
                    text: `<p>🔒 <strong>Privacy & Security Protection:</strong></p>
                           <p>For data privacy and system security, I cannot share internal application source code, API keys, database credentials, or administrative secrets.</p>
                           <p>I am dedicated exclusively to helping citizens with <strong>waste reporting, complaint tracking, waste segregation, and sanitation services</strong> on SmartClean.</p>`,
                    chips: [
                        { label: "📝 How to Report", query: "How do I report a waste issue?" },
                        { label: "📊 Track Reports", query: "How do I track my complaints?" }
                    ]
                };
            }
        }

        // 2. SPECIFIC ITEM DISPOSAL / "WHERE DO I THROW X?"
        // Coconut shells, leaves, garden waste
        if (query.includes("coconut") || query.includes("leaves") || query.includes("garden") || query.includes("food") || query.includes("vegetable") || query.includes("nariyal") || query.includes("patte")) {
            return {
                text: `<p>🥥 <strong>Organic / Wet Waste Disposal:</strong></p>
                       <p>Items like coconut shells, garden leaves, food leftovers, and vegetable peels belong to <strong>Wet Waste (Green Bin)</strong>.</p>
                       <ul>
                           <li>They are biodegradable and can be turned into organic compost.</li>
                           <li>Please do not mix them with plastic bags or wrappers!</li>
                       </ul>`,
                chips: [{ label: "🌿 Full Segregation Guide", query: "How to segregate wet and dry waste?" }]
            };
        }

        // Batteries, electronics, cords, phones
        if (query.includes("battery") || query.includes("cell") || query.includes("e-waste") || query.includes("electronic") || query.includes("charger") || query.includes("wire") || query.includes("laptop") || query.includes("phone")) {
            return {
                text: `<p>🔌 <strong>E-Waste & Battery Disposal:</strong></p>
                       <p>Batteries, chargers, broken electronics, and cables are classified as <strong>E-Waste / Hazardous Waste (Red Bin)</strong>.</p>
                       <ul>
                           <li>Never throw batteries in normal garbage or burn them (they contain toxic heavy metals).</li>
                           <li>Submit a complaint under the <strong>E-Waste</strong> category on SmartClean for safe municipal collection.</li>
                       </ul>`,
                chips: [{ label: "📝 Report E-Waste Issue", query: "Take me to report page" }]
            };
        }

        // Medicines, chemicals, paints
        if (query.includes("medicine") || query.includes("tablet") || query.includes("syrup") || query.includes("paint") || query.includes("chemical") || query.includes("pesticide") || query.includes("dawa")) {
            return {
                text: `<p>⚠️ <strong>Hazardous Domestic Waste Disposal:</strong></p>
                       <p>Expired medicines, chemical containers, and paint cans belong in the <strong>Red Bin (Domestic Hazardous)</strong>.</p>
                       <p>Do not flush medicines down the toilet or sink as they contaminate local groundwater and water treatment facilities.</p>`,
                chips: [{ label: "🗑️ All Waste Categories", query: "What are the waste categories?" }]
            };
        }

        // Plastic, bottles, wrappers, polythene
        if (query.includes("plastic") || query.includes("bottle") || query.includes("polythene") || query.includes("wrapper") || query.includes("bag") || query.includes("thermocol")) {
            return {
                text: `<p>🥤 <strong>Plastic & Packaging Waste (Dry Waste):</strong></p>
                       <p>Plastic bottles, food packaging wrappers, and thermocol belong to <strong>Dry Waste (Blue Bin)</strong>.</p>
                       <ul>
                           <li>Rinse bottles and food containers before disposal so they can be recycled effectively.</li>
                           <li>Crush plastic bottles to save space in community recycling bins.</li>
                       </ul>`,
                chips: [{ label: "📝 Report Plastic Dump", query: "How do I report a waste issue?" }]
            };
        }

        // 3. REPORTING ISSUES
        if (query.includes("report") || query.includes("complaint") || query.includes("submit") || query.includes("dump") || query.includes("garbage") || query.includes("kachra") || query.includes("shikayat") || query.includes("abhijog")) {
            if (lang === "hi" || query.includes("kaise") || query.includes("kare")) {
                return {
                    text: `<p>📝 <strong>कचरा और स्वच्छता की शिकायत कैसे दर्ज करें:</strong></p>
                           <ol>
                               <li>ऊपर दिए गए <strong><a href="report.html">Report Issue</a></strong> पर क्लिक करें।</li>
                               <li>कचरे की श्रेणी (Category) चुनें (जैसे प्लास्टिक, सूखा कचरा, नाली की समस्या)।</li>
                               <li><strong>Use GPS Location</strong> पर क्लिक करके सटीक स्थान चुनें।</li>
                               <li>कचरे की साफ़ फोटो अपलोड करें और <strong>Submit</strong> दबाएं।</li>
                           </ol>
                           <p>💡 <em>नगरपालिका की टीम 2 घंटे के भीतर कार्रवाई शुरू करती है!</em></p>`,
                    chips: [{ label: "📍 रिपोर्ट पेज खोलें", query: "Take me to report page" }]
                };
            }
            if (lang === "or") {
                return {
                    text: `<p>📝 <strong>ଆବର୍ଜନା ଅଭିଯୋଗ କିପରି କରିବେ:</strong></p>
                           <ol>
                               <li><strong><a href="report.html">Report Issue</a></strong> ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ।</li>
                               <li>ଆବର୍ଜନା ବର୍ଗ (Category) ଚୟନ କରନ୍ତୁ।</li>
                               <li>GPS ବ୍ୟବହାର କରି ଲୋକେସନ୍ ଏବଂ ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ।</li>
                               <li><strong>Submit</strong> କ୍ଲିକ୍ କରନ୍ତୁ। ୨ ଘଣ୍ଟା ମଧ୍ୟରେ ସଫେଇ କାର୍ଯ୍ୟ ଆରମ୍ଭ ହେବ।</li>
                           </ol>`,
                    chips: [{ label: "📍 ରିପୋର୍ଟ ପେଜ୍ ଖୋଲନ୍ତୁ", query: "Take me to report page" }]
                };
            }
            return {
                text: `<p>📝 <strong>How to Report a Waste Issue in 4 Simple Steps:</strong></p>
                       <ol>
                           <li>Click <strong><a href="report.html">Report Issue</a></strong> in the top menu or dashboard.</li>
                           <li><strong>Select Category:</strong> Choose the waste type (e.g. Plastic, Dry Waste, Overflowing Dump, Drainage).</li>
                           <li><strong>Capture Location:</strong> Click <em>"Use GPS Location"</em> for automatic GPS coordinates, or enter your landmark.</li>
                           <li><strong>Attach Photo & Submit:</strong> Upload photo evidence and select priority, then click <em>"Submit Complaint"</em>.</li>
                       </ol>
                       <p>💡 <em>Target Response Time: Under 2 hours for municipal sanitation teams!</em></p>`,
                chips: [
                    { label: "📍 Open Report Page", query: "Take me to report page" },
                    { label: "🗑️ Waste Categories", query: "What are the waste categories?" }
                ]
            };
        }

        // 4. TRACKING COMPLAINTS
        if (query.includes("track") || query.includes("status") || query.includes("pending") || query.includes("resolved") || query.includes("assigned") || query.includes("progress") || query.includes("stithi")) {
            return {
                text: `<p>📊 <strong>Tracking Your Sanitation Reports:</strong></p>
                       <p>You can track all submitted complaints live on the <strong><a href="complaints.html">Track Reports Page</a></strong>.</p>
                       <p><strong>Complaint Lifecycle:</strong></p>
                       <ul>
                           <li><span style="color:#d97706; font-weight:600;">⏳ Pending:</span> Received and queued for field review.</li>
                           <li><span style="color:#2563eb; font-weight:600;">👤 Assigned:</span> Allocated to the specific ward sanitation team.</li>
                           <li><span style="color:#7c3aed; font-weight:600;">🔄 In Progress:</span> Workers are on-site actively cleaning the area.</li>
                           <li><span style="color:#16a34a; font-weight:600;">✓ Resolved:</span> Cleaning completed and verified by authorities.</li>
                       </ul>`,
                chips: [
                    { label: "📊 View My Reports", query: "Take me to complaints page" },
                    { label: "⏱️ Response Time", query: "What is the response time?" }
                ]
            };
        }

        // 5. RESPONSE TIME / SLA
        if (query.includes("time") || query.includes("fast") || query.includes("duration") || query.includes("hours") || query.includes("how long") || query.includes("kitna samay")) {
            return {
                text: `<p>⏱️ <strong>Target Municipal SLA:</strong></p>
                       <p>SmartClean targets a response time of <strong>under 2 hours</strong> for standard citizen reports.</p>
                       <p>Critical issues (such as biomedical spills or sewer blockages) receive automated high-priority routing to emergency municipal sanitation units.</p>`,
                chips: [{ label: "📝 Report Waste", query: "How do I report a waste issue?" }]
            };
        }

        // 6. WASTE SEGREGATION RULES
        if (query.includes("segregat") || query.includes("bin") || query.includes("recycle") || query.includes("green bin") || query.includes("blue bin") || query.includes("separate") || query.includes("sukha") || query.includes("gila")) {
            return {
                text: `<p>🌿 <strong>Source Waste Segregation Guidelines:</strong></p>
                       <ul>
                           <li><strong>🟢 Green Bin (Wet Waste):</strong> Organic kitchen food scraps, vegetable/fruit peels, tea bags, garden leaves. <em>(Converts to compost)</em></li>
                           <li><strong>🔵 Blue Bin (Dry Waste):</strong> Clean paper, cardboard boxes, plastic bottles, glass, metal cans. <em>(Sent for recycling)</em></li>
                           <li><strong>🔴 Red Bin (Domestic Hazardous):</strong> Used batteries, medical waste, paints, expired medicines, broken glass.</li>
                       </ul>
                       <p>💡 <em>Segregating at home reduces landfill pollution by over 60%!</em></p>`,
                chips: [{ label: "🗑️ Waste Categories", query: "What are the waste categories?" }]
            };
        }

        // 7. ALL 8 WASTE CATEGORIES
        if (query.includes("category") || query.includes("categories") || query.includes("type") || query.includes("types")) {
            return {
                text: `<p>🗑️ <strong>SmartClean's 8 Waste Categories:</strong></p>
                       <ul>
                           <li><strong>🍂 Dry Waste:</strong> Paper, cartons, packaging, dry leaves, wood scraps.</li>
                           <li><strong>🥦 Wet Waste:</strong> Kitchen leftovers, fruit and vegetable peels.</li>
                           <li><strong>🥤 Plastic Waste:</strong> Single-use plastic wrappers, bottles, polythene.</li>
                           <li><strong>⚠️ Hazardous / Chemical:</strong> Paints, batteries, chemicals, expired medicines.</li>
                           <li><strong>🚰 Drainage & Sewage:</strong> Clogged drains, sewer overflow, stagnant water.</li>
                           <li><strong>🗑️ Garbage Dump / Overflow:</strong> Overflowing community dustbins, road dumps.</li>
                           <li><strong>💉 Biomedical Waste:</strong> Clinical bandages, medical packaging, syringes.</li>
                           <li><strong>🔌 E-Waste:</strong> Old gadgets, cables, damaged circuit boards.</li>
                       </ul>`,
                chips: [{ label: "📝 Report Waste", query: "How do I report a waste issue?" }]
            };
        }

        // 8. CITIZEN LOGIN & OTP AUTH
        if (query.includes("login") || query.includes("otp") || query.includes("register") || query.includes("sign in") || query.includes("account") || query.includes("phone") || query.includes("mobile")) {
            return {
                text: `<p>🔐 <strong>Citizen Authentication & Login:</strong></p>
                       <ul>
                           <li>SmartClean uses a <strong>Passwordless Mobile OTP Login</strong>.</li>
                           <li>Enter your <strong>10-digit Indian Mobile Number</strong> on the <strong><a href="login.html">Login Page</a></strong>.</li>
                           <li>Enter the 6-digit verification code sent to your mobile phone to access your Citizen Dashboard.</li>
                           <li>New users can create an account on <strong><a href="register.html">Create Account</a></strong>.</li>
                       </ul>`,
                chips: [
                    { label: "🔑 Go to Login", query: "Take me to login page" },
                    { label: "👤 Create Account", query: "Take me to register page" }
                ]
            };
        }

        // 9. GPS & PHOTO EVIDENCE
        if (query.includes("gps") || query.includes("location") || query.includes("photo") || query.includes("picture") || query.includes("camera") || query.includes("map")) {
            return {
                text: `<p>📍 <strong>GPS Location & Photo Evidence:</strong></p>
                       <ul>
                           <li><strong>Automatic GPS:</strong> Click <em>"Use GPS Location"</em> on the report page to capture accurate latitude and longitude.</li>
                           <li><strong>Manual Location:</strong> If GPS is disabled, type your street name, landmark, or ward.</li>
                           <li><strong>Photo Upload:</strong> Uploading clear images of the sanitation problem helps teams locate and resolve it quickly.</li>
                       </ul>`,
                chips: [{ label: "📝 Report Page", query: "Take me to report page" }]
            };
        }

        // 10. MULTI-LANGUAGE
        if (query.includes("language") || query.includes("hindi") || query.includes("odia") || query.includes("english") || query.includes("bhasha")) {
            return {
                text: `<p>🌐 <strong>Multi-Language Platform:</strong></p>
                       <p>SmartClean is fully accessible in <strong>English, हिन्दी (Hindi), and ଓଡ଼ିଆ (Odia)</strong>.</p>
                       <p>You can switch the website language using the dropdown in the top navbar, or change the chatbot language using the selector in this chat header!</p>`,
                chips: [{ label: "📊 Go to Dashboard", query: "Take me to dashboard" }]
            };
        }

        // 11. NAVIGATION SHORTCUTS
        if (query.includes("take me to report") || query.includes("open report")) {
            window.location.href = "report.html";
            return { text: `<p>Navigating to the <strong><a href="report.html">Report Issue Page</a></strong>...</p>` };
        }
        if (query.includes("take me to complaints") || query.includes("open complaints") || query.includes("view my reports")) {
            window.location.href = "complaints.html";
            return { text: `<p>Navigating to the <strong><a href="complaints.html">Track Reports Page</a></strong>...</p>` };
        }
        if (query.includes("take me to dashboard") || query.includes("open dashboard")) {
            window.location.href = "dashboard.html";
            return { text: `<p>Navigating to the <strong><a href="dashboard.html">Citizen Dashboard</a></strong>...</p>` };
        }
        if (query.includes("take me to login") || query.includes("open login")) {
            window.location.href = "login.html";
            return { text: `<p>Navigating to the <strong><a href="login.html">Citizen Login Page</a></strong>...</p>` };
        }

        // 12. GREETINGS & CASUAL
        if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("namaste") || query.includes("who are you") || query.includes("help") || query.includes("madat")) {
            if (lang === "hi") {
                return {
                    text: `<p>👋 <strong>नमस्ते! मैं स्मार्टक्लीन AI सहायक हूँ।</strong></p>
                           <p>मैं कचरा रिपोर्ट करने, स्थिति देखने और शहर को स्वच्छ रखने में आपकी मदद करता हूँ। आप मुझसे कुछ भी पूछ सकते हैं या 🎙️ पर बोल सकते हैं!</p>`,
                    chips: [
                        { label: "📝 कचरा रिपोर्ट करें", query: "कचरा कैसे रिपोर्ट करें?" },
                        { label: "📊 शिकायत की स्थिति", query: "शिकायत की स्थिति कैसे देखें?" }
                    ]
                };
            }
            return {
                text: `<p>👋 <strong>Hello! I am your SmartClean AI Assistant.</strong></p>
                       <p>I am here to guide you through keeping our community clean and green. You can ask me or speak 🎙️ to me about:</p>
                       <ul>
                           <li>Reporting a waste complaint with photo & GPS</li>
                           <li>Tracking your submitted sanitation reports</li>
                           <li>Where and how to dispose of specific items (batteries, plastics, food)</li>
                           <li>Waste segregation rules (Green, Blue, Red bins)</li>
                       </ul>`,
                chips: [
                    { label: "📝 Report Issue", query: "How do I report a waste issue?" },
                    { label: "📊 Track Status", query: "How do I track my complaint status?" },
                    { label: "🌿 Segregation Rules", query: "How to segregate wet and dry waste?" }
                ]
            };
        }

        // 13. DYNAMIC / OPEN QUERY FALLBACK (Handles any custom phrased query)
        return {
            text: `
                <p>🌿 <strong>SmartClean Assistance:</strong></p>
                <p>Regarding your query about "<em>${escapeHTML(rawInput)}</em>":</p>
                <p>SmartClean provides full sanitation monitoring, waste disposal tracking, and civic response for citizens. You can:</p>
                <ul>
                    <li><strong>Submit a Report:</strong> Go to <a href="report.html">Report Issue</a> to register any waste, dump, or sewage problem.</li>
                    <li><strong>Track Complaints:</strong> Visit <a href="complaints.html">Track Reports</a> to check active cleaning status.</li>
                    <li><strong>Segregate Waste:</strong> Dispose organic food in Green Bins, recyclables in Blue Bins, and hazardous items in Red Bins.</li>
                </ul>
                <p>Feel free to click any shortcut below or ask a more specific question!</p>
            `,
            chips: [
                { label: "📝 Report Waste Issue", query: "How do I report a waste issue?" },
                { label: "📊 Track My Reports", query: "How do I track my complaint status?" },
                { label: "🗑️ Waste Categories", query: "What are the waste categories?" },
                { label: "🌿 Segregation Rules", query: "How to segregate wet and dry waste?" }
            ]
        };
    }
})();
