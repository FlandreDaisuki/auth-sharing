import express from 'express';
import fs from 'fs/promises';

const app = express();

app.get('/db', async(req, res) => {
  const json = await fs.readFile('db.json', 'utf8');
  res.contentType('application/json').send(json);
});

app.listen(80);
