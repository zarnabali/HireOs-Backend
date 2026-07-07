fetch('http://localhost:4000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: `newuser-${Date.now()}@example.com`,
    password: 'Password123!',
    fullName: 'Test User',
    role: 'candidate'
  })
}).then(r => r.json()).then(console.log).catch(console.error);
