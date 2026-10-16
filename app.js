/**
 * DompetKu — Application Core Logic (Updated with Login Validation & Account Recovery)
 */

let appData = {
    user: null, // { username, identifier, password }
    saldoAwal: 0,
    saldoAwalNote: '',
    budgetLimit: 0,
    transactions: [],
    theme: 'light'
};

let financeChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initAuthUI();
    initTheme();
    setupNavigation();
    setupEventListeners();
    setupAiChatbot();
    setDefaultDates();
});

// Load Data from LocalStorage
function loadData() {
    const saved = localStorage.getItem('dompetku_data');
    if (saved) {
        try {
            appData = JSON.parse(saved);
        } catch (e) {
            console.error('Gagal memparsing data LocalStorage', e);
        }
    }
}

// Save Data to LocalStorage
function saveData() {
    localStorage.setItem('dompetku_data', JSON.stringify(appData));
}

// Format Currency to Indonesian Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number).replace('IDR', 'Rp').trim();
}

// Set Default Date on Form Inputs to Today
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const pDate = document.getElementById('pemasukanTanggal');
    if (pDate) pDate.value = today;
    const expDate = document.getElementById('pengeluaranTanggal');
    if (expDate) expDate.value = today;
}

// Auth UI Initialization
function initAuthUI() {
    const authOverlay = document.getElementById('authOverlay');
    const appContainer = document.getElementById('appContainer');

    const registerContainer = document.getElementById('registerContainer');
    const loginContainer = document.getElementById('loginContainer');
    const forgotContainer = document.getElementById('forgotContainer');

    const loginErrorAlert = document.getElementById('loginErrorAlert');
    const loginErrorText = document.getElementById('loginErrorText');

    // Toggle views
    document.getElementById('showLoginBtn').addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        forgotContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginErrorAlert.classList.add('hidden');
    });

    document.getElementById('showRegisterBtn').addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        forgotContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    document.getElementById('showForgotBtn').addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.add('hidden');
        forgotContainer.classList.remove('hidden');
        document.getElementById('forgotResultBox').classList.add('hidden');
    });

    document.getElementById('backToLoginBtn').addEventListener('click', (e) => {
        e.preventDefault();
        forgotContainer.classList.add('hidden');
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginErrorAlert.classList.add('hidden');
    });

    const backAfterRec = document.getElementById('backToLoginAfterRecover');
    if (backAfterRec) {
        backAfterRec.addEventListener('click', () => {
            forgotContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            loginErrorAlert.classList.add('hidden');
        });
    }

    // Register Form Submit
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const identifier = document.getElementById('regIdentifier').value.trim();
        const password = document.getElementById('regPassword').value;

        if (password.length < 6) {
            showToast('Password minimal 6 karakter!', 'error');
            return;
        }

        appData.user = { username, identifier, password };
        saveData();
        showToast('Akun berhasil dibuat! Silakan masuk.');
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginErrorAlert.classList.add('hidden');
    });

    // Login Form Submit (Strict Validation: Block submit/access if wrong)
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputId = document.getElementById('loginIdentifier').value.trim();
        const inputPass = document.getElementById('loginPassword').value;

        if (!appData.user) {
            loginErrorText.textContent = 'Belum ada akun terdaftar! Silakan buat akun baru terlebih dahulu.';
            loginErrorAlert.classList.remove('hidden');
            showToast('Akun belum terdaftar!', 'error');
            return;
        }

        const isMatchUser = (appData.user.username === inputId) || (appData.user.identifier === inputId);
        const isMatchPass = (appData.user.password === inputPass);

        if (!isMatchUser && !isMatchPass) {
            loginErrorText.textContent = 'Username/Gmail/No. Telp DAN Password salah!';
            loginErrorAlert.classList.remove('hidden');
            showToast('Username & Password salah!', 'error');
        } else if (!isMatchUser) {
            loginErrorText.textContent = 'Username, Gmail, atau No. Telepon tidak ditemukan!';
            loginErrorAlert.classList.remove('hidden');
            showToast('Username / No. Telp / Gmail salah!', 'error');
        } else if (!isMatchPass) {
            loginErrorText.textContent = 'Password yang Anda masukkan salah!';
            loginErrorAlert.classList.remove('hidden');
            showToast('Password salah!', 'error');
        } else {
            // Login Successful
            loginErrorAlert.classList.add('hidden');
            showToast(`Selamat datang kembali, ${appData.user.username}!`);
            authOverlay.classList.add('hidden');
            appContainer.classList.remove('hidden');
            updateUI();
        }
    });

    // Forgot / Recovery Form Submit
    document.getElementById('forgotForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputIdent = document.getElementById('forgotIdentifier').value.trim();

        if (!appData.user) {
            showToast('Belum ada akun yang terdaftar di sistem!', 'error');
            return;
        }

        const match = (appData.user.identifier === inputIdent) || (appData.user.username === inputIdent);

        if (match) {
            document.getElementById('recUsernameText').textContent = appData.user.username;
            document.getElementById('recPasswordText').textContent = appData.user.password;
            document.getElementById('forgotResultBox').classList.remove('hidden');
            showToast('Akun Anda berhasil ditemukan!');
        } else {
            document.getElementById('forgotResultBox').classList.add('hidden');
            showToast('Gmail / No. Telp tidak cocok dengan akun terdaftar!', 'error');
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutSidebarBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda ingin keluar dari sesi ini?')) {
                authOverlay.classList.remove('hidden');
                appContainer.classList.add('hidden');
                document.getElementById('loginIdentifier').value = '';
                document.getElementById('loginPassword').value = '';
                loginErrorAlert.classList.add('hidden');
            }
        });
    }

    if (appData.user) {
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    }
}

