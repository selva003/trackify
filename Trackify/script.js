// Simple pure JS logic for Trackify using localStorage

// --- Helper Functions ---
function getHabits() {
    let habits = localStorage.getItem('trackify_habits');
    if (habits) {
        return JSON.parse(habits);
    } else {
        return [];
    }
}

function saveHabits(habits) {
    localStorage.setItem('trackify_habits', JSON.stringify(habits));
}

// Check logged in status for protected pages
function checkAuth() {
    const currentUser = localStorage.getItem('trackify_loggedInUser');
    const path = window.location.pathname;
    
    // If not logged in and not on login/signup page
    if (!currentUser && !path.includes('login.html') && !path.includes('signup.html')) {
        // Just fail safe for local dev
        if (window.location.protocol === 'file:') {
            const newPath = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/login.html';
            window.location.href = newPath;
        } else {
            window.location.href = 'login.html';
        }
    }
}

// --- Page Specific Logic ---

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // 1. Signup Page
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('signupUsername').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            const messageEl = document.getElementById('signupMessage');

            if (password !== confirmPassword) {
                messageEl.textContent = "Passwords do not match!";
                messageEl.className = "error";
                return;
            }

            // Save user to localStorage (simple array)
            let users = JSON.parse(localStorage.getItem('trackify_users')) || [];
            
            // Basic check if username exists
            let exists = users.find(u => u.username === username);
            if (exists) {
                messageEl.textContent = "Username already exists!";
                messageEl.className = "error";
                return;
            }

            users.push({ username, email, password });
            localStorage.setItem('trackify_users', JSON.stringify(users));

            messageEl.textContent = "Registration successful! Redirecting to login...";
            messageEl.className = "message";
            
            setTimeout(() => {
                if (window.location.protocol === 'file:') {
                    const newPath = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/login.html';
                    window.location.href = newPath;
                } else {
                    window.location.href = 'login.html';
                }
            }, 1500);
        });
    }

    // 2. Login Page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Redirect to home if already logged in
        if (localStorage.getItem('trackify_loggedInUser')) {
            if (window.location.protocol === 'file:') {
                const newPath = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/home.html';
                window.location.href = newPath;
            } else {
                window.location.href = 'home.html';
            }
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            let users = JSON.parse(localStorage.getItem('trackify_users')) || [];
            let user = users.find(u => u.username === username && u.password === password);

            if (user) {
                localStorage.setItem('trackify_loggedInUser', username);
                if (window.location.protocol === 'file:') {
                    const newPath = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/home.html';
                    window.location.href = newPath;
                } else {
                    window.location.href = 'home.html';
                }
            } else {
                alert("Invalid username or password");
            }
        });
    }

    // Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('trackify_loggedInUser');
            if (window.location.protocol === 'file:') {
                const newPath = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/login.html';
                window.location.href = newPath;
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // 3. Home Page - Habit Management
    const habitForm = document.getElementById('habitForm');
    const habitList = document.getElementById('habitList');

    if (habitForm && habitList) {
        displayHabits();

        habitForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('habitId').value;
            const name = document.getElementById('habitName').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const currentUser = localStorage.getItem('trackify_loggedInUser');

            let habits = getHabits();

            if (id) {
                // Edit existing
                const index = habits.findIndex(h => h.id == id);
                if (index !== -1) {
                    habits[index].name = name;
                    habits[index].startDate = startDate;
                    habits[index].endDate = endDate;
                }
            } else {
                // Add new
                const newHabit = {
                    id: Date.now().toString(),
                    username: currentUser,
                    name: name,
                    startDate: startDate,
                    endDate: endDate,
                    completedDays: 0 // simple tracking
                };
                habits.push(newHabit);
            }

            saveHabits(habits);
            habitForm.reset();
            document.getElementById('habitId').value = '';
            document.getElementById('saveHabitBtn').textContent = 'Add Habit';
            document.getElementById('cancelEditBtn').style.display = 'none';
            displayHabits();
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            habitForm.reset();
            document.getElementById('habitId').value = '';
            document.getElementById('saveHabitBtn').textContent = 'Add Habit';
            document.getElementById('cancelEditBtn').style.display = 'none';
        });
    }

    // Display Habits
    function displayHabits() {
        const list = document.getElementById('habitList');
        if (!list) return;
        
        list.innerHTML = '';
        const habits = getHabits();
        const currentUser = localStorage.getItem('trackify_loggedInUser');
        const myHabits = habits.filter(h => h.username === currentUser);

        if (myHabits.length === 0) {
            list.innerHTML = '<p>No habits yet. Add one above!</p>';
            return;
        }

        myHabits.forEach(habit => {
            const li = document.createElement('li');
            li.className = 'habit-item';
            
            // Calculate total days
            const start = new Date(habit.startDate);
            const end = new Date(habit.endDate);
            let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (totalDays <= 0 || isNaN(totalDays)) totalDays = 1;

            li.innerHTML = `
                <div class="habit-details">
                    <p><strong>${habit.name}</strong></p>
                    <p><small>${habit.startDate} to ${habit.endDate}</small></p>
                    <button class="status-btn" onclick="incrementProgress('${habit.id}', ${totalDays})">Mark Day Done</button>
                    <small> (Done: ${habit.completedDays || 0}/${totalDays} days)</small>
                </div>
                <div class="habit-actions">
                    <button class="btn-edit" onclick="editHabit('${habit.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteHabit('${habit.id}')">Delete</button>
                </div>
            `;
            list.appendChild(li);
        });
    }

    // 4. Analyse Page
    const analysisContent = document.getElementById('analysisContent');
    if (analysisContent) {
        displayAnalysis();
    }

    function displayAnalysis() {
        const content = document.getElementById('analysisContent');
        if (!content) return;
        
        content.innerHTML = '';
        const habits = getHabits();
        const currentUser = localStorage.getItem('trackify_loggedInUser');
        const myHabits = habits.filter(h => h.username === currentUser);

        if (myHabits.length === 0) {
            content.innerHTML = '<p>No habits to analyse.</p>';
            return;
        }

        myHabits.forEach(habit => {
            // Calculate percentage
            const start = new Date(habit.startDate);
            const end = new Date(habit.endDate);
            let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (totalDays <= 0 || isNaN(totalDays)) totalDays = 1;

            let compDays = habit.completedDays || 0;
            if(compDays > totalDays) compDays = totalDays; // cap it

            let percentage = Math.round((compDays / totalDays) * 100);

            const div = document.createElement('div');
            div.className = 'analysis-item';
            div.innerHTML = `
                <p><strong>${habit.name}</strong> - ${percentage}% Completed (${compDays}/${totalDays} days)</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percentage}%">${percentage}%</div>
                </div>
            `;
            content.appendChild(div);
        });
    }
});

