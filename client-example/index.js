const request_promise = require('request-promise');
const fs = require('fs');
const crypto = require('crypto');

const API_BASE = 'https://localhost:3030';

const ca = fs.readFileSync('./certs/ca.crt');
const cert = fs.readFileSync('./certs/client_cert.crt');
const key = fs.readFileSync('./certs/client_cert.key');

const deviceId = 'test-device-id';
const modelNumber = 'test-model';

async function test() {
  let options = {
    uri: API_BASE + '/devicecert',
    method: 'POST',
    body: {
      deviceId: deviceId,
      modelNumber: modelNumber,
    },
    cert: cert,
    key: key,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  let resp = await request_promise(options);
  console.log(resp)
  console.log(`Certificate signed: ${resp.certificateId}`);

  resp.deviceId = deviceId;
  resp.modelNumber = modelNumber;
  
  const deviceCert = resp;

  options = {
    uri: API_BASE + '/syncdevicecert',
    method: 'POST',
    body: resp,
    cert: cert,
    key: key,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  console.log(`Synchronizing certificate  ${options.body.certificateId}`);
  resp = await request_promise(options);
  console.log(resp)

  // LSR forward, use cert in forward settings
  options = {
    uri: API_BASE + '/forwardtelemetry',
    method: 'POST',
    body: {
      deviceId: deviceId,
      createdAt: Math.floor(Date.now() / 1000),
      data: {
        testKey: 'testValue'
      }
    },
    cert: cert,
    key: key,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  // Ref: https://stackoverflow.com/questions/51252713/how-to-get-the-same-fingerprint-that-aws-uses-from-x-509-with-node-forge
  let baseString = cert.toString().match(/-----BEGIN CERTIFICATE-----\s*([\s\S]+?)\s*-----END CERTIFICATE-----/i);
  let rawCert = Buffer.from(baseString[1], 'base64');
  let shaSum = crypto.createHash('sha256').update(rawCert).digest('hex');

  console.log(`Forwarding telemetry data with client cert  ${shaSum}`);
  resp = await request_promise(options);
  console.log(resp)

  // Device direct send
  options = {
    uri: API_BASE + '/forwardtelemetry',
    method: 'POST',
    body: {
      deviceId: deviceId,
      createdAt: Math.floor(Date.now() / 1000),
      data: {
        testKey: 'testValue'
      }
    },
    cert: deviceCert.certificatePem,
    key: deviceCert.keyPair.privateKey,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  console.log(`Forwarding telemetry data with signed device cert ${deviceCert.certificateId}`);
  resp = await request_promise(options);
  console.log(resp)
}

test()