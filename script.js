// ===========================
// PC FLIPPING MANAGER - OPTIMIZED SCRIPT
// ===========================

// Global Data Storage
let inventory = [];
let builds = [];
let sales = [];

// Global Variables for Modal Management
let currentBuildForSale = null;
let currentBuildIndex = null;
let editingItemIndex = null;
let editingBuildIndex = null;
let editingSaleIndex = null;
let sellingItemIndex = null; // Hinzugefügte Variable für das Einzelteil
let currentBuildComponents = []; // To store components of the current build in the modal
let activeCharts = {}; // To store Chart.js instances

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    if (!checkRequiredElements()) {
        console.error('Initialisierung fehlgeschlagen: Nicht alle erforderlichen DOM-Elemente gefunden.');
        return;
    }
    
    loadData();
    setupEventListeners();
    applyThemePreference();
    showPage('dashboard');
    
    console.log('PC Flipping Manager erfolgreich initialisiert!');
});

function checkRequiredElements() {
    const requiredIds = [
        'dashboard', 'inventory', 'builds', 'sales', 'total-inventory', 
        'total-invested', 'active-builds', 'total-profit', 'recent-list',
        'add-item-btn', 'inventory-tbody', 'search-inventory', 'filter-category',
        'add-build-btn', 'builds-grid', 'sales-tbody',
        'addItemModal', 'addBuildModal', 'selectComponentModal', 'sellBuildModal',
        'dataManagementModal', 'exportDataBtn', 'importDataBtn', 'importFile', 'clearDataBtn',
        'theme-toggle', 'qa-add-item', 'qa-add-build', 'combo-splitter-btn', 'comboSplitterModal',
        'editSaleModal', 'sellItemModal', 'brandChart', 'categoryChart'
    ];
    
    return requiredIds.every(id => document.getElementById(id) !== null);
}

function loadData() {
    try {
        inventory = JSON.parse(localStorage.getItem('pcFlipping_inventory')) || [];
        builds = JSON.parse(localStorage.getItem('pcFlipping_builds')) || [];
        sales = JSON.parse(localStorage.getItem('pcFlipping_sales')) || [];
        console.log('Daten geladen:', { inventory: inventory.length, builds: builds.length, sales: sales.length });
    } catch (e) {
        console.error('Fehler beim Laden der Daten:', e);
        inventory = [];
        builds = [];
        sales = [];
    }
}

function saveData() {
    try {
        localStorage.setItem('pcFlipping_inventory', JSON.stringify(inventory));
        localStorage.setItem('pcFlipping_builds', JSON.stringify(builds));
        localStorage.setItem('pcFlipping_sales', JSON.stringify(sales));
        console.log('Daten gespeichert');
    } catch (e) {
        console.error('Fehler beim Speichern der Daten:', e);
        alert('Fehler beim Speichern der Daten!');
    }
}

// ===========================
// THEME MANAGEMENT
// ===========================

function applyThemePreference() {
    const isDarkMode = localStorage.getItem('pcFlipping_darkMode') === 'true';
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.getElementById('theme-toggle').checked = isDarkMode;
}

function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('pcFlipping_darkMode', isDarkMode);
    updateChartColors();
}

function updateChartColors() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const labelColor = isDarkMode ? '#f4f7f9' : '#333';
    const gridColor = isDarkMode ? '#444c56' : '#e0e6ed';
    
    for (const chartId in activeCharts) {
        const chart = activeCharts[chartId];
        if (chart) {
            chart.options.scales.y.ticks.color = labelColor;
            chart.options.scales.x.ticks.color = labelColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.x.grid.color = gridColor;
            chart.options.plugins.legend.labels.color = labelColor;
            chart.update();
        }
    }
}


