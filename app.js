/**
 * HOPE MAKERS - PROPOSAL STUDIO ENGINE (app.js)
 * Full-Document Universal Editing Engine:
 * - Allows in-place editing of ALL text elements across all 12 pages (titles, cards, tables, lists, footnotes).
 * - Allows replacing ANY image with auto-resizing via in-memory Canvas to keep localStorage light.
 * - Continuous debounced auto-save to localStorage with instant restore upon reload.
 * - Manual Save button with instant checkmark feedback.
 * - One-click export for pristine A4 PDF, customized A4 PDF, and standalone HTML.
 */

document.addEventListener('DOMContentLoaded', () => {
  initFullStudioEngine();
});

function initFullStudioEngine() {
  const STORAGE_KEY = 'hope_makers_full_document_v5';
  const docWrapper = document.querySelector('.document-wrapper');
  const toggleBtn = document.getElementById('btn-toggle-edit');
  const saveBtn = document.getElementById('btn-manual-save');
  const statusIndicator = document.getElementById('save-status-indicator');
  const fileInput = document.getElementById('global-image-input');

  let isEditing = true;
  let currentTargetImg = null;
  let saveTimeout = null;

  // 1. RESTORE PREVIOUSLY SAVED FULL DOCUMENT STATE (IF ANY)
  const savedDocument = localStorage.getItem(STORAGE_KEY);
  if (savedDocument && docWrapper) {
    try {
      docWrapper.innerHTML = savedDocument;
      console.log('Restored full custom document state from localStorage.');
    } catch (e) {
      console.warn('Could not restore saved document:', e);
    }
  }

  // 2. MAKE ALL TEXT ELEMENTS IN THE ENTIRE DOCUMENT EDITABLE
  function refreshEditableElements(enabled) {
    if (!docWrapper) return;

    // Selector covering every text-bearing container across all 12 pages
    const textSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'li', 'td', 'th', 'span',
      '.editable', '[data-save-key]',
      '.page-category-super', '.ribbon-banner',
      '.page-intro-desc', '.academic-section-subhead',
      '.academic-card-title', '.page-bottom-footnote',
      '.team-commitment-strip', '.team-commitment-label',
      '.academic-member-name', '.academic-member-role', '.academic-member-dept',
      '.leader-name', '.leader-role',
      '.hn-main-title', '.hn-project-title', '.hn-term-year',
      '.hn-cred-lbl', '.hn-toc-title', '.hn-toc-dots', '.hn-toc-page',
      'blockquote', 'cite', 'caption', 'strong', 'em', 'b', 'i'
    ].join(', ');

    docWrapper.querySelectorAll(textSelectors).forEach(el => {
      // Ensure we don't make big layout wrappers editable as a giant block
      if (el.children.length === 0 || el.classList.contains('editable') || el.tagName.match(/^H[1-6]$|^P$|^LI$|^TD$|^TH$/)) {
        el.contentEditable = enabled ? 'true' : 'false';
        el.spellcheck = false;
      }
    });

    document.body.classList.toggle('is-editing', enabled);

    if (toggleBtn) {
      toggleBtn.classList.toggle('active', enabled);
      toggleBtn.innerHTML = enabled 
        ? '✏️ Đang Bật Sửa Toàn Diện' 
        : '🔒 Bật Chế Độ Sửa Chữ';
    }

    if (statusIndicator) {
      statusIndicator.innerHTML = enabled
        ? '<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#16A34A;"></span> Đang bật sửa toàn diện (Bấm vào bất kỳ chữ hoặc ảnh để sửa)'
        : '<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#64748B;"></span> Đã khóa chế độ sửa (Chế độ đọc / trình chiếu)';
      statusIndicator.style.color = enabled ? '#16A34A' : '#64748B';
    }
  }

  // 3. AUTO-SAVE ENGINE (DEBOUNCED)
  function triggerAutoSave(immediate = false) {
    if (saveTimeout) clearTimeout(saveTimeout);

    const performSave = () => {
      if (!docWrapper) return;

      try {
        localStorage.setItem(STORAGE_KEY, docWrapper.innerHTML);
        if (statusIndicator && isEditing) {
          statusIndicator.innerHTML = '<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#2563EB;"></span> 💾 Đã tự động lưu thay đổi mới nhất!';
          statusIndicator.style.color = '#2563EB';
          setTimeout(() => {
            if (isEditing && statusIndicator) {
              statusIndicator.innerHTML = '<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#16A34A;"></span> Đang bật sửa toàn diện (Bấm vào bất kỳ chữ hoặc ảnh để sửa)';
              statusIndicator.style.color = '#16A34A';
            }
          }, 2000);
        }
      } catch (err) {
        console.warn('LocalStorage save error (likely quota exceeded):', err);
        if (statusIndicator) {
          statusIndicator.innerHTML = '⚠️ Bộ nhớ trình duyệt gần đầy, hãy tải file HTML để lưu vĩnh viễn!';
          statusIndicator.style.color = '#DC2626';
        }
      }
    };

    if (immediate) {
      performSave();
    } else {
      saveTimeout = setTimeout(performSave, 400);
    }
  }

  // Listen to input and blur across entire document wrapper
  if (docWrapper) {
    docWrapper.addEventListener('input', () => triggerAutoSave(false));
    docWrapper.addEventListener('blur', (e) => {
      if (e.target && e.target.isContentEditable) {
        triggerAutoSave(true);
      }
    }, true);
  }

  // Toggle edit button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isEditing = !isEditing;
      refreshEditableElements(isEditing);
    });
  }

  // Manual save button
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      triggerAutoSave(true);
      saveBtn.innerHTML = '✅ Đã Lưu!';
      setTimeout(() => {
        saveBtn.innerHTML = '💾 Lưu Ngay';
      }, 1500);
    });
  }

  // 4. CLICK ANY IMAGE TO REPLACE IT
  function attachImagePickers() {
    if (!docWrapper) return;

    docWrapper.querySelectorAll('img').forEach(img => {
      img.title = '📷 Bấm vào đây để tải ảnh từ máy tính lên thay thế!';
      img.style.cursor = 'pointer';

      img.addEventListener('click', (e) => {
        if (!isEditing) return;
        e.stopPropagation();
        currentTargetImg = img;
        if (fileInput) fileInput.click();
      });
    });
  }

  // Handle image file selection with in-memory Canvas resizing
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || !currentTargetImg) return;

      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn một tệp hình ảnh (PNG, JPG, WebP, SVG)!');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const rawBase64 = event.target.result;

        // Use canvas to compress / resize to avoid localStorage quota issues
        const tempImg = new Image();
        tempImg.onload = () => {
          const maxDim = 800; // max dimension for crystal-clear A4 display
          let width = tempImg.width;
          let height = tempImg.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(tempImg, 0, 0, width, height);

          // Get optimized base64
          const optimizedBase64 = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9);

          currentTargetImg.src = optimizedBase64;
          triggerAutoSave(true);
        };
        tempImg.src = rawBase64;
      };
      reader.readAsDataURL(file);
      fileInput.value = ''; // Reset input
    });
  }

  // 5. EXPORT & RESET HANDLERS
  const printBtn = document.getElementById('btn-print-pdf');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const downloadHtmlBtn = document.getElementById('btn-download-html');
  if (downloadHtmlBtn) {
    downloadHtmlBtn.addEventListener('click', () => {
      exportStandaloneHtml();
    });
  }

  const resetBtn = document.getElementById('btn-reset-default');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn khôi phục tài liệu về bản gốc ban đầu không? Mọi nội dung chữ và ảnh bạn tự sửa sẽ được đặt lại theo mẫu chuẩn của nhóm.')) {
        localStorage.removeItem(STORAGE_KEY);
        // Clear legacy keys too
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('hope_')) localStorage.removeItem(k);
        });
        window.location.reload();
      }
    });
  }

  // Initial activations
  refreshEditableElements(isEditing);
  attachImagePickers();
}

function exportStandaloneHtml() {
  const clone = document.documentElement.cloneNode(true);

  // Remove toolbar
  const navbar = clone.querySelector('.studio-navbar');
  if (navbar) navbar.remove();

  // Clean overlays & hidden inputs
  clone.querySelectorAll('.upload-btn-overlay').forEach(el => el.remove());
  clone.querySelectorAll('.hidden-file-input').forEach(el => el.remove());

  // Remove contenteditable attributes
  clone.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
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
