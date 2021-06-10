const request_promise = require('request-promise');
const fs = require('fs');
const crypto = require('crypto');
const colors = require('colors');
const Mock = require('mockjs');

const API_BASE = 'https://localhost:3030';

const ca = fs.readFileSync('./certs/ca.crt');
const cert = fs.readFileSync('./certs/client_cert.crt');
const key = fs.readFileSync('./certs/client_cert.key');

const deviceId1 = 'test-device-id-1';
const deviceId2 = 'test-device-id-2';
const modelNumber = 'test-model';

function printOptions(options) {
  const options_copy = Object.assign({}, options);
  delete options_copy.cert;
  delete options_copy.key;
  delete options_copy.rejectUnauthorized;
  delete options_copy.json;
  console.log(`${JSON.stringify(options_copy, null, 2)}`.gray);
}

function getMockBusinessData() {
  return Mock.mock({
    wt: '@integer(40000, 100000)',
    bmi: '@integer(150, 300)',
    fat: '@integer(50, 400)',
    bm: '@integer(1200, 2000)',
    mus: '@integer(5000, 50000)',
    ts: Math.ceil(Date.now() / 1000)
  })
}

async function test() {
  // Request device cert for test-device-id-1
  let options = {
    uri: API_BASE + '/devicecert',
    method: 'POST',
    body: {
      deviceId: deviceId1,
      modelNumber: modelNumber,
    },
    cert: cert.toString(),
    key: key.toString(),
    // ca: ca,
    rejectUnauthorized: false,
    json: true,
    headers: {
      'APIKeyName': 'APIKeyValue'
    }
  }

  console.log(`Device certificate request:`);
  printOptions(options)
  let resp = await request_promise(options);
  console.log(`Device certificate response:`);
  console.log(`${JSON.stringify(resp, null, 2)}`.gray);
  console.log(`Certificate signed: ${resp.certificateId} for ${deviceId1}`);

  resp.deviceId = deviceId1;
  resp.modelNumber = modelNumber;
  
  const deviceCert1 = resp;

  options = {
    uri: API_BASE + '/syncdevicecert',
    method: 'POST',
    body: resp,
    cert: cert.toString(),
    key: key.toString(),
    // ca: ca,
    rejectUnauthorized: false,
    json: true,
    headers: {
      'APIKeyName': 'APIKeyValue'
    }
  }

  console.log(`Synchronize device certificate request:`);
  printOptions(options)
  console.log(`Synchronizing certificate ${options.body.certificateId}`);
  resp = await request_promise(options);
  console.log(`Synchronize device certificate response:`);
  console.log(`${JSON.stringify(resp, null, 2)}`.gray);

  // Request device cert for test-device-id-2
  options = {
    uri: API_BASE + '/devicecert',
    method: 'POST',
    body: {
      deviceId: deviceId2,
      modelNumber: modelNumber,
    },
    cert: cert.toString(),
    key: key.toString(),
    // ca: ca,
    rejectUnauthorized: false,
    json: true,
    headers: {
      'APIKeyName': 'APIKeyValue'
    }
  }

  console.log(`Device certificate request:`);
  printOptions(options)
  resp = await request_promise(options);
  console.log(`Device certificate response:`);
  console.log(`${JSON.stringify(resp, null, 2)}`.gray);
  console.log(`Certificate signed: ${resp.certificateId} for ${deviceId2}`);

  resp.deviceId = deviceId2;
  resp.modelNumber = modelNumber;
  
  const deviceCert2 = resp;

  options = {
    uri: API_BASE + '/syncdevicecert',
    method: 'POST',
    body: resp,
    cert: cert.toString(),
    key: key.toString(),
    // ca: ca,
    rejectUnauthorized: false,
    json: true,
    headers: {
      'APIKeyName': 'APIKeyValue'
    }
  }

  console.log(`Synchronize device certificate request:`);
  printOptions(options)
  console.log(`Synchronizing certificate ${options.body.certificateId}`);
  resp = await request_promise(options);
  console.log(`Synchronize device certificate response:`);
  console.log(`${JSON.stringify(resp, null, 2)}`.gray);

  // LSR forward, use cert in forward settings
  options = {
    uri: API_BASE + '/forwardtelemetry',
    method: 'POST',
    body: {
      deviceId: deviceId1,
      createdAt: Math.floor(Date.now() / 1000),
      data: getMockBusinessData()
    },
    cert: cert.toString(),
    key: key.toString(),
    // ca: ca,
    rejectUnauthorized: false,
    json: true,
    headers: {
      'APIKeyName': 'APIKeyValue'
    }
  }

  // Ref: https://stackoverflow.com/questions/51252713/how-to-get-the-same-fingerprint-that-aws-uses-from-x-509-with-node-forge
  let baseString = cert.toString().match(/-----BEGIN CERTIFICATE-----\s*([\s\S]+?)\s*-----END CERTIFICATE-----/i);
  let rawCert = Buffer.from(baseString[1], 'base64');
  let shaSum = crypto.createHash('sha256').update(rawCert).digest('hex');

  console.log(`Forward telemetry request:`);
  printOptions(options)
  console.log(`Forwarding telemetry data with cloud-to-cloud client cert ${shaSum}`);
  resp = await request_promise(options);
  console.log(`Forward telemetry response:`);
  console.log(`${JSON.stringify(resp, null, 2)}`.gray);

  // Device1 direct send
  options = {
    uri: API_BASE + `/devicetelemetry/${deviceId1}`,
    method: 'POST',
    body: getMockBusinessData(),
    cert: deviceCert1.certificatePem,
    key: deviceCert1.keyPair.privateKey,
    // ca: ca,
    rejectUnauthorized: false,
    json: true,
    headers: {
      'APIKeyName': 'APIKeyValue'
    }
  }

  console.log(`Device telemetry request:`);
  printOptions(options)
  console.log(`Device1 sending telemetry data with signed device cert ${deviceCert1.certificateId}`);
  resp = await request_promise(options);
  console.log(`Device telemetry response:`);
  console.log(`${JSON.stringify(resp, null, 2)}`.gray);

  // Device2 direct send with device2's certificate
  options = {
    uri: API_BASE + `/devicetelemetry/${deviceId2}`,
    method: 'POST',
    body: getMockBusinessData(),
    cert: deviceCert2.certificatePem,
    key: deviceCert2.keyPair.privateKey,
    // ca: ca,
    rejectUnauthorized: false,
    json: true,
    headers: {
      'APIKeyName': 'APIKeyValue'
    }
  }

  console.log(`Device2 sending telemetry data with signed device cert ${deviceCert2.certificateId}`);
  resp = await request_promise(options);
  console.log(resp)

  // Device2 direct send with device1's certificate
  options = {
    uri: API_BASE + `/devicetelemetry/${deviceId2}`,
    method: 'POST',
    body: getMockBusinessData(),
    cert: deviceCert1.certificatePem,
    key: deviceCert1.keyPair.privateKey,
    // ca: ca,
    rejectUnauthorized: false,
    json: true,
    headers: {
      'APIKeyName': 'APIKeyValue'
    }
  }

  console.log(`Device2 sending telemetry data with signed device cert ${deviceCert1.certificateId}`);

  resp = await request_promise(options).catch(err => {
    console.log(err.message.red);
  });
  console.log(resp)
}

test()