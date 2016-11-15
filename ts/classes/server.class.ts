/// <reference path="../definitions/definitions.d.ts" />

import * as http from "http";

import Game = require("./game.class");
import Utils = require("../services/utils.service");
import Socket = require("./socket.class");
import BSData = require("../definitions/bsdata");
import Logger = require("../services/logger.service");
import Restify = require("restify");
import ChatPlugin = require("../plugins/chat.plugin");
import RoomPlugin = require("../plugins/room.plugin");
import GamePlugin = require("../plugins/game.plugin");

let __io: SocketIOStatic = require("socket.io");
let _io: SocketIO.Server = null;
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
                log: _logger.logger,
                name: "battleship-server",
                version: "0.0.1"
            });
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                   ACCESSORS                                    */
    /*                                                                                */
    /**********************************************************************************/

    public static get server(): http.Server {
        return _server.server;
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public setup = (): Server => {
        _io = __io.listen(_server.server);

        _io.sockets.on("connection", (socket: SocketIO.Socket) => {
            let _socket = new Socket(socket);
            _socket.addPlugin(new ChatPlugin());
            _socket.addPlugin(new RoomPlugin());
            _socket.addPlugin(new GamePlugin());
            _socket.join("lobby");
        });

        return _instance;
    };

    public start = (port: number = 9001) : Server => {
        _server.listen(port, () => {
            _logger.info("All the magic happens when", _server.name, "is listening at", _server.url);
        });
        return _instance;
    };

    public close = () : Server => {
        Game.stopAll();
        Socket.closeAll();
        _server.close();
        return _instance;
    };

    public reset = (): Server => {
        _instance.close();
        _instance.start();
        return _instance;
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                               PRIVATE MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

}

export = Server;
