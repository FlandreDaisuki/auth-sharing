import express from 'express';
import fs from 'fs';
import jwt from 'express-jwt';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

const publicKey = fs.readFileSync('jwtRS256.key.pub', 'utf8');

app.use(cors());
app.use(
  jwt({ secret: publicKey, algorithms: ['RS256'], requestProperty: 'auth' })
    .unless({ path: ['/favicon.ico'] }),
);

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send('401 Unauthorized');
  }
  next();
});


app.get('/pinned-repos', async(req, res) => {
  console.log('req.auth', req.auth);
  if (req.auth.level < 50) {
    return res.status(403).send('403 Forbidden');
  }
  const url = `https://gh-pinned-repos.egoist.sh/?username=${req.auth.github}`;
  const response = await fetch(url);
  res.send(await response.json());
});

app.listen(80);
