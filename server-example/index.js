'use strict';

const express = require('express');
const Logger = require('logger');
const fs = require('fs');
const app = express();
const certificates_handler = require('./certificate/app.js');
const awsServerlessExpress = require('aws-serverless-express');

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

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
    Logger.log(Logger.levels.INFO, 'LSR forward server recieved event:');
    Logger.log(Logger.levels.INFO, event);

    awsServerlessExpress.proxy(server, event, context);
};
