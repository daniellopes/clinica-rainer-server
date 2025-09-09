const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ Server is running:', data);
    return true;
  } catch (error) {
    console.log('❌ Server not reachable:', error.message);
    return false;
  }
};

testConnection();