// Navigation Logic
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav li');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            switchView(targetId);
            document.getElementById('sidebar').classList.remove('show');
        });
    });

    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });
    }
}

function switchView(viewId) {
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        if (li.getAttribute('data-target') === viewId) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });

    document.querySelectorAll('.view-section').forEach(sec => {
        if (sec.id === viewId) {
            sec.classList.add('active');
            const titleMap = {
                'dashboard-view': 'Dashboard',
                'saldo-awal-view': 'Pengaturan Saldo Awal',
                'pemasukan-view': 'Catat Pemasukan',
                'pengeluaran-view': 'Catat Pengeluaran',
                'riwayat-view': 'Riwayat Transaksi',
                'anggaran-view': 'Anggaran Bulanan',
                'saran-view': 'Saran & Target',
                'laporan-view': 'Laporan Keuangan',
                'profil-view': 'Profil & Pengaturan'
            };
            document.getElementById('pageTitle').textContent = titleMap[viewId] || 'DompetKu';
        } else {
            sec.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Theme Handling
function initTheme() {
    const savedTheme = appData.theme || 'light';
    setTheme(savedTheme);

    const sidebarToggle = document.getElementById('themeCheckbox');
    const settingsToggle = document.getElementById('settingsThemeCheckbox');

    if (sidebarToggle) sidebarToggle.checked = (savedTheme === 'dark');
    if (settingsToggle) settingsToggle.checked = (savedTheme === 'dark');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            setTheme(newTheme);
            if (settingsToggle) settingsToggle.checked = e.target.checked;
        });
    }

    if (settingsToggle) {
        settingsToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            setTheme(newTheme);
            if (sidebarToggle) sidebarToggle.checked = e.target.checked;
        });
    }
}

function setTheme(theme) {
    appData.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveData();
    updateChart();
}

