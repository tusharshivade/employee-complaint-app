// Real-time character counter
const descriptionInput = document.getElementById('description');
const charCounter = document.getElementById('char-counter');

if (descriptionInput && charCounter) {
    descriptionInput.addEventListener('input', () => {
        const len = descriptionInput.value.length;
        charCounter.textContent = len;
        if (len > 900) {
            charCounter.style.color = '#ef4444';
        } else {
            charCounter.style.color = 'inherit';
        }
    });
}

// Set max date for incident to today
const incidentDateInput = document.getElementById('incident_date');
if (incidentDateInput) {
    const today = new Date().toISOString().split('T')[0];
    incidentDateInput.setAttribute('max', today);
}

// Prevent accidental multiple submissions
const form = document.getElementById('complaintForm');
const submitBtn = document.getElementById('submitBtn');
if (form && submitBtn) {
    form.addEventListener('submit', () => {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.75';
        submitBtn.querySelector('span').textContent = 'Submitting...';
    });
}

// Clean up unparsed Jinja2 template tags when opened directly as a local file (file://)
if (window.location.protocol === 'file:') {
    var tagStart = '{' + '%';
    var exprStart = '{' + '{';

    // Hide raw unrendered alert cards
    document.querySelectorAll('.alert').forEach(function(el) {
        if (el.textContent.indexOf(exprStart) !== -1 || el.textContent.indexOf('message') !== -1) {
            el.style.display = 'none';
        }
    });

    // Erase unparsed Jinja text nodes
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var nodesToClear = [];
    while (walker.nextNode()) {
        if (walker.currentNode.nodeValue && walker.currentNode.nodeValue.indexOf(tagStart) !== -1) {
            nodesToClear.push(walker.currentNode);
        }
    }
    nodesToClear.forEach(function(n) {
        n.nodeValue = '';
    });

    // Display friendly local preview guidance banner
    var notice = document.createElement('div');
    notice.style.cssText = 'max-width: 760px; width: 100%; background: #fffbeb; color: #92400e; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.5; font-weight: 500; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);';
    notice.innerHTML = '<svg style="width: 22px; height: 22px; flex-shrink: 0; color: #d97706;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><div><strong>Local File Preview:</strong> You are viewing this HTML file directly from your disk (<code>file://</code>). To submit complaints to the database, please open <a href="http://localhost:5000" style="color: #4f46e5; font-weight: 700; text-decoration: underline;">http://localhost:5000</a> in your browser.</div>';
    var header = document.querySelector('.portal-header');
    if (header && header.parentNode) {
        header.parentNode.insertBefore(notice, header);
    }
}
