const request_promise = require('request-promise');
const fs = require('fs');
const crypto = require('crypto');
const colors = require('colors');

const API_BASE = 'https://localhost:3030';

const ca = fs.readFileSync('./certs/ca.crt');
const cert = fs.readFileSync('./certs/client_cert.crt');
const key = fs.readFileSync('./certs/client_cert.key');

const deviceId1 = 'test-device-id-1';
const deviceId2 = 'test-device-id-2';
const modelNumber = 'test-model';

async function test() {
  // Request device cert for test-device-id-1
  let options = {
    uri: API_BASE + '/devicecert',
    method: 'POST',
    body: {
      deviceId: deviceId1,
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
  console.log(`Certificate signed: ${resp.certificateId} for ${deviceId1}`);

  resp.deviceId = deviceId1;
  resp.modelNumber = modelNumber;
  
  const deviceCert1 = resp;

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

  console.log(`Synchronizing certificate ${options.body.certificateId}`);
  resp = await request_promise(options);
  console.log(resp)

  // Request device cert for test-device-id-2
  options = {
    uri: API_BASE + '/devicecert',
    method: 'POST',
    body: {
      deviceId: deviceId2,
      modelNumber: modelNumber,
    },
    cert: cert,
    key: key,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  resp = await request_promise(options);
  console.log(resp)
  console.log(`Certificate signed: ${resp.certificateId} for ${deviceId2}`);

  resp.deviceId = deviceId2;
  resp.modelNumber = modelNumber;
  
  const deviceCert2 = resp;

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

  console.log(`Synchronizing certificate ${options.body.certificateId}`);
  resp = await request_promise(options);
  console.log(resp)

  // LSR forward, use cert in forward settings
  options = {
    uri: API_BASE + '/forwardtelemetry',
    method: 'POST',
    body: {
      deviceId: deviceId1,
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

  console.log(`Forwarding telemetry data with cloud-to-cloud client cert ${shaSum}`);
  resp = await request_promise(options);
  console.log(resp)

  // Device1 direct send
  options = {
    uri: API_BASE + `/devicetelemetry/${deviceId1}`,
    method: 'POST',
    body: {
      createdAt: Math.floor(Date.now() / 1000),
      data: {
        testKey: 'testValue'
      }
    },
    cert: deviceCert1.certificatePem,
    key: deviceCert1.keyPair.privateKey,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  console.log(`Device1 sending telemetry data with signed device cert ${deviceCert1.certificateId}`);
  resp = await request_promise(options);
  console.log(resp)

  // Device2 direct send with device2's certificate
  options = {
    uri: API_BASE + `/devicetelemetry/${deviceId2}`,
    method: 'POST',
    body: {
      createdAt: Math.floor(Date.now() / 1000),
      data: {
        testKey: 'testValue'
      }
    },
    cert: deviceCert2.certificatePem,
    key: deviceCert2.keyPair.privateKey,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  console.log(`Device2 sending telemetry data with signed device cert ${deviceCert2.certificateId}`);
  resp = await request_promise(options);
  console.log(resp)

  // Device2 direct send with device1's certificate
  options = {
    uri: API_BASE + `/devicetelemetry/${deviceId2}`,
    method: 'POST',
    body: {
      createdAt: Math.floor(Date.now() / 1000),
      data: {
        testKey: 'testValue'
      }
    },
    cert: deviceCert1.certificatePem,
    key: deviceCert1.keyPair.privateKey,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  console.log(`Device2 sending telemetry data with signed device cert ${deviceCert1.certificateId}`);

  resp = await request_promise(options).catch(err => {
    console.log(err.message.red);
  });
  console.log(resp)
}

test()