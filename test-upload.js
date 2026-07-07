const fs = require('fs');

async function run() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZjY0MDU0ZS03MTQ0LTQ4OGMtODE2Yi1kOGMwNTQ4NDU3NDIiLCJlbWFpbCI6Im5ld3VzZXItMTc4MzQ0MTA4ODQyNkBleGFtcGxlLmNvbSIsInJvbGUiOiJjYW5kaWRhdGUiLCJjb21wYW55SWRzIjpbXSwiaWF0IjoxNzgzNDQxMTAwLCJleHAiOjE3ODM0NDIwMDAsImF1ZCI6ImhpcmVvcy1hcHAiLCJpc3MiOiJoaXJlb3MtYmFja2VuZCJ9.Ma9n3qM7DJkJ1DzSdghzOEXr_I3Oj7CPoHRyENW-wwM';
  
  fs.writeFileSync('dummy.pdf', '%PDF-1.4 dummy content');
  
  const form = new FormData();
  const fileBlob = new Blob([fs.readFileSync('dummy.pdf')], { type: 'application/pdf' });
  form.append('file', fileBlob, 'dummy.pdf');
  
  try {
    const res = await fetch('http://localhost:4000/api/v1/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });
    
    const text = await res.text();
    console.log(res.status, text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
