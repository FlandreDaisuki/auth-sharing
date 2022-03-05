import express from 'express';
import fetch from 'node-fetch';

import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const userHTMLTemplate = fs.readFileSync('views/user.html', 'utf8');

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
    .replace(/{{\s*id\s*}}/g, user.id); // You can replace all id for keep session
};

const connectDatabase = async() => {
  const response = await fetch('http://database/db');
  return await response.json();
};

const app = express();

app.get('/', async(req, res) => {
  const db = await connectDatabase();
  console.log('GET', 'req.query', req.query);

  const foundUser = db.find((record) => String(record.id) === req.query.id);
  console.log('GET', req.url, foundUser);

  if (foundUser) {
    res.send(await applyUserHTML(foundUser));
  } else {
    res.sendFile('views/login.html', { root: __dirname });
  }
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
    res.redirect(`/?id=${foundUser.id}`);
  } else {
    res.redirect('/');
  }
});

app.listen(80);
