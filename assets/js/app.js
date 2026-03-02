// Advanced Asset Management Logic

class AssetManager {
    constructor() {
        this.storageKey = 'it_assets_inventory';
        this.stolenKey = 'it_stolen_inventory';
        this.categoryKey = 'it_inventory_categories';

        this.initCategories();
        this.assets = this.loadData(this.storageKey);
        this.stolenItems = this.loadData(this.stolenKey);
    }

    // --- Category Management ---
    initCategories() {
        const cats = localStorage.getItem(this.categoryKey);
        if (!cats) {
            const defaults = ['Laptop', 'Desktop', 'Smartphone', 'Monitor', 'UPS', 'Laptop Bag', 'Charger', 'Network Switch', 'Dongle', 'Keyboard Mice', 'Cables', 'Other'];
            localStorage.setItem(this.categoryKey, JSON.stringify(defaults));
        }
    }

    getCategories() {
        return JSON.parse(localStorage.getItem(this.categoryKey)) || [];
    }

    addCategory(name) {
        const cats = this.getCategories();
        if (!cats.includes(name)) {
            cats.push(name);
            localStorage.setItem(this.categoryKey, JSON.stringify(cats));
        }
    }

    removeCategory(name) {
        let cats = this.getCategories();
        cats = cats.filter(c => c !== name);
        localStorage.setItem(this.categoryKey, JSON.stringify(cats));
    }

    // --- Core Data Loading ---
    loadData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.assets));
        localStorage.setItem(this.stolenKey, JSON.stringify(this.stolenItems));
    }

    // --- Assets (New Fields: quantity, receivedDate, dispatchedDate, company) ---
    addAsset(data) {
        const asset = {
            id: 'AST-' + Date.now(),
            assetCode: data.assetCode || '',
            name: data.name,
            category: data.category,
            department: data.department || '',
            serialNumber: data.serialNumber || '',
            quantity: parseInt(data.quantity) || 1,
            company: data.company || '',
            assignedTo: data.assignedTo || '',
            receivedDate: data.receivedDate || '',
            dispatchedDate: data.dispatchedDate || '',
            status: data.status,
            purchaseDate: data.purchaseDate || '',
            notes: data.notes || '',
            dateAdded: new Date().toISOString()
        };
        this.assets.push(asset);
        this.save();
        return asset;
    }

    updateAsset(id, data) {
        const index = this.assets.findIndex(a => a.id === id);
        if (index !== -1) {
            this.assets[index] = {
                ...this.assets[index],
                ...data,
                quantity: parseInt(data.quantity) || 1
            };
            this.save();
            return true;
        }
        return false;
    }

    deleteAsset(id) {
        this.assets = this.assets.filter(a => a.id !== id);
        this.save();
    }

    // --- Stolen Items ---
    addStolen(item) {
        const stolen = {
            id: Date.now().toString(),
            dateReported: new Date().toISOString(),
            ...item
        };
        this.stolenItems.push(stolen);
        this.save();
    }

    deleteStolen(id) {
        this.stolenItems = this.stolenItems.filter(s => s.id !== id);
        this.save();
    }

    // --- Statistics & Filtering ---
    getStats() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const stats = {
            total: this.assets.length,
            totalQuantity: this.assets.reduce((sum, a) => sum + parseInt(a.quantity || 0), 0),
            stolenCount: this.stolenItems.length,
            weeklyAdded: this.assets.filter(a => new Date(a.dateAdded) >= oneWeekAgo).length,
            monthlyAdded: this.assets.filter(a => new Date(a.dateAdded) >= oneMonthAgo).length,
            byCategory: {},
            byStatus: { 'In Use': 0, 'In Stock': 0, 'In Repair': 0, 'Broken': 0 }
        };

        this.assets.forEach(a => {
            stats.byCategory[a.category] = (stats.byCategory[a.category] || 0) + 1;
            if (stats.byStatus.hasOwnProperty(a.status)) stats.byStatus[a.status]++;
        });

        return stats;
    }

    getAllAssets() { return this.assets; }
    getAllStolen() { return this.stolenItems; }
    getAsset(id) { return this.assets.find(a => a.id === id); }
}

const inventory = new AssetManager();
