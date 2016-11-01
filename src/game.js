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
                var ship = ships[s];
                ship.id = player.nickname + '-ship-' + s;
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
            var nickname = player.nickname;
            this.actions[nickname] = [];

            for (var i = 0; i < actions.length; ++i) {
                actions[i].id = nickname + '-action-' + i;
                actions[i].owner = nickname;
                this.actions[nickname].push(actions[i]);
            }
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
        var actions = this.mechanic.processTurn(this.actions, this.map);
        var scores = this._getTurnScores(actions);

        this._updateBoards(actions);
        this._updatePlayersInfos(scores);
        this.history.push(JSON.parse(JSON.stringify(this.actions)));
        this.actions = {};

        return {
            actions: actions,
            turnScore: scores,
            players: this.getPlayersInfos()
        };
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

    _getTurnScores: function (actions) {
        var scores = {};
        for (var i = 0; i < actions.length; ++i) {
            var action = actions[i];
            var owner = action.owner;
            if (scores[owner] === undefined) {
                scores[owner] = {
                    score: 0,
                    missed: 0
                }
            }
            var missed = true;
            for (var j = 0; j < action.result.length; ++j) {
                var result = action.result[j];
                if (result.type === 'hit ship') {
                    missed = false;
                    scores[owner].score += 1;
                }
            }
            scores[owner].missed += missed ? 1 : 0;
        }
        return scores;
    },

    _updateBoards: function (actions) {
        for (var i = 0; i < actions.length; ++i) {
            var action = actions[i];
            if (action.result.length === 0) {
                continue;
            }
            for (var j = 0; j < action.result.length; ++j) {
                var result = action.result[j];
                if (result.type === 'hit ship') {
                    var owner = result.owner;
                    var target = result.target;
                    var ship = this.map.boards[owner].ships[target];
                    var previousHits = ship.hits;
                    var alreadyRegistered = false;

                    for (var x = 0; x < previousHits.length; ++x) {
                        if (previousHits[x].x === result.localHit.x && previousHits[x].y === result.localHit.y) {
                            alreadyRegistered = true;
                            break;
                        }
                    }
                    if (!alreadyRegistered) {
                        ship.hits.push(result.localHit);
                    }

                    if (ship.hits.length === ship.width * ship.height) {
                        ship.destroyed = true;
                    }
                }
            }
        }
    },

    _updatePlayersInfos: function (scores) {
        for (var player in scores) {
            if (!scores.hasOwnProperty(player)) {
                continue;
            }
            this.players[player].score += scores[player].score;
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
