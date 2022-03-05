import express from 'express';
import fetch from 'node-fetch';

import fs from 'fs';

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
    .replace(/{{\s*viewCount\s*}}/g, user.viewCount ?? 0)
    .replace(/{{\s*id\s*}}/g, user.id); // You can replace all id for keep session
};

const connectDatabase = async() => {
  const response = await fetch('http://database/db');
  return await response.json();
};

const app = express();

app.get('/', async(req, res) => {
  console.log('req.headers', req.headers);

  const db = await connectDatabase();

  try {
    if (req.headers.authorization) {
      const encodedCredentials = req.headers.authorization.replace(/^Basic (.+)$/, '$1');
      const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('ascii');
      const [name, password] = decodedCredentials.split(':');
      const foundUser = db.find((record) => record.name === name && record.password === password);
      if (foundUser) {
        res.send(await applyUserHTML(foundUser));
      } else {
        throw new Error('Unauthorized');
      }
    } else {
      throw new Error('Unauthorized');
    }
  } catch (error) {
    if (error.message === 'Unauthorized') {
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
      res.status(401).header('WWW-Authenticate', 'Basic realm="Auth Sharing"').end();
    } else {
      res.status(400).send('400 Bad Request');
    }
  }
});

app.listen(80);
