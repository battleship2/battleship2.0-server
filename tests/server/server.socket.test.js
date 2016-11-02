var expect = require('chai').expect,
    restify = require('restify'),
    socket = require('../../src/release/classes/socket.class'),
    io = require('socket.io'),
    ioClient = require('socket.io-client');

describe('socket', function () {

    var server,
        clientA, clientB, clientC,
        port = 9000,
        url = 'http://localhost:' + port;


    beforeEach(function (done) {
        server = restify.createServer();
        server.listen(port);
        socket(io.listen(server.server));
        clientA = ioClient.connect(url);
        clientB = ioClient.connect(url);
        clientC = ioClient.connect(url);
        done();
    });

    afterEach(function () {
        clientA.disconnect();
        clientB.disconnect();
        clientC.disconnect();
        server.close();
    });

    it('should give a nickname to a connecting socket', function (done) {
        clientA.on('nickname', function (nickname) {
            expect(nickname.length).to.be.gt(0);
            done();
        });
    });

    it('should let a client create a game', function (done) {
        clientA.on('nickname', function () {
            var game = {
                name: 'test',
                maxPlayers: 10
            };
            clientA.emit('create game', game);
        });
        clientA.on('game created', function (game) {
            expect(game.name).to.equal('test');
            expect(game.id).to.be.equal(1);
            expect(game.players).to.be.equal(1);
            expect(game.maxPlayers).to.be.equal(10);
            done()
        });
    });

    it('should let player join the game', function (done) {
        clientB = ioClient.connect(url);
        clientA.emit('create game', {name: 'test', maxPlayers: 4});
        clientA.on('game created', function (game) {
            clientB.emit('join game', {gameId: game.id});
        });

        clientB.on('new player', function () {
            done();
        });
    });

    it('should let player join when the correct password is provided', function (done) {
        clientB = ioClient.connect(url);
        var gameId;
        clientA.emit('create game', {name: 'game with pass', maxPlayers: 4, password: 'password'});
        clientA.on('game created', function (game) {
            gameId = game.id;
            clientB.emit('join game', {gameId: gameId});
        });

        clientB.on('refused', function () {
            clientB.emit('join game', {gameId: gameId, password: 'password'});
        });

        clientB.on('new player', function () {
            clientB.emit('list games');
        });
        clientB.on('list games', function (games) {
            expect(games.length).to.equal(1);
            expect(games[0].name).to.equal('game with pass');
            expect(games[0].players).to.equal(2);
            done();
        });
    });

    it('should refuse player when maxPlayer is reached', function (done) {
        clientA.emit('create game', {name: '2 players', maxPlayers: 2});
        var gameId;
        clientA.on('game created', function (game) {
            gameId = game.id;
            clientB.emit('join game', {gameId: gameId});
        });
        clientB.on('new player', function () {
            clientC.emit('join game', {gameId: gameId});
        });
        clientC.on('refused', function () {
            done();
        });
    });

    it('should destroy a game when all players have left it', function (done) {
        clientA.emit('create game', {name: 'temporary game', maxPlayers: 3});
        var phase = 1;

        clientA.on('game created', function () {
            clientA.emit('list games');
        });

        clientA.on('list games', function (games) {
            if (phase === 1) {
                expect(games.length).to.be.equal(1);
                expect(games[0].name).to.equal('temporary game');
                expect(games[0].players).to.equal(1);
                phase = 2;
                clientA.emit('leave game');
            } else {
                expect(games.length).to.equal(0);
                done();
            }
        });

        clientA.on('game left', function () {
            clientA.emit('list games');
        });
    });

});