// ===========================
// NAVIGATION & UI MANAGEMENT
// ===========================

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Modals
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            closeModal(modalId);
        });
    });

    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Theme Switch
    document.getElementById('theme-toggle').addEventListener('change', toggleTheme);
    
    // Quick Actions
    document.getElementById('qa-add-item').addEventListener('click', showAddItemModal);
    document.getElementById('qa-add-build').addEventListener('click', showAddBuildModal);

    // Inventory page
    document.getElementById('add-item-btn').addEventListener('click', showAddItemModal);
    document.getElementById('search-inventory').addEventListener('keyup', filterAndSortInventory);
    document.getElementById('filter-category').addEventListener('change', filterAndSortInventory);
    document.getElementById('addItemForm').addEventListener('submit', addOrUpdateInventoryItem);
    document.getElementById('combo-splitter-btn').addEventListener('click', showComboSplitterModal);
    document.querySelectorAll('#inventory-table th[data-sort]').forEach(header => {
        header.addEventListener('click', sortInventory);
    });

    // Builds page
    document.getElementById('add-build-btn').addEventListener('click', showAddBuildModal);
    document.getElementById('addBuildForm').addEventListener('submit', addOrUpdateBuild);
    document.getElementById('sort-builds').addEventListener('change', loadBuilds);

    // Sales page
    document.getElementById('editSaleForm').addEventListener('submit', addOrUpdateSale);
    
    // Sell Item Modal
    const sellItemForm = document.getElementById('sellItemForm');
    if (sellItemForm) {
        sellItemForm.addEventListener('submit', sellInventoryItem);
        console.log('Event Listener für sellItemForm erfolgreich hinzugefügt.');
    } else {
        console.error('FEHLER: sellItemForm Element nicht gefunden!');
    }
    
    // Combo Splitter
    document.getElementById('split-price-btn').addEventListener('click', splitComboPrice);

    // Data Management
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    switch(pageId) {
        case 'dashboard': updateDashboard(); break;
        case 'inventory': loadInventory(); break;
        case 'builds': loadBuilds(); break;
        case 'sales': loadSales(); break;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===========================
// DASHBOARD FUNCTIONS
// ===========================

function updateDashboard() {
    try {
        const totalInventory = inventory.filter(item => item.status === 'available').length;
        const totalInvested = inventory.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        const activeBuilds = builds.filter(build => build.status === 'building').length;
        const totalNetProfit = sales.reduce((sum, sale) => sum + (parseFloat(sale.netProfit) || 0), 0);
        
        document.getElementById('total-inventory').textContent = totalInventory;
        document.getElementById('total-invested').textContent = totalInvested.toFixed(2) + '€';
        document.getElementById('active-builds').textContent = activeBuilds;
        document.getElementById('total-profit').textContent = totalNetProfit.toFixed(2) + '€';
        
        updateRecentActivity();
        renderCharts();
    } catch (e) {
        console.error('Fehler beim Dashboard-Update:', e);
    }
}

function renderCharts() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const labelColor = isDarkMode ? '#f4f7f9' : '#333';
    const gridColor = isDarkMode ? '#444c56' : '#e0e6ed';
    const barColor = isDarkMode ? '#58a6ff' : '#007bff';
    
    // Destroy previous chart instances to prevent conflicts
    for (const chartId in activeCharts) {
        if (activeCharts[chartId]) {
            activeCharts[chartId].destroy();
        }
    }
    
    const allUsedComponents = builds.flatMap(build => build.components || []);
    
    // Most Used Brand
    const brandCount = allUsedComponents.reduce((acc, comp) => {
        acc[comp.brand] = (acc[comp.brand] || 0) + 1;
        return acc;
    }, {});
    const sortedBrands = Object.entries(brandCount).sort(([, a], [, b]) => b - a).slice(0, 5);
    const brandLabels = sortedBrands.map(([brand]) => brand);
    const brandData = sortedBrands.map(([, count]) => count);
    
    const brandCtx = document.getElementById('brandChart').getContext('2d');
    activeCharts.brandChart = new Chart(brandCtx, {
        type: 'bar',
        data: {
            labels: brandLabels,
            datasets: [{
                label: 'Anzahl der genutzten Teile',
                data: brandData,
                backgroundColor: barColor
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: labelColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: labelColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: labelColor }
                }
            }
        }
    });

    // Most Used Category
    const categoryCount = allUsedComponents.reduce((acc, comp) => {
        acc[comp.category] = (acc[comp.category] || 0) + 1;
        return acc;
    }, {});
    const sortedCategories = Object.entries(categoryCount).sort(([, a], [, b]) => b - a).slice(0, 5);
    const categoryLabels = sortedCategories.map(([cat]) => cat);
    const categoryData = sortedCategories.map(([, count]) => count);
    
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    activeCharts.categoryChart = new Chart(categoryCtx, {
        type: 'bar',
        data: {
            labels: categoryLabels,
            datasets: [{
                label: 'Anzahl der genutzten Teile',
                data: categoryData,
                backgroundColor: barColor
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: labelColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: labelColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: labelColor }
                }
            }
        }
    });
}

