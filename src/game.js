function Game (id, name, maxPlayers, password) {
    this.id = id;
    this.name = name;
    this.password = password ? password : '';
    this.maxPlayers = maxPlayers >= 2 && maxPlayers <= 10 ? maxPlayers : 4;
    this.players = {};
    this.map = {
        width: 10,
        height: 10,
        ships: {
            'destroyer': 1
        },
        max: {
            action: 1
        },
        boards: {}
    };
    this.actions = {};
    this.history = [];
    this.shipCounter = 0;

    this.state = Game.STATE.WAITING_PLAYERS;
    this.mechanic = require('./mechanics/basic');

    this.socket_room_name = '/game/' + this.id + '-' + this.name;
}

Game.STATE = {
    READY: 1,
    PLAYING: 2,
    WAITING_PLAYERS: 3,
    SETTING: 4
};

Game.prototype = {

    constructor : Game,

    addPlayer: function (player) {
        this.players[player.nickname] = {
            isReady: false,
            score: 0
        };
        player.join(this.socket_room_name);
        player.leave('lobby');
        player.game = this.id;
        this._updateState();
    },

    removePlayer: function (player) {
        player.join('lobby');
        player.leave(this.socket_room_name);
        player.game = null;
        delete this.players[player.nickname];
        this._updateState();
    },

    removeAllPlayers: function (players) {
        var playersToRemove = this.getPlayersList();
        var self = this;
        playersToRemove.forEach(function (nickname) {
            if (players[nickname]) {
                self.removePlayer(players[nickname]);
            }
        });
    },

    acceptPlayer: function (player, data) {
        return player.game === null &&
            this.state === Game.STATE.WAITING_PLAYERS &&
            this._hasAvailableSlot() &&
            this._passwordIsCorrect(data) &&
            !this._hasPlayer(player)
    },

    isStillPlayable: function () {
        return this.countPlayers() > 2;
    },

    isOpen: function () {
        return this.state === Game.STATE.WAITING_PLAYERS && this._hasAvailableSlot();
    },

    summary: function () {
        return {
            name: this.name,
            id: this.id,
            maxPlayers: this.maxPlayers,
            players: this.countPlayers(),
            password: this.password.length > 0
        };
    },

    emit: function (io, event, data) {
        if (data === undefined) {
            io.sockets.in(this.socket_room_name).emit(event);
        } else {
            io.sockets.in(this.socket_room_name).emit(event, data);
        }
    },

    placePlayerShips: function (player, ships) {
        if (this.mechanic.isDispositionValid(this.map, ships)) {
            if (this.map.boards[player.nickname] === undefined) {
                this.map.boards[player.nickname] = {};
            }
            this.map.boards[player.nickname].ships = {};
            for (var s = 0; s < ships.length; ++s) {
                this.shipCounter++;
                var ship = ships[s];
                ship.id = player.nickname + '-' + this.shipCounter;
                ship.hits = [];
                this.map.boards[player.nickname].ships[ship.id] = ship;
            }
            var allReady = true;
            for (var nickname in this.players) {
                if (!this.players.hasOwnProperty(nickname)) {
                    continue;
                }
                if (this.map.boards[nickname] === undefined) {
                    allReady = false;
                }
            }
            if (allReady) {
                this.state = Game.STATE.PLAYING;
            }
            return true;
        }
        return false;
    },

    setNextActions: function (player, actions) {
        if (this.mechanic.isActionsValid(this.map, actions)) {
            this.actions[player.nickname] = actions;
            return true;
        }
        return false;
    },

    hasEveryonePlayedTheTurn: function () {
        for (var player in this.players) {
            if (!this.players.hasOwnProperty(player)) {
                continue;
            }
            if (this.actions[player] === undefined) {
                return false;
            }
        }
        return true;
    },

    playTheTurn: function () {
        var result = {
            actions: [],
            turnScores: [],
            players: [],
            events: []
        };
        var rawResult = this.mechanic.processTurn(result, this.actions, this.map);
        this._updateBoards(result, rawResult);
        this._updatePlayerInfos(result, rawResult);
        this.history.push(JSON.parse(JSON.stringify(this.actions)));
        this.actions = {};

        result.players = this.getPlayersInfos();
        return result;
    },

    getPlayersList: function () {
        return Object.keys(this.players);
    },

    getPlayersInfos: function () {
        var infos = [];
        for (var player in this.map.boards) {
            if (!this.map.boards.hasOwnProperty(player)) {
                continue;
            }
            var infosPlayer = {
                nickname: player,
                score: this.players[player].score,
                maxHealth: 0,
                health: 0
            };
            for (var shipId in this.map.boards[player].ships) {
                if (!this.map.boards[player].ships.hasOwnProperty(shipId)) {
                    continue;
                }
                var ship = this.map.boards[player].ships[shipId];
                var shipHealth = ship.width * ship.height;
                infosPlayer.maxHealth += shipHealth;
                if (ship.destroyed) {
                    continue;
                }
                infosPlayer.health += (shipHealth - ship.hits.length);
            }
            infos.push(infosPlayer);
        }
        return infos;
    },

    countPlayers: function () {
        return this.getPlayersList().length;
    },

    setPlayerReady: function(player, isReady) {
        if (this._hasPlayer(player) && this.state === Game.STATE.READY) {
            this.players[player.nickname].isReady = isReady;
            this._updateState();
        }
    },

    _updateBoards: function(result, rawResult) {
        result.events = [];
        var hits = rawResult.hits;
        for (var h = 0; h < hits.length; ++h) {
            var hit = hits[h];
            var info = hit.ship;
            var ship = this.map.boards[info.owner].ships[info.id];
            var previousHits = ship.hits;
            var alreadyRegistered = false;
            for (var i = 0; i < previousHits.length; ++i) {
                if (previousHits[i].x === info.localHit.x && previousHits[i].y === info.localHit.y) {
                    alreadyRegistered = true;
                    break;
                }
            }
            if (!alreadyRegistered) {
                ship.hits.push(info.localHit);
            }

            if (previousHits.length > ship.width * ship.height) {
                ship.destroyed = true;
            }
        }
    },

    _updatePlayerInfos: function (result, rawResult) {
        result.turnScores = [];
        var hits = rawResult.hits;
        var tmp = {};
        for (var h = 0; h < hits.length; ++h) {
            var owner = hits[h].owner;
            if (tmp[owner]) {
                tmp[owner] = { score : 1 };
            } else {
                tmp[owner].score += 1;
            }
            this.players[owner].score += 1;
        }
        for (var player in tmp) {
            result.turnScores.push({
                nickname: player,
                score: tmp[player].score
            });
        }
    },

    _updateState: function () {
        switch (this.state) {
            case Game.STATE.WAITING_PLAYERS:
                if (!this._hasAvailableSlot()) {
                    this.state = Game.STATE.READY;
                }
                break;
            case Game.STATE.READY:
                if (this._hasAvailableSlot()) {
                    this.state = Game.STATE.WAITING_PLAYERS;
                }
                if (this._areAllPlayersReady()) {
                    this.state = Game.STATE.SETTING;
                }
                break;
            case Game.STATE.PLAYING:
                break;
        }
    },

    _areAllPlayersReady: function () {
        for (var nickname in this.players) {
            if (!this.players.hasOwnProperty(nickname)) {
                continue;
            }
            if (!this.players[nickname].isReady) {
                return false;
            }
        }
        return true;
    },

    _hasPlayer: function (player) {
        return player.nickname in this.players;
    },

    _hasAvailableSlot: function () {
        return this.countPlayers() < this.maxPlayers;
    },

    _passwordIsCorrect: function (data) {
        if (this.password.length > 0) {
            return this.password === data.password;
        }
        return true;
    }
};

module.exports = Game;
