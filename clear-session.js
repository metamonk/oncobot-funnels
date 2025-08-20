/**
 * Script to manually clear all authentication sessions
 * Run this in the browser console to start from an unauthorized state
 */

function clearAllAuthSessions() {
  console.log('🧹 Starting session cleanup...');
  
  // 1. Clear all cookies
  console.log('📦 Clearing cookies...');
  document.cookie.split(";").forEach(function(c) { 
    const cookie = c.trim();
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    
    // Clear cookie for all paths and domains
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    
    // Also try localhost variations
    if (window.location.hostname === 'localhost') {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.localhost";
    }
  });
  
  // List of specific auth-related cookies to ensure they're cleared
  const authCookies = [
    'better-auth.session_token',
    'better-auth.session',
    'better-auth.csrf',
    'better-auth.session.token',
    'auth.session-token',
    'auth.session',
    '__session',
    'session',
    'connect.sid'
  ];
  
  authCookies.forEach(name => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
  });
  
  // 2. Clear localStorage
  console.log('💾 Clearing localStorage...');
  localStorage.clear();
  
  // 3. Clear sessionStorage
  console.log('🗂️ Clearing sessionStorage...');
  sessionStorage.clear();
  
  // 4. Clear IndexedDB (if used)
  console.log('🗄️ Clearing IndexedDB...');
  if (window.indexedDB) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
        console.log(`  Deleted IndexedDB: ${db.name}`);
      });
    }).catch(e => console.log('  IndexedDB clear skipped:', e.message));
  }
  
  // 5. Clear any service worker caches
  if ('caches' in window) {
    console.log('📦 Clearing service worker caches...');
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log(`  Deleted cache: ${name}`);
      });
    });
  }
  
  console.log('✅ Session cleanup complete!');
  console.log('🔄 Refreshing page in 2 seconds...');
  
  // Refresh the page after a short delay
  setTimeout(() => {
    window.location.href = '/';
  }, 2000);
}

// Execute the function
clearAllAuthSessions();