/// <reference path="../definitions/definitions.d.ts" />

import * as http from 'http';
import Utils = require('../services/utils.service');
import Logger = require('../services/logger.service');
import Restify = require('restify');

let _utils: Utils = new Utils();
let _server: Restify.Server = null;
let _logger: Logger = null;
let _instance: Server = null;

class Server {

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

            _logger = new Logger();

            _server = Restify.createServer({
                log: _logger.get(),
                name: 'battleship-server',
                version: '0.0.1'
            });
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public get = () : http.Server => {
        return _server.server;
    };

    public start = (port: number = 9001) : Server => {
        _server.listen(port, () => {
            _logger.info('All the magic happens when', _server.name, 'is listening at', _server.url);
        });
        return _instance;
    };

    public close = () : Server => {
        _server.close();
        return _instance;
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                               PRIVATE MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

}

export = Server;
