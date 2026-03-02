// Authentication and RBAC Logic (v1.2)

class AuthManager {
    constructor() {
        this.userKey = 'it_inventory_users';
        this.sessionKey = 'it_inventory_session';
        this.initUsers();
    }

    initUsers() {
        if (!localStorage.getItem(this.userKey)) {
            const defaultUsers = [
                { id: 'u1', username: 'admin', password: '123', role: 'admin', fullName: 'System Administrator', created: new Date().toLocaleDateString() },
                { id: 'u2', username: 'staff', password: '123', role: 'staff', fullName: 'Office Staff', created: new Date().toLocaleDateString() }
            ];
            localStorage.setItem(this.userKey, JSON.stringify(defaultUsers));
        }
    }

    login(username, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem(this.sessionKey, JSON.stringify({
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                loginTime: new Date().toISOString()
            }));
            return true;
        }
        return false;
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.href = 'login.html';
    }

    getCurrentUser() {
        const session = localStorage.getItem(this.sessionKey);
        return session ? JSON.parse(session) : null;
    }

    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    enforceRBAC() {
        const isLoginPage = window.location.href.includes('login.html');
        if (!this.isAuthenticated() && !isLoginPage) {
            window.location.href = 'login.html';
            return;
        }

        const user = this.getCurrentUser();
        if (!user) return;

        // Apply admin-only restrictions
        const adminElements = document.querySelectorAll('.admin-only');
        if (user.role !== 'admin') {
            adminElements.forEach(el => el.classList.add('hidden'));

            // Block protected pages
            if (window.location.href.includes('users.html')) {
                window.location.href = 'index.html';
            }
        } else {
            adminElements.forEach(el => el.classList.remove('hidden'));
        }
    }

    getAllUsers() {
        return JSON.parse(localStorage.getItem(this.userKey)) || [];
    }

    addUser(username, fullName, password, role) {
        if (!this.isAdmin()) return false;
        const users = this.getAllUsers();
        if (users.find(u => u.username === username)) return { error: 'Username already exists' };

        users.push({
            id: 'U-' + Date.now(),
            username,
            fullName,
            password,
            role,
            created: new Date().toLocaleDateString()
        });
        localStorage.setItem(this.userKey, JSON.stringify(users));
        return { success: true };
    }

    deleteUser(username) {
        if (!this.isAdmin() || username === 'admin') return false;
        let users = this.getAllUsers();
        users = users.filter(u => u.username !== username);
        localStorage.setItem(this.userKey, JSON.stringify(users));
        return true;
    }

    updateUserPassword(username, newPassword) {
        if (!this.isAdmin()) return false;
        let users = this.getAllUsers();
        const user = users.find(u => u.username === username);
        if (user) {
            user.password = newPassword;
            localStorage.setItem(this.userKey, JSON.stringify(users));
            return true;
        }
        return false;
    }
}

const auth = new AuthManager();

// Run check on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.enforceRBAC();

    const profileName = document.getElementById('user-profile-name');
    if (profileName && auth.isAuthenticated()) {
        profileName.innerText = auth.getCurrentUser().fullName;
    }
});