// Event Listeners for Forms and Buttons
function setupEventListeners() {
    // Saldo Awal Form
    const saldoForm = document.getElementById('saldoAwalForm');
    if (saldoForm) {
        saldoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = parseFloat(document.getElementById('initialBalanceInput').value);
            const note = document.getElementById('initialBalanceNote').value;

            if (isNaN(val) || val < 0) {
                showToast('Jumlah saldo awal tidak valid!', 'error');
                return;
            }

            appData.saldoAwal = val;
            appData.saldoAwalNote = note;
            saveData();
            updateUI();
            showToast('Saldo awal berhasil disimpan!');
            switchView('dashboard-view');
        });
    }

    // Pemasukan Form
    const pemasukanForm = document.getElementById('pemasukanForm');
    if (pemasukanForm) {
        pemasukanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const jumlah = parseFloat(document.getElementById('pemasukanJumlah').value);
            const kategori = document.getElementById('pemasukanKategori').value;
            const tanggal = document.getElementById('pemasukanTanggal').value;
            const catatan = document.getElementById('pemasukanCatatan').value;

            if (isNaN(jumlah) || jumlah <= 0) {
                showToast('Jumlah pemasukan harus lebih besar dari 0!', 'error');
                return;
            }

            const newTx = {
                id: 'tx_' + Date.now(),
                jenis: 'pemasukan',
                jumlah,
                kategori,
                tanggal,
                catatan: catatan || '-'
            };

            appData.transactions.unshift(newTx);
            saveData();
            updateUI();
            pemasukanForm.reset();
            setDefaultDates();
            showToast('Pemasukan berhasil dicatat!');
            switchView('dashboard-view');
        });
    }

    // Pengeluaran Form
    const pengeluaranForm = document.getElementById('pengeluaranForm');
    if (pengeluaranForm) {
        pengeluaranForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const jumlah = parseFloat(document.getElementById('pengeluaranJumlah').value);
            const kategori = document.getElementById('pengeluaranKategori').value;
            const tanggal = document.getElementById('pengeluaranTanggal').value;
            const catatan = document.getElementById('pengeluaranCatatan').value;

            if (isNaN(jumlah) || jumlah <= 0) {
                showToast('Jumlah pengeluaran harus lebih besar dari 0!', 'error');
                return;
            }

            const newTx = {
                id: 'tx_' + Date.now(),
                jenis: 'pengeluaran',
                jumlah,
                kategori,
                tanggal,
                catatan: catatan || '-'
            };

            appData.transactions.unshift(newTx);
            saveData();
            updateUI();
            pengeluaranForm.reset();
            setDefaultDates();
            showToast('Pengeluaran berhasil dicatat!');
            switchView('dashboard-view');
        });
    }

    // Riwayat filters & search
    const searchTx = document.getElementById('searchTx');
    const filterType = document.getElementById('filterType');
    const sortTx = document.getElementById('sortTx');

    if (searchTx) searchTx.addEventListener('input', renderRiwayat);
    if (filterType) filterType.addEventListener('change', renderRiwayat);
    if (sortTx) sortTx.addEventListener('change', renderRiwayat);

    // Budget Button
    const saveBudgetBtn = document.getElementById('saveBudgetBtn');
    if (saveBudgetBtn) {
        saveBudgetBtn.addEventListener('click', () => {
            const limit = parseFloat(document.getElementById('budgetLimitInput').value);
            if (isNaN(limit) || limit < 0) {
                showToast('Batas anggaran tidak valid!', 'error');
                return;
            }
            appData.budgetLimit = limit;
            saveData();
            updateBudgetSection();
            showToast('Batas anggaran berhasil disimpan!');
        });
    }

    // Update Profile Form
    const updateProfileForm = document.getElementById('updateProfileForm');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newUsername = document.getElementById('updateUsername').value.trim();
            const newIdentifier = document.getElementById('updateIdentifier').value.trim();
            const newPass = document.getElementById('updatePassword').value;

            if (appData.user) {
                appData.user.username = newUsername;
                appData.user.identifier = newIdentifier;
                if (newPass.length >= 6) {
                    appData.user.password = newPass;
                }
                saveData();
                updateUI();
                showToast('Profil berhasil diperbarui!');
            }
        });
    }

    // Export CSV
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Reset Data
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus seluruh data transaksi DompetKu?')) {
                appData.transactions = [];
                appData.saldoAwal = 0;
                appData.budgetLimit = 0;
                saveData();
                updateUI();
                showToast('Seluruh data transaksi berhasil direset.');
            }
        });
    }

    // Modal Edit Close
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Edit Form Submit
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('editId').value;
            const jenis = document.getElementById('editJenis').value;
            const jumlah = parseFloat(document.getElementById('editJumlah').value);
            const kategori = document.getElementById('editKategori').value;
            const tanggal = document.getElementById('editTanggal').value;
            const catatan = document.getElementById('editCatatan').value;

            if (isNaN(jumlah) || jumlah <= 0) {
                showToast('Jumlah tidak valid!', 'error');
                return;
            }

            const index = appData.transactions.findIndex(t => t.id === id);
            if (index !== -1) {
                appData.transactions[index] = {
                    id,
                    jenis,
                    jumlah,
                    kategori,
                    tanggal,
                    catatan: catatan || '-'
                };
                saveData();
                updateUI();
                closeModal();
                showToast('Transaksi berhasil diperbarui!');
            }
        });
    }
}

