'use strict';
/**
 * an example of using the @coolgk/mvc framework with rabbitMQ
 * message publisher
 */
const express = require('express');
const { Amqp } = require('@coolgk/amqp');

const { Router } = require('@coolgk/mvc/router');
// import app configurations
const { config } = require('./config');

const app = express();

app.use(async (request, response, next) => {

    // create an amqp (rabbitmq) instance
    // see @coolgk/amqp https://www.npmjs.com/package/@coolgk/amqp
    const amqp = new Amqp({
        url: config.amqp.url
    });

    const routerConfig = {
        rootDir: __dirname,
        url: request.originalUrl,
        method: request.method
    };

    // setup router
    const router = new Router(routerConfig);
    const { module, controller, action } = router.getModuleControllerAction();

    // setup callback for handling responses from consumers
    const responseHandler = (consumerResponse) => {
        console.log('consumer replied: ', consumerResponse.responseMessage); // eslint-disable-line
        const result = consumerResponse.responseMessage;

        // handle json, file or text responses
        const responseSent = result.json && (response.json(result.json) || 1)
        || result.file && (response.download(result.file.path, result.file.name || '') || 1)
        || result.code && (response.status(result.code).send(result.text) || 1);

        // json, file and text are the only valid responses from this simple app
        // log error for anything else
        if (!responseSent) {
            // your custom error logger
            console.error(result); // eslint-disable-line
            response.status(500).send('Internal Server Error');
        }
    };

    // publish message
    amqp.publish(
        routerConfig,
        responseHandler,
        {
            routes: `${module}.${controller}.${action}`,
            exchangeName: 'direct'
        }
    );

});

app.listen(3000);

process.on('unhandledRejection', (error) => {
    // your custom error logger
    console.error(error); // eslint-disable-line
});
