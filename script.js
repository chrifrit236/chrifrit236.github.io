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
let sellingItemIndex = null; // New global variable
let currentBuildComponents = []; // To store components of the current build in the modal
let activeCharts = {}; // To store Chart.js instances
let currentInventorySort = { column: 'date', direction: 'desc' }; // Default sort for inventory
let currentBuildsSort = 'name_asc'; // Default sort for builds

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
        'editSaleModal', 'brandChart', 'categoryChart', 'sellItemModal', // Added sellItemModal
        'sort-builds' // Added sort-builds select
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
    document.getElementById('search-inventory').addEventListener('keyup', filterAndSortInventory); // Combined function
    document.getElementById('filter-category').addEventListener('change', filterAndSortInventory); // Combined function
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
    document.getElementById('sellItemForm').addEventListener('submit', sellInventoryItem);

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
// INVENTORY FUNCTIONS - FULL CRUD & SORT/FILTER
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
    filterAndSortInventory();
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

    sortData(filteredInventory, currentInventorySort.column, currentInventorySort.direction);
    
    if (filteredInventory.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="8">Keine passenden Komponenten gefunden</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredInventory.map(item => {
        const originalIndex = inventory.findIndex(inv => inv.id === item.id);
        const actions = item.status === 'available' ? `
            <button class="btn-primary" data-action="edit-item" data-index="${originalIndex}">Bearbeiten</button>
            <button class="btn-success" data-action="sell-item" data-index="${originalIndex}">Verkaufen</button>
            <button class="btn-danger" data-action="delete-item" data-index="${originalIndex}">Löschen</button>
        ` : `
            <button class="btn-primary" data-action="edit-item" data-index="${originalIndex}">Bearbeiten</button>
            <button class="btn-danger" data-action="delete-item" data-index="${originalIndex}">Löschen</button>
        `;

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
                    ${actions}
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const index = parseInt(btn.dataset.index);
        const action = btn.dataset.action;
        if (action === 'edit-item') {
            btn.addEventListener('click', () => editInventoryItem(index));
        } else if (action === 'delete-item') {
            btn.addEventListener('click', () => deleteInventoryItem(index));
        } else if (action === 'sell-item') {
            btn.addEventListener('click', () => showSellItemModal(index));
        }
    });
    updateSortIcons();
}

function sortInventory(event) {
    const column = event.target.dataset.sort;
    if (!column) return;

    if (currentInventorySort.column === column) {
        currentInventorySort.direction = currentInventorySort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentInventorySort.column = column;
        currentInventorySort.direction = 'asc';
    }

    filterAndSortInventory();
}

function updateSortIcons() {
    document.querySelectorAll('#inventory-table th .sort-icon').forEach(icon => {
        icon.textContent = '';
    });
    const header = document.querySelector(`#inventory-table th[data-sort="${currentInventorySort.column}"]`);
    if (header) {
        header.querySelector('.sort-icon').textContent = currentInventorySort.direction === 'asc' ? '▲' : '▼';
    }
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
            alert('Komponente erfolgreich aktualisiert!');
        } else {
            const newItem = {
                id: Date.now(),
                ...itemData,
                status: 'available'
            };
            inventory.push(newItem);
            alert('Komponente erfolgreich hinzugefügt!');
        }
        saveData();
        closeModal('addItemModal');
        loadInventory();
        loadBuilds();
    } catch (e) {
        console.error('Fehler beim Speichern der Komponente:', e);
        alert('Fehler beim Speichern der Komponente!');
    }
}

function deleteInventoryItem(index) {
    const item = inventory[index];
    if (item.status === 'used') {
        alert('Diese Komponente ist in einem Build verbaut und kann nicht gelöscht werden!');
        return;
    }
    if (confirm(`Komponente "${item.category} ${item.brand} ${item.model}" wirklich löschen?`)) {
        try {
            inventory.splice(index, 1);
            saveData();
            loadInventory();
        } catch (e) {
            console.error('Fehler beim Löschen der Komponente:', e);
            alert('Fehler beim Löschen der Komponente!');
        }
    }
}

