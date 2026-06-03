// ============================================================
// cms.js — KR New Vision Enterprise CMS Content Loader
// Runs on every public page. Loads content from Supabase.
// Falls back to existing HTML if no CMS data found.
// ============================================================

(async function () {
  // Wait for Supabase CDN to be available
  if (typeof supabase === 'undefined') return;

  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Detect current page name from filename
  const pageName = (() => {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html', '') || 'index';
    return file === '' ? 'index' : file;
  })();

  // Fetch all content for this page
  const { data, error } = await client
    .from('site_content')
    .select('*')
    .eq('page', pageName);

  if (error || !data || data.length === 0) return;

  // Build a lookup map: "section.key" => row
  const contentMap = {};
  data.forEach(row => {
    contentMap[`${row.section}.${row.key}`] = row;
  });

  // Apply content to elements with data-cms-key attributes
  document.querySelectorAll('[data-cms-key]').forEach(el => {
    const key = el.getAttribute('data-cms-key'); // e.g. "hero.title"
    const row = contentMap[key];
    if (!row || row.value === null || row.value === undefined) return;

    const type = row.type || 'text';

    if (type === 'image') {
      // For img elements
      if (el.tagName === 'IMG') {
        // If value looks like a full URL, use it directly
        if (row.value.startsWith('http') || row.value.startsWith('//')) {
          el.src = row.value;
        } else {
          // Keep local path as-is (fallback)
          el.src = row.value;
        }
        // Apply image sizing
        if (row.image_width)  el.style.width      = row.image_width;
        if (row.image_height) el.style.height     = row.image_height;
        if (row.object_fit)   el.style.objectFit  = row.object_fit;
        if (row.max_width)    el.style.maxWidth    = row.max_width;
        if (row.max_height)   el.style.maxHeight   = row.max_height;
      }
    } else if (type === 'html') {
      el.innerHTML = row.value;
    } else {
      // text, button_text, etc.
      el.textContent = row.value;
    }

    // Apply alignment
    if (row.align && row.align !== 'left') {
      el.style.textAlign = row.align;
    }

    // Apply alignment to parent container if specified
    const alignAttr = el.getAttribute('data-cms-align-parent');
    if (alignAttr && row.align) {
      const parent = el.closest(alignAttr);
      if (parent) parent.style.textAlign = row.align;
    }
  });

  // Special: apply image-container alignment (for image-stack divs)
  document.querySelectorAll('[data-cms-image-key]').forEach(el => {
    const key = el.getAttribute('data-cms-image-key');
    const row = contentMap[key];
    if (!row) return;
    if (row.align) el.style.justifySelf = row.align === 'center' ? 'center' : row.align === 'right' ? 'end' : 'start';
  });

})();
