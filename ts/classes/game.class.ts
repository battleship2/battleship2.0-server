/// <reference path="../definitions/definitions.d.ts" />

import Utils = require("../services/utils.service");
import BSData = require("../definitions/bsdata");
import GameLogic = require("../logics/game.logic");

let _utils: Utils = new Utils();

class Game {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    public map: BSMap = { max: {action: 1, other: []}, ships: [], width: 10, height: 10, boards: {} };
    public name: string = "";
    public logic: GameLogic = new GameLogic();
    public players: BSPlayerRegistry = {};
    public actions: BSActionRegistry = {};
    public history: Array<BSActionRegistry> = [];
    public password: string = "";
    public maxPlayers: number = 4;
    public socketRoomName: string = "UNNAMED";

    private _id: string = _utils.uuid();
    private _state: BSData.State = BSData.State.WAITING_PLAYERS;

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor(name: string, maxPlayers: number, password: string = "") {
        this.map.ships.push({type: BSData.ShipType.DESTROYER, amount: 1});
        this.name = name;
        this.password = password;
        this.maxPlayers = maxPlayers >= 2 && maxPlayers <= 10 ? maxPlayers : 4;
        this.socketRoomName = "/game/" + this._id + "-" + this.name;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public state = (__state?: BSData.State) : BSData.State => {

        if (_utils.isUndefined(__state)) {
            return this._state;
        }

        this._state = __state;
        return this._state;
    };

    public getId = () : string => {
        return this._id;
    };

    public hasEveryonePlayedTheTurn = () : boolean => {
        try {
            _utils.forEach(this.players, (player: BSPlayer, bs_uuid: string) => {
                if (_utils.isUndefined(this.actions[bs_uuid])) {
                    throw new Error();
                }
            });
        }
        catch (exception) { return false; }
        return true;
    };

    public isOpen = () : boolean => {
        return this.state() === BSData.State.WAITING_PLAYERS && _hasAvailableSlot.call(this);
    };

    public isStillPlayable = () : boolean => {
        return this.countPlayers() >= 2;
    };

    public emit = (io: SocketIO.Server, event: string, data?: any) : Game => {
        if (_utils.isUndefined(data)) {
            io.sockets.in(this.socketRoomName).emit(event);
        } else {
            io.sockets.in(this.socketRoomName).emit(event, data);
        }
        return this;
    };

    public countPlayers = () : number => {
        return this.getPlayersList().length;
    };

    public getPlayersList = () : Array<string> => {
        return Object.keys(this.players);
    };

    public playTheTurn = () : BSTurn => {
        let actions = this.logic.processTurn(this.actions, this.map);
        let scores = _getTurnScores.call(this, actions);

        _updateBoards.call(this, actions);
        _updatePlayersInfos.call(this, scores);

        this.history.push(JSON.parse(JSON.stringify(this.actions)));
        this.actions = {};

        return {
            actions: actions,
            players: this.getPlayersInfos(),
            turnScores: scores
        };
    };

    public getPlayersInfos = () : Array<BSPlayerInfo> => {
        let infos = [];

        _utils.forEach(this.map.boards, (board: BSMapBoard, bs_uuid: string) => {
            let player: BSPlayer = this.players[bs_uuid];
            let playerInfo: BSPlayerInfo = {
                id: bs_uuid,
                score: player.score,
                nickname: player.nickname,
                health: 0,
                maxHealth: 0
            };

            _utils.forEach(board.ships, (ship: BSShip) => {
                let shipHealth = ship.width * ship.height;
                playerInfo.maxHealth += shipHealth;
                if (ship.destroyed) {
                    return;
                }
                playerInfo.health += (shipHealth - ship.hits.length);
            });
            infos.push(playerInfo);
        });
        return infos;
    };

    public setNextActions = (socket: SocketIO.Socket, actions: Array<BSAction>) : boolean => {
        if (!this.logic.isActionsValid(this.map, actions)) {
            return false;
        }

        this.actions[socket.bs_uuid] = [];

        _utils.forEach(actions, (action: BSAction, index: string) => {
            action.id = socket.bs_uuid + "-action-" + index;
            action.owner = socket.bs_uuid;
            this.actions[socket.bs_uuid].push(action);
        });

        return true;
    };

    public setPlayerReady = (socket: SocketIO.Socket, isReady: boolean) : Game => {
        if (_hasPlayer.call(this, socket) && this.state() === BSData.State.READY) {
            this.players[socket.bs_uuid].isReady = isReady;
            _updateState.call(this);
        }
        return this;
    };

    public placePlayerShips = (socket: SocketIO.Socket, ships: Array<BSShip>) : boolean => {
        if (this.logic.isDispositionValid(this.map, ships)) {

            if (_utils.isUndefined(this.map.boards[socket.bs_uuid])) {
                this.map.boards[socket.bs_uuid] = {};
            }
            this.map.boards[socket.bs_uuid].ships = {};

            _utils.forEach(ships, (ship: BSShip, index: string) => {
                ship.id = socket.bs_uuid + "-ship-" + index;
                ship.hits = [];
                this.map.boards[socket.bs_uuid].ships[ship.id] = ship;
            });

            let allReady = true;
            _utils.forEach(this.players, (player: BSPlayer, bs_uuid: string) => {
                if (_utils.isUndefined(this.map.boards[bs_uuid])) {
                    allReady = false;
                }
            });

            if (allReady) {
                this._state = BSData.State.PLAYING;
            }
            return true;
        }
        return false;
    };

    public acceptPlayer = (socket: SocketIO.Socket, data: BSGameData) : boolean => {
        return _utils.isNull(socket.game) &&
            this.state() === BSData.State.WAITING_PLAYERS &&
            _hasAvailableSlot.call(this) &&
            _passwordIsCorrect.call(this, data) &&
            !_hasPlayer.call(this, socket);
    };

    public summary = () : BSGameSummary => {
        return <BSGameSummary>{
            id: this._id,
            name: this.name,
            players: this.countPlayers(),
            password: _utils.isString(this.password) && this.password.length > 0,
            maxPlayers: this.maxPlayers
        };
    };

    public addPlayer = (socket: SocketIO.Socket) : Game => {
        this.players[socket.bs_uuid] = {
            score: 0,
            isReady: false,
            nickname: socket.nickname
        };
        socket.join(this.socketRoomName);
        socket.leave("lobby");
        socket.game = this._id;
        _updateState.call(this);
        return this;
    };

    public removePlayer = (socket: SocketIO.Socket) : Game => {
        socket.join("lobby");
        socket.leave(this.socketRoomName);
        socket.game = null;
        delete this.players[socket.bs_uuid];
        _updateState.call(this);
        return this;
    };

    public removeAllPlayers = (sockets: BSSocketRegistry) : Game => {
        let self = this;
        _utils.forEach(sockets, (socket: SocketIO.Socket) => {
            self.removePlayer(socket);
        });
        return this;
    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _updateState(): Game {
    switch (this._state) {
        case BSData.State.WAITING_PLAYERS:
            if (!_hasAvailableSlot.call(this)) {
                this._state = BSData.State.READY;
            }
            break;

        case BSData.State.READY:
            if (_hasAvailableSlot.call(this)) {
                this._state = BSData.State.WAITING_PLAYERS;
            } else if (_areAllPlayersReady.call(this)) {
                this._state = BSData.State.SETTING;
            }
            break;
    }
    return this;
}

function _passwordIsCorrect(data: BSGameData): boolean {
    if (_utils.isString(this.password) && this.password.length) {
        return this.password === data.password;
    }
    return true;
}

function _hasPlayer(socket: SocketIO.Socket): boolean {
    return socket.bs_uuid in this.players;
}

function _hasAvailableSlot(): boolean {
    return this.countPlayers() < this.maxPlayers;
}

function _areAllPlayersReady(): boolean {
    try {
        _utils.forEach(this.players, (player: BSPlayer) => {
            if (!player.isReady) throw new Error();
        });
    } catch (exception) { return false; }
    return true;
}

function _getTurnScores(actions: Array<BSAction>): BSScoreRegistry {
    let scores: BSScoreRegistry = {};

    _utils.forEach(actions, (action: BSAction) => {
        let owner = action.owner;
        if (_utils.isUndefined(scores[owner])) {
            scores[owner] = { score: 0, miss: 0 };
        }

        let missed = true;
        _utils.forEach(action.result, (result: BSTurnResult) => {
            if (result.type === "hit ship") {
                missed = false;
                scores[owner].score += 1;
            }
        });
        scores[owner].miss += missed ? 1 : 0;
    });

    return scores;
}

function _updateBoards(actions: Array<BSAction>): Game {

    _utils.forEach(actions, (action: BSAction) => {
        if (action.result.length === 0) {
            return;
        }

        _utils.forEach(action.result, (result: BSTurnResult) => {
            if (result.type === "hit ship") {
                let owner = result.owner;
                let target = result.target;
                let ship = this.map.boards[owner].ships[target];
                let previousHits = ship.hits;
                let alreadyRegistered = false;

                _utils.forEach(previousHits, (hit: BSCoordinates) => {
                    if (alreadyRegistered || (hit.x === result.localHit.x && hit.y === result.localHit.y)) {
                        alreadyRegistered = true;
                        return;
                    }
                });

                if (!alreadyRegistered) {
                    ship.hits.push(result.localHit);
                    if (ship.hits.length === ship.width * ship.height) {
                        ship.destroyed = true;
                    }
                }
            }
        });
    });

    return this;
}

function _updatePlayersInfos(scores: BSScoreRegistry): Game {
    _utils.forEach(scores, (score: BSScore, bs_uuid: string) => {
        this.players[bs_uuid].score += score.score;
    });
    return this;
}

export = Game;
