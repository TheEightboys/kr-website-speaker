// ============================================================
// admin.js — KR New Vision Enterprise Admin Panel Logic
// Full CMS: Auth, CRUD, Image Upload, Alignment, Sizing
// ============================================================

// ---- Supabase Client ----
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- State ----
let currentUser = null;
let allContent = {};  // { "page:section:key": row }
let pendingChanges = {}; // { "page:section:key": updatedFields }

// ============================================================
// INITIALIZATION
// ============================================================
async function init() {
  // Check existing session
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadAdminPanel();
  } else {
    document.getElementById('loading-overlay').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  }

  // Auth state listener
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      currentUser = session.user;
      loadAdminPanel();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLoginScreen();
    }
  });
}

// ============================================================
// AUTH — LOGIN
// ============================================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  btn.disabled = true;
  btn.textContent = 'Signing in...';
  errEl.classList.remove('show');

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    errEl.textContent = error.message || 'Login failed. Check your credentials.';
    errEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Sign In to Admin Panel';
    return;
  }

  currentUser = data.user;
  await loadAdminPanel();
});

// ============================================================
// AUTH — LOGOUT
// ============================================================
async function handleLogout() {
  await sb.auth.signOut();
  showLoginScreen();
}

function showLoginScreen() {
  document.getElementById('admin-app').classList.remove('active');
  document.getElementById('admin-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('loading-overlay').style.display = 'none';
}

// ============================================================
// LOAD ADMIN PANEL
// ============================================================
async function loadAdminPanel() {
  // Show loading
  document.getElementById('loading-overlay').style.display = 'flex';

  // Set user display
  if (currentUser) {
    document.getElementById('user-email-display').textContent = currentUser.email || 'Admin';
  }

  // Load all content from DB
  await fetchAllContent();

  // Build all page editors
  buildAllEditors();

  // Load stats
  loadDashboardStats();

  // Show admin
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').classList.add('active');
  document.getElementById('admin-app').style.display = 'flex';
  document.getElementById('loading-overlay').style.display = 'none';
}

// ============================================================
// FETCH ALL CONTENT FROM SUPABASE
// ============================================================
async function fetchAllContent() {
  const { data, error } = await sb.from('site_content').select('*');
  if (error) {
    showToast('Failed to load content: ' + error.message, 'error');
    return;
  }
  allContent = {};
  (data || []).forEach(row => {
    const key = `${row.page}:${row.section}:${row.key}`;
    allContent[key] = row;
  });
}

function getContent(page, section, key) {
  return allContent[`${page}:${section}:${key}`] || null;
}

function getVal(page, section, key, fallback = '') {
  const row = getContent(page, section, key);
  return row ? (row.value || fallback) : fallback;
}

// ============================================================
// DASHBOARD STATS
// ============================================================
function loadDashboardStats() {
  const total = Object.keys(allContent).length;
  const images = Object.values(allContent).filter(r => r.type === 'image').length;
  document.getElementById('stat-items').textContent = total;
  document.getElementById('stat-images').textContent = images;
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(tabId, btnEl) {
  document.querySelectorAll('.page-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  if (btnEl) btnEl.classList.add('active');

  const labels = {
    'dashboard': 'Dashboard',
    'index': 'Home Page',
    'about': 'About Page',
    'author': 'Author / Books',
    'second-wind': 'Second Wind',
    'whoy': 'WHOY',
    'work-with-kr': 'Work With KR',
    'monetization': 'Monetization',
    'speaker': 'Speaker'
  };
  document.getElementById('current-page-label').textContent = labels[tabId] || tabId;
}

// ============================================================
// BUILDER — BUILD ALL EDITORS DYNAMICALLY
// ============================================================
function buildAllEditors() {
  buildPageEditor('index');
  buildPageEditor('about');
  buildPageEditor('author');
  buildPageEditor('second-wind');
  buildPageEditor('whoy');
  buildPageEditor('work-with-kr');
  buildPageEditor('monetization');
  buildPageEditor('speaker');
}

// ============================================================
// DEFINE PAGE SCHEMAS
// Each page has sections, each section has fields
// ============================================================
const PAGE_SCHEMAS = {
  'index': [
    {
      id: 'hero', label: 'Hero Section', icon: '🦸',
      fields: [
        { key: 'title',    label: 'Page Title',     type: 'text' },
        { key: 'subtitle', label: 'Subtitle Text',  type: 'textarea' },
        { key: 'btn1_text',label: 'Button 1 Text',  type: 'text' },
        { key: 'btn1_link',label: 'Button 1 Link',  type: 'text' },
        { key: 'btn2_text',label: 'Button 2 Text',  type: 'text' },
        { key: 'btn2_link',label: 'Button 2 Link',  type: 'text' },
        { key: 'tile_text',label: 'Floating Tile Text', type: 'text' },
        { key: 'image_url',label: 'Hero Image',     type: 'image' },
      ]
    },
    {
      id: 'ecosystem', label: 'The Ecosystem Section', icon: '🌐',
      fields: [
        { key: 'title',    label: 'Section Title',  type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
      ]
    },
    {
      id: 'for_whom', label: '"Second Wind Is For" Section', icon: '👥',
      fields: [
        { key: 'title',    label: 'Section Title',  type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
      ]
    },
    {
      id: 'meet_kr', label: 'Meet KR Henderson Section', icon: '🤵',
      fields: [
        { key: 'title',    label: 'Section Title',  type: 'text' },
        { key: 'subtitle', label: 'Description',    type: 'textarea' },
        { key: 'quote',    label: 'Quote',          type: 'text' },
        { key: 'image_url',label: 'KR Photo',       type: 'image' },
      ]
    },
    {
      id: 'banner', label: 'Call-to-Action Banner', icon: '📣',
      fields: [
        { key: 'title',    label: 'Banner Title',   type: 'text' },
        { key: 'subtitle', label: 'Banner Subtitle',type: 'text' },
      ]
    },
    {
      id: 'footer', label: 'Footer', icon: '📋',
      fields: [
        { key: 'left',     label: 'Footer Left Text',  type: 'text' },
        { key: 'right',    label: 'Footer Right Text', type: 'text' },
      ]
    },
  ],

  'about': [
    {
      id: 'hero', label: 'Hero Section', icon: '🦸',
      fields: [
        { key: 'title',    label: 'Page Title',     type: 'text' },
        { key: 'subtitle', label: 'Subtitle',       type: 'textarea' },
        { key: 'image_url',label: 'Hero Image',     type: 'image' },
      ]
    },
    {
      id: 'founder', label: 'The Founder Section', icon: '👤',
      fields: [
        { key: 'title',    label: 'Section Title',  type: 'text' },
        { key: 'subtitle', label: 'Description',    type: 'textarea' },
        { key: 'image_url',label: 'Founder Photo',  type: 'image' },
      ]
    },
    {
      id: 'mission', label: 'Mission', icon: '🎯',
      fields: [
        { key: 'title',    label: 'Title',          type: 'text' },
        { key: 'quote',    label: 'Mission Quote',  type: 'textarea' },
      ]
    },
    {
      id: 'vision', label: 'Vision', icon: '🔭',
      fields: [
        { key: 'title',    label: 'Title',          type: 'text' },
        { key: 'quote',    label: 'Vision Quote',   type: 'textarea' },
      ]
    },
    {
      id: 'banner', label: 'Call-to-Action Banner', icon: '📣',
      fields: [
        { key: 'title',    label: 'Banner Title',   type: 'text' },
        { key: 'subtitle', label: 'Banner Subtitle',type: 'text' },
      ]
    },
  ],

  'author': [
    {
      id: 'hero', label: 'Hero Section', icon: '🦸',
      fields: [
        { key: 'title',    label: 'Page Title',     type: 'text' },
        { key: 'subtitle', label: 'Subtitle',       type: 'textarea' },
        { key: 'image_url',label: 'Author Photo',   type: 'image' },
      ]
    },
    {
      id: 'books', label: 'Books Section Header', icon: '📚',
      fields: [
        { key: 'title',    label: 'Section Title',  type: 'text' },
        { key: 'subtitle', label: 'Subtitle',       type: 'text' },
      ]
    },
    {
      id: 'book1', label: "Book 1 — The Lion's Den", icon: '🦁',
      fields: [
        { key: 'title',    label: 'Book Title',     type: 'text' },
        { key: 'subtitle', label: 'Description',    type: 'textarea' },
        { key: 'image_url',label: 'Book Cover',     type: 'image' },
      ]
    },
    {
      id: 'book2', label: 'Book 2 — WHOY', icon: '💪',
      fields: [
        { key: 'title',    label: 'Book Title',     type: 'text' },
        { key: 'subtitle', label: 'Description',    type: 'text' },
        { key: 'image_url',label: 'Book Cover',     type: 'image' },
      ]
    },
    {
      id: 'book3', label: 'Book 3 — Major Max Shorty', icon: '👦',
      fields: [
        { key: 'title',    label: 'Book Title',     type: 'text' },
        { key: 'subtitle', label: 'Description',    type: 'text' },
        { key: 'image_url',label: 'Book Cover',     type: 'image' },
      ]
    },
    {
      id: 'banner', label: 'Call-to-Action Banner', icon: '📣',
      fields: [
        { key: 'title',    label: 'Banner Title',   type: 'text' },
        { key: 'subtitle', label: 'Banner Subtitle',type: 'text' },
      ]
    },
  ],

  'second-wind': [
    {
      id: 'hero', label: 'Hero Section', icon: '🦸',
      fields: [
        { key: 'title',    label: 'Page Title',      type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
        { key: 'tile_text',label: 'Floating Tile',   type: 'text' },
        { key: 'image_url',label: 'Hero Image',      type: 'image' },
      ]
    },
    {
      id: 'for_whom', label: '"Second Wind Is For" Section', icon: '👥',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
      ]
    },
    {
      id: 'offers', label: 'What Second Wind Offers', icon: '🎁',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
      ]
    },
    {
      id: 'banner', label: 'Call-to-Action Banner', icon: '📣',
      fields: [
        { key: 'title',    label: 'Banner Title',    type: 'text' },
        { key: 'subtitle', label: 'Banner Subtitle', type: 'text' },
      ]
    },
  ],

  'whoy': [
    {
      id: 'hero', label: 'Hero Section', icon: '🦸',
      fields: [
        { key: 'title',    label: 'Page Title',      type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
        { key: 'tile_text',label: 'Floating Tile',   type: 'text' },
        { key: 'image_url',label: 'Hero Image',      type: 'image' },
      ]
    },
    {
      id: 'principle', label: 'The WHOY Principle Section', icon: '⚡',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
        { key: 'image_url',label: 'Section Image',   type: 'image' },
      ]
    },
    {
      id: 'books', label: 'Books Section Header', icon: '📚',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
      ]
    },
    {
      id: 'offers', label: 'What WHOY Offers', icon: '🎁',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
      ]
    },
    {
      id: 'banner', label: 'Call-to-Action Banner', icon: '📣',
      fields: [
        { key: 'title',    label: 'Banner Title',    type: 'text' },
        { key: 'subtitle', label: 'Banner Subtitle', type: 'text' },
      ]
    },
  ],

  'work-with-kr': [
    {
      id: 'hero', label: 'Hero Section', icon: '🦸',
      fields: [
        { key: 'title',    label: 'Page Title',      type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
        { key: 'tile_text',label: 'Floating Tile',   type: 'text' },
        { key: 'image_url',label: 'Hero Image',      type: 'image' },
      ]
    },
    {
      id: 'services', label: 'Services Section', icon: '🛠️',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'text' },
      ]
    },
    {
      id: 'why', label: 'Why Organizations Choose KR', icon: '🏆',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
        { key: 'image_url',label: 'Section Image',   type: 'image' },
      ]
    },
    {
      id: 'process', label: 'The Booking Process', icon: '📋',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
        { key: 'image_url',label: 'Process Image',   type: 'image' },
      ]
    },
    {
      id: 'banner', label: 'Call-to-Action Banner', icon: '📣',
      fields: [
        { key: 'title',    label: 'Banner Title',    type: 'text' },
        { key: 'subtitle', label: 'Banner Subtitle', type: 'text' },
      ]
    },
  ],

  'monetization': [
    {
      id: 'hero', label: 'Hero Section', icon: '🦸',
      fields: [
        { key: 'title',    label: 'Page Title',      type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
        { key: 'image_url',label: 'Hero Image',      type: 'image' },
      ]
    },
    {
      id: 'form', label: 'Event Form Section', icon: '📝',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'text' },
      ]
    },
    {
      id: 'products', label: 'Products & Services Section', icon: '🛒',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'text' },
      ]
    },
    {
      id: 'banner', label: 'Call-to-Action Banner', icon: '📣',
      fields: [
        { key: 'title',    label: 'Banner Title',    type: 'text' },
        { key: 'subtitle', label: 'Banner Subtitle', type: 'text' },
      ]
    },
  ],

  'speaker': [
    {
      id: 'hero', label: 'Hero Section', icon: '🎤',
      fields: [
        { key: 'title',    label: 'Page Title',      type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'textarea' },
        { key: 'image_url',label: 'Speaker Image',   type: 'image' },
      ]
    },
    {
      id: 'topics', label: 'Speaking Topics', icon: '💬',
      fields: [
        { key: 'title',    label: 'Section Title',   type: 'text' },
        { key: 'subtitle', label: 'Subtitle',        type: 'text' },
      ]
    },
    {
      id: 'banner', label: 'Call-to-Action Banner', icon: '📣',
      fields: [
        { key: 'title',    label: 'Banner Title',    type: 'text' },
        { key: 'subtitle', label: 'Banner Subtitle', type: 'text' },
      ]
    },
  ],
};

