/// <reference path="../server.ts" />

import Utils = require('../services/utils.service');
import Bunyan = require('bunyan');
import Restify = require('restify');

let _utils: Utils = new Utils();
let _logger: any = null;
let _bunyan: any = Bunyan;
let _restify: any = Restify;
let _instance: Logger = null;

class Logger {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/



    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor() {
        if (_utils.isNull(_instance)) {
            _instance = this;

            _logger = new _bunyan({
                name: 'battleship-server-logger',
                streams: [
                    {
                        stream: process.stdout,
                        level: 'debug'
                    },
                    {
                        type: 'rotating-file',
                        path: 'server-traces.log',
                        level: 'trace',
                        period: '1d',   // daily rotation
                        count: 10        // keep 10 back copies
                    },
                    {
                        type: 'rotating-file',
                        path: 'server-errors.log',
                        level: 'error',
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
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public get = () : any => {
        return _logger;
    };

    public trace = (...args: any[]) : Logger => {
        _logger.trace(args);
        return _instance;
    };

    public debug = (...args: any[]) : Logger => {
        _logger.debug(args);
        return _instance;
    };

    public info = (...args: any[]) : Logger => {
        _logger.info(args);
        return _instance;
    };

    public warn = (...args: any[]) : Logger => {
        _logger.warn(args);
        return _instance;
    };

    public error = (...args: any[]) : Logger => {
        _logger.error(args);
        return _instance;
    };

    public fatal = (...args: any[]) : Logger => {
        _logger.fatal(args);
        return _instance;
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                               PRIVATE MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

}

export = Logger;
