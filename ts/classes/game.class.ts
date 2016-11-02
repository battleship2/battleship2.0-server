/// <reference path="../definitions/definitions.d.ts" />

import Utils = require('../services/utils.service');
import BSData = require('../definitions/bsdata');
import GameLogic = require('../logics/game.logic');

let _utils: Utils = new Utils();

class Game {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    public map: BSMap = { max: {action: 1}, ships: {destroyer: 1}, width: 10, height: 10, boards: {} };
    public name: string = '';
    public logic: GameLogic = new GameLogic();
    public players;
    public actions;
    public history;
    public password;
    public maxPlayers;
    public socketRoomName;

    private _id: string = _utils.uuid();
    private _state: BSData.State = BSData.State.WAITING_PLAYERS;

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor(name: string, maxPlayers: number, password: string = '') {
        this.name = name;
        this.players = {};
        this.actions = {};
        this.history = [];
        this.password = password;
        this.maxPlayers = maxPlayers >= 2 && maxPlayers <= 10 ? maxPlayers : 4;
        this.socketRoomName = '/game/' + this._id + '-' + this.name;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public state = () : BSData.State => {
        return this._state;
    };

    public getId = () : string => {
        return this._id;
    };

    public hasEveryonePlayedTheTurn = () : boolean => {
        try {
            _utils.forEach(this.players, (player, nickname) => {
                if (_utils.isUndefined(this.actions[nickname])) {
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

    public emit = (io: any, event: string, data?: any) : Game => {
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

    public playTheTurn = () : {} => {
        let actions = this.logic.processTurn(this.actions, this.map);
        let scores = _getTurnScores.call(this, actions);

        _updateBoards.call(this, actions);
        _updatePlayersInfos.call(this, scores);

        this.history.push(JSON.parse(JSON.stringify(this.actions)));
        this.actions = {};

        return {
            actions: actions,
            turnScores: scores,
            players: this.getPlayersInfos()
        };
    };

    public getPlayersInfos = () : Array<any> => {
        let infos = [];

        _utils.forEach(this.map.boards, (board, player) => {
            let infosPlayer = {
                nickname: player,
                score: this.players[player].score,
                maxHealth: 0,
                health: 0
            };

            _utils.forEach(this.map.boards[player].ships, ship => {
                let shipHealth = ship.width * ship.height;
                infosPlayer.maxHealth += shipHealth;
                if (ship.destroyed) {
                    return;
                }
                infosPlayer.health += (shipHealth - ship.hits.length);
            });
            infos.push(infosPlayer);
        });
        return infos;
    };

    public setNextActions = (player: BSPlayer, actions: Array<BSAction>) : boolean => {
        if (!this.logic.isActionsValid(this.map, actions)) {
            return false;
        }

        let nickname = player.nickname;
        this.actions[nickname] = [];

        _utils.forEach(actions, (action, index) => {
            action.id = nickname + '-action-' + index;
            action.owner = nickname;
            this.actions[nickname].push(action);
        });
        return true;
    };

    public setPlayerReady = (player: BSPlayer, isReady: boolean) : Game => {
        if (_hasPlayer.call(this, player) && this.state() === BSData.State.READY) {
            this.players[player.nickname].isReady = isReady;
            _updateState.call(this);
        }
        return this;
    };

    public placePlayerShips = (player: BSPlayer, ships: Array<BSShip>) : boolean => {
        if (this.logic.isDispositionValid(this.map, ships)) {

            if (_utils.isUndefined(this.map.boards[player.nickname])) {
                this.map.boards[player.nickname] = {};
            }
            this.map.boards[player.nickname].ships = {};

            _utils.forEach(ships, (ship, index) => {
                ship.id = player.nickname + '-ship-' + index;
                ship.hits = [];
                this.map.boards[player.nickname].ships[ship.id] = ship;
            });

            let allReady = true;
            _utils.forEach(this.players, (player, nickname) => {
                if (_utils.isUndefined(this.map.boards[nickname])) {
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

    public acceptPlayer = (player: BSPlayer, data: any) : boolean => {
        return _utils.isNull(player.game) &&
            this.state() === BSData.State.WAITING_PLAYERS &&
            _hasAvailableSlot.call(this) &&
            _passwordIsCorrect.call(this, data) &&
            !_hasPlayer.call(this, player);
    };

    public summary = () : {} => {
        return {
            id: this._id,
            name: this.name,
            players: this.countPlayers(),
            password: _utils.isString(this.password) && this.password.length > 0,
            maxPlayers: this.maxPlayers
        };
    };

    public addPlayer = (player: BSPlayer) : Game => {
        this.players[player.nickname] = {
            isReady: false,
            score: 0
        };
        player.join(this.socketRoomName);
        player.leave('lobby');
        player.game = this._id;
        _updateState.call(this);
        return this;
    };

    public removePlayer = (player: BSPlayer) : Game => {
        player.join('lobby');
        player.leave(this.socketRoomName);
        player.game = null;
        delete this.players[player.nickname];
        _updateState.call(this);
        return this;
    };

    public removeAllPlayers = (players: {}) : Game => {
        let self = this;
        _utils.forEach(players, player => {
            self.removePlayer(player);
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
    switch (this.state) {
        case BSData.State.WAITING_PLAYERS:
            if (!_hasAvailableSlot.call(this)) {
                this.state = BSData.State.READY;
            }
            break;

        case BSData.State.READY:
            if (_hasAvailableSlot.call(this)) {
                this.state = BSData.State.WAITING_PLAYERS;
            } else if (_areAllPlayersReady.call(this)) {
                this.state = BSData.State.SETTING;
            }
            break;
    }
    return this;
}

function _passwordIsCorrect(data: any): boolean {
    if (_utils.isString(this.password) && this.password.length) {
        return this.password === data.password;
    }
    return true;
}

function _hasPlayer(player: BSPlayer): boolean {
    return player.nickname in this.players;
}

function _hasAvailableSlot(): boolean {
    return this.countPlayers() < this.maxPlayers;
}

function _areAllPlayersReady(): boolean {
    try {
        _utils.forEach(this.players, player => {
            if (!player.isReady) throw new Error();
        });
    } catch (exception) { return false; }
    return true;
}

function _getTurnScores(actions: Array<BSAction>): {} {
    let scores = {};

    _utils.forEach(actions, action => {
        let owner = action.owner;
        if (_utils.isUndefined(scores[owner])) {
            scores[owner] = { score: 0, miss: 0 };
        }

        let missed = true;
        _utils.forEach(action.result, result => {
            if (result.type === 'hit ship') {
                missed = false;
                scores[owner].score += 1;
            }
        });
        scores[owner].miss += missed ? 1 : 0;
    });

    return scores;
}

function _updateBoards(actions: Array<BSAction>): Game {

    _utils.forEach(actions, action => {
        if (action.result.length === 0) {
            return;
        }

        _utils.forEach(action.result, result => {
            if (result.type === 'hit ship') {
                let owner = result.owner;
                let target = result.target;
                let ship = this.map.boards[owner].ships[target];
                let previousHits = ship.hits;
                let alreadyRegistered = false;

                _utils.forEach(previousHits, hit => {
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

function _updatePlayersInfos(scores: {}): Game {
    _utils.forEach(scores, (player, nickname) => {
        this.players[nickname].score += player.score;
    });
    return this;
}

export = Game;
