/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */

'use strict';

/**
 * Lib
 */
const Logger = require('logger');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const router = express.Router();
const generateCustomKeysAndCertificate = require('./custom_certificate.js');
const fs = require('fs');

let validCertificates = JSON.parse(fs.readFileSync('./validCertificates.json'));

// declare a new express app
router.use(cors());
router.use((req, res, next) => {
    bodyParser.json()(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                code: 400,
                error: 'BadRequest',
                message: err.message,
            });
        }
        next();
    });
});
router.use(bodyParser.urlencoded({ extended: true }));
// router.use(awsServerlessExpressMiddleware.eventContext());

const _signCertificate = async (body) => {
    const { deviceId, modelNumber } = body;
    if (!deviceId || !modelNumber) {
        return Promise.reject({
            code: 400,
            error: "Invalid parameter",
            message: `Body parameters are invalid. Please check the API specification.`,
        });
    }
    
    console.log(`Signing certificate for LSR device ${deviceId} (${modelNumber})`);

    const cert = generateCustomKeysAndCertificate();
    
    validCertificates[cert.certificateId] = deviceId;
    fs.writeFileSync('./validCertificates.json', JSON.stringify(validCertificates, null, 2));
    console.log(`Saved signed cert ${cert.certificateId} to validCertificates`);
    return cert;
}

const signCertificate = async (req, res) => {
    const { body, ticket } = req;

    try {
        const result = await _signCertificate(body)
        res.json(result);
    } catch (err) {
        Logger.log(Logger.levels.INFO, err);

        let status = 400;
        return res.status(status).json(err);
    }
}

const _syncCertificate = async (body) => {
    const { deviceId, modelNumber, certificateId, certificatePem } = body;
    if (!deviceId || !modelNumber || !certificateId || !certificatePem) {
        return Promise.reject({
            code: 400,
            error: "Invalid parameter",
            message: `Body parameters are invalid. Please check the API specification.`,
        });
    }
    validCertificates[certificateId] = deviceId;
    console.log(`Saved sync cert ${certificateId} to validCertificates`);
    fs.writeFileSync('./validCertificates.json', JSON.stringify(validCertificates, null, 2));
    console.log(`Synchronizing certificate from LSR ${deviceId} (${modelNumber})`);
    
    const result = {
        success: true
    }
    return result;
}

const syncCertificate = async (req, res) => {
    const { body, ticket } = req;

    try {
        const result = await _syncCertificate(body);
        res.json(result);
    } catch (err) {
        Logger.log(Logger.levels.INFO, err);

        let status = err.code;
        return res.status(status).json(err);
    }
}

const validateClientCert = async (req, res, next) => {
    const cert = req.connection.getPeerCertificate()
    if (!cert || !cert.fingerprint256) {
        return res
        .status(401)
        .json({ success: false, message: 'Certificate is required.' });
    }
    const certificateId = cert.fingerprint256.replace(/\:/g,'').toLowerCase();

    if (validCertificates[certificateId]) {
        console.log(`Client certificate: ${certificateId} : ${validCertificates[certificateId]} authorized.`);
        next();
    } else {
        return res
        .status(401)
        .json({ success: false, message: 'Certificate not in valid cert list.' });
    }
}

const validateClientCertAndDeviceId = async (req, res, next) => {
    const cert = req.connection.getPeerCertificate()
    if (!cert || !cert.fingerprint256) {
        return res
        .status(401)
        .json({ success: false, message: 'Certificate is required.' });
    }
    const certificateId = cert.fingerprint256.replace(/\:/g,'').toLowerCase();

    if (!validCertificates[certificateId]) {
        return res
        .status(401)
        .json({ success: false, message: 'Certificate not in valid cert list.' });
    }

    const { deviceId } = req.params;
    if (validCertificates[certificateId] !== deviceId) {
        return res
        .status(401)
        .json({ success: false, message: 'Certificate and deviceId mismatch.' });
    }

    if (validCertificates[certificateId]) {
        console.log(`Client certificate: ${certificateId} : ${validCertificates[certificateId]} authorized.`);
        next();
    }
}

const _telemetryData = async (body) => {
    // const { sn, model_number } = body;
    // if (!sn || !model_number) {
    //     return Promise.reject({
    //         code: 400,
    //         error: "Invalid parameter",
    //         message: `Body parameters are invalid. Please check the API specification.`,
    //     });
    // }

    console.log(`Telemetry data: ${JSON.stringify(body)})`);

    const result = {
        success: true
    }
    return result;
}

const telemetryData = async (req, res, next) => {
    const { body, ticket } = req;
    
    try {
        const result = await _telemetryData(body);
        res.json(result);
    } catch (err) {
        Logger.log(Logger.levels.INFO, err);

        let status = err.code;
        return res.status(status).json(err);
    }
}

/****************************
 * Event methods *
 ****************************/

router.post('/devicecert', signCertificate);
router.post('/syncdevicecert', syncCertificate);

router.post('/forwardtelemetry', validateClientCert, telemetryData);
router.post('/devicetelemetry/:deviceId', validateClientCertAndDeviceId, telemetryData);

app.use('/', router);

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
