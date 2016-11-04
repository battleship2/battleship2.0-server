/// <reference path="../definitions/definitions.d.ts" />

import Utils = require('../services/utils.service');
import Bunyan = require('bunyan');
import Restify = require('restify');

let _utils: Utils = new Utils();
let _logger: Bunyan.Logger = null;
let _instance: Logger = null;

class Logger {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    public info: Function = null;
    public warn: Function = null;
    public trace: Function = null;
    public debug: Function = null;
    public error: Function = null;
    public fatal: Function = null;

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor() {
        if (_utils.isNull(_instance)) {
            _instance = this;

            let _bunyan: any = Bunyan;
            let _restify: any = Restify;

            _logger = new _bunyan({
                name: 'battleship-server-logger',
                streams: [
                    {
                        stream: process.stdout,
                        level: 'debug'
                    },
                    {
                        type: 'rotating-file',
                        path: 'logs/server-info.log',
                        level: 'info',
                        period: '1d',   // daily rotation
                        count: 10        // keep 10 back copies
                    },
                    {
                        type: 'rotating-file',
                        path: 'logs/server-warn.log',
                        level: 'warn',
                        period: '1d',   // daily rotation
                        count: 10        // keep 10 back copies
                    },
                    {
                        type: 'rotating-file',
                        path: 'logs/server-trace.log',
                        level: 'trace',
                        period: '1d',   // daily rotation
                        count: 10        // keep 10 back copies
                    },
                    {
                        type: 'rotating-file',
                        path: 'logs/server-debug.log',
                        level: 'debug',
                        period: '1d',   // daily rotation
                        count: 10        // keep 10 back copies
                    },
                    {
                        type: 'rotating-file',
                        path: 'logs/server-error.log',
                        level: 'error',
                        period: '1d',   // daily rotation
                        count: 10        // keep 10 back copies
                    },
                    {
                        type: 'rotating-file',
                        path: 'logs/server-fatal.log',
                        level: 'fatal',
                        period: '1d',   // daily rotation
                        count: 10        // keep 10 back copies
                    }
                ],
                serializers: {
                    req: _bunyan.stdSerializers.req,
                    res: _restify.bunyan.serializers.res
                }
            });

            if (!global.DEBUG_ENABLED) {
                _logger.level(100);
            }

            _instance.info = _logger.info.bind(_logger);
            _instance.warn = _logger.warn.bind(_logger);
            _instance.trace = _logger.trace.bind(_logger);
            _instance.debug = _logger.debug.bind(_logger);
            _instance.error = _logger.error.bind(_logger);
            _instance.fatal = _logger.fatal.bind(_logger);
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public get = () : Bunyan.Logger => {
        return _logger;
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                               PRIVATE MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

}

export = Logger;
