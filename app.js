// app.js (ES6 Modular)
import { Inventory } from './modules/inventory.js';
import { Builds } from './modules/builds.js';
import { Bundles } from './modules/bundles.js';
import { Finance } from './modules/finance.js';

// Dark Mode Toggle
const toggleBtn = document.getElementById('toggleDark');
toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// Tab Navigation
document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Initialisiere Module
Inventory.init();
Builds.init();
Bundles.init();
Finance.init();