// Master Update UI Function
let totalPemasukanGlobal = 0;
let totalPengeluaranGlobal = 0;
let totalSaldoGlobal = 0;

function updateUI() {
    calculateFinancials();
    renderDashboard();
    renderRiwayat();
    updateBudgetSection();
    renderSaranSection();
    renderLaporan();
    renderProfileSection();
}

function calculateFinancials() {
    totalPemasukanGlobal = appData.transactions
        .filter(t => t.jenis === 'pemasukan')
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    totalPengeluaranGlobal = appData.transactions
        .filter(t => t.jenis === 'pengeluaran')
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    totalSaldoGlobal = appData.saldoAwal + totalPemasukanGlobal - totalPengeluaranGlobal;
}

// Render Dashboard
function renderDashboard() {
    const uname = appData.user ? appData.user.username : 'Pengguna';
    document.getElementById('bannerUsername').textContent = uname;
    document.getElementById('greetingText').textContent = `Halo, ${uname}`;

    document.getElementById('dashTotalSaldo').textContent = formatRupiah(totalSaldoGlobal);
    document.getElementById('dashSaldoAwal').textContent = formatRupiah(appData.saldoAwal);
    document.getElementById('dashTotalPemasukan').textContent = formatRupiah(totalPemasukanGlobal);
    document.getElementById('dashTotalPengeluaran').textContent = formatRupiah(totalPengeluaranGlobal);

    const initInput = document.getElementById('initialBalanceInput');
    const initNote = document.getElementById('initialBalanceNote');
    if (initInput && appData.saldoAwal > 0) initInput.value = appData.saldoAwal;
    if (initNote && appData.saldoAwalNote) initNote.value = appData.saldoAwalNote;

    const recentBody = document.getElementById('dashRecentBody');
    const emptyState = document.getElementById('dashEmptyState');
    recentBody.innerHTML = '';

    const recentTx = appData.transactions.slice(0, 5);

    if (recentTx.length === 0) {
        emptyState.classList.remove('hidden');
        document.getElementById('dashRecentTable').classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        document.getElementById('dashRecentTable').classList.remove('hidden');

        recentTx.forEach(t => {
            const tr = document.createElement('tr');
            const isInc = t.jenis === 'pemasukan';
            tr.innerHTML = `
                <td>${t.tanggal}</td>
                <td>${t.kategori}</td>
                <td>${t.catatan}</td>
                <td class="${isInc ? 'text-success' : 'text-danger'} font-weight-bold">
                    ${isInc ? '+' : '-'} ${formatRupiah(t.jumlah)}
                </td>
            `;
            recentBody.appendChild(tr);
        });
    }

    updateChart();
}

// Render Chart with percentage breakdown
function updateChart() {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;

    const isDark = appData.theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const base = appData.saldoAwal + totalPemasukanGlobal;
    let expensePct = base > 0 ? Math.round((totalPengeluaranGlobal / base) * 100) : 0;
    document.getElementById('chartPercentageBadge').textContent = `${expensePct}% Pengeluaran dari Dana`;

    if (financeChartInstance) {
        financeChartInstance.destroy();
    }

    financeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Saldo Awal', 'Total Pemasukan', 'Total Pengeluaran'],
            datasets: [{
                data: [appData.saldoAwal, totalPemasukanGlobal, totalPengeluaranGlobal],
                backgroundColor: ['#2563eb', '#10b981', '#ef4444'],
                borderWidth: isDark ? 2 : 0,
                borderColor: isDark ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
                    }
                }
            }
        }
    });
}

