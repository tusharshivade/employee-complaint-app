// ========================================================
// Employee Session Management (Works on file:// and Server)
// ========================================================
function initEmployeeSession() {
    let employee = null;

    // 1. Check if server injected user via body attributes
    const body = document.body;
    if (window.location.protocol !== 'file:' && body) {
        const fn = body.getAttribute('data-user-firstname');
        if (fn && !fn.includes('{')) {
            employee = {
                first_name: fn,
                last_name: body.getAttribute('data-user-lastname') || '',
                employee_id: body.getAttribute('data-user-empid') || '',
                department: body.getAttribute('data-user-dept') || '',
                position: body.getAttribute('data-user-position') || ''
            };
            try {
                localStorage.setItem('employee_session', JSON.stringify(employee));
            } catch (e) {}
        }
    }

    // 2. Fallback to localStorage (vital for file:// preview or client sessions)
    if (!employee) {
        try {
            const saved = localStorage.getItem('employee_session');
            if (saved) {
                employee = JSON.parse(saved);
            }
        } catch (e) {}
    }

    const guestActions = document.getElementById('nav-guest-actions');
    const userActions = document.getElementById('nav-user-actions');
    const verifiedBanner = document.getElementById('verified-banner');

    if (employee && employee.first_name) {
        if (guestActions) guestActions.style.display = 'none';
        if (userActions) userActions.style.display = 'flex';
        if (verifiedBanner) verifiedBanner.style.display = 'flex';

        const nameEl = document.getElementById('nav-user-name');
        const idEl = document.getElementById('nav-user-id');
        const bNameEl = document.getElementById('banner-employee-name');
        const bIdEl = document.getElementById('banner-employee-id');
        const bDeptEl = document.getElementById('banner-employee-dept');

        const fullName = `${employee.first_name} ${employee.last_name}`;
        if (nameEl) nameEl.textContent = fullName;
        if (idEl) idEl.textContent = employee.employee_id;
        if (bNameEl) bNameEl.textContent = fullName;
        if (bIdEl) bIdEl.textContent = employee.employee_id;
        if (bDeptEl) bDeptEl.textContent = employee.department || '';

        // Pre-fill incident form inputs if present and currently empty
        const fn = document.getElementById('first_name');
        const ln = document.getElementById('last_name');
        const eid = document.getElementById('employee_id');
        const dept = document.getElementById('department');
        const pos = document.getElementById('position');

        if (fn && !fn.value) fn.value = employee.first_name;
        if (ln && !ln.value) ln.value = employee.last_name;
        if (eid && !eid.value) eid.value = employee.employee_id;
        if (dept && !dept.value) dept.value = employee.department;
        if (pos && !pos.value) pos.value = employee.position || '';
    } else {
        if (guestActions) guestActions.style.display = 'flex';
        if (userActions) userActions.style.display = 'none';
        if (verifiedBanner) verifiedBanner.style.display = 'none';
    }
}

function handleLogout() {
    try {
        localStorage.removeItem('employee_session');
    } catch (e) {}

    if (window.location.protocol === 'file:') {
        window.location.href = 'index.html';
    } else {
        window.location.href = '/logout';
    }
}

