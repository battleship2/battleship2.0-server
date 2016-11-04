var expect = require('chai').expect,
    restify = require('restify'),
    socket = require('../../src/release/classes/socket.class'),
    SocketClass = require('../../src/release/classes/socket.class'),
    ServerClass = require('../../src/release/classes/server.class'),
    io = require('socket.io'),
    ioClient = require('socket.io-client');

describe('chat', function () {

    var server,
        clientA, clientB, clientC,
        port = 9001,
        url = 'http://localhost:' + port;


    beforeEach(function (done) {
        server = new ServerClass();
        socket = new SocketClass();

        socket.init(server.get());
        server.start();

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

    it("should dispatch a player's message to others in the lobby", function (done) {
        var nicknameA;
        var messageCounter = 0;

        clientA.on('nickname', function (nickname) {
            nicknameA = nickname;
            clientA.emit('message', 'hello!');
        });

        var receiveMessage = function (data) {
            expect(data.nickname).to.equal(nicknameA);
            expect(data.message).to.equal('hello!');
            messageCounter++;
            if (messageCounter === 3) done();
        };

        clientA.on('message', receiveMessage);
        clientB.on('message', receiveMessage);
        clientC.on('message', receiveMessage);
    });

    it("should only dispatch a message to players of the same game", function (done) {
        var nicknameA,
            messageCounter = 0;

        clientA.on('nickname', function (nickname) {
            nicknameA = nickname;
            clientA.emit('create game', {name: 'toto', maxPlayers: 4});
        });

        clientA.on('game created', function (game) {
            clientB.emit('join game', {gameId: game.id});
        });

        clientB.on('new player', function () {
            clientA.emit('message', "yo! what's up?");
        });


        var receiveMessage = function (data) {
            expect(data.nickname).to.equal(nicknameA);
            expect(data.message).to.equal("yo! what's up?");
            messageCounter++;
            if (messageCounter === 2) done();
        };

        clientA.on('message', receiveMessage);
        clientB.on('message', receiveMessage);
    });

});
