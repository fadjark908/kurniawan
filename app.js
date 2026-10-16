/**
 * DompetKu — Application Core Logic
 * Handles State, LocalStorage, UI Rendering, Charts, and Validation.
 */

// Application State
let appData = {
    saldoAwal: 0,
    saldoAwalNote: '',
    budgetLimit: 0,
    transactions: [],
    theme: 'light'
};

let financeChartInstance = null;

// DOMContentLoaded Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initTheme();
    setupNavigation();
    setupEventListeners();
    updateUI();
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
    const eDate = document.getElementById('pengeluaranForm');
    if (pDate) pDate.value = today;
    const expDate = document.getElementById('pengeluaranTanggal');
    if (expDate) expDate.value = today;
}

// Navigation Logic
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav li');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            switchView(targetId);

            // Close mobile sidebar if open
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
    // Nav active state
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        if (li.getAttribute('data-target') === viewId) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });

    // View sections
    document.querySelectorAll('.view-section').forEach(sec => {
        if (sec.id === viewId) {
            sec.classList.add('active');
            // Update page header title
            const titleMap = {
                'dashboard-view': 'Dashboard',
                'saldo-awal-view': 'Pengaturan Saldo Awal',
                'pemasukan-view': 'Catat Pemasukan',
                'pengeluaran-view': 'Catat Pengeluaran',
                'riwayat-view': 'Riwayat Transaksi',
                'anggaran-view': 'Anggaran Bulanan',
                'laporan-view': 'Laporan Keuangan',
                'pengaturan-view': 'Pengaturan Aplikasi'
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
    // Re-render chart with proper colors if needed
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

    // Export CSV
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Reset Data
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus seluruh data DompetKu? Tindakan ini tidak dapat dibatalkan.')) {
                localStorage.removeItem('dompetku_data');
                appData = {
                    saldoAwal: 0,
                    saldoAwalNote: '',
                    budgetLimit: 0,
                    transactions: [],
                    theme: appData.theme
                };
                updateUI();
                showToast('Seluruh data berhasil dihapus.');
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
function updateUI() {
    calculateFinancials();
    renderDashboard();
    renderRiwayat();
    updateBudgetSection();
    renderLaporan();
}

// Financial Calculations
let totalPemasukanGlobal = 0;
let totalPengeluaranGlobal = 0;
let totalSaldoGlobal = 0;

function calculateFinancials() {
    totalPemasukanGlobal = appData.transactions
        .filter(t => t.jenis === 'pemasukan')
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    totalPengeluaranGlobal = appData.transactions
        .filter(t => t.jenis === 'pengeluaran')
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    // Formula: Saldo Saat Ini = Saldo Awal + Total Pemasukan - Total Pengeluaran
    totalSaldoGlobal = appData.saldoAwal + totalPemasukanGlobal - totalPengeluaranGlobal;
}

// Render Dashboard
function renderDashboard() {
    document.getElementById('dashTotalSaldo').textContent = formatRupiah(totalSaldoGlobal);
    document.getElementById('dashSaldoAwal').textContent = formatRupiah(appData.saldoAwal);
    document.getElementById('dashTotalPemasukan').textContent = formatRupiah(totalPemasukanGlobal);
    document.getElementById('dashTotalPengeluaran').textContent = formatRupiah(totalPengeluaranGlobal);

    // Pre-fill saldo awal input if exists
    const initInput = document.getElementById('initialBalanceInput');
    const initNote = document.getElementById('initialBalanceNote');
    if (initInput && appData.saldoAwal > 0) initInput.value = appData.saldoAwal;
    if (initNote && appData.saldoAwalNote) initNote.value = appData.saldoAwalNote;

    // Recent Transactions Table (Top 5)
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

// Render Chart
function updateChart() {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;

    // Calculate monthly breakdown or total comparison
    const isDark = appData.theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    if (financeChartInstance) {
        financeChartInstance.destroy();
    }

    financeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Saldo Awal', 'Pemasukan', 'Pengeluaran'],
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

    // Sorting
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

// Delete Transaction
function deleteTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        appData.transactions = appData.transactions.filter(t => t.id !== id);
        saveData();
        updateUI();
        showToast('Transaksi berhasil dihapus.');
    }
}

// Open Edit Modal
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

// Budget Section Update
function updateBudgetSection() {
    const limitInput = document.getElementById('budgetLimitInput');
    if (limitInput) limitInput.value = appData.budgetLimit || '';

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const now = new Date();
    document.getElementById('currentMonthName').textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    // Filter current month expenses
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

    // Progress bar color & warning alert
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

// Render Laporan
function renderLaporan() {
    document.getElementById('repSaldoAwal').textContent = formatRupiah(appData.saldoAwal);
    document.getElementById('repPemasukan').textContent = formatRupiah(totalPemasukanGlobal);
    document.getElementById('repPengeluaran').textContent = formatRupiah(totalPengeluaranGlobal);
    document.getElementById('repSaldoAkhir').textContent = formatRupiah(totalSaldoGlobal);
}

// Export to CSV
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

// Toast Notification Helper
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
