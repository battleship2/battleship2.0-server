/// <reference path="../server.ts" />

import Utils = require('../services/utils.service');
import Logger = require('../classes/logger.class');
import Restify = require('restify');

let _utils: Utils = new Utils();
let _server: any = null;
let _logger: Logger = null;
let _restify: any = Restify;
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

            _server = _restify.createServer({
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

    public get = () : any => {
        return _server.server;
    };

    public start = () : Server => {
        _server.listen(9001, () => {
            _logger.info('All the magic happens when', _server.name, 'is listening at', _server.url)
        });
        return _instance;
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                               PRIVATE MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

}

export = Server;