// ============================================================
// BUILD EDITOR FOR A PAGE
// ============================================================
function buildPageEditor(page) {
  const container = document.getElementById('content-' + page);
  if (!container) return;

  const schema = PAGE_SCHEMAS[page];
  if (!schema) {
    container.innerHTML = '<div style="color: var(--muted); padding: 20px;">No schema defined for this page yet.</div>';
    return;
  }

  let html = '';
  schema.forEach(section => {
    html += buildSectionCard(page, section);
  });
  container.innerHTML = html;
}

function buildSectionCard(page, section) {
  let fieldsHtml = '';
  section.fields.forEach(field => {
    fieldsHtml += buildField(page, section.id, field);
  });

  return `
    <div class="section-card" id="section-card-${page}-${section.id}">
      <div class="section-card-header" onclick="toggleSection('${page}-${section.id}')">
        <div class="section-card-title">
          <span>${section.icon}</span>
          ${section.label}
          <span class="section-badge">${section.id}</span>
        </div>
        <span class="section-toggle">▾</span>
      </div>
      <div class="section-card-body">
        ${fieldsHtml}
        <button class="btn-save-section" id="save-btn-${page}-${section.id}"
          onclick="saveSection('${page}', '${section.id}')">
          💾 Save Section
        </button>
      </div>
    </div>
  `;
}

