'use strict';

const https = require('https');
const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const app = express();
const certificates_handler = require('./certificate/app.js');

const ca = fs.readFileSync('./cert_ca/ca.crt');
const cert = fs.readFileSync('./cert_server/servercert.crt');
const key = fs.readFileSync('./cert_server/servercert.key');

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));
app.use('/', certificates_handler);

let options = {
    key: key,
    cert: cert,
    ca: [ca],
    requestCert: true,
    rejectUnauthorized: false
};

const server = https.createServer(options, app);
const port = 3030;
server.listen(port);
console.log(`Listening: https://localhost:${port}`);
