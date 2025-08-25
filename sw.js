// Service Worker für PC Flipping Manager
const CACHE_NAME = 'pc-flipping-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Installation
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Fetch-Events abfangen
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - gib Antwort zurück
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// GitHub API Integration (in app.js ergänzen)
class GitHubSync {
    constructor(token, repo, owner) {
        this.token = token;
        this.repo = repo;
        this.owner = owner;
        this.apiBase = 'https://api.github.com';
    }

    async saveToGitHub(data) {
        const content = btoa(JSON.stringify(data, null, 2));
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/data.json`;
        
        try {
            // Aktuelle Datei laden für SHA
            const currentFile = await fetch(url, {
                headers: { 'Authorization': `token ${this.token}` }
            });
            
            const sha = currentFile.ok ? (await currentFile.json()).sha : undefined;
            
            // Datei updaten
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update data ${new Date().toISOString()}`,
                    content: content,
                    sha: sha
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('GitHub sync error:', error);
            return false;
        }
    }

    async loadFromGitHub() {
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/data.json`;
        
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `token ${this.token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content);
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('GitHub load error:', error);
        }
        
        return null;
    }
}
