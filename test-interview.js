const WebSocket = require('ws');

// Test WebSocket connection to interview endpoint
console.log('Testing WebSocket connection to interview endpoint...');

// Test interview ID 1 (assuming this exists or will be created)
const ws = new WebSocket('ws://localhost:4000/interview/1');

ws.on('open', function open() {
  console.log('✅ WebSocket connection established');

  // Test sending a user message to start the interview
  console.log('📤 Sending test message to start interview...');
  ws.send(JSON.stringify({
    type: 'user_message',
    content: 'Hello, I am ready to start the interview'
  }));
});

ws.on('message', function message(data) {
  console.log('📥 Received message from server:');
  try {
    const parsed = JSON.parse(data);
    console.log(JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('Raw message:', data.toString());
  }
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err.message);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
  process.exit(0);
});

// Close connection after 10 seconds for testing
setTimeout(() => {
  console.log('⏰ Closing connection after test...');
  ws.close();
}, 10000);