// Render Saran & Target Section based on Initial Balance
function renderSaranSection() {
    const saldoAcuan = appData.saldoAwal;
    document.getElementById('saranTotalSaldo').textContent = formatRupiah(saldoAcuan);

    // 5 Hari
    const d5Total = saldoAcuan;
    const d5Harian = saldoAcuan > 0 ? Math.round(saldoAcuan / 5) : 0;
    document.getElementById('saran5HariTotal').textContent = formatRupiah(d5Total);
    document.getElementById('saran5HariHarian').textContent = `${formatRupiah(d5Harian)} / hari`;

    // 1 Minggu (7 Hari)
    const mingguTotal = saldoAcuan;
    const mingguHarian = saldoAcuan > 0 ? Math.round(saldoAcuan / 7) : 0;
    document.getElementById('saranMingguTotal').textContent = formatRupiah(mingguTotal);
    document.getElementById('saranMingguHarian').textContent = `${formatRupiah(mingguHarian)} / hari`;

    // 2 Minggu (14 Hari)
    const d14Total = saldoAcuan;
    const d14Harian = saldoAcuan > 0 ? Math.round(saldoAcuan / 14) : 0;
    document.getElementById('saran2MingguTotal').textContent = formatRupiah(d14Total);
    document.getElementById('saran2MingguHarian').textContent = `${formatRupiah(d14Harian)} / hari`;

    // 3 Minggu (21 Hari)
    const d21Total = saldoAcuan;
    const d21Harian = saldoAcuan > 0 ? Math.round(saldoAcuan / 21) : 0;
    document.getElementById('saran3MingguTotal').textContent = formatRupiah(d21Total);
    document.getElementById('saran3MingguHarian').textContent = `${formatRupiah(d21Harian)} / hari`;

    // 1 Bulan (30 Hari)
    const bulanTotal = saldoAcuan;
    const bulanHarian = saldoAcuan > 0 ? Math.round(saldoAcuan / 30) : 0;
    document.getElementById('saranBulanTotal').textContent = formatRupiah(bulanTotal);
    document.getElementById('saranBulanHarian').textContent = `${formatRupiah(bulanHarian)} / hari`;
}

// Render Profile Section
function renderProfileSection() {
    if (!appData.user) return;
    document.getElementById('profileUsernameDisplay').textContent = appData.user.username;
    document.getElementById('profileIdentifierDisplay').textContent = appData.user.identifier;

    const uInput = document.getElementById('updateUsername');
    const iInput = document.getElementById('updateIdentifier');
    if (uInput && !uInput.value) uInput.value = appData.user.username;
    if (iInput && !iInput.value) iInput.value = appData.user.identifier;
}

