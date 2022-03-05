import express from 'express';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const userHTMLTemplate = fs.readFileSync('views/user.html', 'utf8');

const sessionTable = {};

const getGithubUser = async(githubUsername) => {
  const response = await fetch(`https://api.github.com/users/${githubUsername}`);
  return await response.json();
};

const applyUserHTML = async(user) => {
  const githubUser = await getGithubUser(user.github);
  return userHTMLTemplate
    .replace(/{{\s*name\s*}}/g, user.name)
    .replace(/{{\s*avatar.src\s*}}/g, githubUser.avatar_url)
    .replace(/{{\s*avatar.alt\s*}}/g, `${user.name}'s avatar`)
    .replace(/{{\s*github\s*}}/g, user.github)
    .replace(/{{\s*viewCount\s*}}/g, user.viewCount ?? 0)
    .replace(/{{\s*id\s*}}/g, user.id); // You can replace all id for keep session
};

const connectDatabase = async() => {
  const response = await fetch('http://database/db');
  return await response.json();
};

const generateRandomHex8 = () => [...'12345678']
  .map(() => Math.floor(Math.random() * 16).toString(16))
  .join('');

const createSessionId = () => {
  let sessionId = generateRandomHex8();
  while (sessionTable[sessionId]) {
    sessionId = generateRandomHex8();
  }
  return sessionId;
};


const app = express();

app.use(cookieParser());
app.get('/', async(req, res) => {
  console.log('GET', 'req.cookies', req.cookies);

  const foundSession = sessionTable[req.cookies.sessionId];
  if (foundSession) {
    foundSession.viewCount = (foundSession.viewCount ?? 0) + 1;
    res.send(await applyUserHTML(foundSession));
  } else {
    res.sendFile('views/login.html', { root: __dirname });
  }
});

app.get('/logout', async(req, res) => {
  res.cookie('sessionId', '', { expires: new Date(0) }).redirect('/');
});

app.use(express.urlencoded({ extended: true }));
app.post('/', async(req, res) => {
  console.log('POST', req.url, req.body);
  const db = await connectDatabase();
  const foundUser = db.find(({ name, password }) =>
    name === req.body.name && password === req.body.password,
  );
  console.log('foundUser', foundUser);
  if (foundUser) {
    const sessionId = createSessionId();
    sessionTable[sessionId] = foundUser;
    res.cookie('sessionId', sessionId, { httpOnly: true }).redirect('/');
  } else {
    res.redirect('/logout');
  }
});

// Session Controls
app.get('/sessions', async(req, res) => {
  res.send(sessionTable);
});
app.get('/sessions/delete/:sessionId', async(req, res) => {
  const foundSession = sessionTable[req.params.sessionId];
  if (foundSession) {
    delete sessionTable[req.params.sessionId];
  }
  res.redirect('/sessions');
});

app.listen(80);
