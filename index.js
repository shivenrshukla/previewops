import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('<h1>PreviewOps Environment is LIVE! 🚀</h1><br><h1>PreviewOps Webhooks are LIVE!</h1>');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});