function buildField(page, section, field) {
  const row = getContent(page, section, field.key);
  const currentVal = row ? (row.value || '') : '';

  if (field.type === 'image') {
    return buildImageField(page, section, field, row, currentVal);
  } else if (field.type === 'textarea') {
    return buildTextareaField(page, section, field, currentVal, row);
  } else {
    return buildTextField(page, section, field, currentVal, row);
  }
}

function buildTextField(page, section, field, val, row) {
  const align = row ? (row.align || 'left') : 'left';
  return `
    <div class="field-row">
      <label class="field-label">
        ${field.label}
        <span class="field-key-badge">${section}.${field.key}</span>
      </label>
      <input class="field-input"
        type="text"
        id="field-${page}-${section}-${field.key}"
        value="${escHtml(val)}"
        onchange="markChange('${page}', '${section}', '${field.key}', 'value', this.value)"
        oninput="markChange('${page}', '${section}', '${field.key}', 'value', this.value)"
      />
      <div class="align-controls">
        <button class="align-btn ${align==='left'?'active':''}" title="Align Left"
          onclick="setAlign('${page}', '${section}', '${field.key}', 'left', this)">⬅ Left</button>
        <button class="align-btn ${align==='center'?'active':''}" title="Align Center"
          onclick="setAlign('${page}', '${section}', '${field.key}', 'center', this)">↔ Center</button>
        <button class="align-btn ${align==='right'?'active':''}" title="Align Right"
          onclick="setAlign('${page}', '${section}', '${field.key}', 'right', this)">➡ Right</button>
      </div>
    </div>
  `;
}