function showSellItemModal(index) {
    sellingItemIndex = index;
    const item = inventory[index];
    document.getElementById('sellItemInfo').innerHTML = `
        <p><strong>Komponente:</strong> ${item.brand} ${item.model}</p>
        <p><strong>Einkaufspreis:</strong> ${parseFloat(item.price).toFixed(2)}€</p>
    `;
    document.getElementById('item-sale-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('sellItemForm').reset();
    document.getElementById('sellItemModal').style.display = 'block';
}

function sellInventoryItem(event) {
    event.preventDefault();
    const item = inventory[sellingItemIndex];
    if (!item) return;

    const salePrice = parseFloat(document.getElementById('item-sale-price').value);
    const saleBuyer = document.getElementById('item-sale-buyer').value;
    const saleDate = document.getElementById('item-sale-date').value;

    if (isNaN(salePrice) || salePrice <= 0) {
        alert('Bitte einen gültigen Verkaufspreis eingeben.');
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
    alert('Komponente erfolgreich verkauft und in der Verkaufsliste hinzugefügt!');
}

// ===========================
// BUILD FUNCTIONS - FULL CRUD
// ===========================

function loadBuilds() {
    const buildsGrid = document.getElementById('builds-grid');
    if (!buildsGrid) return;
    
    // Sort builds based on the current selection
    const sortSelect = document.getElementById('sort-builds');
    currentBuildsSort = sortSelect.value;
    
    const sortedBuilds = [...builds];
    
    switch (currentBuildsSort) {
        case 'name_asc':
            sortedBuilds.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name_desc':
            sortedBuilds.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'cost_asc':
            sortedBuilds.sort((a, b) => {
                const costA = (a.components || []).reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
                const costB = (b.components || []).reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
                return costA - costB;
            });
            break;
        case 'cost_desc':
            sortedBuilds.sort((a, b) => {
                const costA = (a.components || []).reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
                const costB = (b.components || []).reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
                return costB - costA;
            });
            break;
        case 'target_asc':
            sortedBuilds.sort((a, b) => (parseFloat(a.targetPrice) || 0) - (parseFloat(b.targetPrice) || 0));
            break;
        case 'target_desc':
            sortedBuilds.sort((a, b) => (parseFloat(b.targetPrice) || 0) - (parseFloat(a.targetPrice) || 0));
            break;
    }

    if (sortedBuilds.length === 0) {
        buildsGrid.innerHTML = '<div class="no-data">Noch keine Builds erstellt</div>';
        return;
    }
    
    buildsGrid.innerHTML = sortedBuilds.map((build, index) => {
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
                            ${build.status === 'building' ? `<button class="btn-danger remove-component" data-build-index="${index}" data-component-id="${comp.id}">×</button>` : ''}
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

    buildsGrid.querySelectorAll('.remove-component').forEach(btn => {
        btn.addEventListener('click', function() {
            const buildIndex = parseInt(this.dataset.buildIndex);
            const componentId = parseInt(this.dataset.componentId);
            removeComponentFromBuild(buildIndex, componentId);
        });
    });
}

function showAddBuildModal() {
    editingBuildIndex = null;
    const modal = document.getElementById('addBuildModal');
    modal.querySelector('h3').textContent = 'Neuen Build starten';
    modal.querySelector('.btn-primary[type="submit"]').textContent = 'Erstellen';
    document.getElementById('addBuildForm').reset();
    modal.style.display = 'block';
}

function addOrUpdateBuild(event) {
    event.preventDefault();
    try {
        const form = document.getElementById('addBuildForm');
        const buildName = form['build-name'].value;
        const buildBudget = parseFloat(form['build-budget'].value) || 0;
        const buildTargetPrice = parseFloat(form['build-target-price'].value);
        const buildImageUrl = form['build-image-url'].value;
        
        if (editingBuildIndex !== null) {
            const build = builds[editingBuildIndex];
            build.name = buildName;
            build.budget = buildBudget;
            build.targetPrice = buildTargetPrice;
            build.imageUrl = buildImageUrl;
            alert('Build erfolgreich aktualisiert!');
        } else {
            const newBuild = {
                id: Date.now(),
                name: buildName,
                created: new Date().toISOString().split('T')[0],
                budget: buildBudget,
                targetPrice: buildTargetPrice,
                imageUrl: buildImageUrl,
                status: 'building',
                components: []
            };
            builds.push(newBuild);
            alert('Neuer Build erfolgreich erstellt!');
        }
        
        saveData();
        closeModal('addBuildModal');
        loadBuilds();
    } catch (e) {
        console.error('Fehler beim Speichern des Builds:', e);
        alert('Fehler beim Speichern des Builds!');
    }
}

function editBuild(index) {
    editingBuildIndex = index;
    const build = builds[index];
    const modal = document.getElementById('addBuildModal');
    modal.querySelector('h3').textContent = 'Build bearbeiten';
    modal.querySelector('.btn-primary[type="submit"]').textContent = 'Speichern';
    
    document.getElementById('build-name').value = build.name || '';
    document.getElementById('build-budget').value = build.budget || '';
    document.getElementById('build-target-price').value = build.targetPrice || '';
    document.getElementById('build-image-url').value = build.imageUrl || '';
    modal.style.display = 'block';
}

function deleteBuild(index) {
    if (confirm(`Sind Sie sicher, dass Sie den Build "${builds[index].name}" unwiderruflich löschen wollen?`)) {
        try {
            // Restore components to inventory with 'available' status
            (builds[index].components || []).forEach(comp => {
                const originalItem = inventory.find(item => item.id === comp.id);
                if (originalItem) {
                    originalItem.status = 'available';
                }
            });

            builds.splice(index, 1);
            saveData();
            loadBuilds();
            loadInventory();
            updateDashboard();
            alert('Build erfolgreich gelöscht!');
        } catch (e) {
            console.error('Fehler beim Löschen des Builds:', e);
            alert('Fehler beim Löschen des Builds!');
        }
    }
}

function showSelectComponentModal(buildIndex) {
    currentBuildIndex = buildIndex;
    const tbody = document.getElementById('select-component-tbody');
    const availableItems = inventory.filter(item => item.status === 'available');
    
    if (availableItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Keine verfügbaren Komponenten im Inventar.</td></tr>';
        document.getElementById('selectComponentModal').style.display = 'block';
        return;
    }
    
    tbody.innerHTML = availableItems.map(item => `
        <tr>
            <td>${item.category || 'N/A'}</td>
            <td>${item.brand || 'N/A'}</td>
            <td>${item.model || 'N/A'}</td>
            <td>${(parseFloat(item.price) || 0).toFixed(2)}€</td>
            <td><button class="btn-primary" onclick="addComponentToBuild(${item.id})">Auswählen</button></td>
        </tr>
    `).join('');
    
    document.getElementById('selectComponentModal').style.display = 'block';
}

function addComponentToBuild(itemId) {
    const item = inventory.find(i => i.id === itemId);
    const build = builds[currentBuildIndex];
    if (item && build) {
        build.components.push({
            id: item.id,
            category: item.category,
            brand: item.brand,
            model: item.model,
            price: item.price
        });
        item.status = 'used';
        saveData();
        closeModal('selectComponentModal');
        loadBuilds();
        loadInventory();
        alert('Komponente erfolgreich zum Build hinzugefügt!');
    }
}

function removeComponentFromBuild(buildIndex, componentId) {
    const build = builds[buildIndex];
    if (build) {
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
            alert('Komponente erfolgreich aus dem Build entfernt!');
        }
    }
}

function showSellBuildModal(buildIndex) {
    currentBuildForSale = builds[buildIndex];
    document.getElementById('sellBuildForm').reset();
    document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('sellBuildModal').style.display = 'block';
}

function sellBuild(event) {
    event.preventDefault();
    const salePrice = parseFloat(document.getElementById('sale-price').value);
    const buyer = document.getElementById('sale-buyer').value;
    const saleDate = document.getElementById('sale-date').value;
    
    if (isNaN(salePrice) || salePrice <= 0) {
        alert('Bitte einen gültigen Verkaufspreis eingeben.');
        return;
    }

    const totalCost = (currentBuildForSale.components || []).reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
    const netProfit = salePrice - totalCost;
    
    // Create new sale entry
    const newSale = {
        id: Date.now(),
        buildName: currentBuildForSale.name,
        buildCost: totalCost,
        soldPrice: salePrice,
        netProfit: netProfit,
        date: saleDate,
        buyer: buyer
    };
    
    // Update build and component statuses
    currentBuildForSale.status = 'sold';
    currentBuildForSale.components.forEach(comp => {
        const item = inventory.find(i => i.id === comp.id);
        if (item) {
            item.status = 'sold';
        }
    });

    sales.push(newSale);
    saveData();
    closeModal('sellBuildModal');
    loadBuilds();
    loadSales();
    updateDashboard();
    alert('Build erfolgreich verkauft!');
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
    
    tbody.innerHTML = sales.map((sale, index) => {
        const profitClass = sale.netProfit >= 0 ? 'profit' : 'loss';
        const cost = sale.type === 'Einzelteil' ? sale.itemCost : sale.buildCost;
        const name = sale.type === 'Einzelteil' ? sale.itemName : sale.buildName;
        return `
            <tr>
                <td>${name || 'N/A'}</td>
                <td>${(parseFloat(sale.soldPrice) || 0).toFixed(2)}€</td>
                <td>${(parseFloat(cost) || 0).toFixed(2)}€</td>
                <td><span class="${profitClass}">${(parseFloat(sale.netProfit) || 0).toFixed(2)}€</span></td>
                <td>${sale.date ? new Date(sale.date).toLocaleDateString('de-DE') : 'N/A'}</td>
                <td>${sale.buyer || 'N/A'}</td>
                <td>
                    <button class="btn-primary" data-action="edit-sale" data-index="${index}">Bearbeiten</button>
                    <button class="btn-danger" data-action="delete-sale" data-index="${index}">Löschen</button>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.querySelectorAll('[data-action]').forEach(btn => {
        const index = parseInt(btn.dataset.index);
        const action = btn.dataset.action;
        if (action === 'edit-sale') {
            btn.addEventListener('click', () => editSale(index));
        } else if (action === 'delete-sale') {
            btn.addEventListener('click', () => deleteSale(index));
        }
    });
}

function editSale(index) {
    editingSaleIndex = index;
    const sale = sales[index];
    document.getElementById('edit-sale-price').value = sale.soldPrice || '';
    document.getElementById('edit-sale-buyer').value = sale.buyer || '';
    document.getElementById('edit-sale-date').value = sale.date || '';
    document.getElementById('editSaleModal').style.display = 'block';
}

function addOrUpdateSale(event) {
    event.preventDefault();
    const sale = sales[editingSaleIndex];
    sale.soldPrice = parseFloat(document.getElementById('edit-sale-price').value);
    sale.buyer = document.getElementById('edit-sale-buyer').value;
    sale.date = document.getElementById('edit-sale-date').value;

    const cost = sale.type === 'Einzelteil' ? sale.itemCost : sale.buildCost;
    sale.netProfit = sale.soldPrice - cost;

    saveData();
    closeModal('editSaleModal');
    loadSales();
    updateDashboard();
    alert('Verkauf erfolgreich aktualisiert!');
}

function deleteSale(index) {
    if (confirm('Verkaufseintrag wirklich löschen?')) {
        try {
            sales.splice(index, 1);
            saveData();
            loadSales();
            updateDashboard();
        } catch (e) {
            console.error('Fehler beim Löschen des Verkaufs:', e);
            alert('Fehler beim Löschen des Verkaufs!');
        }
    }
}

// ===========================
// COMBO SPLITTER
// ===========================

function showComboSplitterModal() {
    const list = document.getElementById('combo-inventory-list');
    const availableItems = inventory.filter(item => item.status === 'available');

    if (availableItems.length === 0) {
        list.innerHTML = '<p class="no-data">Keine verfügbaren Komponenten im Inventar.</p>';
        document.getElementById('comboSplitterModal').style.display = 'block';
        return;
    }
    
    list.innerHTML = availableItems.map(item => `
        <div class="combo-item-entry">
            <input type="checkbox" id="combo-item-${item.id}" data-id="${item.id}">
            <label for="combo-item-${item.id}">${item.brand} ${item.model}</label>
        </div>
    `).join('');
    
    document.getElementById('comboSplitterModal').style.display = 'block';
}

function splitComboPrice() {
    const totalComboPrice = parseFloat(document.getElementById('combo-total-price').value);
    const selectedItems = Array.from(document.querySelectorAll('#combo-inventory-list input:checked'))
                            .map(input => inventory.find(item => item.id === parseInt(input.dataset.id)));

    if (isNaN(totalComboPrice) || selectedItems.length === 0) {
        alert('Bitte einen Gesamtpreis eingeben und mindestens eine Komponente auswählen.');
        return;
    }

    const totalEstimatedPrice = selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    if (totalEstimatedPrice === 0) {
        alert('Die ausgewählten Komponenten haben keinen Einkaufspreis. Kann nicht aufgeteilt werden.');
        return;
    }

    selectedItems.forEach(item => {
        const newPrice = (parseFloat(item.price) / totalEstimatedPrice) * totalComboPrice;
        item.price = newPrice.toFixed(2);
    });

    saveData();
    closeModal('comboSplitterModal');
    loadInventory();
    alert('Preis erfolgreich auf die Komponenten aufgeteilt!');
}

// ===========================
// DATA MANAGEMENT
// ===========================

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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            if (importedData && importedData.inventory && importedData.builds && importedData.sales) {
                if (confirm('Importierte Daten werden Ihre aktuellen Daten überschreiben. Fortfahren?')) {
                    inventory = importedData.inventory;
                    builds = importedData.builds;
                    sales = importedData.sales;
                    saveData();
                    showPage(document.querySelector('.nav-btn.active').dataset.page);
                    alert('Daten erfolgreich importiert!');
                }
            } else {
                alert('Ungültiges JSON-Format. Bitte eine gültige Exportdatei auswählen.');
            }
        } catch (error) {
            console.error('Fehler beim Importieren der Daten:', error);
            alert('Fehler beim Importieren der Daten!');
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
            alert('Alle Daten erfolgreich gelöscht!');
        } catch (e) {
            console.error('Fehler beim Löschen der Daten:', e);
            alert('Fehler beim Löschen der Daten!');
        }
    }
}

// Utility function for sorting arrays
function sortData(data, key, direction) {
    data.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return direction === 'asc' ? valA - valB : valB - valA;
        }
    });
}
