/**
 * FARAN // RE-ENTERING PRIME
 * Full-Stack AI Chatbot & Portfolio Client Engine
 * Main Font: NEVAN RUS
 * Features: Interactive 3D Canvas, 3D Tilt Cards, Scroll Animations, Ollama Bridge, Rate Limiter
 */

(() => {
  'use strict';

  const API_BASE = 'http://localhost:3001';
  const OLLAMA_DIRECT = 'http://localhost:11434';

  const STATE = {
    backendOnline: false,
    ollamaOnline: false,
    activeModel: 'llama3:latest',
    availableModels: ['llama3:latest', 'mistral:latest', 'deepseek-r1:latest'],
    sessions: [],
    currentSessionId: null,
    rateLimit: {
      max: 20,
      remaining: 20,
      resetTime: Date.now() + 60000,
      timestamps: []
    }
  };

  // ==========================================================================
  // 1. CINEMATIC MINIMALIST SPLASH SCREEN
  // ==========================================================================
  function initSplashScreen() {
    const splash = document.getElementById('splashScreen');
    const progressBar = document.getElementById('splashProgress');
    const percentText = document.getElementById('splashPercent');
    const statusText = document.getElementById('splashStatusText');
    const skipBtn = document.getElementById('skipSplashBtn');

    if (!splash) return;

    let progress = 0;
    const stages = [
      { at: 20, text: 'Initializing runtime...' },
      { at: 50, text: 'Probing local Ollama bridge...' },
      { at: 80, text: 'Verifying rate limiter & sessions...' },
      { at: 100, text: 'PRIME SYSTEMS READY' }
    ];

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(dismissSplash, 280);
      }

      progressBar.style.width = `${progress}%`;
      percentText.textContent = `${progress}%`;

      const currentStage = stages.slice().reverse().find(s => progress >= s.at);
      if (currentStage) {
        statusText.textContent = currentStage.text;
      }
    }, 50);

    function dismissSplash() {
      clearInterval(interval);
      splash.classList.add('dismissed');
      setTimeout(() => {
        splash.style.display = 'none';
      }, 700);
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', dismissSplash);
    }
  }

  // ==========================================================================
  // 2. THEME CONTROLLER
  // ==========================================================================
  function initTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const html = document.documentElement;

    const savedTheme = localStorage.getItem('prime_theme') || 'slate';
    html.setAttribute('data-theme', savedTheme);

    themeBtn?.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'slate' ? 'cyan' : 'slate';
      html.setAttribute('data-theme', next);
      localStorage.setItem('prime_theme', next);
    });
  }

  // ==========================================================================
  // 3. INTERACTIVE 3D HERO CANVAS (Pure 3D Mathematics)
  // ==========================================================================
  function init3DHeroCanvas() {
    const canvas = document.getElementById('hero3DCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = 440;
    let height = canvas.height = 440;

    // Define 3D Icosahedron Vertices
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const scale = 110;

    let baseVertices = [
      [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
      [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
      [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
    ].map(v => {
      const len = Math.hypot(...v);
      return [ (v[0]/len) * scale, (v[1]/len) * scale, (v[2]/len) * scale ];
    });

    // Edges connecting vertices with distance <= scale * 1.15
    const edges = [];
    for (let i = 0; i < baseVertices.length; i++) {
      for (let j = i + 1; j < baseVertices.length; j++) {
        const d = Math.hypot(
          baseVertices[i][0] - baseVertices[j][0],
          baseVertices[i][1] - baseVertices[j][1],
          baseVertices[i][2] - baseVertices[j][2]
        );
        if (d < scale * 1.15) {
          edges.push([i, j]);
        }
      }
    }

    let rotX = 0.4;
    let rotY = 0.2;
    let targetRotX = 0.4;
    let targetRotY = 0.2;
    let mouseX = 0;
    let mouseY = 0;

    const heroSection = document.getElementById('hero');
    heroSection?.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = nx * 1.8;
      targetRotX = -ny * 1.8;
    });

    function render3D() {
      ctx.clearRect(0, 0, width, height);

      // Smooth inertia rotation
      rotX += (targetRotX - rotX) * 0.05 + 0.003;
      rotY += (targetRotY - rotY) * 0.05 + 0.006;

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      // Project vertices with perspective
      const fov = 380;
      const projected = baseVertices.map(v => {
        // Rotate around Y
        let x1 = v[0] * cosY + v[2] * sinY;
        let y1 = v[1];
        let z1 = -v[0] * sinY + v[2] * cosY;

        // Rotate around X
        let x2 = x1;
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX + 320;

        const pScale = fov / z2;
        return {
          x: width / 2 + x2 * pScale,
          y: height / 2 + y2 * pScale,
          z: z2,
          pScale
        };
      });

      // Draw Edges with depth fading
      ctx.lineWidth = 1.2;
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.08, Math.min(0.45, 1 - (avgZ - 200) / 280));

        ctx.strokeStyle = `rgba(82, 117, 246, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw Node Vertices
      projected.forEach(p => {
        const r = Math.max(1.8, 3.2 * (fov / p.z));
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, 300 / p.z)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow ring
        ctx.fillStyle = 'rgba(82, 117, 246, 0.2)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(render3D);
    }

    render3D();
  }

  // ==========================================================================
  // 4. INTERACTIVE 3D CARD TILT EFFECT
  // ==========================================================================
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate max 12 deg tilt
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.4s ease';
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
      });
    });
  }

  // ==========================================================================
  // 5. SCROLL ANIMATIONS (Progress, Reveals, Parallax, Scrollspy)
  // ==========================================================================
  function initScrollAnimations() {
    const progressBar = document.getElementById('scrollProgressBar');
    const header = document.getElementById('siteHeader');
    const glowTop = document.getElementById('ambientGlowTop');
    const glowBottom = document.getElementById('ambientGlowBottom');
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    const sections = document.querySelectorAll('section[id]');

    // 1. Scroll Progress & Parallax Handler
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Top Progress Bar
      if (progressBar && docHeight > 0) {
        const pct = (scrollY / docHeight) * 100;
        progressBar.style.width = `${pct}%`;
      }

      // Header Shrink / Shadow
      if (header) {
        if (scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }

      // Parallax Ambient Drift
      if (glowTop) {
        glowTop.style.transform = `translate3d(0, ${scrollY * 0.12}px, 0)`;
      }
      if (glowBottom) {
        glowBottom.style.transform = `translate3d(0, ${-scrollY * 0.08}px, 0)`;
      }

      // Scrollspy Active Section Tracker
      let currentSectionId = '';
      sections.forEach(sec => {
        const top = sec.offsetTop - 120;
        const height = sec.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          currentSectionId = sec.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${currentSectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    }, { passive: true });

    // 2. IntersectionObserver for Reveal Elements
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ==========================================================================
  // 6. RATE LIMITING ENGINE
  // ==========================================================================
  function checkClientRateLimit() {
    const now = Date.now();
    const windowMs = 60000;

    STATE.rateLimit.timestamps = STATE.rateLimit.timestamps.filter(t => now - t < windowMs);
    STATE.rateLimit.remaining = Math.max(0, STATE.rateLimit.max - STATE.rateLimit.timestamps.length);

    updateRateLimitUI();
    return STATE.rateLimit.remaining > 0;
  }

  function consumeRateLimitToken() {
    STATE.rateLimit.timestamps.push(Date.now());
    STATE.rateLimit.remaining = Math.max(0, STATE.rateLimit.max - STATE.rateLimit.timestamps.length);
    updateRateLimitUI();
  }

  function updateRateLimitUI() {
    const countEl = document.getElementById('rateLimitCount');
    const barEl = document.getElementById('rateLimitBar');
    const footnoteEl = document.getElementById('rateLimitFootnote');

    if (!countEl || !barEl) return;

    const remaining = STATE.rateLimit.remaining;
    const max = STATE.rateLimit.max;
    const pct = (remaining / max) * 100;

    countEl.textContent = `${remaining}/${max}`;
    barEl.style.width = `${pct}%`;

    if (remaining <= 3) {
      footnoteEl.textContent = `Throttling active: ${remaining} queries left this minute.`;
    } else {
      footnoteEl.textContent = '20 requests / min hardware limit';
    }
  }

  setInterval(checkClientRateLimit, 5000);

  // ==========================================================================
  // 7. OLLAMA & BACKEND HEALTH PROBE
  // ==========================================================================
  async function probeServices() {
    const beacon = document.getElementById('ollamaBeacon');
    const statusLabel = document.getElementById('ollamaStatusLabel');
    const mobileStatus = document.getElementById('mobileOllamaStatus');
    const connectionIndicator = document.getElementById('indicatorText');
    const modelBadge = document.getElementById('activeModelBadge');

    try {
      const res = await fetch(`${API_BASE}/api/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        STATE.backendOnline = true;
        STATE.ollamaOnline = data.ollamaConnected ?? true;

        beacon?.classList.add('online');
        beacon?.classList.remove('offline');
        
        const label = STATE.ollamaOnline 
          ? `Ollama: Online (${data.activeModel || 'llama3'})` 
          : 'Gateway: Active (Standby)';
        
        if (statusLabel) statusLabel.textContent = label;
        if (mobileStatus) mobileStatus.textContent = label;
        if (connectionIndicator) connectionIndicator.textContent = 'Gateway Connected';
        if (modelBadge && data.activeModel) modelBadge.textContent = data.activeModel.split(':')[0];

        loadRemoteModels();
        return;
      }
    } catch (e) {
      STATE.backendOnline = false;
    }

    try {
      const ollamaRes = await fetch(`${OLLAMA_DIRECT}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      if (ollamaRes.ok) {
        const tags = await ollamaRes.json();
        STATE.ollamaOnline = true;
        beacon?.classList.add('online');
        beacon?.classList.remove('offline');
        
        const tagText = tags.models && tags.models.length > 0 ? tags.models[0].name.split(':')[0] : 'Active';
        if (statusLabel) statusLabel.textContent = `Ollama: ${tagText}`;
        if (mobileStatus) mobileStatus.textContent = `Ollama: ${tagText}`;
        if (connectionIndicator) connectionIndicator.textContent = 'Ollama Direct Link';
        populateModelDropdown(tags.models ? tags.models.map(m => m.name) : []);
        return;
      }
    } catch (e) {
      STATE.ollamaOnline = false;
    }

    beacon?.classList.remove('online');
    beacon?.classList.remove('offline');
    if (statusLabel) statusLabel.textContent = 'Ollama: Standby';
    if (mobileStatus) mobileStatus.textContent = 'Standby (Demo Active)';
    if (connectionIndicator) connectionIndicator.textContent = 'Sovereign Standby';
  }

  async function loadRemoteModels() {
    try {
      const res = await fetch(`${API_BASE}/api/models`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          populateModelDropdown(data.models);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  function populateModelDropdown(models) {
    const select = document.getElementById('modelSelect');
    if (!select || !models.length) return;

    select.innerHTML = '';
    models.forEach(model => {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = model;
      select.appendChild(opt);
    });

    if (models.includes(STATE.activeModel)) {
      select.value = STATE.activeModel;
    } else {
      STATE.activeModel = models[0];
      select.value = models[0];
    }
    const badge = document.getElementById('activeModelBadge');
    if (badge) badge.textContent = STATE.activeModel.split(':')[0];
  }

  // ==========================================================================
  // 8. CHAT SESSIONS & PERSISTENCE
  // ==========================================================================
  const STORAGE_KEY = 'prime_chat_sessions';

  function initChatSessions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        STATE.sessions = JSON.parse(stored);
      }
    } catch (e) {
      STATE.sessions = [];
    }

    if (!STATE.sessions.length) {
      createNewSession('Prime Initialization');
    } else {
      STATE.currentSessionId = STATE.sessions[0].id;
      renderHistoryList();
      renderCurrentThread();
    }
  }

  function saveSessions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE.sessions));
    renderHistoryList();
  }

  function createNewSession(customTitle = null) {
    const newId = 'session_' + Date.now();
    const session = {
      id: newId,
      title: customTitle || 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: [
        {
          role: 'assistant',
          content: "Welcome. I am **Prime Co-Pilot**, Faran's sovereign AI assistant. I run locally on your machine with on-premise weights and zero cloud telemetry. How can I assist with Faran's technical stack, architecture, or code design?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    STATE.sessions.unshift(session);
    STATE.currentSessionId = newId;
    saveSessions();
    renderCurrentThread();

    const titleEl = document.getElementById('currentSessionTitle');
    if (titleEl) titleEl.textContent = session.title;
  }

  function getCurrentSession() {
    return STATE.sessions.find(s => s.id === STATE.currentSessionId) || STATE.sessions[0];
  }

  function renderHistoryList() {
    const listEl = document.getElementById('historyList');
    if (!listEl) return;

    listEl.innerHTML = '';
    STATE.sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = `history-item ${session.id === STATE.currentSessionId ? 'active' : ''}`;
      
      const textSpan = document.createElement('span');
      textSpan.className = 'history-item-text';
      textSpan.textContent = session.title;
      textSpan.title = session.title;

      const delBtn = document.createElement('button');
      delBtn.className = 'history-item-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Delete Session';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSession(session.id);
      });

      item.appendChild(textSpan);
      item.appendChild(delBtn);

      item.addEventListener('click', () => {
        STATE.currentSessionId = session.id;
        renderHistoryList();
        renderCurrentThread();
        const titleEl = document.getElementById('currentSessionTitle');
        if (titleEl) titleEl.textContent = session.title;
      });

      listEl.appendChild(item);
    });
  }

  function deleteSession(id) {
    STATE.sessions = STATE.sessions.filter(s => s.id !== id);
    if (!STATE.sessions.length) {
      createNewSession('Default Session');
    } else {
      if (STATE.currentSessionId === id) {
        STATE.currentSessionId = STATE.sessions[0].id;
      }
      saveSessions();
      renderCurrentThread();
    }
  }

  function clearAllHistory() {
    if (confirm('Clear all conversation history?')) {
      STATE.sessions = [];
      createNewSession('Fresh Session');
    }
  }

  // ==========================================================================
  // 9. CHAT THREAD RENDERING & MARKDOWN
  // ==========================================================================
  function renderCurrentThread() {
    const threadEl = document.getElementById('chatThread');
    if (!threadEl) return;

    threadEl.innerHTML = '';
    const session = getCurrentSession();
    if (!session) return;

    session.messages.forEach(msg => {
      appendMessageToThread(msg.role, msg.content, msg.timestamp, false);
    });

    scrollChatToBottom();
  }

  function appendMessageToThread(role, text, timestamp = null, animate = true) {
    const threadEl = document.getElementById('chatThread');
    if (!threadEl) return;

    const time = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgEl = document.createElement('div');
    msgEl.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = role === 'assistant' ? '⚡' : '⏵';

    const body = document.createElement('div');
    body.className = 'msg-body';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = parseMarkdown(text);

    bubble.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (code) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.type = 'button';
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(code.innerText).then(() => {
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
          });
        });
        pre.appendChild(copyBtn);
      }
    });

    const timeEl = document.createElement('div');
    timeEl.className = 'msg-time';
    timeEl.textContent = time;

    body.appendChild(bubble);
    body.appendChild(timeEl);

    msgEl.appendChild(avatar);
    msgEl.appendChild(body);

    threadEl.appendChild(msgEl);
    scrollChatToBottom();

    return bubble;
  }

  function showTypingIndicator() {
    const threadEl = document.getElementById('chatThread');
    if (!threadEl) return null;

    const typingEl = document.createElement('div');
    typingEl.className = 'message assistant typing-message';
    typingEl.id = 'activeTypingIndicator';

    typingEl.innerHTML = `
      <div class="msg-avatar">⚡</div>
      <div class="msg-body">
        <div class="msg-bubble">
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;

    threadEl.appendChild(typingEl);
    scrollChatToBottom();
    return typingEl;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('activeTypingIndicator');
    indicator?.remove();
  }

  function scrollChatToBottom() {
    const threadEl = document.getElementById('chatThread');
    if (threadEl) {
      threadEl.scrollTop = threadEl.scrollHeight;
    }
  }

  function parseMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, '&bull; $1<br>');

    const paragraphs = html.split(/\n\n+/);
    return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }

  // ==========================================================================
  // 10. AI RESPONDER
  // ==========================================================================
  async function generateAIResponse(userPrompt, model) {
    const session = getCurrentSession();
    const history = session.messages.slice(-8);

    if (STATE.backendOnline) {
      try {
        const response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            model: model,
            history: history
          })
        });

        if (response.status === 429) {
          const errData = await response.json();
          throw new Error(errData.error || 'Rate limit threshold reached. Please wait 60s.');
        }

        if (!response.ok) {
          throw new Error(`Gateway returned status ${response.status}`);
        }

        const data = await response.json();
        return data.response;
      } catch (err) {
        if (err.message.includes('Rate limit')) {
          throw err;
        }
      }
    }

    try {
      const directRes = await fetch(`${OLLAMA_DIRECT}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'llama3',
          messages: [
            {
              role: 'system',
              content: 'You are Prime Co-Pilot, representing Faran — a full-stack engineer and AI systems architect. Deliver direct, technical, high-caliber responses with clean code examples.'
            },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: userPrompt }
          ],
          stream: false
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (directRes.ok) {
        const data = await directRes.json();
        return data.message.content;
      }
    } catch (e) {
      // fallback
    }

    return getOfflineSimulatedResponse(userPrompt);
  }

  function getOfflineSimulatedResponse(prompt) {
    const lower = prompt.toLowerCase();

    if (lower.includes('skill') || lower.includes('stack') || lower.includes('engineering')) {
      return `### Faran's Core Engineering Stack:\n\n` +
        `* **AI & Sovereign Inference**: Ollama API, Llama 3.x, DeepSeek-R1, Mistral, Agent Workflows, RAG.\n` +
        `* **Backend Systems**: Node.js, Python, Express, FastAPI, sliding-window rate limiters, SSE.\n` +
        `* **Interface Engineering**: Modern Vanilla JS, custom CSS token systems, micro-interactions, responsive design.\n` +
        `* **Data Sovereignty**: 100% On-Prem LLM execution with zero third-party cloud data egress.`;
    }

    if (lower.includes('prime') || lower.includes('vision') || lower.includes('era')) {
      return `**Prime Era Architectural Vision**\n\n` +
        `"Re-Entering Prime" represents peak engineering velocity: eliminating framework bloat, deploying autonomous on-premise AI systems, and building resilient full-stack applications.\n\n` +
        `The platform runs on local compute via Ollama, guaranteeing privacy, performance, and complete data sovereignty.`;
    }

    if (lower.includes('ollama') || lower.includes('setup') || lower.includes('model') || lower.includes('run')) {
      return `### Connecting Your Local Ollama Model:\n\n` +
        `1. Ensure Ollama is running on your machine:\n` +
        `\`\`\`bash\nollama run llama3\n\`\`\`\n` +
        `2. Launch the backend gateway:\n` +
        `\`\`\`bash\nnode server.js\n# or\npython server.py\n\`\`\`\n` +
        `3. Click the refresh button next to **Active Model** in the sidebar. The system will detect your installed weights automatically.`;
    }

    if (lower.includes('rate') || lower.includes('limit') || lower.includes('pattern')) {
      return `### Sliding-Window Rate Limiting Implementation:\n\n` +
        `\`\`\`javascript\nconst rateLimitMap = new Map();\n\nfunction rateLimiter(req, res, next) {\n  const ip = req.ip || req.connection.remoteAddress;\n  const now = Date.now();\n  const windowMs = 60 * 1000;\n  const maxRequests = 20;\n\n  let userRecord = rateLimitMap.get(ip) || [];\n  userRecord = userRecord.filter(t => now - t < windowMs);\n\n  if (userRecord.length >= maxRequests) {\n    res.set('Retry-After', '60');\n    return res.status(429).json({\n      error: 'Rate Limit Exceeded',\n      message: 'Hardware protection: 20 req/min limit reached.'\n    });\n  }\n\n  userRecord.push(now);\n  rateLimitMap.set(ip, userRecord);\n  next();\n}\n\`\`\`\nThis pattern is active in \`server.js\` and \`server.py\`.`;
    }

    return `Transmission received: *"${prompt}"*.\n\n` +
      `Operating in **Sovereign Standby Mode**. To run live neural inference, start Ollama locally (\`ollama run llama3\`) and launch \`node server.js\` or \`start.bat\`.\n\n` +
      `You can ask me about Faran's technical capabilities, architecture patterns, or rate-limiting design.`;
  }

  // ==========================================================================
  // 11. CHAT FORM & SUBMIT CONTROLLER
  // ==========================================================================
  function initChatForm() {
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const modelSelect = document.getElementById('modelSelect');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearAllBtn = document.getElementById('clearAllHistoryBtn');
    const refreshModelsBtn = document.getElementById('refreshModelsBtn');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const chatSidebar = document.getElementById('chatSidebar');
    const promptChips = document.querySelectorAll('.prompt-chip');

    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });

    modelSelect?.addEventListener('change', (e) => {
      STATE.activeModel = e.target.value;
      const badge = document.getElementById('activeModelBadge');
      if (badge) badge.textContent = STATE.activeModel.split(':')[0];
    });

    refreshModelsBtn?.addEventListener('click', async () => {
      refreshModelsBtn.style.transform = 'rotate(180deg)';
      await probeServices();
      setTimeout(() => { refreshModelsBtn.style.transform = ''; }, 300);
    });

    newChatBtn?.addEventListener('click', () => {
      createNewSession();
      if (window.innerWidth <= 768) {
        chatSidebar?.classList.remove('mobile-open');
      }
    });

    clearAllBtn?.addEventListener('click', clearAllHistory);

    toggleSidebarBtn?.addEventListener('click', () => {
      chatSidebar?.classList.toggle('mobile-open');
    });

    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (input) {
          input.value = prompt;
          input.focus();
          form.dispatchEvent(new Event('submit'));
        }
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      if (!checkClientRateLimit()) {
        alert('Rate limit active: Maximum 20 requests per minute allowed to protect local hardware.');
        return;
      }

      consumeRateLimitToken();

      input.value = '';
      input.style.height = 'auto';

      const session = getCurrentSession();
      const userMessageCount = session.messages.filter(m => m.role === 'user').length;
      if (userMessageCount === 0) {
        session.title = text.length > 26 ? text.substring(0, 26) + '...' : text;
        const titleEl = document.getElementById('currentSessionTitle');
        if (titleEl) titleEl.textContent = session.title;
      }

      const userMsg = {
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      session.messages.push(userMsg);
      saveSessions();
      appendMessageToThread('user', text, userMsg.timestamp);

      sendBtn.disabled = true;
      showTypingIndicator();

      try {
        const aiResponseText = await generateAIResponse(text, STATE.activeModel);
        removeTypingIndicator();

        const botMsg = {
          role: 'assistant',
          content: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        session.messages.push(botMsg);
        saveSessions();
        appendMessageToThread('assistant', aiResponseText, botMsg.timestamp);
      } catch (err) {
        removeTypingIndicator();
        const errMsg = `⚠️ **Notice**: ${err.message || 'Error processing request.'}`;
        appendMessageToThread('assistant', errMsg);
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    });
  }

  // ==========================================================================
  // 12. TERMINAL
  // ==========================================================================
  function initTerminal() {
    const termInput = document.getElementById('terminalInput');
    const termBody = document.getElementById('terminalBody');
    if (!termInput || !termBody) return;

    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = termInput.value.trim();
        if (!val) return;
        termInput.value = '';

        printTermLine(`&gt; ${escapeHtml(val)}`, 'term-highlight');
        executeTermCommand(val.toLowerCase());
        termBody.scrollTop = termBody.scrollHeight;
      }
    });

    function printTermLine(text, className = 'term-line') {
      const line = document.createElement('div');
      line.className = className;
      line.innerHTML = text;
      termBody.appendChild(line);
    }

    function executeTermCommand(cmd) {
      switch (cmd) {
        case 'help':
          printTermLine('Commands:');
          printTermLine('&bull; <span class="term-highlight">skills</span> - Engineering stack');
          printTermLine('&bull; <span class="term-highlight">ollama</span> - Local engine status');
          printTermLine('&bull; <span class="term-highlight">about</span> - Background &amp; vision');
          printTermLine('&bull; <span class="term-highlight">clear</span> - Clear console');
          break;

        case 'skills':
          printTermLine('Node.js, Python, Ollama, Llama 3, DeepSeek, Vanilla JS, Custom CSS Architecture');
          break;

        case 'ollama':
          printTermLine(`Ollama Status: ${STATE.ollamaOnline ? 'ONLINE' : 'STANDBY (Run "ollama run llama3")'}`);
          printTermLine(`Active Model: ${STATE.activeModel}`);
          break;

        case 'about':
          printTermLine('Faran &bull; Full-Stack &amp; Sovereign AI Architect');
          break;

        case 'clear':
          termBody.innerHTML = '';
          printTermLine('Console buffer cleared.', 'term-line');
          break;

        default:
          printTermLine(`Command not found: "${escapeHtml(cmd)}". Type <span class="term-highlight">help</span>.`, 'term-error');
          break;
      }
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  // ==========================================================================
  // 13. MOBILE CONTROLS & FAB
  // ==========================================================================
  function initMobileControls() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const drawer = document.getElementById('mobileNavDrawer');
    const fab = document.getElementById('floatingChatFab');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    mobileBtn?.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('open');
      drawer.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', !isOpen);
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });

    fab?.addEventListener('click', () => {
      const chatSection = document.getElementById('chatbot');
      chatSection?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        document.getElementById('chatInput')?.focus();
      }, 400);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSplashScreen();
    initTheme();
    init3DHeroCanvas();
    init3DCardTilt();
    initScrollAnimations();
    initChatSessions();
    initChatForm();
    initTerminal();
    initMobileControls();
    updateRateLimitUI();

    probeServices();
    setInterval(probeServices, 15000);
  });

})();