// Client-side Sign In Handler (Enables full interactive preview on file://)
function handleLocalSignIn(e) {
    if (window.location.protocol === 'file:') {
        e.preventDefault();
        const idInput = document.getElementById('login_identifier');
        const pwdInput = document.getElementById('login_password');

        const identifier = idInput ? idInput.value.trim() : '';
        const password = pwdInput ? pwdInput.value : '';

        if (!identifier || !password) {
            alert('Please enter your Employee ID and password.');
            return false;
        }

        // Demo account or mock employee session
        let empSession = {
            first_name: 'Sarah',
            last_name: 'Jenkins',
            employee_id: identifier.toUpperCase().startsWith('EMP-') ? identifier.toUpperCase() : 'EMP-2048',
            email: identifier.includes('@') ? identifier : 'sarah.jenkins@novaplus.com',
            department: 'Operations & Tech',
            position: 'Software Engineer'
        };

        // If local custom registered user matches
        try {
            const regUser = localStorage.getItem('registered_user_' + identifier.toUpperCase());
            if (regUser) {
                empSession = JSON.parse(regUser);
            }
        } catch (err) {}

        localStorage.setItem('employee_session', JSON.stringify(empSession));
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Client-side Sign Up Handler (Enables full interactive preview on file://)
function handleLocalSignUp(e) {
    if (window.location.protocol === 'file:') {
        e.preventDefault();
        const fn = document.getElementById('signup_first_name').value.trim();
        const ln = document.getElementById('signup_last_name').value.trim();
        const eid = document.getElementById('signup_employee_id').value.trim().toUpperCase();
        const email = document.getElementById('signup_email').value.trim().toLowerCase();
        const dept = document.getElementById('signup_department').value;
        const pos = document.getElementById('signup_position').value.trim();
        const pwd = document.getElementById('signup_password').value;
        const cpwd = document.getElementById('signup_confirm_password').value;

        if (pwd.length < 6) {
            alert('Password must be at least 6 characters.');
            return false;
        }

        if (pwd !== cpwd) {
            alert('Passwords do not match.');
            return false;
        }

        const newEmp = {
            first_name: fn,
            last_name: ln,
            employee_id: eid,
            email: email,
            department: dept,
            position: pos
        };

        try {
            localStorage.setItem('registered_user_' + eid, JSON.stringify(newEmp));
            localStorage.setItem('employee_session', JSON.stringify(newEmp));
        } catch (err) {}

        alert(`Welcome, ${fn}! Your employee account has been created.`);
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ========================================================
// Password Show / Hide Toggle
// ========================================================
function togglePasswordVisibility(targetInputId, btnElement) {
    const input = document.getElementById(targetInputId);
    if (!input || !btnElement) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    btnElement.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    btnElement.setAttribute('title', isPassword ? 'Hide password' : 'Show password');

    if (isPassword) {
        // Eye-slash icon (hide)
        btnElement.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    } else {
        // Normal eye icon (show)
        btnElement.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="7" r="3"></circle>
            </svg>
        `;
    }
}

// ========================================================
// Password Strength Meter & Real-Time Confirmation
// ========================================================
const signupPassword = document.getElementById('signup_password');
const signupConfirmPassword = document.getElementById('signup_confirm_password');
const pwMatchText = document.getElementById('pw-match-text');

if (signupPassword) {
    signupPassword.addEventListener('input', () => {
        const val = signupPassword.value;
        const segs = [
            document.getElementById('pw-seg-1'),
            document.getElementById('pw-seg-2'),
            document.getElementById('pw-seg-3'),
            document.getElementById('pw-seg-4')
        ];
        const label = document.getElementById('pw-strength-label');

        let score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 8 && /[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val) || val.length >= 12) score++;

        const colors = ['#e2e8f0', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
        const textLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

        segs.forEach((seg, idx) => {
            if (!seg) return;
            if (val.length === 0) {
                seg.style.backgroundColor = '#e2e8f0';
            } else if (idx < score) {
                seg.style.backgroundColor = colors[score];
            } else {
                seg.style.backgroundColor = '#e2e8f0';
            }
        });

        if (label) {
            label.textContent = val.length === 0 ? 'Minimum 6 characters' : textLabels[score];
            label.style.color = val.length === 0 ? 'inherit' : colors[score];
        }

        checkPasswordMatch();
    });
}

function checkPasswordMatch() {
    if (!signupPassword || !signupConfirmPassword || !pwMatchText) return;
    const p1 = signupPassword.value;
    const p2 = signupConfirmPassword.value;

    if (!p2) {
        pwMatchText.textContent = '';
        pwMatchText.className = 'pw-match-text';
        return;
    }

    if (p1 === p2) {
        pwMatchText.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg> Passwords match
        `;
        pwMatchText.className = 'pw-match-text match';
    } else {
        pwMatchText.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg> Passwords do not match
        `;
        pwMatchText.className = 'pw-match-text no-match';
    }
}

if (signupConfirmPassword) {
    signupConfirmPassword.addEventListener('input', checkPasswordMatch);
}

// ========================================================
// One-Click Demo Employee Filler
// ========================================================
function fillDemoEmployee() {
    const idInput = document.getElementById('login_identifier');
    const pwdInput = document.getElementById('login_password');

    if (idInput && pwdInput) {
        idInput.value = 'EMP-2048';
        pwdInput.value = 'password123';

        // Visual flash feedback
        [idInput, pwdInput].forEach(el => {
            el.style.borderColor = '#10b981';
            el.style.backgroundColor = '#f0fdf4';
            setTimeout(() => {
                el.style.borderColor = '';
                el.style.backgroundColor = '';
            }, 1200);
        });
    }
}

// ========================================================
// Modal Dialog for Help / Forgot Password
// ========================================================
function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.classList.add('open');
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.classList.remove('open');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeHelpModal();
});

// Mock SSO Handler
function handleMockSSO(provider) {
    alert(`${provider} Single Sign-On:\nIn enterprise production, Novaplus corporate Identity Provider (Azure AD / Google Workspace) will authenticate your session. For local testing, please use Employee ID EMP-2048 or create a test employee account.`);
}

// ========================================================
// Existing Incident Form Handlers
// ========================================================
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

const incidentDateInput = document.getElementById('incident_date');
if (incidentDateInput) {
    const today = new Date().toISOString().split('T')[0];
    incidentDateInput.setAttribute('max', today);
}

const complaintForm = document.getElementById('complaintForm');
const submitBtn = document.getElementById('submitBtn');
if (complaintForm && submitBtn) {
    complaintForm.addEventListener('submit', () => {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.75';
        submitBtn.querySelector('span').textContent = 'Submitting...';
    });
}

// ========================================================
// DOM Ready Initialization & file:// cleanup
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Clean up unparsed Jinja2 template tags when opened directly as a local file (file://)
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
    }

    // 2. Initialize employee session display
    initEmployeeSession();
});
