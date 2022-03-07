import express from 'express';
import fs from 'fs/promises';

const app = express();

app.get('/', async(req, res) => {
  res.send(await fs.readFile('views/index.html', 'utf8'));
});

app.listen(80);
