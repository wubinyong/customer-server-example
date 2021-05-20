const forge = require('node-forge');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const caCertificatePem = fs.readFileSync('./cert_ca/ca.crt');
const caPrivateKeyPem = fs.readFileSync('./cert_ca/ca.key');

function generateCustomKeysAndCertificate() {
  const attrs = [
    {
      name: 'commonName',
      value: 'LSR Device',
    },
    {
      name: 'organizationName',
      value: 'LSR',
    },
  ];

  const privateCAKey = forge.pki.privateKeyFromPem(caPrivateKeyPem);
  const caCert = forge.pki.certificateFromPem(caCertificatePem);

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = crypto.createHash('sha1').update(uuidv4()).digest('hex');
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + 30
  );

  cert.setSubject(attrs);
  cert.setIssuer(caCert.subject.attributes);

  cert.sign(privateCAKey, forge.md.sha256.create());

  // PEM-format keys and cert
  const pem = {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    certificate: forge.pki.certificateToPem(cert),
  };

  const certRet = {
    certificateId: cert.serialNumber,
    certificatePem: pem.certificate,
    keyPair: {
      publicKey: pem.publicKey,
      privateKey: pem.privateKey
    },
    rootCertPem: caCertificatePem.toString(),
    createdAt: Math.floor(Date.now() / 1000)
  }

  console.log(certRet);

  return certRet;
}

module.exports = generateCustomKeysAndCertificate;