function updateRecentActivity() {
    const recentList = document.getElementById('recent-list');
    if (!recentList) return;
    
    const activities = [
        ...inventory.slice(-3).map(item => ({
            text: `${item.category} ${item.brand} ${item.model} hinzugefügt`,
            date: new Date(item.date),
            type: 'inventory'
        })),
        ...builds.slice(-2).map(build => ({
            text: `Build "${build.name}" erstellt`,
            date: new Date(build.created),
            type: 'build'
        })),
        ...sales.slice(-2).map(sale => ({
            text: `"${sale.buildName}" verkauft für ${parseFloat(sale.soldPrice).toFixed(2)}€`,
            date: new Date(sale.date),
            type: 'sale'
        }))
    ];
    
    activities.sort((a, b) => b.date - a.date);
    
    if (activities.length === 0) {
        recentList.innerHTML = '<p class="no-data">Noch keine Aktivitäten</p>';
        return;
    }
    
    recentList.innerHTML = activities.slice(0, 5).map(activity => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
            <span>${activity.text}</span>
            <span style="color: var(--secondary-color); font-size: 0.9rem;">${activity.date.toLocaleDateString('de-DE')}</span>
        </div>
    `).join('');
}

// ===========================
// INVENTORY FUNCTIONS - FULL CRUD
// ===========================

function getStatusText(status) {
    const statuses = {
        'available': 'Verfügbar',
        'used': 'Verbaut',
        'sold': 'Verkauft'
    };
    return statuses[status] || 'Unbekannt';
}

function loadInventory() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    
    if (inventory.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="8">Keine Komponenten im Inventar</td></tr>';
        return;
    }
    
    const tableHeaders = document.querySelectorAll('#inventory-table th[data-sort]');
    tableHeaders.forEach(header => {
        header.querySelector('i')?.remove();
    });
    
    const sortedInventory = [...inventory].sort(sortInventoryData);

    tbody.innerHTML = sortedInventory.map((item, index) => `
        <tr>
            <td>${item.category || 'N/A'}</td>
            <td>${item.brand || 'N/A'}</td>
            <td>${item.model || 'N/A'}</td>
            <td>${(parseFloat(item.price) || 0).toFixed(2)}€</td>
            <td>${item.date ? new Date(item.date).toLocaleDateString('de-DE') : 'N/A'}</td>
            <td>${item.source || 'N/A'}</td>
            <td><span class="status-${item.status || 'available'}">${getStatusText(item.status || 'available')}</span></td>
            <td>
                <button class="btn-primary" data-action="sell-item" data-index="${index}">Verkaufen</button>
                <button class="btn-primary" data-action="edit-item" data-index="${index}">Bearbeiten</button>
                <button class="btn-danger" data-action="delete-item" data-index="${index}">Löschen</button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners for new buttons
    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const index = parseInt(btn.dataset.index);
        const action = btn.dataset.action;
        if (action === 'sell-item') {
            btn.addEventListener('click', () => showSellItemModal(index));
        } else if (action === 'edit-item') {
            btn.addEventListener('click', () => editInventoryItem(index));
        } else if (action === 'delete-item') {
            btn.addEventListener('click', () => deleteInventoryItem(index));
        }
    });
}

let sortDirection = {};

function sortInventoryData(a, b) {
    const column = sortDirection.column;
    const direction = sortDirection.direction;
    if (!column || !direction) return 0;

    const valA = a[column];
    const valB = b[column];

    let result;
    if (typeof valA === 'string') {
        result = valA.localeCompare(valB);
    } else {
        result = valA - valB;
    }

    return direction === 'asc' ? result : -result;
}

function sortInventory(event) {
    const column = event.target.dataset.sort;
    if (!column) return;

    const currentDirection = sortDirection.column === column && sortDirection.direction === 'asc' ? 'desc' : 'asc';
    sortDirection = { column, direction: currentDirection };

    // Update arrows
    document.querySelectorAll('#inventory-table th[data-sort] i').forEach(icon => icon.remove());
    const arrow = document.createElement('i');
    arrow.className = `fas fa-sort-${currentDirection}`;
    event.target.appendChild(arrow);

    loadInventory();
}


