// Main JS for Krushi Mitra (Vanilla JS, React-ready structure)
// API Integration with Spring Boot Backend

const API_BASE_URL = 'http://localhost:8080/api';
let MOCK_MODE = false; // auto-enabled on first API failure

(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // API Utility Functions
  function getAuthToken() {
    const user = localStorage.getItem('km_user');
    return user ? JSON.parse(user).token : null;
  }

  function getCurrentUser() {
    const user = localStorage.getItem('km_user');
    return user ? JSON.parse(user) : null;
  }

  function setCurrentUser(userData) {
    localStorage.setItem('km_user', JSON.stringify(userData));
  }

  function clearCurrentUser() {
    localStorage.removeItem('km_user');
  }

  async function apiCall(endpoint, options = {}) {
    endpoint = endpoint.trim();
    const token = getAuthToken();
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'API call failed');
    }

    return response.json();
  }

  // Year in footer
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  if (navToggle && navLinks){
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Modal helpers
  function openModal(id){
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.setAttribute('open','');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(modal){
    modal.removeAttribute('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  // Open/Close modal bindings
  $$('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.getAttribute('data-open-modal'));
      // Auto-select role in modals when provided
      const role = btn.getAttribute('data-role');
      if (role) {
        const loginRole = $('#loginRole');
        const regRoleSel = $('#regRole');
        if (loginRole) loginRole.value = role;
        if (regRoleSel) {
          regRoleSel.value = role;
          const evt = new Event('change');
          regRoleSel.dispatchEvent(evt);
        }
      }
    });
  });
  $$('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
  });
  $$('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => closeModal(backdrop.closest('.modal')));
  });
  $$('[data-switch-modal]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const current = link.closest('.modal');
      const target = link.getAttribute('data-switch-modal');
      closeModal(current);
      openModal(target);
    });
  });

  // Simple validators
  function setError(input, msg){
    const err = document.querySelector(`[data-error-for="${input.id}"]`);
    if (err) err.textContent = msg || '';
  }
  function required(input){
    if (!input.value.trim()) { setError(input, 'This field is required'); return false; }
    setError(input, ''); return true;
  }
  // Mock registration store (to prevent duplicate email in demo mode)
  function getMockRegisteredEmails(){
    try { return JSON.parse(localStorage.getItem('km_mock_emails')||'[]'); } catch { return []; }
  }
  function addMockRegisteredEmail(email){
    const list = getMockRegisteredEmails();
    if (!list.includes(email)){
      list.push(email);
      localStorage.setItem('km_mock_emails', JSON.stringify(list));
    }
  }
  function minLen(input, n){
    if (input.value.trim().length < n){ setError(input, `Minimum ${n} characters`); return false; }
    setError(input, ''); return true;
  }
  function emailLike(input){
    const ok = /.+@.+\..+/.test(input.value);
    if (!ok){ setError(input, 'Enter a valid email'); return false; }
    setError(input, ''); return true;
  }

  // Login form with fallback to mock data
  const loginForm = $('#loginForm');
  if (loginForm){
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roleSel = $('#loginRole');
      const email = $('#loginEmail');
      const pass = $('#loginPassword');
      const ok = [required(email) && emailLike(email), required(pass) && minLen(pass, 6)].every(Boolean);
      if (!ok) return;

      try {
        // Try API call first, fallback to mock data if backend is not available
        try {
          const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              username: email.value,
              password: pass.value
            })
          });
          setCurrentUser(response);
          closeModal($('#loginModal'));
          routeToRole(response.user.role);
        } catch (apiError) {
          // Fallback to mock login
          console.log('Backend not available, using mock login');
          const role = (roleSel && roleSel.value) ? roleSel.value : 'FARMER';
          const mockUser = {
            token: 'mock-jwt-token-' + Date.now(),
            user: {
              id: Date.now(),
              username: email.value,
              email: email.value,
              firstName: 'Test',
              lastName: 'User',
              role: role
            }
          };
          setCurrentUser(mockUser);
          closeModal($('#loginModal'));
          routeToRole(role);
          alert('Login successful! Welcome back!');
        }
      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });
  }

  // Register form with fallback to mock data
  const regForm = $('#registerForm');
  if (regForm){
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#regName');
      const email = $('#regEmail');
      const pass = $('#regPassword');
      const roleSel = $('#regRole');
      const expertise = $('#regExpertise');
      const qualifications = $('#regQualifications');
      const ok = [required(name), required(email) && emailLike(email), required(pass) && minLen(pass, 6), required(roleSel)].every(Boolean);
      if (!ok) return;

      try {
        const nameParts = name.value.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Try API call first, fallback to mock data if backend is not available
        try {
          const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              username: email.value,
              email: email.value,
              password: pass.value,
              firstName: firstName,
              lastName: lastName,
              role: roleSel.value,
              ...(roleSel.value === 'EXPERT' ? {
                expertise: (expertise && expertise.value) || '',
                qualifications: (qualifications && qualifications.value) || ''
              } : {})
            })
          });
          setCurrentUser(response);
        } catch (apiError) {
          // Fallback to mock registration
          console.log('Backend not available, using mock registration');
          // Prevent duplicate registration by email in mock mode
          const existing = getMockRegisteredEmails();
          if (existing.includes(email.value)){
            alert('This email is already registered. Please login.');
            return;
          }
          const mockUser = {
            token: 'mock-jwt-token-' + Date.now(),
            user: {
              id: Date.now(),
              username: email.value,
              email: email.value,
              firstName: firstName,
              lastName: lastName,
              role: roleSel.value
            }
          };
          setCurrentUser(mockUser);
          addMockRegisteredEmail(email.value);
        }

        closeModal($('#registerModal'));
        routeToRole(roleSel.value);
        alert('Registration successful! Welcome to Krushi Mitra!');
      } catch (error) {
        alert('Registration failed: ' + error.message);
      }
    });
  }

  // Toggle expert fields based on selected role
  const regRole = $('#regRole');
  const expertFields = $('#expertFields');
  if (regRole && expertFields){
    const updateExpertFields = () => {
      if (regRole.value === 'EXPERT') expertFields.classList.remove('hide');
      else expertFields.classList.add('hide');
    };
    regRole.addEventListener('change', updateExpertFields);
    updateExpertFields();
  }

  // Admin login with fallback to mock data
  // Forgot Password flow
  const forgotForm = $('#forgotPasswordForm');
  if (forgotForm){
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fpEmail = $('#fpEmail');
      const ok = required(fpEmail) && emailLike(fpEmail);
      if (!ok) return;
      try {
        try {
          await apiCall('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email: fpEmail.value })
          });
          alert('If the email is registered, a reset link has been sent.');
        } catch (apiError){
          console.log('Backend not available or endpoint missing, mocking forgot password');
          alert('If the email is registered, a reset link has been sent.');
        }
        closeModal($('#forgotPasswordModal'));
      } catch(err){
        alert('Could not process request: ' + err.message);
      }
    });
  }
  const adminLoginForm = $('#adminLoginForm');
  if (adminLoginForm){
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#adminEmail');
      const pass = $('#adminPassword');
      const ok = [required(email) && emailLike(email), required(pass) && minLen(pass, 6)].every(Boolean);
      if (!ok) return;

      try {
        // Try API call first, fallback to mock data if backend is not available
        try {
          const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              username: email.value,
              password: pass.value
            })
          });

          if (response.user.role !== 'ADMIN') {
            alert('Access denied. Admin privileges required.');
            return;
          }

          setCurrentUser(response);
          closeModal($('#adminLoginModal'));
          window.location.href = './admin.html';
        } catch (apiError) {
          // Fallback to mock admin login
          console.log('Backend not available, using mock admin login');
          const mockUser = {
            token: 'mock-admin-jwt-token-' + Date.now(),
            user: {
              id: Date.now(),
              username: email.value,
              email: email.value,
              firstName: 'Admin',
              lastName: 'User',
              role: 'ADMIN'
            }
          };
          setCurrentUser(mockUser);
          closeModal($('#adminLoginModal'));
          window.location.href = './admin.html';
          alert('Admin login successful!');
        }
      } catch (error) {
        alert('Admin login failed: ' + error.message);
      }
    });
  }

  // Route helper
  function routeToRole(role){
    if (role === 'FARMER') window.location.href = './farmer-dashboard.html';
    else if (role === 'EXPERT') window.location.href = './expert-dashboard.html';
    else if (role === 'VISITOR') window.location.href = './visitor.html';
    else window.location.href = './index.html';
  }

  // Page-specific bootstraps using data-page attribute
  const page = document.body.getAttribute('data-page');
  if (page === 'dashboard') initDashboard();
  if (page === 'qa') initQA();
  if (page === 'market') initMarket();
  if (page === 'schemes') initSchemes();
  if (page === 'admin') initAdmin();

  // Dummy data (used when backend is unreachable)
  const DUMMY = {
    questions: [
      { id: 1, title: 'Best time to sow wheat for higher yield?', farmer: { firstName: 'Rajesh', lastName: 'Patel' }, createdAt: new Date().toISOString() },
      { id: 2, title: 'How to treat leaf rust in wheat?', farmer: { firstName: 'Anita', lastName: 'Deshmukh' }, createdAt: new Date(Date.now()-86400000).toISOString() },
      { id: 3, title: 'Drip irrigation schedule for tomatoes?', farmer: { firstName: 'Vikas', lastName: 'Yadav' }, createdAt: new Date(Date.now()-2*86400000).toISOString() }
    ],
    answersByQuestion: {
      1: [ { id: 11, content: 'Sow in Nov 15 - Dec 15 for Rabi in MH.', expert: { firstName: 'Priya', lastName: 'Sharma' } } ],
      2: [ { id: 12, content: 'Use rust-resistant varieties and balanced NPK.', expert: { firstName: 'Amit', lastName: 'Kulkarni' } } ],
      3: [ { id: 13, content: '1-1.5 L/hr emitters, 45-60 mins alternate days.', expert: { firstName: 'Neha', lastName: 'Joshi' } } ]
    },
    recommendations: [
      { title: 'Wheat (HD-2967)', desc: 'High yield; sow in Nov-Dec; spacing 20 cm.' },
      { title: 'Paddy (IR-64)', desc: 'Suitable for irrigated areas; transplant after 25-30 days.' }
    ],
    schemes: [
      { name: 'PM-KISAN', dept: 'GoI', benefit: '₹6,000/year', isActive: true },
      { name: 'Soil Health Card', dept: 'GoI', benefit: 'Free soil testing', isActive: true }
    ],
    market: [
      { commodity: 'Wheat', price: '2,250/qtl', mandi: 'Nagpur' },
      { commodity: 'Soybean', price: '4,450/qtl', mandi: 'Akola' },
      { commodity: 'Mustard', price: '5,200/qtl', mandi: 'Jaipur' }
    ],
    weather: { location: 'Nagpur, MH', tempC: 30, condition: 'Partly Cloudy' },
    products: [
      { name: 'Bio-fertilizer A', price: '₹499', summary: 'Improves soil health, eco-friendly.' },
      { name: 'Organic Pesticide B', price: '₹299', summary: 'Targets common pests safely.' },
      { name: 'Seed Kit C', price: '₹199', summary: 'High-germination seasonal seeds.' }
    ],
    pendingExperts: [
      { id: 101, firstName: 'Dr. Kavita', lastName: 'Rao', email: 'kavita@example.com', username: 'kavita.rao' },
      { id: 102, firstName: 'Dr. Ramesh', lastName: 'Iyer', email: 'ramesh@example.com', username: 'ramesh.iyer' }
    ]
  };

  async function initDashboard(){
    // Question form
    const form = $('#askForm');
    const list = $('#recentQuestions');
    const recGrid = $('#recGrid');
    const schemeList = $('#schemeList');

    if (form){
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ta = $('#questionText');
        if (!ta.value.trim()) return;

        try {
          await apiCall('/questions', {
            method: 'POST',
            body: JSON.stringify({
              title: ta.value.trim().substring(0, 100),
              content: ta.value.trim(),
              category: 'General'
            })
          });
          ta.value = '';
          await loadRecentQuestions(list);
        } catch (error) {
          alert('Failed to post question: ' + error.message);
        }
      });
    }

    // Load data from API
    if (list) await loadRecentQuestions(list);
    if (recGrid) await loadCropRecommendations(recGrid);
    if (schemeList) await loadSchemes(schemeList);
  }

  async function loadRecentQuestions(container) {
    try {
      const questions = await apiCall('/questions/public');
      renderQuestions(container, questions.slice(0, 5));
    } catch (error) {
      console.error('Failed to load questions:', error);
      MOCK_MODE = true;
      renderQuestions(container, DUMMY.questions.slice(0,5));
    }
  }

  async function loadCropRecommendations(container) {
    try {
      const crops = await apiCall('/crops');
      renderRecommendations(container, crops.slice(0, 6));
    } catch (error) {
      console.error('Failed to load crops:', error);
      MOCK_MODE = true;
      renderRecommendations(container, DUMMY.recommendations);
    }
  }

  async function loadSchemes(container) {
    try {
      const schemes = await apiCall('/government-schemes/public');
      renderSchemes(container, schemes);
    } catch (error) {
      console.error('Failed to load schemes:', error);
      MOCK_MODE = true;
      renderSchemes(container, DUMMY.schemes);
    }
  }

  function renderQuestions(container, items){
    container.innerHTML = items.map(q => `
      <div class="card">
        <strong>${q.farmer ? q.farmer.firstName + ' ' + q.farmer.lastName : 'Anonymous'}</strong>
        <p class="muted">${q.title}</p>
        <small class="muted">${new Date(q.createdAt).toLocaleDateString()}</small>
      </div>
    `).join('');
  }
  function renderRecommendations(container, items){
    container.innerHTML = items.map(r => `
      <div class="card">
        <h4>${r.name || r.title}</h4>
        <p class="muted">${r.description || r.desc || 'Crop recommendation'}</p>
        <button class="btn btn-secondary">View Details</button>
      </div>
    `).join('');
  }
  function renderSchemes(container, items){
    container.innerHTML = items.map(s => `
      <tr>
        <td>${s.name || s.title}</td>
        <td>${s.department || s.dept || 'Government'}</td>
        <td>${s.benefit || s.description || 'See details'}</td>
        <td>${s.isActive ? 'Active' : 'Inactive'}</td>
      </tr>
    `).join('');
  }

  async function initQA(){
    const qList = $('#qaList');
    if (!qList) return;

    try {
      const questions = await apiCall('/questions/public');
      renderQAQuestions(qList, questions);
    } catch (error) {
      console.error('Failed to load questions:', error);
      MOCK_MODE = true;
      renderQAQuestions(qList, DUMMY.questions);
    }
  }

  function renderQAQuestions(container, questions) {
    container.innerHTML = questions.map(q => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <div>
            <strong>${q.farmer ? q.farmer.firstName + ' ' + q.farmer.lastName : 'Anonymous'}</strong>
            <p class="muted" style="margin:4px 0 0">${q.title}</p>
            <small class="muted">${new Date(q.createdAt).toLocaleDateString()}</small>
          </div>
          <button class="btn btn-primary" data-reply="${q.id}">Reply</button>
        </div>
        <div class="hide" id="replyBox-${q.id}">
          <div class="form-field" style="margin-top:10px">
            <label for="reply-${q.id}">Your Answer</label>
            <textarea id="reply-${q.id}" placeholder="Type your expert advice..."></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" data-cancel="${q.id}">Cancel</button>
            <button class="btn btn-primary" data-submit="${q.id}">Submit</button>
          </div>
        </div>
      </div>
    `).join('');

    container.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.getAttribute('data-reply')||btn.getAttribute('data-cancel')||btn.getAttribute('data-submit');
      
      if (btn.hasAttribute('data-reply')){
        $(`#replyBox-${id}`).classList.remove('hide');
      } else if (btn.hasAttribute('data-cancel')){
        $(`#replyBox-${id}`).classList.add('hide');
      } else if (btn.hasAttribute('data-submit')){
        const ta = $(`#reply-${id}`);
        if (!ta.value.trim()) return;
        
        try {
          await apiCall('/answers', {
            method: 'POST',
            body: JSON.stringify({
              questionId: parseInt(id),
              content: ta.value.trim()
            })
          });
          alert('Answer submitted successfully!');
          ta.value = '';
          $(`#replyBox-${id}`).classList.add('hide');
        } catch (error) {
          alert('Failed to submit answer: ' + error.message);
        }
      }
    });
  }

  async function initMarket(){
    const weatherCard = $('#weatherCard');
    const priceBody = $('#priceBody');

    // Load weather data
    if (weatherCard){
      try {
        const weatherData = await apiCall('/weather/Nagpur');
        weatherCard.innerHTML = `
          <div class="card" style="display:flex;gap:12px;align-items:center">
            <i class="fa-solid fa-cloud-sun" style="font-size:28px;color:var(--primary)"></i>
            <div>
              <div><strong>Nagpur, Maharashtra</strong></div>
              <div class="muted">${weatherData}</div>
            </div>
          </div>
        `;
      } catch (error) {
        console.error('Failed to load weather:', error);
        MOCK_MODE = true;
        weatherCard.innerHTML = `
          <div class="card" style="display:flex;gap:12px;align-items:center">
            <i class="fa-solid fa-cloud-sun" style="font-size:28px;color:var(--primary)"></i>
            <div>
              <div><strong>Weather Service</strong></div>
              <div class="muted">${DUMMY.weather.location} • ${DUMMY.weather.tempC}°C • ${DUMMY.weather.condition}</div>
            </div>
          </div>
        `;
      }
    }

    // Load market prices
    if (priceBody){
      try {
        const prices = await apiCall('/market-prices');
        priceBody.innerHTML = prices.map(m => `
          <tr>
            <td>${m.commodityName || m.commodity}</td>
            <td>₹${m.price || m.pricePerUnit}</td>
            <td>${m.marketName || m.mandi || 'Local Market'}</td>
          </tr>
        `).join('');
      } catch (error) {
        console.error('Failed to load market prices:', error);
        MOCK_MODE = true;
        priceBody.innerHTML = DUMMY.market.map(m => `
          <tr>
            <td>${m.commodity}</td>
            <td>₹${m.price}</td>
            <td>${m.mandi}</td>
          </tr>
        `).join('');
      }
    }
  }

  async function initSchemes(){
    const list = $('#schemesBody');
    const productsGrid = $('#productsGrid');
    
    if (list) {
      try {
        const schemes = await apiCall('/government-schemes/public');
        renderSchemes(list, schemes);
      } catch (error) {
        console.error('Failed to load schemes:', error);
        MOCK_MODE = true;
        renderSchemes(list, DUMMY.schemes);
      }
    }
    
    if (productsGrid) {
      try {
        const products = await apiCall('/product-listings/public');
        renderProducts(productsGrid, products);
      } catch (error) {
        console.error('Failed to load products:', error);
        MOCK_MODE = true;
        renderProducts(productsGrid, DUMMY.products);
      }
    }
  }

  async function initAdmin(){
    const pendingQ = $('#pendingQuestions');
    const pendingA = $('#pendingAnswers');
    const pendingExperts = $('#pendingExperts');
    const refreshExpertsBtn = $('#refreshPendingExperts');
    
    if (pendingQ){
      try {
        const questions = await apiCall('/questions');
        pendingQ.innerHTML = questions.map(q => 
          `<li>Q#${q.id}: ${q.title.slice(0,60)}... (${q.farmer ? q.farmer.firstName : 'Anonymous'})</li>`
        ).join('');
      } catch (error) {
        console.error('Failed to load questions for admin:', error);
        pendingQ.innerHTML = '<li>Failed to load questions</li>';
      }
    }
    
    if (pendingA){
      try {
        // Note: This would need a specific endpoint for pending answers
        pendingA.innerHTML = '<li>Answer moderation feature coming soon</li>';
      } catch (error) {
        console.error('Failed to load answers for admin:', error);
        pendingA.innerHTML = '<li>Failed to load answers</li>';
      }
    }

    // Load pending experts and wire approve buttons
    async function loadPendingExperts(){
      if (!pendingExperts) return;
      pendingExperts.innerHTML = '<li>Loading...</li>';
      try {
        const experts = await apiCall('/users/experts/pending');
        if (!experts.length){
          pendingExperts.innerHTML = '<li>No pending experts</li>';
        } else {
          pendingExperts.innerHTML = experts.map(e => `
            <li style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
              <div>
                <strong>${e.firstName} ${e.lastName}</strong>
                <div class="muted">${e.email} • ${e.username}</div>
              </div>
              <button class="btn btn-primary" data-approve-expert="${e.id}">Approve</button>
            </li>
          `).join('');
        }
      } catch (error) {
        console.error('Failed to load pending experts:', error);
        MOCK_MODE = true;
        pendingExperts.innerHTML = DUMMY.pendingExperts.map(e => `
          <li style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
            <div>
              <strong>${e.firstName} ${e.lastName}</strong>
              <div class="muted">${e.email} • ${e.username}</div>
            </div>
            <button class="btn btn-primary" data-approve-expert="${e.id}">Approve</button>
          </li>
        `).join('');
      }
    }
    if (pendingExperts) {
      await loadPendingExperts();
      pendingExperts.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-approve-expert]');
        if (!btn) return;
        const id = btn.getAttribute('data-approve-expert');
        btn.disabled = true;
        try {
          if (!MOCK_MODE) {
            await apiCall(`/users/experts/${id}/approve`, { method: 'POST' });
            await loadPendingExperts();
          } else {
            // Remove from dummy list locally
            const remain = Array.from(pendingExperts.querySelectorAll('li')).filter(li => li.querySelector(`[data-approve-expert]`).getAttribute('data-approve-expert') !== id);
            pendingExperts.innerHTML = remain.map(li => li.outerHTML).join('') || '<li>No pending experts</li>';
          }
        } catch (err) {
          alert('Failed to approve expert: ' + err.message);
          btn.disabled = false;
        }
      });
    }
    if (refreshExpertsBtn) refreshExpertsBtn.addEventListener('click', loadPendingExperts);
  }

  function renderProducts(container, items){
    container.innerHTML = items.map(p => `
      <div class="card">
        <h4>${p.name || p.title}</h4>
        <p class="muted">${p.description || p.summary || 'Product listing'}</p>
        <div class="form-actions">
          <span><strong>₹${p.price || p.pricePerUnit || 'Contact for price'}</strong></span>
          <button class="btn btn-secondary">View Details</button>
        </div>
        <small class="muted">By: ${p.farmer ? p.farmer.firstName + ' ' + p.farmer.lastName : 'Farmer'}</small>
      </div>
    `).join('');
  }
})();