// Global functions for inline onclick handlers
window.deleteHabit = function(id) {
    if (confirm('Are you sure you want to delete this habit?')) {
        let habits = getHabits();
        habits = habits.filter(h => h.id !== id);
        saveHabits(habits);
        window.location.reload(); 
    }
}

window.editHabit = function(id) {
    const habits = getHabits();
    const habit = habits.find(h => h.id === id);
    if (habit) {
        document.getElementById('habitId').value = habit.id;
        document.getElementById('habitName').value = habit.name;
        document.getElementById('startDate').value = habit.startDate;
        document.getElementById('endDate').value = habit.endDate;
        
        document.getElementById('saveHabitBtn').textContent = 'Update Habit';
        document.getElementById('cancelEditBtn').style.display = 'inline-block';
        
        // scroll to form
        document.getElementById('habitForm').scrollIntoView();
    }
}

window.incrementProgress = function(id, totalDays) {
    let habits = getHabits();
    const index = habits.findIndex(h => h.id === id);
    if (index !== -1) {
        let compDays = habits[index].completedDays || 0;
        if (compDays < totalDays) {
            habits[index].completedDays = compDays + 1;
            saveHabits(habits);
            window.location.reload();
        } else {
            alert('Habit already fully completed for its duration!');
        }
    }
}
