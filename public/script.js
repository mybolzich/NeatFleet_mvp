async function loadHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    document.getElementById('health').textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    document.getElementById('health').textContent = `Error: ${error.message}`;
  }
}

loadHealth();