function filterAndSortInventory() {
    const searchInput = document.getElementById('search-inventory');
    const categoryFilter = document.getElementById('filter-category');
    const tbody = document.getElementById('inventory-tbody');
    if (!searchInput || !categoryFilter || !tbody) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilterValue = categoryFilter.value;
    
    const filteredInventory = inventory.filter(item => {
        const matchesSearch = (item.brand || '').toLowerCase().includes(searchTerm) || 
                            (item.model || '').toLowerCase().includes(searchTerm) ||
                            (item.category || '').toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilterValue || item.category === categoryFilterValue;
        return matchesSearch && matchesCategory;
    });

    const sortedFilteredInventory = [...filteredInventory].sort(sortInventoryData);

    if (sortedFilteredInventory.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="8">Keine passenden Komponenten gefunden</td></tr>';
        return;
    }
    
    tbody.innerHTML = sortedFilteredInventory.map((item) => {
        const originalIndex = inventory.findIndex(inv => inv.id === item.id);
        return `
            <tr>
                <td>${item.category || 'N/A'}</td>
                <td>${item.brand || 'N/A'}</td>
                <td>${item.model || 'N/A'}</td>
                <td>${(parseFloat(item.price) || 0).toFixed(2)}€</td>
                <td>${item.date ? new Date(item.date).toLocaleDateString('de-DE') : 'N/A'}</td>
                <td>${item.source || 'N/A'}</td>
                <td><span class="status-${item.status || 'available'}">${getStatusText(item.status || 'available')}</span></td>
                <td>
                    <button class="btn-primary" data-action="sell-item" data-index="${originalIndex}">Verkaufen</button>
                    <button class="btn-primary" data-action="edit-item" data-index="${originalIndex}">Bearbeiten</button>
                    <button class="btn-danger" data-action="delete-item" data-index="${originalIndex}">Löschen</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const index = parseInt(btn.dataset.index);
        const action = btn.dataset.action;
        if (action === 'sell-item') {
            btn.addEventListener('click', () => showSellItemModal(index));
        } else if (action === 'edit-item') {
            btn.addEventListener('click', () => editInventoryItem(index));
        } else if (action === 'delete-item') {
            btn.addEventListener('click', () => deleteInventoryItem(index));
        }
    });
}


function showAddItemModal() {
    editingItemIndex = null;
    const modal = document.getElementById('addItemModal');
    modal.querySelector('h3').textContent = 'Komponente hinzufügen';
    modal.querySelector('.btn-primary[type="submit"]').textContent = 'Hinzufügen';
    document.getElementById('addItemForm').reset();
    document.getElementById('item-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('item-status-field').style.display = 'none';
    modal.style.display = 'block';
}

function editInventoryItem(index) {
    editingItemIndex = index;
    const item = inventory[index];
    const modal = document.getElementById('addItemModal');
    modal.querySelector('h3').textContent = 'Komponente bearbeiten';
    modal.querySelector('.btn-primary[type="submit"]').textContent = 'Speichern';
    
    document.getElementById('item-category').value = item.category || '';
    document.getElementById('item-brand').value = item.brand || '';
    document.getElementById('item-model').value = item.model || '';
    document.getElementById('item-price').value = item.price || '';
    document.getElementById('item-date').value = item.date || '';
    document.getElementById('item-source').value = item.source || '';
    document.getElementById('item-status-field').style.display = 'block';
    document.getElementById('item-status').value = item.status || 'available';
    modal.style.display = 'block';
}

function addOrUpdateInventoryItem(event) {
    event.preventDefault();
    try {
        const form = document.getElementById('addItemForm');
        const itemData = {
            category: form['item-category'].value,
            brand: form['item-brand'].value,
            model: form['item-model'].value,
            price: parseFloat(form['item-price'].value),
            date: form['item-date'].value,
            source: form['item-source'].value
        };

        if (editingItemIndex !== null) {
            const oldStatus = inventory[editingItemIndex].status;
            const newStatus = form['item-status'].value;
            if (oldStatus !== newStatus) {
                if (
                    (oldStatus === 'used' && newStatus === 'available' && !confirm('ACHTUNG: Eine verbaute Komponente soll auf "Verfügbar" geändert werden. Fortfahren?')) ||
                    (oldStatus === 'sold' && newStatus !== 'sold' && !confirm('ACHTUNG: Eine verkaufte Komponente soll geändert werden. Dies kann Ihre Verkaufsstatistiken beeinflussen. Fortfahren?'))
                ) {
                    return;
                }
            }
            inventory[editingItemIndex] = { ...inventory[editingItemIndex], ...itemData, status: newStatus };
            showToast('Komponente erfolgreich aktualisiert!', 'success');
        } else {
            const newItem = {
                id: Date.now(),
                ...itemData,
                status: 'available'
            };
            inventory.push(newItem);
            showToast('Komponente erfolgreich hinzugefügt!', 'success');
        }

        saveData();
        closeModal('addItemModal');
        loadInventory();
        loadBuilds();
    } catch (e) {
        console.error('Fehler beim Speichern der Komponente:', e);
        showToast('Fehler beim Speichern der Komponente!', 'error');
    }
}

function deleteInventoryItem(index) {
    const item = inventory[index];
    if (item.status === 'used') {
        showToast('Diese Komponente ist in einem Build verbaut und kann nicht gelöscht werden!', 'error');
        return;
    }
    if (confirm(`Komponente "${item.category} ${item.brand} ${item.model}" wirklich löschen?`)) {
        try {
            inventory.splice(index, 1);
            saveData();
            loadInventory();
            showToast('Komponente erfolgreich gelöscht!', 'success');
        } catch (e) {
            console.error('Fehler beim Löschen der Komponente:', e);
            showToast('Fehler beim Löschen der Komponente!', 'error');
        }
    }
}

function showSellItemModal(index) {
    sellingItemIndex = index;
    const item = inventory[index];
    if (!item) return;

    const modal = document.getElementById('sellItemModal');
    const infoDiv = document.getElementById('sellItemInfo');
    const form = document.getElementById('sellItemForm');

    infoDiv.innerHTML = `
        <p><strong>Komponente:</strong> ${item.category} ${item.brand} ${item.model}</p>
        <p><strong>Einkaufspreis:</strong> ${(parseFloat(item.price) || 0).toFixed(2)}€</p>
    `;

    form.reset();
    document.getElementById('item-sale-date').value = new Date().toISOString().split('T')[0];
    modal.style.display = 'block';
}

function sellInventoryItem(event) {
    event.preventDefault(); // Diese Zeile verhindert, dass das Formular die Seite neu lädt
    console.log('Verkaufen-Funktion wird ausgeführt...');

    const item = inventory[sellingItemIndex];
    if (!item) {
        console.error('Kein Item zum Verkaufen gefunden.');
        showToast('Fehler: Komponente nicht gefunden.', 'error');
        return;
    }

    const salePrice = parseFloat(document.getElementById('item-sale-price').value);
    const saleBuyer = document.getElementById('item-sale-buyer').value;
    const saleDate = document.getElementById('item-sale-date').value;

    if (isNaN(salePrice) || salePrice <= 0) {
        showToast('Bitte einen gültigen Verkaufspreis eingeben.', 'error');
        return;
    }

    const cost = parseFloat(item.price) || 0;
    const netProfit = salePrice - cost;

    const newSale = {
        id: Date.now(),
        type: 'Einzelteil',
        itemName: `${item.category} ${item.brand} ${item.model}`,
        itemCost: cost,
        soldPrice: salePrice,
        netProfit: netProfit,
        date: saleDate,
        buyer: saleBuyer,
        notes: ''
    };

    sales.push(newSale);
    item.status = 'sold';
    saveData();
    closeModal('sellItemModal');
    loadInventory();
    loadSales();
    updateDashboard();
    showToast('Komponente erfolgreich als Einzelteil verkauft!', 'success');
    console.log('Verkauf erfolgreich abgeschlossen.');
}


// ===========================
// BUILD FUNCTIONS - FULL CRUD
// ===========================

function loadBuilds() {
    const buildsGrid = document.getElementById('builds-grid');
    if (!buildsGrid) return;

    const filteredBuilds = builds.filter(build => {
        const status = document.getElementById('sort-builds')?.value || 'all';
        return status === 'all' || build.status === status;
    });

    if (filteredBuilds.length === 0) {
        buildsGrid.innerHTML = '<div class="no-data">Keine Builds gefunden</div>';
        return;
    }
    
    buildsGrid.innerHTML = filteredBuilds.map((build, index) => {
        const components = build.components || [];
        const totalCost = components.reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
        return `
            <div class="build-card">
                ${build.imageUrl ? `<img src="${build.imageUrl}" alt="${build.name}" style="height: 200px; object-fit: cover;">` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4>${build.name || 'Unnamed Build'}</h4>
                    <span class="status-${build.status}" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">${build.status === 'building' ? 'In Arbeit' : 'Verkauft'}</span>
                </div>
                <div class="build-stats">
                    <div class="build-stat">
                        <strong class="cost">${totalCost.toFixed(2)}€</strong>
                        <span>Kosten</span>
                    </div>
                    ${build.budget > 0 ? `<div class="build-stat">
                        <strong class="budget">${(parseFloat(build.budget) || 0).toFixed(2)}€</strong>
                        <span>Budget</span>
                    </div>` : ''}
                    <div class="build-stat">
                        <strong>${(parseFloat(build.targetPrice) || 0).toFixed(2)}€</strong>
                        <span>Zielpreis</span>
                    </div>
                </div>
                <div class="build-components">
                    <h5>Komponenten (${components.length}):</h5>
                    ${components.length > 0 ? components.map(comp => `
                        <div class="component-item" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>${comp.category || 'N/A'}: ${comp.brand || ''} ${comp.model || ''}</span>
                            ${build.status === 'building' ? `<button class="btn-danger" data-build-index="${index}" data-component-id="${comp.id}">×</button>` : ''}
                        </div>
                    `).join('') : '<p class="no-data" style="font-size: 0.9rem; margin: 0.5rem 0;">Noch keine Komponenten hinzugefügt</p>'}
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                    ${build.status === 'building' ? `
                        <button class="btn-primary" data-action="add-component-to-build" data-index="${index}">+ Komponente</button>
                        <button class="btn-success" data-action="sell-build" data-index="${index}">Verkaufen</button>
                    ` : ''}
                    <button class="btn-primary" data-action="edit-build" data-index="${index}">Bearbeiten</button>
                    <button class="btn-danger" data-action="delete-build" data-index="${index}">Löschen</button>
                </div>
            </div>
        `;
    }).join('');

    buildsGrid.querySelectorAll('[data-action]').forEach(btn => {
        const index = parseInt(btn.dataset.index);
        const action = btn.dataset.action;
        if (action === 'add-component-to-build') {
            btn.addEventListener('click', () => showSelectComponentModal(index));
        } else if (action === 'sell-build') {
            btn.addEventListener('click', () => showSellBuildModal(index));
        } else if (action === 'edit-build') {
            btn.addEventListener('click', () => editBuild(index));
        } else if (action === 'delete-build') {
            btn.addEventListener('click', () => deleteBuild(index));
        }
    });

    buildsGrid.querySelectorAll('.component-item button').forEach(btn => {
        const buildIndex = parseInt(btn.dataset.buildIndex);
        const componentId = parseInt(btn.dataset.componentId);
        btn.addEventListener('click', () => removeComponentFromBuild(buildIndex, componentId));
    });
}

function showAddBuildModal() {
    editingBuildIndex = null;
    const modal = document.getElementById('addBuildModal');
    modal.querySelector('h3').textContent = 'Neuen Build starten';
    document.getElementById('addBuildForm').reset();
    modal.style.display = 'block';
}

function addOrUpdateBuild(event) {
    event.preventDefault();
    try {
        const form = document.getElementById('addBuildForm');
        const buildData = {
            name: form['build-name'].value,
            budget: parseFloat(form['build-budget'].value) || 0,
            targetPrice: parseFloat(form['build-target-price'].value),
            imageUrl: form['build-image'].value,
        };

        if (editingBuildIndex !== null) {
            builds[editingBuildIndex] = { ...builds[editingBuildIndex], ...buildData };
            showToast('Build erfolgreich aktualisiert!', 'success');
        } else {
            const newBuild = {
                id: Date.now(),
                ...buildData,
                status: 'building',
                components: [],
                created: new Date().toISOString().split('T')[0]
            };
            builds.push(newBuild);
            showToast('Build erfolgreich erstellt!', 'success');
        }

        saveData();
        closeModal('addBuildModal');
        loadBuilds();
    } catch (e) {
        console.error('Fehler beim Speichern des Builds:', e);
        showToast('Fehler beim Speichern des Builds!', 'error');
    }
}

function editBuild(index) {
    editingBuildIndex = index;
    const build = builds[index];
    const modal = document.getElementById('addBuildModal');
    modal.querySelector('h3').textContent = 'Build bearbeiten';
    
    document.getElementById('build-name').value = build.name || '';
    document.getElementById('build-budget').value = build.budget || '';
    document.getElementById('build-target-price').value = build.targetPrice || '';
    document.getElementById('build-image').value = build.imageUrl || '';
    
    modal.style.display = 'block';
}

function deleteBuild(index) {
    if (confirm(`Sicher, dass Sie den Build "${builds[index].name}" löschen wollen?`)) {
        // Return components to inventory
        builds[index].components.forEach(comp => {
            const originalItem = inventory.find(item => item.id === comp.id);
            if (originalItem) {
                originalItem.status = 'available';
            }
        });
        builds.splice(index, 1);
        saveData();
        loadBuilds();
        loadInventory();
        showToast('Build erfolgreich gelöscht!', 'success');
    }
}

function showSelectComponentModal(buildIndex) {
    currentBuildIndex = buildIndex;
    const modal = document.getElementById('selectComponentModal');
    const tbody = document.getElementById('component-selection-tbody');

    const availableItems = inventory.filter(item => item.status === 'available');

    if (availableItems.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="5">Keine verfügbaren Komponenten im Inventar</td></tr>';
    } else {
        tbody.innerHTML = availableItems.map(item => `
            <tr>
                <td><input type="checkbox" data-item-id="${item.id}" name="selected-components"></td>
                <td>${item.category || 'N/A'}</td>
                <td>${item.brand || 'N/A'}</td>
                <td>${item.model || 'N/A'}</td>
                <td>${(parseFloat(item.price) || 0).toFixed(2)}€</td>
            </tr>
        `).join('');
    }

    // Event listener for search and filter in the modal
    document.getElementById('search-component').addEventListener('keyup', filterComponentsForModal);
    document.getElementById('filter-component-category').addEventListener('change', filterComponentsForModal);

    // Event listener for adding selected components
    document.getElementById('addComponentToBuildBtn').onclick = addSelectedComponentsToBuild;

    modal.style.display = 'block';
}

function filterComponentsForModal() {
    const searchInput = document.getElementById('search-component');
    const categoryFilter = document.getElementById('filter-component-category');
    const tbody = document.getElementById('component-selection-tbody');
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilterValue = categoryFilter.value;

    const filteredItems = inventory.filter(item => {
        const matchesSearch = (item.brand || '').toLowerCase().includes(searchTerm) || 
                            (item.model || '').toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilterValue || item.category === categoryFilterValue;
        const isAvailable = item.status === 'available';
        return matchesSearch && matchesCategory && isAvailable;
    });

    if (filteredItems.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="5">Keine passenden Komponenten gefunden</td></tr>';
        return;
    }

    tbody.innerHTML = filteredItems.map(item => `
        <tr>
            <td><input type="checkbox" data-item-id="${item.id}" name="selected-components"></td>
            <td>${item.category || 'N/A'}</td>
            <td>${item.brand || 'N/A'}</td>
            <td>${item.model || 'N/A'}</td>
            <td>${(parseFloat(item.price) || 0).toFixed(2)}€</td>
        </tr>
    `).join('');
}


function addSelectedComponentsToBuild() {
    const checkboxes = document.querySelectorAll('#component-selection-tbody input[type="checkbox"]:checked');
    const build = builds[currentBuildIndex];

    checkboxes.forEach(checkbox => {
        const itemId = parseInt(checkbox.dataset.itemId);
        const item = inventory.find(i => i.id === itemId);
        if (item) {
            build.components.push(item);
            item.status = 'used';
        }
    });

    saveData();
    closeModal('selectComponentModal');
    loadBuilds();
    loadInventory();
    showToast('Komponenten erfolgreich zum Build hinzugefügt!', 'success');
}

function removeComponentFromBuild(buildIndex, componentId) {
    const build = builds[buildIndex];
    if (build && build.status === 'building') {
        const componentIndex = build.components.findIndex(comp => comp.id === componentId);
        if (componentIndex > -1) {
            const removedComponent = build.components.splice(componentIndex, 1)[0];
            const originalItem = inventory.find(item => item.id === removedComponent.id);
            if (originalItem) {
                originalItem.status = 'available';
            }
            saveData();
            loadBuilds();
            loadInventory();
            showToast('Komponente erfolgreich aus Build entfernt!', 'success');
        }
    }
}

function showSellBuildModal(buildIndex) {
    currentBuildForSale = builds[buildIndex];
    if (!currentBuildForSale) return;

    const modal = document.getElementById('sellBuildModal');
    const infoDiv = document.getElementById('sellBuildInfo');
    const form = document.getElementById('sellBuildForm');

    const totalCost = currentBuildForSale.components.reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
    const targetPrice = parseFloat(currentBuildForSale.targetPrice) || 0;

    infoDiv.innerHTML = `
        <p><strong>Build:</strong> ${currentBuildForSale.name}</p>
        <p><strong>Gesamtkosten:</strong> ${totalCost.toFixed(2)}€</p>
        <p><strong>Zielpreis:</strong> ${targetPrice.toFixed(2)}€</p>
    `;

    form.reset();
    document.getElementById('build-sale-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('build-sale-price').value = targetPrice > 0 ? targetPrice.toFixed(2) : '';

    modal.style.display = 'block';
}

function sellBuild(event) {
    event.preventDefault();

    const build = currentBuildForSale;
    if (!build) {
        showToast('Fehler: Build zum Verkaufen nicht gefunden.', 'error');
        return;
    }

    const salePrice = parseFloat(document.getElementById('build-sale-price').value);
    const saleBuyer = document.getElementById('build-sale-buyer').value;
    const saleDate = document.getElementById('build-sale-date').value;

    if (isNaN(salePrice) || salePrice <= 0) {
        showToast('Bitte einen gültigen Verkaufspreis eingeben.', 'error');
        return;
    }

    const totalCost = build.components.reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
    const netProfit = salePrice - totalCost;

    const newSale = {
        id: Date.now(),
        type: 'Build',
        buildName: build.name,
        itemCost: totalCost,
        soldPrice: salePrice,
        netProfit: netProfit,
        date: saleDate,
        buyer: saleBuyer,
        notes: ''
    };

    sales.push(newSale);
    build.status = 'sold';
    saveData();
    closeModal('sellBuildModal');
    loadBuilds();
    loadSales();
    updateDashboard();
    showToast('Build erfolgreich verkauft!', 'success');
}


// ===========================
// SALES FUNCTIONS
// ===========================

function loadSales() {
    const tbody = document.getElementById('sales-tbody');
    if (!tbody) return;
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="7">Noch keine Verkäufe</td></tr>';
        return;
    }
    
    tbody.innerHTML = sales.map((sale, index) => `
        <tr>
            <td>${sale.buildName || sale.itemName || 'N/A'}</td>
            <td>${(parseFloat(sale.soldPrice) || 0).toFixed(2)}€</td>
            <td>${(parseFloat(sale.itemCost) || 0).toFixed(2)}€</td>
            <td class="${sale.netProfit >= 0 ? 'profit' : 'loss'}">${(parseFloat(sale.netProfit) || 0).toFixed(2)}€</td>
            <td>${sale.date ? new Date(sale.date).toLocaleDateString('de-DE') : 'N/A'}</td>
            <td>${sale.buyer || 'N/A'}</td>
            <td>
                <button class="btn-primary" data-action="edit-sale" data-index="${index}">Bearbeiten</button>
                <button class="btn-danger" data-action="delete-sale" data-index="${index}">Löschen</button>
            </td>
        </tr>
    `).join('');
    
    tbody.querySelectorAll('[data-action="edit-sale"]').forEach(btn => {
        const index = parseInt(btn.dataset.index);
        btn.addEventListener('click', () => editSale(index));
    });
    
    tbody.querySelectorAll('[data-action="delete-sale"]').forEach(btn => {
        const index = parseInt(btn.dataset.index);
        btn.addEventListener('click', () => deleteSale(index));
    });
}

function editSale(index) {
    editingSaleIndex = index;
    const sale = sales[index];
    const modal = document.getElementById('editSaleModal');

    document.getElementById('sale-item-name').value = sale.buildName || sale.itemName || '';
    document.getElementById('sale-cost').value = (parseFloat(sale.itemCost) || 0).toFixed(2);
    document.getElementById('sale-price').value = (parseFloat(sale.soldPrice) || 0).toFixed(2);
    document.getElementById('sale-date').value = sale.date || '';
    document.getElementById('sale-buyer').value = sale.buyer || '';
    document.getElementById('sale-notes').value = sale.notes || '';

    modal.style.display = 'block';
}

function addOrUpdateSale(event) {
    event.preventDefault();
    const form = document.getElementById('editSaleForm');
    const sale = sales[editingSaleIndex];

    if (!sale) {
        showToast('Fehler: Verkauf nicht gefunden.', 'error');
        return;
    }

    const newPrice = parseFloat(form['sale-price'].value);
    const newDate = form['sale-date'].value;
    const newBuyer = form['sale-buyer'].value;
    const newNotes = form['sale-notes'].value;
    const cost = parseFloat(sale.itemCost);

    sale.soldPrice = newPrice;
    sale.date = newDate;
    sale.buyer = newBuyer;
    sale.notes = newNotes;
    sale.netProfit = newPrice - cost;

    saveData();
    closeModal('editSaleModal');
    loadSales();
    updateDashboard();
    showToast('Verkauf erfolgreich aktualisiert!', 'success');
}

function deleteSale(index) {
    if (confirm('Sicher, dass Sie diesen Verkauf löschen wollen?')) {
        sales.splice(index, 1);
        saveData();
        loadSales();
        updateDashboard();
        showToast('Verkauf erfolgreich gelöscht!', 'success');
    }
}


// ===========================
// COMBO SPLITTER
// ===========================

function showComboSplitterModal() {
    const modal = document.getElementById('comboSplitterModal');
    const listDiv = document.getElementById('combo-inventory-list');
    
    const availableItems = inventory.filter(item => item.status === 'available');

    if (availableItems.length === 0) {
        listDiv.innerHTML = '<p class="no-data">Keine verfügbaren Komponenten zum Aufteilen</p>';
        showToast('Keine Komponenten im Inventar, um einen Kombo-Splitter zu verwenden.', 'error');
    } else {
        listDiv.innerHTML = availableItems.map(item => `
            <div class="combo-item" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <span>${item.category} ${item.brand} ${item.model}</span>
                <input type="checkbox" data-item-id="${item.id}" name="combo-items">
            </div>
        `).join('');
    }
    
    document.getElementById('combo-total-price').value = '';
    modal.style.display = 'block';
}

function splitComboPrice() {
    const totalComboPrice = parseFloat(document.getElementById('combo-total-price').value);
    const checkboxes = document.querySelectorAll('#combo-inventory-list input[type="checkbox"]:checked');
    
    if (isNaN(totalComboPrice) || totalComboPrice <= 0) {
        showToast('Bitte einen gültigen Gesamtpreis eingeben.', 'error');
        return;
    }
    
    if (checkboxes.length === 0) {
        showToast('Bitte wählen Sie mindestens eine Komponente aus.', 'error');
        return;
    }

    const selectedItemIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.itemId));
    const selectedItems = inventory.filter(item => selectedItemIds.includes(item.id));
    
    // Calculate the old total price of selected items
    const oldTotalPrice = selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    
    if (oldTotalPrice === 0) {
        showToast('Die ausgewählten Komponenten haben einen Gesamtwert von 0. Der Preis kann nicht aufgeteilt werden.', 'error');
        return;
    }

    // Calculate the scaling factor
    const scalingFactor = totalComboPrice / oldTotalPrice;

    // Update the price of each selected item
    selectedItems.forEach(item => {
        item.price = (parseFloat(item.price) * scalingFactor).toFixed(2);
    });

    saveData();
    closeModal('comboSplitterModal');
    loadInventory();
    showToast('Preise erfolgreich aufgeteilt!', 'success');
}


// ===========================
// DATA MANAGEMENT
// ===========================

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function exportData() {
    const data = {
        inventory: inventory,
        builds: builds,
        sales: sales
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pc-flipping-data.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Daten erfolgreich exportiert!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.inventory && importedData.builds && importedData.sales) {
                if (confirm('Importierte Daten werden Ihre aktuellen Daten überschreiben. Fortfahren?')) {
                    inventory = importedData.inventory;
                    builds = importedData.builds;
                    sales = importedData.sales;
                    saveData();
                    showPage(document.querySelector('.nav-btn.active').dataset.page);
                    showToast('Daten erfolgreich importiert!', 'success');
                }
            } else {
                showToast('Ungültiges JSON-Format. Bitte eine gültige Exportdatei auswählen.', 'error');
            }
        } catch (error) {
            console.error('Fehler beim Importieren der Daten:', error);
            showToast('Fehler beim Importieren der Daten!', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Sicher, dass Sie alle Daten unwiderruflich löschen wollen?')) {
        try {
            localStorage.removeItem('pcFlipping_inventory');
            localStorage.removeItem('pcFlipping_builds');
            localStorage.removeItem('pcFlipping_sales');
            inventory = [];
            builds = [];
            sales = [];
            showPage('dashboard');
            showToast('Alle Daten erfolgreich gelöscht!', 'success');
        } catch (e) {
            console.error('Fehler beim Löschen der Daten:', e);
            showToast('Fehler beim Löschen der Daten!', 'error');
        }
    }
}