function buildTextareaField(page, section, field, val, row) {
  const align = row ? (row.align || 'left') : 'left';
  return `
    <div class="field-row">
      <label class="field-label">
        ${field.label}
        <span class="field-key-badge">${section}.${field.key}</span>
      </label>
      <textarea class="field-textarea"
        id="field-${page}-${section}-${field.key}"
        onchange="markChange('${page}', '${section}', '${field.key}', 'value', this.value)"
        oninput="markChange('${page}', '${section}', '${field.key}', 'value', this.value)"
      >${escHtml(val)}</textarea>
      <div class="align-controls">
        <button class="align-btn ${align==='left'?'active':''}"
          onclick="setAlign('${page}', '${section}', '${field.key}', 'left', this)">⬅ Left</button>
        <button class="align-btn ${align==='center'?'active':''}"
          onclick="setAlign('${page}', '${section}', '${field.key}', 'center', this)">↔ Center</button>
        <button class="align-btn ${align==='right'?'active':''}"
          onclick="setAlign('${page}', '${section}', '${field.key}', 'right', this)">➡ Right</button>
      </div>
    </div>
  `;
}

function buildImageField(page, section, field, row, val) {
  const align       = row ? (row.align || 'left') : 'left';
  const imgWidth    = row ? (row.image_width  || '100%')     : '100%';
  const imgHeight   = row ? (row.image_height || 'auto')     : 'auto';
  const maxW        = row ? (row.max_width    || '')         : '';
  const maxH        = row ? (row.max_height   || '')         : '';
  const fit         = row ? (row.object_fit   || 'contain')  : 'contain';

  const previewSrc = val
    ? (val.startsWith('http') ? val : val)
    : '';

  const previewHtml = previewSrc
    ? `<img src="${escHtml(previewSrc)}" id="img-preview-${page}-${section}-${field.key}" alt="Preview" style="max-width:100%;max-height:200px;object-fit:contain;" onerror="this.style.display='none'" />`
    : `<div class="image-placeholder"><div class="image-placeholder-icon">🖼️</div><div>No image set</div></div>`;

  return `
    <div class="field-row">
      <label class="field-label">
        ${field.label}
        <span class="field-key-badge">${section}.${field.key}</span>
      </label>
      <div class="image-field">
        <div class="image-preview-area" id="img-preview-area-${page}-${section}-${field.key}">
          ${previewHtml}
        </div>
        <div class="image-controls">
          <!-- Upload button -->
          <div class="image-controls-full">
            <input type="file" accept="image/*"
              id="file-${page}-${section}-${field.key}"
              onchange="handleImageUpload('${page}', '${section}', '${field.key}', this)" />
            <button class="btn-upload" onclick="document.getElementById('file-${page}-${section}-${field.key}').click()">
              📤 Upload New Image
            </button>
            <div class="upload-progress" id="progress-${page}-${section}-${field.key}">
              <span>Uploading...</span>
              <div class="progress-bar-wrap"><div class="progress-bar" id="pbar-${page}-${section}-${field.key}"></div></div>
            </div>
          </div>

          <!-- Or enter URL manually -->
          <div class="image-controls-full">
            <label class="field-label" style="margin-bottom: 4px;">Or enter image URL directly</label>
            <input class="field-input" type="text"
              id="field-${page}-${section}-${field.key}"
              value="${escHtml(val)}"
              placeholder="https://... or local path"
              oninput="markChange('${page}','${section}','${field.key}','value',this.value); updateImgPreview('${page}','${section}','${field.key}',this.value)"
            />
          </div>

          <!-- Size controls -->
          <div class="size-controls image-controls-full">
            <div class="size-control-group">
              <label class="size-label">Width</label>
              <input class="size-input" type="text" value="${escHtml(imgWidth)}" placeholder="100% or 350px"
                oninput="markChange('${page}','${section}','${field.key}','image_width',this.value)" />
            </div>
            <div class="size-control-group">
              <label class="size-label">Height</label>
              <input class="size-input" type="text" value="${escHtml(imgHeight)}" placeholder="auto or 400px"
                oninput="markChange('${page}','${section}','${field.key}','image_height',this.value)" />
            </div>
            <div class="size-control-group">
              <label class="size-label">Max Width</label>
              <input class="size-input" type="text" value="${escHtml(maxW)}" placeholder="e.g. 550px"
                oninput="markChange('${page}','${section}','${field.key}','max_width',this.value)" />
            </div>
            <div class="size-control-group">
              <label class="size-label">Max Height</label>
              <input class="size-input" type="text" value="${escHtml(maxH)}" placeholder="e.g. 550px"
                oninput="markChange('${page}','${section}','${field.key}','max_height',this.value)" />
            </div>
          </div>

          <!-- Image fit / crop -->
          <div class="image-controls-full">
            <label class="size-label" style="margin-bottom: 6px;">Image Fit / Crop Mode</label>
            <div class="fit-selector">
              <button class="fit-btn ${fit==='contain'?'active':''}" onclick="setFit('${page}','${section}','${field.key}','contain',this)">Contain</button>
              <button class="fit-btn ${fit==='cover'?'active':''}" onclick="setFit('${page}','${section}','${field.key}','cover',this)">Cover</button>
              <button class="fit-btn ${fit==='fill'?'active':''}" onclick="setFit('${page}','${section}','${field.key}','fill',this)">Fill</button>
              <button class="fit-btn ${fit==='none'?'active':''}" onclick="setFit('${page}','${section}','${field.key}','none',this)">None</button>
            </div>
          </div>

          <!-- Alignment -->
          <div class="image-controls-full">
            <label class="size-label" style="margin-bottom: 6px;">Image Alignment</label>
            <div class="align-controls">
              <button class="align-btn ${align==='left'?'active':''}" onclick="setAlign('${page}','${section}','${field.key}','left',this)">⬅ Left</button>
              <button class="align-btn ${align==='center'?'active':''}" onclick="setAlign('${page}','${section}','${field.key}','center',this)">↔ Center</button>
              <button class="align-btn ${align==='right'?'active':''}" onclick="setAlign('${page}','${section}','${field.key}','right',this)">➡ Right</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// TOGGLE SECTION CARD
// ============================================================
function toggleSection(id) {
  const card = document.getElementById('section-card-' + id);
  if (card) card.classList.toggle('collapsed');
}

// ============================================================
// MARK CHANGE (track pending changes without saving yet)
// ============================================================
function markChange(page, section, key, field, value) {
  const storeKey = `${page}:${section}:${key}`;
  if (!pendingChanges[storeKey]) {
    pendingChanges[storeKey] = { page, section, key };
  }
  pendingChanges[storeKey][field] = value;
}

// ============================================================
// SET ALIGNMENT
// ============================================================
function setAlign(page, section, key, align, btnEl) {
  markChange(page, section, key, 'align', align);
  // Update UI
  const container = btnEl.closest('.align-controls');
  if (container) {
    container.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
}

// ============================================================
// SET OBJECT FIT
// ============================================================
function setFit(page, section, key, fit, btnEl) {
  markChange(page, section, key, 'object_fit', fit);
  const container = btnEl.closest('.fit-selector');
  if (container) {
    container.querySelectorAll('.fit-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
}

// ============================================================
// IMAGE PREVIEW UPDATE
// ============================================================
function updateImgPreview(page, section, key, url) {
  const area = document.getElementById(`img-preview-area-${page}-${section}-${key}`);
  if (!area) return;
  const existing = document.getElementById(`img-preview-${page}-${section}-${key}`);
  if (existing) {
    existing.src = url;
    existing.style.display = '';
  } else if (url) {
    area.innerHTML = `<img src="${escHtml(url)}" id="img-preview-${page}-${section}-${key}" alt="Preview" style="max-width:100%;max-height:200px;object-fit:contain;" />`;
  }
}

// ============================================================
// IMAGE UPLOAD TO SUPABASE STORAGE
// ============================================================
async function handleImageUpload(page, section, key, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;

  const progressEl = document.getElementById(`progress-${page}-${section}-${key}`);
  const pbar = document.getElementById(`pbar-${page}-${section}-${key}`);

  progressEl.classList.add('show');
  pbar.style.width = '20%';

  // Generate file path: page/section/timestamp_filename.ext
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${page}/${section}/${Date.now()}_${key}.${ext}`;

  pbar.style.width = '50%';

  const { data, error } = await sb.storage
    .from('site-images')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });

  pbar.style.width = '90%';

  if (error) {
    progressEl.classList.remove('show');
    showToast('Upload failed: ' + error.message, 'error');
    return;
  }

  // Get public URL
  const { data: urlData } = sb.storage.from('site-images').getPublicUrl(fileName);
  const publicUrl = urlData.publicUrl;

  pbar.style.width = '100%';
  setTimeout(() => progressEl.classList.remove('show'), 800);

  // Update the URL field and preview
  const urlInput = document.getElementById(`field-${page}-${section}-${key}`);
  if (urlInput) urlInput.value = publicUrl;
  updateImgPreview(page, section, key, publicUrl);

  // Mark change
  markChange(page, section, key, 'value', publicUrl);

  showToast('Image uploaded! Click "Save Section" to apply.', 'success');
}

