const API_URL = 'https://studdybuddy-server-dzeub9g9e5dag4e2.uaenorth-01.azurewebsites.net'; // Update this URL when deploying to Azure

// ---------- Utility Functions for Token Storage ----------
function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

// ---------- DOM Elements ----------
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const userNameDisplay = document.getElementById('user-name-display');
const profileForm = document.getElementById('profile-form');
const profileNameInput = document.getElementById('profile-name');

// Navigation and Content Sections
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');

// ---------- Login / Logout ----------
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('login-name').value.trim();
  const email = document.getElementById('login-email').value.trim();
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      showApp();
    } else {
      alert('Login failed: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Error logging in.');
  }
});

logoutButton.addEventListener('click', () => {
  removeToken();
  location.reload();
});

// ---------- Navigation Tab Switching ----------
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    contentSections.forEach(sec => sec.classList.remove('active'));
    link.classList.add('active');
    const sectionId = link.getAttribute('data-section');
    document.getElementById(sectionId).classList.add('active');
  });
});

// ---------- Show Application After Login ----------
async function showApp() {
  // Fetch profile to display user info
  try {
    const res = await fetch(`${API_URL}/api/profile`, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const user = await res.json();
    userNameDisplay.textContent = user.name;
    profileNameInput.value = user.name;
  } catch (err) {
    console.error('Error fetching profile:', err);
  }
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  updateDashboardStats();
  loadAssignments();
  loadChat();
}

// ---------- Dashboard Stats Update ----------
async function updateDashboardStats() {
  try {
    const assignmentsRes = await fetch(`${API_URL}/api/assignments`, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const assignments = await assignmentsRes.json();
    document.getElementById('assignments-count').textContent = assignments.length;
    
    const chatRes = await fetch(`${API_URL}/api/chat`, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const chatMessages = await chatRes.json();
    document.getElementById('chat-count').textContent = chatMessages.length;
  } catch (err) {
    console.error(err);
  }
}

// ---------- Assignments Management ----------
const assignmentForm = document.getElementById('assignment-form');
const assignmentList = document.getElementById('assignment-list');

assignmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('assignment-title').value.trim();
  const due = document.getElementById('assignment-due').value;
  try {
    await fetch(`${API_URL}/api/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ title, due })
    });
    document.getElementById('assignment-title').value = '';
    document.getElementById('assignment-due').value = '';
    loadAssignments();
    updateDashboardStats();
  } catch (err) {
    console.error(err);
  }
});

async function loadAssignments() {
  try {
    const res = await fetch(`${API_URL}/api/assignments`, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const assignments = await res.json();
    assignmentList.innerHTML = '';
    assignments.forEach(assignment => {
      const li = document.createElement('li');
      li.textContent = `${assignment.title} – Due: ${assignment.due}`;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', async () => {
        await fetch(`${API_URL}/api/assignments/${assignment.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        loadAssignments();
        updateDashboardStats();
      });
      li.appendChild(removeBtn);
      assignmentList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------- Chat Functionality ----------
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatBox = document.getElementById('chat-box');

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  try {
    await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ text })
    });
    chatInput.value = '';
    loadChat();
    updateDashboardStats();
  } catch (err) {
    console.error(err);
  }
});

async function loadChat() {
  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const messages = await res.json();
    chatBox.innerHTML = '';
    messages.forEach(msg => {
      const div = document.createElement('div');
      div.classList.add('chat-message');
      div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text}`;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    console.error(err);
  }
}

// ---------- Profile Update ----------
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = profileNameInput.value.trim();
  try {
    const res = await fetch(`${API_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ name })
    });
    const user = await res.json();
    userNameDisplay.textContent = user.name;
    alert('Profile updated!');
    updateDashboardStats();
  } catch (err) {
    console.error(err);
  }
});

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', () => {
  if (getToken()) {
    showApp();
  }
});