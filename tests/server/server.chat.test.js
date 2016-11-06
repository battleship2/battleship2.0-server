var expect = require('chai').expect,
    restify = require('restify'),
    SocketClass = require('../../src/release/classes/socket.class'),
    ServerClass = require('../../src/release/classes/server.class'),
    ioClient = require('socket.io-client');

require('events').EventEmitter.prototype._maxListeners = 100;

describe('server.chat:', function () {

    var server, socket,
        clientA, clientB, clientC,
        port = 9000,
        url = 'http://localhost:' + port;

    function _clean(client) {
        client.off();
        client.disconnect();
        client.destroy();
    }

    beforeEach(function (done) {
        server = new ServerClass();
        socket = new SocketClass();

        socket.init(server.get());
        server.start(port);

        clientA = ioClient(url);
        clientB = ioClient(url);
        clientC = ioClient(url);
        done();
    });

    afterEach(function () {
        _clean(clientA);
        _clean(clientB);
        _clean(clientC);
        server.close();
    });

    it('should dispatch a the message of a player to others in the lobby', function (done) {
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

    it('should only dispatch a message to players of the same game', function (done) {
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
            clientA.emit('message', 'yo!');
        });


        var receiveMessage = function (data) {
            expect(data.nickname).to.equal(nicknameA);
            expect(data.message).to.equal('yo!');
            messageCounter++;
            if (messageCounter === 2) done();
        };

        clientA.on('message', receiveMessage);
        clientB.on('message', receiveMessage);
    });

});
