import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const userHTMLTemplate = fs.readFileSync('views/user.html', 'utf8');
const privateKey = fs.readFileSync('jwtRS256.key', 'utf8');
const publicKey = fs.readFileSync('jwtRS256.key.pub', 'utf8');

const getGithubUser = async(githubUsername) => {
  const response = await fetch(`https://api.github.com/users/${githubUsername}`);
  return await response.json();
};

const renderUserHTML = async(user) => {
  const githubUser = await getGithubUser(user.github);
  return userHTMLTemplate
    .replace(/{{\s*ENV\s*}}/g, JSON.stringify({
      RESOURCE_SERVER: process.env.RESOURCE_SERVER,
    }))
    .replace(/{{\s*name\s*}}/g, user.name)
    .replace(/{{\s*avatar.src\s*}}/g, githubUser.avatar_url)
    .replace(/{{\s*avatar.alt\s*}}/g, `${user.name}'s avatar`)
    .replace(/{{\s*github\s*}}/g, user.github)
    .replace(/{{\s*id\s*}}/g, user.id); // You can replace all id for keep session
};

const connectDatabase = async() => {
  const response = await fetch('http://database/db');
  return await response.json();
};

const app = express();

app.use(cookieParser());
app.get('/', async(req, res) => {
  try {
    console.log('req.cookies', req.cookies);
    const { token } = req.cookies;
    if (!token) {
      throw new Error('Unauthorized');
    }

    const decodedUser = jwt.verify(token, publicKey);
    console.log('decodedUser', decodedUser);

    res.send(await renderUserHTML(decodedUser));
  } catch (error) {
    res.sendFile('views/login.html', { root: __dirname });
  }
});

app.get('/logout', async(req, res) => {
  res.cookie('token', '', { expires: new Date(0) }).send(`<script>
  localStorage.removeItem('token'); location.assign('/');
  </script>`);
});

app.use(express.urlencoded({ extended: true }));
app.post('/', async(req, res) => {
  console.log('POST', req.url, req.body);

  const db = await connectDatabase();
  const foundUser = db.users.find(({ name, password }) =>
    name === req.body.name && password === req.body.password,
  );
  console.log('foundUser', foundUser);

  if (foundUser) {
    const token = jwt.sign(foundUser, privateKey, { algorithm: 'RS256' });
    console.log('token', token);
    res.cookie('token', token).send(`<script>
    localStorage.setItem('token', '${token}'); location.assign('/');
    </script>`);
  } else {
    res.redirect('/');
  }
});

app.listen(80);
