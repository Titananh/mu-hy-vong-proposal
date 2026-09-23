/**
 * HOPE MAKERS - PROPOSAL STUDIO ENGINE (app.js)
 * Manages theme switching, image uploading & base64 caching,
 * in-place rich text editing, auto-save to localStorage, and PDF/HTML export.
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeManager();
  initImageUploaders();
  initEditableManager();
  initStorageSync();
  initExportManager();
});

/* =========================================================
   1. THEME MANAGER
   ========================================================= */
function initThemeManager() {
  const chips = document.querySelectorAll('.theme-chip');
  const savedTheme = localStorage.getItem('hope_makers_theme') || 'theme-ocean';

  applyTheme(savedTheme);

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const theme = chip.getAttribute('data-theme');
      applyTheme(theme);
    });
  });
}

function applyTheme(themeName) {
  document.body.className = ''; // clear existing themes
  if (themeName && themeName !== 'theme-ocean') {
    document.body.classList.add(themeName);
  }
  localStorage.setItem('hope_makers_theme', themeName);

  document.querySelectorAll('.theme-chip').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-theme') === themeName);
  });
}

/* =========================================================
   2. IMAGE UPLOAD & LOCAL STORAGE PERSISTENCE
   ========================================================= */
function initImageUploaders() {
  const fileInput = document.getElementById('global-image-input');
  let currentTargetImgId = null;

  // Click on upload overlay or parent box
  document.querySelectorAll('[data-img-target]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      currentTargetImgId = trigger.getAttribute('data-img-target');
      fileInput.click();
    });
  });

  // Handle file selected
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !currentTargetImgId) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, SVG, WebP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      const targetImg = document.getElementById(currentTargetImgId);
      if (targetImg) {
        targetImg.src = base64Data;
        // Save to localStorage
        try {
          localStorage.setItem(`hope_img_${currentTargetImgId}`, base64Data);
        } catch (err) {
          console.warn('LocalStorage limit reached for image storage, displayed in DOM only.', err);
        }
      }
    };
    reader.readAsDataURL(file);
    fileInput.value = ''; // reset
  });

  // Restore saved images from localStorage
  document.querySelectorAll('img[id]').forEach(img => {
    const saved = localStorage.getItem(`hope_img_${img.id}`);
    if (saved) {
      img.src = saved;
    }
  });
}

/* =========================================================
   3. IN-PLACE TEXT EDITING & AUTO-SAVE
   ========================================================= */
function initEditableManager() {
  const toggleBtn = document.getElementById('btn-toggle-edit');
  let isEditing = true; // default true for convenience

  function updateEditableState(enabled) {
    document.querySelectorAll('.editable').forEach(el => {
      el.contentEditable = enabled ? 'true' : 'false';
    });
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', enabled);
      toggleBtn.innerHTML = enabled 
        ? '✏️ Đang Bật Sửa Chữ' 
        : '🔒 Bật Chế Độ Sửa Chữ';
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isEditing = !isEditing;
      updateEditableState(isEditing);
    });
  }

  updateEditableState(isEditing);

  // Auto-save on blur for elements with data-save-key
  document.querySelectorAll('[data-save-key]').forEach(el => {
    el.addEventListener('blur', () => {
      const key = el.getAttribute('data-save-key');
      localStorage.setItem(`hope_txt_${key}`, el.innerHTML);
    });
  });
}

function initStorageSync() {
  // Restore saved text
  document.querySelectorAll('[data-save-key]').forEach(el => {
    const key = el.getAttribute('data-save-key');
    const saved = localStorage.getItem(`hope_txt_${key}`);
    if (saved !== null) {
      el.innerHTML = saved;
    }
  });
}

/* =========================================================
   4. EXPORT & PRINT ACTIONS
   ========================================================= */
function initExportManager() {
  // Print / PDF
  const printBtn = document.getElementById('btn-print-pdf');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Standalone HTML Download
  const downloadHtmlBtn = document.getElementById('btn-download-html');
  if (downloadHtmlBtn) {
    downloadHtmlBtn.addEventListener('click', () => {
      exportStandaloneHtml();
    });
  }

  // Reset to default
  const resetBtn = document.getElementById('btn-reset-default');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn khôi phục thiết kế và nội dung về mặc định ban đầu không? Mọi ảnh và chữ bạn tự sửa sẽ bị xóa.')) {
        // Clear all hope_* keys
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('hope_')) {
            localStorage.removeItem(k);
          }
        });
        window.location.reload();
      }
    });
  }
}

function exportStandaloneHtml() {
  // Clone current document
  const clone = document.documentElement.cloneNode(true);

  // Remove floating studio toolbar from exported file
  const navbar = clone.querySelector('.studio-navbar');
  if (navbar) navbar.remove();

  // Remove overlay buttons
  clone.querySelectorAll('.upload-btn-overlay').forEach(el => el.remove());
  clone.querySelectorAll('.hidden-file-input').forEach(el => el.remove());

  // Disable contenteditable
  clone.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
  });

  const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'De_Xuat_Du_An_Mu_Hy_Vong_HopeMakers.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
