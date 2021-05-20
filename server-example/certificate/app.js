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
    Logger.log(
        Logger.levels.INFO,
        `Signing certificate for LSR device ${deviceId} (${modelNumber})`
    );

    const cert = generateCustomKeysAndCertificate();
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
    const { deviceId, modelNumber } = body;
    if (!deviceId || !modelNumber) {
        return Promise.reject({
            code: 400,
            error: "Invalid parameter",
            message: `Body parameters are invalid. Please check the API specification.`,
        });
    }

    Logger.log(
        Logger.levels.INFO,
        `Synchronizing from LSR device ${deviceId} (${modelNumber})`
    );

    
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


const _telemetryData = async (body) => {
    // const { sn, model_number } = body;
    // if (!sn || !model_number) {
    //     return Promise.reject({
    //         code: 400,
    //         error: "Invalid parameter",
    //         message: `Body parameters are invalid. Please check the API specification.`,
    //     });
    // }

    Logger.log(
        Logger.levels.INFO,
        `Telemetry data: ${JSON.stringify(body)})`
    );

    const result = {
        success: true
    }
    return result;
}

const telemetryData = async (req, res) => {
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

router.post('/forwardtelemetry', telemetryData);

app.use('/', router);

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
