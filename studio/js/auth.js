// auth.js - Authentication system for 4K Studio
// Users: MnkyBr8n (admin), 4k (editor)
// Password requirements: min 6 chars, must include number + special character

const AUTH_KEY = '4k_studio_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// User database (in production, this should be server-side)
const USERS = {
  'MnkyBr8n': {
    username: 'MnkyBr8n',
    password: 'Admin123!', // Default - user should change
    role: 'admin',
    displayName: 'Admin'
  },
  '4k': {
    username: '4k',
    password: '4kArt1!', // Default - user should change
    role: 'editor',
    displayName: '4K Artist'
  }
};

// Password validation
export function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasNumber) {
    return { valid: false, error: 'Password must include at least one number' };
  }
  
  if (!hasSpecial) {
    return { valid: false, error: 'Password must include at least one special character (!@#$%^&*...)' };
  }
  
  return { valid: true };
}

// Login function
export function login(username, password) {
  const user = USERS[username];
  
  if (!user) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  // Create session
  const session = {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    loginTime: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };
  
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  
  return { success: true, user: session };
}

// Logout function
export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

// Check if user is logged in
export function isAuthenticated() {
  const sessionData = localStorage.getItem(AUTH_KEY);
  
  if (!sessionData) {
    return false;
  }
  
  try {
    const session = JSON.parse(sessionData);
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    
    return true;
  } catch (e) {
    localStorage.removeItem(AUTH_KEY);
    return false;
  }
}

// Get current user
export function getCurrentUser() {
  const sessionData = localStorage.getItem(AUTH_KEY);
  
  if (!sessionData) {
    return null;
  }
  
  try {
    const session = JSON.parse(sessionData);
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    
    return session;
  } catch (e) {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

// Require authentication (call this at the top of protected pages)
export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Change password
export function changePassword(username, oldPassword, newPassword) {
  const user = USERS[username];
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (user.password !== oldPassword) {
    return { success: false, error: 'Current password is incorrect' };
  }
  
  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // Update password (Note: In production, this should update a database)
  user.password = newPassword;
  
  // Update localStorage users (temporary solution)
  const usersData = localStorage.getItem('4k_studio_users') || JSON.stringify(USERS);
  const users = JSON.parse(usersData);
  if (users[username]) {
    users[username].password = newPassword;
    localStorage.setItem('4k_studio_users', JSON.stringify(users));
  }
  
  return { success: true };
}

// Initialize users in localStorage on first run
export function initializeUsers() {
  const usersData = localStorage.getItem('4k_studio_users');
  if (!usersData) {
    localStorage.setItem('4k_studio_users', JSON.stringify(USERS));
  } else {
    // Load users from localStorage
    const storedUsers = JSON.parse(usersData);
    Object.assign(USERS, storedUsers);
  }
}

// Auto-initialize on module load
initializeUsers();
