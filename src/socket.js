module.exports = function (io) {
    var Game = require('./game');
    var words = require('./words');

    var gameId = 0;

    var bf = {
        sockets: {},
        games: {}
    };

    var pickOne = function(list) {
        return list[Math.floor(Math.random() * list.length)];
    };

    var generateNickname = function () {
        var nickname;
        do {
            nickname = pickOne(words.adjectives) + ' ' + pickOne(words.nouns);
        } while (nickname in bf.sockets);
        return nickname;
    };

    var isPlaying = function (player) {
        return player.game && player.game in bf.games;
    };

    var playerData = function (player) {
        return {
            id: player.id,
            nickname: player.nickname
        };
    };

    var getGame = function (player) {
        return bf.games[player.game];
    };

    io.sockets.on('connection', function (player) {

        player.nickname = generateNickname();
        player.game = null;
        bf.sockets[player.nickname] = player;
        player.join('lobby');

        player.emit('nickname', player.nickname);

        player.on('disconnect', function () {
            if (isPlaying(player)) {
                getGame(player).removePlayer(player);
            }
            delete bf.sockets[player.nickname];
        });

        // room creation

        player.on('create game', function (gameData) {
            if (!isPlaying(player)) {
                gameId += 1;
                var game = new Game(gameId, gameData.name, gameData.maxPlayers, gameData.password);
                game.addPlayer(player);
                bf.games[game.id] = game;
                player.emit('game created', game.summary());
            } else {
                player.emit('error', {message: 'you are already in a game.'});
            }
        });

        player.on('join game', function (data) {
            var gameId = data.gameId;
            if (gameId !== undefined && gameId in bf.games) {
                var game = bf.games[gameId];
                if (game.acceptPlayer(player, data)) {
                    game.addPlayer(player);
                    game.emit(io, 'new player', playerData(player));
                    if (game.state === Game.STATE.READY) {
                        game.emit(io, 'game state', {state: 'ready'});
                    }
                } else {
                    player.emit('refused');
                }
            } else {
                player.emit('error', {message: 'no game with id ' + gameId});
            }
        });

        player.on('leave game', function () {
            if (player.game !== null) {
                var game = getGame(player);
                game.removePlayer(player);
                game.emit(io, 'player left', {nickname: player.nickname});
                player.emit('game left');
                var playersCount = game.countPlayers();
                if (playersCount <= 0 || (game.state === Game.STATE.READY && !game.isStillPlayable())) {
                    if (playersCount > 0) {
                        game.emit(io, 'game state', {state: 'stopped'});
                        game.removeAllPlayers(bf.sockets);
                    }
                    delete bf.games[game.id];
                }
            } else {
                player.emit('error', {message: 'To leave a game, you first need to join one…'});
            }
        });

        player.on('list games', function () {
            var games = [];
            Object.keys(bf.games).forEach(function (id) {
                if (bf.games[id].isOpen()) {
                    games.push(bf.games[id].summary());
                }
            });
            player.emit('list games', games);
        });

        // game

        player.on('ready', function (ready) {
            if (isPlaying(player)) {
                var game = getGame(player);
                if (game.state === Game.STATE.READY) {
                    game.setPlayerReady(player, ready);
                    game.emit(io, 'player ready', {nickname: player.nickname, isReady: ready});
                    if (game.state === Game.STATE.SETTING) {
                        game.emit(io, 'game state', {
                            state: 'place ship',
                            ships: game.map.ships
                        });
                    }
                }
            }
        });

        player.on('place ships', function (ships) {
            if (isPlaying(player)) {
                var game = getGame(player);
                if (game.state === Game.STATE.SETTING) {
                    if (game.placePlayerShips(player, ships)) {
                        player.emit('ship placement', true);
                        if (game.state === Game.STATE.PLAYING) {
                            game.emit(io, 'game state', {state: 'new turn'});
                            game.emit(io, 'new round');
                        }
                    } else {
                        player.emit('ship placement', {error: 'learn how to place your ships…'});
                    }
                } else {
                    player.emit('error', {message: 'it is not the moment to place your ship'})
                }
            }
        });

        player.on('play turn', function (bomb) {
            if (isPlaying(player)) {
                var game = getGame(player);
                if (game.setNextActions(player, bomb)) {
                    player.emit('play turn', true);
                    if (game.hasEveryonePlayedTheTurn()) {
                        var results = game.playTheTurn();
                        game.emit(io, 'turn results', results);
                        game.emit(io, 'game state', {state: 'new turn'});
                    }
                } else {
                    player.emit('play turn', {error: 'learn how to place a bomb…'});
                }
            }
        });

        // chat

        player.on('message', function (message) {
            var messageData = {
                id: player.id,
                nickname: player.nickname,
                message: message
            };

            if (isPlaying(player)) {
                var game = getGame(player);
                game.emit(io, 'message', messageData);
            } else {
                io.sockets.in('lobby').emit('message', messageData);
            }
        });

    });

};
