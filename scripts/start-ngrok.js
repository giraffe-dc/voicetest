#!/usr/bin/env node
const ngrok = require('ngrok');

const port = process.env.PORT || 3000;
const authtoken = process.env.NGROK_AUTHTOKEN || undefined;

(async () => {
  try {
    console.log(`Starting ngrok tunnel to http://localhost:${port} ...`);
    const url = await ngrok.connect({ addr: Number(port), authtoken });
    console.log(`ngrok tunnel established: ${url}`);
    console.log('Open this URL on your mobile device to test microphone access (HTTPS).');
    console.log('Press Ctrl+C to stop ngrok.');
  } catch (err) {
    console.error('Failed to start ngrok:', err && err.message ? err.message : err);
    if (err && err.response) {
      try {
        console.error('ngrok response status:', err.response.statusCode, err.response.statusMessage);
        // Try to read body if present
        if (err.response.body) console.error('ngrok response body:', err.response.body);
      } catch (e) {
        // ignore
      }
    }

    // If we attempted with an explicit auth token, try a fallback without providing it
    if (authtoken) {
      console.log('Retrying ngrok connect without provided auth token (will use local ngrok config if available)...');
      try {
        const url = await ngrok.connect({ addr: Number(port) });
        console.log(`ngrok tunnel established (fallback): ${url}`);
        console.log('Open this URL on your mobile device to test microphone access (HTTPS).');
        console.log('Press Ctrl+C to stop ngrok.');
        return;
      } catch (err2) {
        console.error('Fallback attempt failed:', err2 && err2.message ? err2.message : err2);
        try {
          if (err2 && err2.response) {
            console.error('ngrok fallback response status:', err2.response.statusCode, err2.response.statusMessage);
            // attempt to log body safely
            if (Object.prototype.hasOwnProperty.call(err2.response, 'body') && err2.response.body) {
              console.error('ngrok fallback response body:', err2.response.body);
            } else if (err2.response.headers) {
              console.error('ngrok fallback response headers:', err2.response.headers);
            }
          }
        } catch (readErr) {
          console.error('Could not read fallback response details:', readErr && readErr.message ? readErr.message : readErr);
        }
      }
    }

    console.error('ngrok could not be started. Common causes: invalid NGROK_AUTHTOKEN, no network access, or ngrok service outage.');
    console.error('If you have an ngrok authtoken, set it and retry:');
    console.error('  set NGROK_AUTHTOKEN=your_token && npm run ngrok');
    process.exit(1);
  }
})();
