'use strict';

const https = require('https');
const express = require('express');
const Logger = require('logger');
const fs = require('fs');
const app = express();
const certificates_handler = require('./certificate/app.js');

const ca = fs.readFileSync('./cert_ca/ca.crt');
const cert = fs.readFileSync('./cert_server/cert.crt');
const key = fs.readFileSync('./cert_server/cert.key');

app.use('/', certificates_handler);

let options = {
    key: key,
    cert: cert,
    ca: [ca],
    requestCert: true,
    rejectUnauthorized: true
};

const server = https.createServer(options, app);
const port = 3030;
server.listen(port);
console.log(`Listening: https://localhost:${port}`);
