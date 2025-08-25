/**
 * PC Flipping Manager - Hauptanwendung
 * Verwaltet Inventar, Builds, Bundles und Finanzen
 */

class PCFlippingManager {
    constructor() {
        this.data = {
            parts: [],
            builds: [],
            bundles: [],
            soldParts: [],
            settings: {
                darkMode: false,
                viewMode: 'table' // 'table' oder 'cards'
            }
        };
        
        this.currentEditingPart = null;
        this.currentEditingBuild = null;
        this.currentSellPart = null;
        
        this.init();
    }

    // Initialisierung der Anwendung
    init() {
        this.loadData();
        this.setupEventListeners();
        this.applySettings();
        this.loadExampleData(); // Beispieldaten laden beim ersten Start
        this.render();
    }

    // Event Listeners einrichten
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Dark Mode Toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // View Toggle
        document.getElementById('tableView').addEventListener('click', () => {
            this.setViewMode('table');
        });
        
        document.getElementById('cardView').addEventListener('click', () => {
            this.setViewMode('cards');
        });

        // Inventory
        document.getElementById('addPartBtn').addEventListener('click', () => {
            this.openPartModal();
        });

        document.getElementById('inventorySearch').addEventListener('input', (e) => {
            this.filterInventory(e.target.value);
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterInventory(document.getElementById('inventorySearch').value, e.target.value);
        });

        // Builds
        document.getElementById('addBuildBtn').addEventListener('click', () => {
            this.openBuildModal();
        });

        // Bundles
        document.getElementById('addBundleBtn').addEventListener('click', () => {
            this.openBundleModal();
        });

        // Modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Forms
        document.getElementById('partForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePart();
        });

        document.getElementById('sellForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sellPart();
        });

        document.getElementById('buildForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBuild();
        });

        document.getElementById('cancelPartBtn').addEventListener('click', () => {
            this.closeModal(document.getElementById('partModal'));
        });

        document.getElementById('cancelSellBtn').addEventListener('click', () => {
            this.closeModal(document.getElementById('sellModal'));
        });

        document.getElementById('cancelBuildBtn').addEventListener('click', () => {
            this.closeModal(document.getElementById('buildModal'));
        });

        // Sell Price Preview
        document.getElementById('sellPrice').addEventListener('input', () => {
            this.updateSellPreview();
        });
    }

    // Sektion wechseln
    switchSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(sectionName).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Spezifische Aktionen für verschiedene Sektionen
        if (sectionName === 'finances') {
            this.updateFinanceOverview();
        }
    }

    // Dark Mode umschalten
    toggleDarkMode() {
        this.data.settings.darkMode = !this.data.settings.darkMode;
        this.applySettings();
        this.saveData();
    }

    // View Mode setzen
    setViewMode(mode) {
        this.data.settings.viewMode = mode;
        
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'table') {
            document.getElementById('tableView').classList.add('active');
        } else {
            document.getElementById('cardView').classList.add('active');
        }
        
        this.renderInventory();
        this.saveData();
    }

    // Einstellungen anwenden
    applySettings() {
        if (this.data.settings.darkMode) {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.removeAttribute('data-theme');
            document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-moon"></i>';
        }

        // View Mode anwenden
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (this.data.settings.viewMode === 'table') {
            document.getElementById('tableView').classList.add('active');
        } else {
            document.getElementById('cardView').classList.add('active');
        }
    }

    // Modal öffnen
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    // Modal schließen
    closeModal(modal) {
        modal.classList.remove('active');
        this.currentEditingPart = null;
        this.currentEditingBuild = null;
        this.currentSellPart = null;
    }

    // Teil-Modal öffnen
    openPartModal(part = null) {
        this.currentEditingPart = part;
        const modal = document.getElementById('partModal');
        const title = document.getElementById('partModalTitle');
        const form = document.getElementById('partForm');

        if (part) {
            title.textContent = 'Teil bearbeiten';
            this.fillPartForm(part);
        } else {
            title.textContent = 'Teil hinzufügen';
            form.reset();
            document.getElementById('partPurchaseDate').valueAsDate = new Date();
        }

        this.openModal('partModal');
    }

    // Teil-Formular ausfüllen
    fillPartForm(part) {
        document.getElementById('partName').value = part.name || '';
        document.getElementById('partCategory').value = part.category || '';
        document.getElementById('partBrand').value = part.brand || '';
        document.getElementById('partPrice').value = part.price || '';
        document.getElementById('partCondition').value = part.condition || 'Neu';
        document.getElementById('partPlatform').value = part.platform || 'eBay';
        document.getElementById('partPurchaseDate').value = part.purchaseDate || '';
        document.getElementById('partMarketValue').value = part.marketValue || '';
    }

    // Teil speichern
    savePart() {
        const formData = new FormData(document.getElementById('partForm'));
        const partData = {
            id: this.currentEditingPart ? this.currentEditingPart.id : this.generateId(),
            name: document.getElementById('partName').value,
            category: document.getElementById('partCategory').value,
            brand: document.getElementById('partBrand').value,
            price: parseFloat(document.getElementById('partPrice').value) || 0,
            condition: document.getElementById('partCondition').value,
            platform: document.getElementById('partPlatform').value,
            purchaseDate: document.getElementById('partPurchaseDate').value,
            marketValue: parseFloat(document.getElementById('partMarketValue').value) || 0,
            status: 'available', // available, sold, in-build
            createdAt: this.currentEditingPart ? this.currentEditingPart.createdAt : new Date().toISOString()
        };

        if (this.currentEditingPart) {
            const index = this.data.parts.findIndex(p => p.id === this.currentEditingPart.id);
            this.data.parts[index] = partData;
            this.showToast('Teil aktualisiert');
        } else {
            this.data.parts.push(partData);
            this.showToast('Teil hinzugefügt');
        }

        this.saveData();
        this.closeModal(document.getElementById('partModal'));
        this.renderInventory();
        this.updateFinanceOverview();
    }

    // Teil löschen
    deletePart(partId) {
        if (confirm('Möchten Sie dieses Teil wirklich löschen?')) {
            this.data.parts = this.data.parts.filter(p => p.id !== partId);
            
            // Teil aus Builds entfernen
            this.data.builds.forEach(build => {
                build.parts = build.parts.filter(p => p.id !== partId);
            });

            this.saveData();
            this.renderInventory();
            this.updateFinanceOverview();
            this.showToast('Teil gelöscht');
        }
    }

    // Verkauf-Modal öffnen
    openSellModal(part) {
        this.currentSellPart = part;
        document.getElementById('sellPrice').value = part.marketValue || part.price;
        document.getElementById('sellPlatform').value = 'eBay';
        document.getElementById('sellDate').valueAsDate = new Date();
        
        this.updateSellPreview();
        this.openModal('sellModal');
    }

    // Verkaufs-Vorschau aktualisieren
    updateSellPreview() {
        if (!this.currentSellPart) return;

        const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
        const originalPrice = this.currentSellPart.price;
        const profit = sellPrice - originalPrice;

        document.getElementById('originalPrice').textContent = this.formatCurrency(originalPrice);
        document.getElementById('previewSellPrice').textContent = this.formatCurrency(sellPrice);
        document.getElementById('previewProfit').textContent = this.formatCurrency(profit);
        document.getElementById('previewProfit').className = profit >= 0 ? 'price-positive' : 'price-negative';
    }

    // Teil verkaufen
    sellPart() {
        if (!this.currentSellPart) return;

        const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
        const sellPlatform = document.getElementById('sellPlatform').value;
        const sellDate = document.getElementById('sellDate').value;

        const soldPart = {
            ...this.currentSellPart,
            sellPrice: sellPrice,
            sellPlatform: sellPlatform,
            sellDate: sellDate,
            profit: sellPrice - this.currentSellPart.price,
            soldAt: new Date().toISOString()
        };

        this.data.soldParts.push(soldPart);
        
        // Teil aus Inventar entfernen
        this.data.parts = this.data.parts.filter(p => p.id !== this.currentSellPart.id);

        this.saveData();
        this.closeModal(document.getElementById('sellModal'));
        this.renderInventory();
        this.updateFinanceOverview();
        this.showToast('Teil verkauft');
    }

    // Build-Modal öffnen
    openBuildModal(build = null) {
        this.currentEditingBuild = build;
        const modal = document.getElementById('buildModal');
        const title = document.getElementById('buildModalTitle');

        if (build) {
            title.textContent = 'Build bearbeiten';
            document.getElementById('buildName').value = build.name;
        } else {
            title.textContent = 'Build erstellen';
            document.getElementById('buildName').value = '';
        }

        this.renderAvailableParts();
        this.renderBuildConfiguration();
        this.openModal('buildModal');
    }

    // Verfügbare Teile für Build rendern
    renderAvailableParts() {
        const container = document.getElementById('availableParts');
        const availableParts = this.data.parts.filter(p => p.status === 'available');

        if (availableParts.length === 0) {
            container.innerHTML = '<div class="empty-state">Keine verfügbaren Teile</div>';
            return;
        }

        container.innerHTML = availableParts.map(part => `
            <div class="part-item" data-part-id="${part.id}">
                <div class="part-info">
                    <div class="part-name">${part.name}</div>
                    <div class="part-price">${this.formatCurrency(part.price)}</div>
                </div>
            </div>
        `).join('');

        // Event Listeners für Teilauswahl
        container.querySelectorAll('.part-item').forEach(item => {
            item.addEventListener('click', () => {
                const partId = item.dataset.partId;
                this.togglePartInBuild(partId);
                item.classList.toggle('selected');
                this.renderBuildConfiguration();
            });
        });
    }

    // Teil zu Build hinzufügen/entfernen
    togglePartInBuild(partId) {
        if (!this.currentBuildParts) {
            this.currentBuildParts = [];
        }

        const index = this.currentBuildParts.indexOf(partId);
        if (index > -1) {
            this.currentBuildParts.splice(index, 1);
        } else {
            this.currentBuildParts.push(partId);
        }
    }

    // Build-Konfiguration rendern
    renderBuildConfiguration() {
        const container = document.getElementById('buildConfiguration');
        
        if (!this.currentBuildParts || this.currentBuildParts.length === 0) {
            container.innerHTML = '<div class="empty">Keine Teile ausgewählt</div>';
            container.classList.add('empty');
        } else {
            container.classList.remove('empty');
            const selectedParts = this.currentBuildParts.map(partId => 
                this.data.parts.find(p => p.id === partId)
            ).filter(p => p);

            container.innerHTML = selectedParts.map(part => `
                <div class="selected-part">
                    <div class="part-info">
                        <div class="part-name">${part.name}</div>
                        <div class="part-price">${this.formatCurrency(part.price)}</div>
                    </div>
                    <button class="remove-part" onclick="app.removePartFromBuild('${part.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }

        this.updateBuildSummary();
    }

    // Teil aus Build entfernen
    removePartFromBuild(partId) {
        const index = this.currentBuildParts.indexOf(partId);
        if (index > -1) {
            this.currentBuildParts.splice(index, 1);
            this.renderBuildConfiguration();
            
            // Update UI
            const partItem = document.querySelector(`[data-part-id="${partId}"]`);
            if (partItem) {
                partItem.classList.remove('selected');
            }
        }
    }

    // Build-Zusammenfassung aktualisieren
    updateBuildSummary() {
        if (!this.currentBuildParts || this.currentBuildParts.length === 0) {
            document.getElementById('buildTotalCost').textContent = this.formatCurrency(0);
            document.getElementById('buildEstimatedPrice').textContent = this.formatCurrency(0);
            document.getElementById('buildExpectedProfit').textContent = this.formatCurrency(0);
            return;
        }

        const selectedParts = this.currentBuildParts.map(partId => 
            this.data.parts.find(p => p.id === partId)
        ).filter(p => p);

        const totalCost = selectedParts.reduce((sum, part) => sum + part.price, 0);
        const estimatedPrice = selectedParts.reduce((sum, part) => sum + (part.marketValue || part.price * 1.3), 0);
        const expectedProfit = estimatedPrice - totalCost;

        document.getElementById('buildTotalCost').textContent = this.formatCurrency(totalCost);
        document.getElementById('buildEstimatedPrice').textContent = this.formatCurrency(estimatedPrice);
        document.getElementById('buildExpectedProfit').textContent = this.formatCurrency(expectedProfit);
        
        const profitElement = document.getElementById('buildExpectedProfit');
        profitElement.className = expectedProfit >= 0 ? 'price-positive' : 'price-negative';
    }

    // Build speichern
    saveBuild() {
        const buildName = document.getElementById('buildName').value.trim();
        if (!buildName) {
            this.showToast('Bitte Build-Namen eingeben', 'error');
            return;
        }

        if (!this.currentBuildParts || this.currentBuildParts.length === 0) {
            this.showToast('Bitte mindestens ein Teil auswählen', 'error');
            return;
        }

        const selectedParts = this.currentBuildParts.map(partId => 
            this.data.parts.find(p => p.id === partId)
        ).filter(p => p);

        const buildData = {
            id: this.currentEditingBuild ? this.currentEditingBuild.id : this.generateId(),
            name: buildName,
            parts: selectedParts,
            totalCost: selectedParts.reduce((sum, part) => sum + part.price, 0),
            estimatedValue: selectedParts.reduce((sum, part) => sum + (part.marketValue || part.price * 1.3), 0),
            status: 'active', // active, completed, sold
            createdAt: this.currentEditingBuild ? this.currentEditingBuild.createdAt : new Date().toISOString()
        };

        if (this.currentEditingBuild) {
            const index = this.data.builds.findIndex(b => b.id === this.currentEditingBuild.id);
            this.data.builds[index] = buildData;
            this.showToast('Build aktualisiert');
        } else {
            this.data.builds.push(buildData);
            this.showToast('Build erstellt');
        }

        // Teile-Status aktualisieren
        selectedParts.forEach(part => {
            const partIndex = this.data.parts.findIndex(p => p.id === part.id);
            if (partIndex > -1) {
                this.data.parts[partIndex].status = 'in-build';
            }
        });

        this.currentBuildParts = [];
        this.saveData();
        this.closeModal(document.getElementById('buildModal'));
        this.renderBuilds();
        this.renderInventory();
    }

    // Bundle-Modal öffnen
    openBundleModal() {
        // TODO: Bundle-Funktionalität implementieren
        this.showToast('Bundle-Funktion wird noch implementiert', 'warning');
    }

    // Inventar filtern
    filterInventory(searchTerm = '', category = '') {
        const filteredParts = this.data.parts.filter(part => {
            const matchesSearch = !searchTerm || 
                part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                part.brand.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = !category || part.category === category;
            
            return matchesSearch && matchesCategory;
        });

        this.renderInventory(filteredParts);
    }

    // Hauptrenderfunktion
    render() {
        this.renderInventory();
        this.renderBuilds();
        this.renderBundles();
        this.updateFinanceOverview();
    }

    // Inventar rendern
    renderInventory(parts = null) {
        const container = document.getElementById('inventoryContent');
        const partsToRender = parts || this.data.parts;

        if (partsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-boxes"></i>
                    <h3>Kein Inventar vorhanden</h3>
                    <p>Fügen Sie Ihr erstes Teil hinzu</p>
                </div>
            `;
            return;
        }

        if (this.data.settings.viewMode === 'table') {
            this.renderInventoryTable(partsToRender);
        } else {
            this.renderInventoryCards(partsToRender);
        }
    }

    // Inventar als Tabelle rendern
    renderInventoryTable(parts) {
        const container = document.getElementById('inventoryContent');
        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Kategorie</th
                            <th>Marke</th>
                            <th>Einkaufspreis</th>
                            <th>Marktwert</th>
                            <th>Zustand</th>
                            <th>Status</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parts.map(part => `
                            <tr>
                                <td class="font-medium">${part.name}</td>
                                <td>${part.category}</td>
                                <td>${part.brand || '-'}</td>
                                <td>${this.formatCurrency(part.price)}</td>
                                <td>${this.formatCurrency(part.marketValue || 0)}</td>
                                <td>${part.condition}</td>
                                <td>
                                    <span class="status-badge status-${part.status}">
                                        ${this.getStatusText(part.status)}
                                    </span>
                                </td>
                                <td>
                                    <div class="table-actions">
                                        <button class="btn-icon" onclick="app.openPartModal(app.getPartById('${part.id}'))" title="Bearbeiten">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        ${part.status === 'available' ? `
                                            <button class="btn-icon btn-success" onclick="app.openSellModal(app.getPartById('${part.id}'))" title="Verkaufen">
                                                <i class="fas fa-dollar-sign"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn-icon btn-danger" onclick="app.deletePart('${part.id}')" title="Löschen">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Inventar als Karten rendern
    renderInventoryCards(parts) {
        const container = document.getElementById('inventoryContent');
        container.innerHTML = `
            <div class="cards-grid">
                ${parts.map(part => `
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">${part.name}</div>
                                <div class="card-subtitle">${part.brand || ''} ${part.category}</div>
                            </div>
                            <span class="status-badge status-${part.status}">
                                ${this.getStatusText(part.status)}
                            </span>
                        </div>
                        
                        <div class="card-content">
                            <div class="card-meta">
                                <div class="card-meta-item">
                                    <div class="card-meta-label">Einkaufspreis</div>
                                    <div class="card-meta-value">${this.formatCurrency(part.price)}</div>
                                </div>
                                <div class="card-meta-item">
                                    <div class="card-meta-label">Marktwert</div>
                                    <div class="card-meta-value">${this.formatCurrency(part.marketValue || 0)}</div>
                                </div>
                                <div class="card-meta-item">
                                    <div class="card-meta-label">Zustand</div>
                                    <div class="card-meta-value">${part.condition}</div>
                                </div>
                                <div class="card-meta-item">
                                    <div class="card-meta-label">Plattform</div>
                                    <div class="card-meta-value">${part.platform}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card-actions">
                            <button class="btn-secondary" onclick="app.openPartModal(app.getPartById('${part.id}'))">
                                <i class="fas fa-edit"></i> Bearbeiten
                            </button>
                            ${part.status === 'available' ? `
                                <button class="btn-success" onclick="app.openSellModal(app.getPartById('${part.id}'))">
                                    <i class="fas fa-dollar-sign"></i> Verkaufen
                                </button>
                            ` : ''}
                            <button class="btn-danger" onclick="app.deletePart('${part.id}')">
                                <i class="fas fa-trash"></i> Löschen
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Builds rendern
    renderBuilds() {
        const container = document.getElementById('buildsContent');

        if (this.data.builds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-desktop"></i>
                    <h3>Keine Builds vorhanden</h3>
                    <p>Erstellen Sie Ihren ersten Build</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="cards-grid">
                ${this.data.builds.map(build => {
                    const profit = build.estimatedValue - build.totalCost;
                    const margin = build.totalCost > 0 ? ((profit / build.totalCost) * 100) : 0;
                    
                    return `
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">${build.name}</div>
                                    <div class="card-subtitle">${build.parts.length} Teile</div>
                                </div>
                                <span class="status-badge status-${build.status}">
                                    ${this.getStatusText(build.status)}
                                </span>
                            </div>
                            
                            <div class="card-content">
                                <div class="card-meta">
                                    <div class="card-meta-item">
                                        <div class="card-meta-label">Gesamtkosten</div>
                                        <div class="card-meta-value">${this.formatCurrency(build.totalCost)}</div>
                                    </div>
                                    <div class="card-meta-item">
                                        <div class="card-meta-label">Geschätzter Wert</div>
                                        <div class="card-meta-value">${this.formatCurrency(build.estimatedValue)}</div>
                                    </div>
                                    <div class="card-meta-item">
                                        <div class="card-meta-label">Erwarteter Gewinn</div>
                                        <div class="card-meta-value ${profit >= 0 ? 'price-positive' : 'price-negative'}">
                                            ${this.formatCurrency(profit)}
                                        </div>
                                    </div>
                                    <div class="card-meta-item">
                                        <div class="card-meta-label">Marge</div>
                                        <div class="card-meta-value ${margin >= 0 ? 'price-positive' : 'price-negative'}">
                                            ${margin.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="build-parts-list">
                                    <h4>Teile:</h4>
                                    <div style="display: grid; gap: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">
                                        ${build.parts.map(part => `
                                            <div>${part.name} - ${this.formatCurrency(part.price)}</div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card-actions">
                                <button class="btn-secondary" onclick="app.openBuildModal(app.getBuildById('${build.id}'))">
                                    <i class="fas fa-edit"></i> Bearbeiten
                                </button>
                                <button class="btn-danger" onclick="app.deleteBuild('${build.id}')">
                                    <i class="fas fa-trash"></i> Löschen
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Build löschen
    deleteBuild(buildId) {
        if (confirm('Möchten Sie diesen Build wirklich löschen?')) {
            const build = this.data.builds.find(b => b.id === buildId);
            
            if (build) {
                // Teile wieder verfügbar machen
                build.parts.forEach(part => {
                    const partIndex = this.data.parts.findIndex(p => p.id === part.id);
                    if (partIndex > -1) {
                        this.data.parts[partIndex].status = 'available';
                    }
                });
                
                // Build löschen
                this.data.builds = this.data.builds.filter(b => b.id !== buildId);
                
                this.saveData();
                this.renderBuilds();
                this.renderInventory();
                this.showToast('Build gelöscht');
            }
        }
    }

    // Bundles rendern
    renderBundles() {
        const container = document.getElementById('bundlesContent');
        
        // Placeholder da Bundle-Funktionalität noch nicht vollständig implementiert
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-layer-group"></i>
                <h3>Bundle-Funktion</h3>
                <p>Diese Funktion wird in einer zukünftigen Version implementiert</p>
            </div>
        `;
    }

    // Finanzübersicht aktualisieren
    updateFinanceOverview() {
        const totalInvestment = this.data.parts.reduce((sum, part) => sum + part.price, 0) +
                              this.data.soldParts.reduce((sum, part) => sum + part.price, 0);
        
        const totalRevenue = this.data.soldParts.reduce((sum, part) => sum + part.sellPrice, 0);
        
        const totalProfit = this.data.soldParts.reduce((sum, part) => sum + part.profit, 0);
        
        const totalMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

        document.getElementById('totalInvestment').textContent = this.formatCurrency(totalInvestment);
        document.getElementById('totalRevenue').textContent = this.formatCurrency(totalRevenue);
        document.getElementById('totalProfit').textContent = this.formatCurrency(totalProfit);
        document.getElementById('totalMargin').textContent = totalMargin.toFixed(2) + '%';

        // Profit-Farbe setzen
        const profitElement = document.getElementById('totalProfit');
        profitElement.className = totalProfit >= 0 ? 'finance-value price-positive' : 'finance-value price-negative';

        const marginElement = document.getElementById('totalMargin');
        marginElement.className = totalMargin >= 0 ? 'finance-value price-positive' : 'finance-value price-negative';

        this.renderSoldPartsTable();
    }

    // Tabelle der verkauften Teile rendern
    renderSoldPartsTable() {
        const container = document.getElementById('soldPartsTable');
        
        if (this.data.soldParts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Noch keine Teile verkauft</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Teil</th>
                        <th>Einkaufspreis</th>
                        <th>Verkaufspreis</th>
                        <th>Gewinn/Verlust</th>
                        <th>Plattform</th>
                        <th>Verkaufsdatum</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.data.soldParts.map(part => `
                        <tr>
                            <td class="font-medium">${part.name}</td>
                            <td>${this.formatCurrency(part.price)}</td>
                            <td>${this.formatCurrency(part.sellPrice)}</td>
                            <td class="${part.profit >= 0 ? 'price-positive' : 'price-negative'}">
                                ${this.formatCurrency(part.profit)}
                            </td>
                            <td>${part.sellPlatform}</td>
                            <td>${this.formatDate(part.sellDate)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Hilfsfunktionen
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getPartById(id) {
        return this.data.parts.find(p => p.id === id);
    }

    getBuildById(id) {
        return this.data.builds.find(b => b.id === id);
    }

    getStatusText(status) {
        const statusMap = {
            available: 'Verfügbar',
            sold: 'Verkauft',
            'in-build': 'Im Build',
            active: 'Aktiv',
            completed: 'Fertig',
            inactive: 'Inaktiv'
        };
        return statusMap[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('de-DE');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Beispieldaten laden
    loadExampleData() {
        if (this.data.parts.length > 0) return; // Nur laden wenn keine Daten vorhanden

        this.data.parts = [
            {
                id: 'part_001',
                name: 'AMD Ryzen 5 3600',
                category: 'CPU',
                brand: 'AMD',
                price: 180.00,
                marketValue: 220.00,
                condition: 'Sehr gut',
                platform: 'eBay',
                purchaseDate: '2024-01-15',
                status: 'available',
                createdAt: '2024-01-15T10:00:00Z'
            },
            {
                id: 'part_002',
                name: 'RTX 3070 Gaming OC',
                category: 'GPU',
                brand: 'Gigabyte',
                price: 450.00,
                marketValue: 520.00,
                condition: 'Wie neu',
                platform: 'eBay Kleinanzeigen',
                purchaseDate: '2024-01-20',
                status: 'available',
                createdAt: '2024-01-20T14:30:00Z'
            },
            {
                id: 'part_003',
                name: 'Corsair Vengeance 16GB DDR4',
                category: 'RAM',
                brand: 'Corsair',
                price: 65.00,
                marketValue: 85.00,
                condition: 'Neu',
                platform: 'Amazon',
                purchaseDate: '2024-01-22',
                status: 'available',
                createdAt: '2024-01-22T09:15:00Z'
            },
            {
                id: 'part_004',
                name: 'MSI B450 Tomahawk Max',
                category: 'Mainboard',
                brand: 'MSI',
                price: 95.00,
                marketValue: 120.00,
                condition: 'Gut',
                platform: 'Hardwareluxx',
                purchaseDate: '2024-01-25',
                status: 'available',
                createdAt: '2024-01-25T16:45:00Z'
            },
            {
                id: 'part_005',
                name: 'Samsung 970 EVO 1TB',
                category: 'Storage',
                brand: 'Samsung',
                price: 85.00,
                marketValue: 110.00,
                condition: 'Sehr gut',
                platform: 'eBay',
                purchaseDate: '2024-02-01',
                status: 'available',
                createdAt: '2024-02-01T11:20:00Z'
            }
        ];

        // Beispiel verkauftes Teil
        this.data.soldParts = [
            {
                id: 'sold_001',
                name: 'Intel i5-9400F',
                category: 'CPU',
                brand: 'Intel',
                price: 120.00,
                sellPrice: 150.00,
                profit: 30.00,
                sellPlatform: 'eBay',
                sellDate: '2024-02-10',
                soldAt: '2024-02-10T18:30:00Z'
            }
        ];

        // Beispiel Build
        this.data.builds = [
            {
                id: 'build_001',
                name: 'Gaming Build #1',
                parts: [
                    this.data.parts.find(p => p.id === 'part_001'),
                    this.data.parts.find(p => p.id === 'part_002')
                ],
                totalCost: 630.00,
                estimatedValue: 740.00,
                status: 'active',
                createdAt: '2024-02-05T12:00:00Z'
            }
        ];

        // Status der Teile im Build aktualisieren
        this.data.parts.find(p => p.id === 'part_001').status = 'in-build';
        this.data.parts.find(p => p.id === 'part_002').status = 'in-build';

        this.saveData();
    }

    // Daten speichern (localStorage als Fallback für GitHub-Integration)
    saveData() {
        try {
            localStorage.setItem('pcFlippingData', JSON.stringify(this.data));
            // TODO: GitHub-Integration hier implementieren
        } catch (error) {
            console.error('Fehler beim Speichern der Daten:', error);
            this.showToast('Fehler beim Speichern', 'error');
        }
    }

    // Daten laden
    loadData() {
        try {
            const savedData = localStorage.getItem('pcFlippingData');
            if (savedData) {
                this.data = { ...this.data, ...JSON.parse(savedData) };
            }
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            this.showToast('Fehler beim Laden der Daten', 'error');
        }
    }

    // GitHub-Integration (Placeholder für zukünftige Implementierung)
    async syncWithGitHub() {
        // TODO: GitHub API Integration
        // - Repository erstellen/zugreifen
        // - Daten als JSON in Repository speichern
        // - Konfliktbehandlung bei gleichzeitigen Änderungen
        console.log('GitHub-Sync wird in einer zukünftigen Version implementiert');
    }
}

// App initialisieren
const app = new PCFlippingManager();

// Service Worker für Offline-Funktionalität (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registriert:', registration))
        .catch(error => console.log('SW Registrierung fehlgeschlagen:', error));
}

// Globale Event Listener für Tastaturkürzel
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N für neues Teil
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        app.openPartModal();
    }
    
    // ESC zum Schließen von Modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            app.closeModal(modal);
        });
    }
});

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Export für mögliche Erweiterungen
window.PCFlippingManager = PCFlippingManager;
