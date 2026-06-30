/* ==========================================================================
   SHOPEE AFFILIATE LINK REFINER - FRONTEND CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // DOM Elements Selection
  // ==========================================
  
  // Configuration
  const btnToggleConfig = document.getElementById('btnToggleConfig');
  const configDrawer = document.getElementById('configDrawer');
  const configToggleIcon = document.getElementById('configToggleIcon');
  const inputAffId = document.getElementById('inputAffId');
  const inputSubId1 = document.getElementById('inputSubId1');
  const btnSaveConfig = document.getElementById('btnSaveConfig');
  const saveStatusMsg = document.getElementById('saveStatusMsg');
  
  // Converter
  const textareaSourceUrl = document.getElementById('textareaSourceUrl');
  const btnClearInput = document.getElementById('btnClearInput');
  const btnConvert = document.getElementById('btnConvert');
  const signalPulse = document.querySelector('.signal-pulse');
  
  // Output Area
  const outputEmptyState = document.getElementById('outputEmptyState');
  const outputLoadingState = document.getElementById('outputLoadingState');
  const outputResultDetails = document.getElementById('outputResultDetails');
  const inputResultUrl = document.getElementById('inputResultUrl');
  const btnCopyResult = document.getElementById('btnCopyResult');
  const productPreviewCard = document.getElementById('productPreviewCard');
  const previewProductImg = document.getElementById('previewProductImg');
  const previewImgFallback = document.getElementById('previewImgFallback');
  const previewProductTitle = document.getElementById('previewProductTitle');
  const previewProductDesc = document.getElementById('previewProductDesc');
  const qrCodeBox = document.getElementById('qrCodeBox');
  const linkOpenDirect = document.getElementById('linkOpenDirect');
  const btnDownloadQR = document.getElementById('btnDownloadQR');
  
  // History Area
  const historyTableBody = document.getElementById('historyTableBody');
  const historyEmptyState = document.getElementById('historyEmptyState');
  const btnClearHistory = document.getElementById('btnClearHistory');
  const inputSearchHistory = document.getElementById('inputSearchHistory');
  const historyTable = document.getElementById('historyTable');
  
  // Help Modal
  const btnShowHelp = document.getElementById('btnShowHelp');
  const helpModal = document.getElementById('helpModal');
  const btnCloseHelpModal = document.getElementById('btnCloseHelpModal');
  const toastContainer = document.getElementById('toastContainer');

  // ==========================================
  // Application State
  // ==========================================
  let appConfig = {
    affiliateId: '17342170319',
    subId1: ''
  };
  let conversionHistory = [];

  // ==========================================
  // Toast System
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    
    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate out and remove
    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.25s reverse ease-out forwards';
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, 3000);
  }

  // ==========================================
  // URL Utility Functions
  // ==========================================
  
  /**
   * Validate if the given URL belongs to Shopee domains
   */
  function validateShopeeUrl(urlStr) {
    try {
      const trimmed = urlStr.trim();
      if (!trimmed) return false;
      
      // If it doesn't start with a protocol, prepended it for proper URL parsing
      let urlWithProtocol = trimmed;
      if (!/^https?:\/\//i.test(trimmed)) {
        urlWithProtocol = 'https://' + trimmed;
      }
      
      const parsedUrl = new URL(urlWithProtocol);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      return (
        hostname.includes('shopee.vn') ||
        hostname.includes('shope.ee') ||
        hostname.includes('shopee.co.id') ||
        hostname.includes('shopee.com.my') ||
        hostname.includes('shopee.co.th') ||
        hostname.includes('shopee.sg') ||
        hostname.includes('shopee.ph') ||
        hostname.includes('shopee.tw')
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Clean tracking variables from typical Shopee URLs.
   * Keeps the root product/shop coordinates intact.
   */
  function cleanShopeeUrl(urlStr) {
    try {
      let trimmed = urlStr.trim();
      if (!/^https?:\/\//i.test(trimmed)) {
        trimmed = 'https://' + trimmed;
      }
      
      const parsedUrl = new URL(trimmed);
      
      // If it's a short link, keep it exactly as it is to avoid losing parameters
      if (parsedUrl.hostname.includes('shope.ee') || parsedUrl.hostname.includes('s.shopee.vn')) {
        return trimmed;
      }
      
      // Standard Shopee URLs: clean up tracking parameters to keep link light
      const searchParams = parsedUrl.searchParams;
      const cleanParams = new URLSearchParams();
      
      // Shopee sometimes requires sp_atk or similar, but for redirect links, the raw canonical URL is best.
      // We will keep only crucial path parameters if any, or discard query parameters entirely for canonical paths.
      parsedUrl.search = '';
      
      return parsedUrl.toString();
    } catch (e) {
      return urlStr.trim();
    }
  }

  // ==========================================
  // Configuration Storage
  // ==========================================
  function loadConfig() {
    // Affiliate ID is locked to the default value
    inputAffId.value = '17342170319';
    appConfig.affiliateId = '17342170319';

    const saved = localStorage.getItem('shopee_aff_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        appConfig.subId1 = parsed.subId1 || '';
        inputSubId1.value = appConfig.subId1 || '';
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
  }

  function saveConfig() {
    const subId = inputSubId1.value.trim();

    appConfig = {
      affiliateId: '17342170319',
      subId1: subId
    };

    localStorage.setItem('shopee_aff_config', JSON.stringify(appConfig));
    
    saveStatusMsg.textContent = 'Đã lưu cấu hình!';
    saveStatusMsg.className = 'save-status-msg success';
    showToast('Cấu hình Sub ID đã được cập nhật.', 'success');

    // Automatically collapse drawer after saving
    setTimeout(() => {
      saveStatusMsg.textContent = '';
      toggleDrawer(false);
    }, 1200);
  }

  function toggleDrawer(open) {
    if (open === undefined) {
      open = !configDrawer.classList.contains('active');
    }
    
    if (open) {
      configDrawer.classList.add('active');
      configToggleIcon.style.transform = 'rotate(0deg)';
    } else {
      configDrawer.classList.remove('active');
      configToggleIcon.style.transform = 'rotate(-180deg)';
    }
  }

  // ==========================================
  // Conversion Logic
  // ==========================================
  async function performConversion() {
    const sourceUrl = textareaSourceUrl.value.trim();
    
    // Check Config
    if (!appConfig.affiliateId) {
      showToast('Vui lòng điền và lưu Affiliate ID trước!', 'error');
      toggleDrawer(true);
      inputAffId.focus();
      return;
    }

    // Validate Input
    if (!sourceUrl) {
      showToast('Vui lòng dán link sản phẩm Shopee!', 'error');
      textareaSourceUrl.focus();
      return;
    }

    if (!validateShopeeUrl(sourceUrl)) {
      showToast('Link sản phẩm không đúng định dạng Shopee!', 'error');
      return;
    }

    const cleanUrl = cleanShopeeUrl(sourceUrl);
    
    // Display signature animation
    signalPulse.classList.add('active', 'animating');
    
    // Show Loading Output State
    outputEmptyState.classList.add('hidden');
    outputResultDetails.classList.add('hidden');
    outputLoadingState.classList.remove('hidden');

    // Generate Affiliate redirection link
    // https://s.shopee.vn/an_redir?origin_link=...&affiliate_id=...&sub_id=...
    let affUrl = `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent(cleanUrl)}&affiliate_id=${appConfig.affiliateId}`;
    if (appConfig.subId1) {
      affUrl += `&sub_id=${encodeURIComponent(appConfig.subId1)}`;
    }

    // Attempt to scrape product metadata via backend proxy
    let metadata = { success: false, title: 'Sản phẩm Shopee', image: '' };
    try {
      const response = await fetch('/api/scrape-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: cleanUrl })
      });
      if (response.ok) {
        metadata = await response.json();
      }
    } catch (err) {
      console.warn('Could not scrape product metadata:', err);
    }

    // Render converted results
    inputResultUrl.value = affUrl;
    linkOpenDirect.href = affUrl;
    
    // Render QR Code (Using free public API: api.qrserver.com)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(affUrl)}`;
    qrCodeBox.innerHTML = `<img src="${qrUrl}" alt="QR code mua hàng">`;
    
    // Render Product Preview card
    if (metadata.success && metadata.image) {
      previewProductImg.src = metadata.image;
      previewProductImg.classList.remove('hidden');
      previewImgFallback.classList.add('hidden');
    } else {
      previewProductImg.classList.add('hidden');
      previewImgFallback.classList.remove('hidden');
    }
    
    // Set titles
    const parsedTitle = metadata.title || 'Sản phẩm Shopee';
    previewProductTitle.textContent = parsedTitle;
    previewProductDesc.textContent = cleanUrl;

    // Save metadata response to local history
    saveToHistory(parsedTitle, cleanUrl, affUrl, metadata.image || '');

    // Stop signature animation cleanly
    setTimeout(() => {
      signalPulse.classList.remove('active', 'animating');
      outputLoadingState.classList.add('hidden');
      outputResultDetails.classList.remove('hidden');
      showToast('Quy đổi link thành công!', 'success');
      
      // Auto-scroll output section on mobile
      if (window.innerWidth < 900) {
        outputResultDetails.scrollIntoView({ behavior: 'smooth' });
      }
    }, 600);
  }

  // ==========================================
  // History Management
  // ==========================================
  function loadHistory() {
    const saved = localStorage.getItem('shopee_aff_history');
    if (saved) {
      try {
        conversionHistory = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
    renderHistoryTable();
  }

  function saveToHistory(title, originalUrl, affiliateUrl, image) {
    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
      title: title,
      originalUrl: originalUrl,
      affiliateUrl: affiliateUrl,
      image: image
    };

    // Keep unique list - filter out same original URLs if they already exist to avoid clutter
    conversionHistory = conversionHistory.filter(item => item.originalUrl !== originalUrl);
    
    // Add to top of array
    conversionHistory.unshift(historyItem);
    
    // Cap history at 50 entries
    if (conversionHistory.length > 50) {
      conversionHistory.pop();
    }

    localStorage.setItem('shopee_aff_history', JSON.stringify(conversionHistory));
    renderHistoryTable();
  }

  function renderHistoryTable() {
    const searchVal = inputSearchHistory.value.toLowerCase().trim();
    
    // Filter history based on search
    const filteredHistory = conversionHistory.filter(item => {
      return (
        item.title.toLowerCase().includes(searchVal) ||
        item.originalUrl.toLowerCase().includes(searchVal) ||
        item.affiliateUrl.toLowerCase().includes(searchVal)
      );
    });

    if (filteredHistory.length === 0) {
      historyTable.classList.add('hidden');
      historyEmptyState.classList.remove('hidden');
      return;
    }

    historyTable.classList.remove('hidden');
    historyEmptyState.classList.add('hidden');

    historyTableBody.innerHTML = '';
    
    filteredHistory.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="history-time">${item.timestamp}</span></td>
        <td>
          <div class="history-item-title" title="${item.title}">${item.title}</div>
          <div class="history-item-link" title="${item.originalUrl}">${item.originalUrl}</div>
        </td>
        <td>
          <div class="history-aff-link" title="${item.affiliateUrl}">${item.affiliateUrl}</div>
        </td>
        <td class="actions-col">
          <div class="history-actions">
            <button class="btn-action-icon btn-copy-history" data-url="${item.affiliateUrl}" title="Sao chép link">
              <i class="fa-regular fa-copy"></i>
            </button>
            <a href="${item.affiliateUrl}" target="_blank" class="btn-action-icon" title="Test link">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button class="btn-action-icon btn-delete btn-delete-history" data-id="${item.id}" title="Xóa lịch sử">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      historyTableBody.appendChild(tr);
    });

    // Add copy listener
    document.querySelectorAll('.btn-copy-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = btn.getAttribute('data-url');
        copyToClipboard(url, btn);
      });
    });

    // Add delete listener
    document.querySelectorAll('.btn-delete-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        deleteHistoryItem(id);
      });
    });
  }

  function deleteHistoryItem(id) {
    conversionHistory = conversionHistory.filter(item => item.id !== id);
    localStorage.setItem('shopee_aff_history', JSON.stringify(conversionHistory));
    renderHistoryTable();
    showToast('Đã xóa dòng lịch sử này.', 'info');
  }

  function clearAllHistory() {
    if (conversionHistory.length === 0) return;
    
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử quy đổi?')) {
      conversionHistory = [];
      localStorage.setItem('shopee_aff_history', JSON.stringify(conversionHistory));
      renderHistoryTable();
      showToast('Đã xóa toàn bộ lịch sử quy đổi.', 'success');
    }
  }

  // ==========================================
  // Auxiliary Handlers
  // ==========================================
  
  /**
   * Helper function to copy link to clipboard and trigger animation feedback
   */
  function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Đã sao chép vào bộ nhớ tạm!', 'success');
      
      if (buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.classList.add('copied');
        
        if (buttonElement.querySelector('span')) {
          buttonElement.querySelector('span').textContent = 'ĐÃ SAO CHÉP';
        }
        
        setTimeout(() => {
          buttonElement.classList.remove('copied');
          buttonElement.innerHTML = originalText;
        }, 1500);
      }
    }).catch(err => {
      showToast('Lỗi khi sao chép link.', 'error');
    });
  }

  /**
   * Safe fetch for QR Code image stream to trigger direct download
   */
  async function downloadQR() {
    const qrImg = qrCodeBox.querySelector('img');
    if (!qrImg) return;
    
    const qrUrl = qrImg.src;
    try {
      showToast('Đang tải hình ảnh mã QR...', 'info');
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `shopee-affiliate-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (e) {
      // Fallback
      window.open(qrUrl, '_blank');
    }
  }

  // ==========================================
  // Event Bindings
  // ==========================================
  
  // Drawer Toggle
  document.getElementById('configToggle').addEventListener('click', () => toggleDrawer());
  
  // Save Configuration
  btnSaveConfig.addEventListener('click', saveConfig);
  
  // Clear input textarea
  btnClearInput.addEventListener('click', () => {
    textareaSourceUrl.value = '';
    textareaSourceUrl.focus();
  });
  
  // Perform Conversion
  btnConvert.addEventListener('click', performConversion);
  
  // Result Clipboard Copy
  btnCopyResult.addEventListener('click', () => {
    copyToClipboard(inputResultUrl.value, btnCopyResult);
  });

  // QR Download
  btnDownloadQR.addEventListener('click', downloadQR);

  // Search History Event
  inputSearchHistory.addEventListener('input', renderHistoryTable);

  // Clear History Event
  btnClearHistory.addEventListener('click', clearAllHistory);

  // Help Modal Toggle
  btnShowHelp.addEventListener('click', (e) => {
    e.preventDefault();
    helpModal.classList.remove('hidden');
  });

  btnCloseHelpModal.addEventListener('click', () => {
    helpModal.classList.add('hidden');
  });

  // Close modal when clicking outside modal-card
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.classList.add('hidden');
    }
  });

  // ==========================================
  // App Initializer
  // ==========================================
  loadConfig();
  loadHistory();
  
  // If Affiliate ID is missing, open configuration drawer on load
  if (!appConfig.affiliateId) {
    toggleDrawer(true);
  } else {
    toggleDrawer(false);
  }
});