// ============================================================
// SAVE A SECTION
// ============================================================
async function saveSection(page, sectionId) {
  const btn = document.getElementById(`save-btn-${page}-${sectionId}`);
  if (btn) { btn.classList.add('saving'); btn.textContent = '⏳ Saving...'; }

  // Find all pending changes for this page+section
  const toSave = Object.entries(pendingChanges).filter(([k]) => k.startsWith(`${page}:${sectionId}:`));

  // Also grab current field values even if not "dirty" (full save of section)
  const schema = PAGE_SCHEMAS[page];
  const sectionSchema = schema ? schema.find(s => s.id === sectionId) : null;

  let allUpdates = {};

  // Collect values from all fields in this section
  if (sectionSchema) {
    sectionSchema.fields.forEach(field => {
      const el = document.getElementById(`field-${page}-${sectionId}-${field.key}`);
      if (el) {
        const storeKey = `${page}:${sectionId}:${field.key}`;
        if (!allUpdates[storeKey]) allUpdates[storeKey] = { page, section: sectionId, key: field.key };
        allUpdates[storeKey].value = el.value;
        allUpdates[storeKey].type = field.type === 'image' ? 'image' : 'text';
      }
    });
  }

  // Merge pending changes over field values
  toSave.forEach(([k, changes]) => {
    if (!allUpdates[k]) allUpdates[k] = { page, section: sectionId, key: changes.key };
    Object.assign(allUpdates[k], changes);
  });

  // Merge any other pending changes for extra fields (align, fit, sizes)
  Object.entries(pendingChanges)
    .filter(([k]) => k.startsWith(`${page}:${sectionId}:`))
    .forEach(([k, changes]) => {
      if (!allUpdates[k]) allUpdates[k] = changes;
      else Object.assign(allUpdates[k], changes);
    });

  let errors = [];

  for (const [storeKey, update] of Object.entries(allUpdates)) {
    const { page: p, section: s, key: k, ...fields } = update;

    const { error } = await sb.from('site_content')
      .upsert({
        page: p,
        section: s,
        key: k,
        ...fields,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'page,section,key',
      });

    if (error) {
      errors.push(`${s}.${k}: ${error.message}`);
    } else {
      // Update local cache
      if (!allContent[storeKey]) allContent[storeKey] = { page: p, section: s, key: k };
      Object.assign(allContent[storeKey], fields);
      // Clear pending
      delete pendingChanges[storeKey];
    }
  }

  if (btn) {
    btn.classList.remove('saving');
    if (errors.length === 0) {
      btn.classList.add('saved');
      btn.textContent = '✅ Saved!';
      showToast(`"${sectionId}" section saved successfully!`, 'success');
      updateLastSave();
      setTimeout(() => {
        btn.classList.remove('saved');
        btn.textContent = '💾 Save Section';
      }, 3000);
    } else {
      btn.textContent = '❌ Error — Try Again';
      showToast('Some items failed to save: ' + errors.join(', '), 'error');
      setTimeout(() => { btn.textContent = '💾 Save Section'; }, 4000);
    }
  }
}

// ============================================================
// SAVE ALL VISIBLE SECTIONS
// ============================================================
async function saveAllVisible() {
  const activeTab = document.querySelector('.page-tab-content.active');
  if (!activeTab || activeTab.id === 'tab-dashboard') {
    showToast('Please select a page first, then click Save All.', 'info');
    return;
  }

  const page = activeTab.id.replace('tab-', '');
  const schema = PAGE_SCHEMAS[page];
  if (!schema) return;

  showToast('Saving all sections...', 'info');

  for (const section of schema) {
    await saveSection(page, section.id);
  }

  showToast('All sections saved! 🎉', 'success');
}

// ============================================================
// LAST SAVE TIMESTAMP
// ============================================================
function updateLastSave() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = document.getElementById('stat-last-save');
  if (el) el.textContent = timeStr;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================================
// UTILITY
// ============================================================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', init);
