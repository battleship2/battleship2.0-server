/// <reference path="../definitions/definitions.d.ts" />

import Game = require("./game.class");
import Utils = require("../services/utils.service");
import Server = require("./server.class");
import BSData = require("../definitions/bsdata");
import BSPlugin = require("../plugins/abstract.bsplugin");
import Nickname = require("../services/nickname.service");

let _utils: Utils = new Utils();
let _sockets: { [bs_uuid: string]: Socket } = {};
let _nickname: Nickname = new Nickname();

class Socket {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    private _room: string = "";
    private _game: Game = null;
    private _plugins: Array<BSPlugin> = [];
    private _nickname: string = _nickname.get();

    readonly _bs_uuid: string = _utils.uuid();

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor(private _socket: SocketIO.Socket) {
        this._socket.on(BSData.events.on.DISCONNECT, this.disconnect);
        this._socket.emit(BSData.events.emit.NICKNAME, {id: this._bs_uuid, nickname: this._nickname});

        _sockets[this._bs_uuid] = this;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                   ACCESSORS                                    */
    /*                                                                                */
    /**********************************************************************************/

    public static get sockets(): { [bs_uuid: string]: Socket } {
        return _sockets;
    };

    public get socket(): SocketIO.Socket {
        return this._socket;
    };

    public get room(): string {
        return this._room;
    };

    public get game(): Game {
        return this._game;
    };

    public set game(game: Game) {
        if (_utils.isDefined(game)) {
            this._game = game;
        }
    };

    public get plugins(): Array<BSPlugin> {
        return this._plugins;
    };

    public get bs_uuid(): string {
        return this._bs_uuid;
    };

    public get nickname(): string {
        return this._nickname;
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                                STATIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public static findIn = (room: string): Array<Socket> => {
        let sockets = [];
        _utils.forEach(_sockets, (_socket: Socket) => {
            if (_socket.room === room) {
                sockets.push(_socket);
            }
        });
        return sockets;
    };

    public static closeAll = (): void => {
        _utils.forEach(_sockets, (_socket: Socket) => _socket.close());
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public dispatch = (event: string, data?: any): Socket => {
        let siblings = Socket.findIn(this._room);
        _utils.forEach(siblings, (socket: Socket) => {
            if (_utils.isUndefined(data)) {
                socket.socket.emit(event);
            } else {
                socket.socket.emit(event, data);
            }
        });
        return this;
    };

    public addPlugin = (plugin: BSPlugin): Socket => {
        plugin.setup(this);
        this._plugins.push(plugin);
        return this;
    };

    public close = (): Socket => {
        this._socket.emit(BSData.events.emit.SERVER_RESET);
        this._socket.leaveAll();
        this._socket.disconnect();
        return this;
    };

    public peopleInSameRoom = (): { [id: string]: People } => {
        let people = {};
        let siblings = Socket.findIn(this._room);

        _utils.forEach(siblings, (socket: Socket) => {
            people[socket.bs_uuid] = {
                id: socket.bs_uuid,
                nickname: socket.nickname
            };
        });

        return people;
    };

    public join = (room: string): Socket => {
        if (_utils.isString(room) && room.trim().length > 0) {
            this._socket.leave(this._room);
            this._socket.join(room);
            this._room = room;
            this.dispatch(BSData.events.emit.JOIN_ROOM, { id: this._bs_uuid, nickname: this._nickname });
            this.dispatch(BSData.events.emit.PEOPLE_IN_ROOM, this.peopleInSameRoom());
        }
        return this;
    };

    public disconnect = (): Socket => {
        _utils.forEach(this._plugins, (plugin: BSPlugin) => plugin.stop());

        this.dispatch(BSData.events.emit.LEFT_ROOM, { id: this._bs_uuid, nickname: this._nickname });
        this.dispatch(BSData.events.emit.PEOPLE_IN_ROOM, this.peopleInSameRoom());

        if (!_utils.isNull(this._game)) {
            this._game.removePlayer(this);
            this._game = null;
        }

        delete _sockets[this._bs_uuid];
        return this;
    };

    public leave = (room: string = this._room): Socket => {
        this._socket.leave(room);
        this.join("lobby");
        return this;
    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

export = Socket;