// Render Riwayat Transaksi
function renderRiwayat() {
    const tbody = document.getElementById('riwayatBody');
    const emptyState = document.getElementById('riwayatEmpty');
    const table = document.getElementById('riwayatTable');

    const searchKeyword = (document.getElementById('searchTx').value || '').toLowerCase();
    const filterTypeVal = document.getElementById('filterType').value;
    const sortVal = document.getElementById('sortTx').value;

    let filtered = appData.transactions.filter(t => {
        const matchSearch = t.kategori.toLowerCase().includes(searchKeyword) || t.catatan.toLowerCase().includes(searchKeyword);
        const matchType = filterTypeVal === 'all' || t.jenis === filterTypeVal;
        return matchSearch && matchType;
    });

    filtered.sort((a, b) => {
        if (sortVal === 'newest') return new Date(b.tanggal) - new Date(a.tanggal);
        if (sortVal === 'oldest') return new Date(a.tanggal) - new Date(b.tanggal);
        if (sortVal === 'highest') return b.jumlah - a.jumlah;
        if (sortVal === 'lowest') return a.jumlah - b.jumlah;
        return 0;
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        table.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        table.classList.remove('hidden');

        filtered.forEach(t => {
            const tr = document.createElement('tr');
            const isInc = t.jenis === 'pemasukan';
            tr.innerHTML = `
                <td>
                    <span class="badge-tx ${isInc ? 'badge-pemasukan' : 'badge-pengeluaran'}">
                        <i class="fa-solid ${isInc ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                        ${isInc ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                </td>
                <td>${t.tanggal}</td>
                <td>${t.kategori}</td>
                <td>${t.catatan}</td>
                <td class="${isInc ? 'text-success' : 'text-danger'} font-weight-bold">
                    ${isInc ? '+' : '-'} ${formatRupiah(t.jumlah)}
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" onclick="openEditModal('${t.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon btn-delete" onclick="deleteTransaction('${t.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function deleteTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        appData.transactions = appData.transactions.filter(t => t.id !== id);
        saveData();
        updateUI();
        showToast('Transaksi berhasil dihapus.');
    }
}

function openEditModal(id) {
    const tx = appData.transactions.find(t => t.id === id);
    if (!tx) return;

    document.getElementById('editId').value = tx.id;
    document.getElementById('editJenis').value = tx.jenis;
    document.getElementById('editJumlah').value = tx.jumlah;
    document.getElementById('editKategori').value = tx.kategori;
    document.getElementById('editTanggal').value = tx.tanggal;
    document.getElementById('editCatatan').value = tx.catatan === '-' ? '' : tx.catatan;

    document.getElementById('editModal').classList.add('show');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('show');
}

// Budget Section
function updateBudgetSection() {
    const limitInput = document.getElementById('budgetLimitInput');
    if (limitInput) limitInput.value = appData.budgetLimit || '';

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const now = new Date();
    document.getElementById('currentMonthName').textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const currentMonthExpenses = appData.transactions
        .filter(t => t.jenis === 'pengeluaran' && t.tanggal.startsWith(currentMonth))
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    const limit = appData.budgetLimit || 0;
    const remaining = limit - currentMonthExpenses;
    const percentage = limit > 0 ? Math.min(Math.round((currentMonthExpenses / limit) * 100), 100) : 0;

    document.getElementById('budgetSpent').textContent = formatRupiah(currentMonthExpenses);
    document.getElementById('budgetLimitDisplay').textContent = formatRupiah(limit);
    document.getElementById('budgetRemaining').textContent = formatRupiah(remaining);
    document.getElementById('budgetPercentage').textContent = `${percentage}% terpakai`;

    const progressBar = document.getElementById('budgetProgressBar');
    progressBar.style.width = `${percentage}%`;

    const alertBox = document.getElementById('budgetAlert');
    const alertText = document.getElementById('budgetAlertText');

    if (limit > 0) {
        if (currentMonthExpenses > limit) {
            progressBar.style.backgroundColor = 'var(--danger)';
            alertBox.classList.remove('hidden', 'alert-warning');
            alertBox.classList.add('alert-danger');
            alertText.textContent = `Peringatan! Pengeluaran bulan ini telah melebihi batas anggaran sebesar ${formatRupiah(currentMonthExpenses - limit)}.`;
        } else if (percentage >= 80) {
            progressBar.style.backgroundColor = 'var(--warning)';
            alertBox.classList.remove('hidden', 'alert-danger');
            alertBox.classList.add('alert-warning');
            alertText.textContent = `Perhatian! Pengeluaran bulan ini sudah mencapai ${percentage}% dari batas anggaran.`;
        } else {
            progressBar.style.backgroundColor = 'var(--primary)';
            alertBox.classList.add('hidden');
        }
    } else {
        progressBar.style.backgroundColor = 'var(--primary)';
        alertBox.classList.add('hidden');
    }
}

// Laporan View
function renderLaporan() {
    document.getElementById('repSaldoAwal').textContent = formatRupiah(appData.saldoAwal);
    document.getElementById('repPemasukan').textContent = formatRupiah(totalPemasukanGlobal);
    document.getElementById('repPengeluaran').textContent = formatRupiah(totalPengeluaranGlobal);
    document.getElementById('repSaldoAkhir').textContent = formatRupiah(totalSaldoGlobal);
}

// Export CSV
function exportToCSV() {
    if (appData.transactions.length === 0) {
        showToast('Tidak ada data transaksi untuk diekspor!', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,ID,Jenis,Tanggal,Kategori,Catatan,Nominal\n";

    appData.transactions.forEach(t => {
        const row = [t.id, t.jenis, t.tanggal, `"${t.kategori}"`, `"${t.catatan}"`, t.jumlah];
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_keuangan_dompetku_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Laporan berhasil diekspor ke CSV!');
}

// AI Assistant Chatbot Logic
function setupAiChatbot() {
    const fab = document.getElementById('aiFabBtn');
    const box = document.getElementById('aiChatBox');
    const closeBtn = document.getElementById('aiCloseBtn');
    const sendBtn = document.getElementById('aiSendBtn');
    const inputTxt = document.getElementById('aiInputText');

    fab.addEventListener('click', () => {
        box.classList.toggle('hidden');
    });

    closeBtn.addEventListener('click', () => {
        box.classList.add('hidden');
    });

    const handleSend = () => {
        const q = inputTxt.value.trim();
        if (!q) return;

        appendAiMessage(q, 'user');
        inputTxt.value = '';

        setTimeout(() => {
            const ans = getAiResponse(q);
            appendAiMessage(ans, 'bot');
        }, 500);
    };

    sendBtn.addEventListener('click', handleSend);
    inputTxt.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

function appendAiMessage(text, sender) {
    const chatBody = document.getElementById('aiChatBody');
    const div = document.createElement('div');
    div.className = `ai-message ${sender}`;
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function getAiResponse(question) {
    const q = question.toLowerCase();
    const uname = appData.user ? appData.user.username : 'pengguna';

    if (q.includes('halo') || q.includes('hai')) {
        return `Halo ${uname}! Ada yang bisa saya bantu terkait pencatatan keuangan atau fitur DompetKu?`;
    } else if (q.includes('saldo awal') || q.includes('modal')) {
        return `Saldo awal adalah modal awal Anda sebelum mencatat transaksi. Anda dapat mengaturnya di menu "Saldo Awal". Saldo Anda saat ini adalah ${formatRupiah(totalSaldoGlobal)}.`;
    } else if (q.includes('saran') || q.includes('target') || q.includes('harian')) {
        const harian = appData.saldoAwal > 0 ? formatRupiah(Math.round(appData.saldoAwal / 7)) : 'Rp0';
        return `Berdasarkan saldo acuan Anda, saran alokasi untuk 7 hari ke depan adalah sekitar ${harian} per hari. Cek menu "Saran & Tips" untuk detail lengkapnya!`;
    } else if (q.includes('lupa') || q.includes('password') || q.includes('akun')) {
        return `Jika Anda lupa password atau username, klik opsi "Lupa Password / Username?" pada halaman Login untuk memulihkan kredensial akun Anda.`;
    } else if (q.includes('ekspor') || q.includes('excel') || q.includes('csv')) {
        return `Anda dapat mengunduh laporan dalam format CSV yang kompatibel dengan Excel melalui menu "Laporan Keuangan" dengan menekan tombol "Ekspor ke CSV".`;
    } else if (q.includes('kegunaan') || q.includes('aplikasi ini') || q.includes('apa itu dompetku')) {
        return `DompetKu adalah aplikasi pencatatan keuangan pribadi modern untuk memantau pemasukan, pengeluaran, saldo, anggaran bulanan, serta memberikan saran keuangan cerdas secara offline di browser Anda.`;
    } else {
        return `Pertanyaan bagus! Untuk mengelola keuangan dengan baik di DompetKu, pastikan Anda rutin mencatat setiap pemasukan dan pengeluaran serta memantau grafik persentase di Dashboard. Ada hal lain yang ingin ditanyakan?`;
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMsg.textContent = message;
    if (type === 'error') {
        toastIcon.className = 'fa-solid fa-circle-exclamation';
        toastIcon.style.color = 'var(--danger)';
    } else {
        toastIcon.className = 'fa-solid fa-circle-check';
        toastIcon.style.color = 'var(--success)';
    }

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
