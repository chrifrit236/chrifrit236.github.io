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
        this.currentBuildParts = [];
        
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
            document.getElementById('darkModeToggle').textContent = '☀️';
        } else {
            document.body.removeAttribute('data-theme');
            document.getElementById('darkModeToggle').textContent = '🌙';
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
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    // Modal schließen
    closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
        this.currentEditingPart = null;
        this.currentEditingBuild = null;
        this.currentSellPart = null;
        this.currentBuildParts = [];
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
        const partData = {
            id: this.currentEditingPart ? this.currentEditingPart.id : this.generateId(),
            name: document.getElementById('partName').value.trim(),
            category: document.getElementById('partCategory').value,
            brand: document.getElementById('partBrand').value,
            price: parseFloat(document.getElementById('partPrice').value) || 0,
            condition: document.getElementById('partCondition').value,
            platform: document.getElementById('partPlatform').value,
            purchaseDate: document.getElementById('partPurchaseDate').value,
            marketValue: parseFloat(document.getElementById('partMarketValue').value) || 0,
            status: this.currentEditingPart ? this.currentEditingPart.status : 'available',
            createdAt: this.currentEditingPart ? this.currentEditingPart.createdAt : new Date().toISOString()
        };

        // Validation
        if (!partData.name || !partData.category || partData.price <= 0) {
            this.showToast('Bitte füllen Sie alle Pflichtfelder aus', 'error');
            return;
        }

        if (this.currentEditingPart) {
            const index = this.data.parts.findIndex(p => p.id === this.currentEditingPart.id);
            if (index !== -1) {
                this.data.parts[index] = partData;
                this.showToast('Teil aktualisiert');
            }
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
            const part = this.data.parts.find(p => p.id === partId);
            if (part && part.status === 'in-build') {
                this.showToast('Teile in Builds können nicht gelöscht werden', 'error');
                return;
            }

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
        document.getElementById('sellPrice').value = part.marketValue || part.price * 1.2;
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

        if (sellPrice <= 0) {
            this.showToast('Bitte gültigen Verkaufspreis eingeben', 'error');
            return;
        }

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

        // Teil aus Builds entfernen falls vorhanden
        this.data.builds.forEach(build => {
            build.parts = build.parts.filter(p => p.id !== this.currentSellPart.id);
        });

        this.saveData();
        this.closeModal(document.getElementById('sellModal'));
        this.renderInventory();
        this.renderBuilds();
        this.updateFinanceOverview();
        this.showToast(`Teil für ${this.formatCurrency(sellPrice)} verkauft! Gewinn: ${this.formatCurrency(soldPart.profit)}`);
    }

    // Rest der JavaScript-Methoden folgen im nächsten Teil...
