var expect = require('chai').expect,
    sinon = require('sinon'),
    Game = require('../../src/game');

describe('game', function () {
    var mockPlayer,
        game;

    describe('player trying to join', function () {
        beforeEach(function (done) {
            game = new Game(1, 'test', 5);
            mockPlayer = {
                id: 'toto',
                nickname: 'testing dude',
                game: null
            };
            done();
        });

        it("should accept a player when the game is public (no password)", function () {
            var result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.true;
        });

        it("should refuse a player if he does not provide the correct password", function () {
            game.password = 'the password';
            var conf = {};
            var result = game.acceptPlayer(mockPlayer, conf);
            expect(result).to.be.false;
            conf.password = 'the password';
            result = game.acceptPlayer(mockPlayer, conf);
            expect(result).to.be.true;
        });

        it("should refuse a player if the game's state isn't WAITING_PLAYERS", function () {
            game.state = Game.STATE.WAITING_PLAYERS;
            var result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.true;
            game.state = Game.STATE.READY;
            result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.false;
            game.state = Game.STATE.STARTED;
            result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.false;
        });

        it("should refuse a player if the limit of players is reached in the game", function () {
            game = new Game(1, '3 players', 3);
            game.players = {
                'Huey': {},
                'Dewey': {},
                'Louie': {}
            };
            var result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.false;
        });

        it("shoud refuse a player wich is already in an other game", function () {
            mockPlayer.game = 2;
            var result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.false;
            mockPlayer.game = null;
            result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.true;
        });
    });

    describe('player in game', function () {

        beforeEach(function () {
            game = new Game(1, 'test', 5);
            mockPlayer = {
                id: 'titi',
                nickname: 'testing dude',
                game: null,
                join: function () {},
                leave: function () {}
            };
        });

        it("should set the game property of the player when he is joining", function () {
            game.addPlayer(mockPlayer);
            expect(mockPlayer).to.have.property('game').to.equal(game.id);
            expect(game.players).to.have.property(mockPlayer.nickname);
            expect(Object.keys(game.players)).to.have.length(1);
        });

        it("should add the new player to the game's room and leave lobby", function () {
            mockPlayer.join = sinon.spy();
            mockPlayer.leave = sinon.spy();
            game.addPlayer(mockPlayer);
            var result = mockPlayer.join.calledWith(game.socket_room_name);
            expect(result).to.be.true;
            result = mockPlayer.leave.calledWith('lobby');
            expect(result).to.be.true;
        });

        it("should set the game's state to READY when the number of player is reached", function () {
            game = new Game(1, '2 players', 2);
            expect(game.state).to.equal(Game.STATE.WAITING_PLAYERS);
            game.players = {
                'dupont': {}
            };
            mockPlayer.nickname = 'dupond';
            game.addPlayer(mockPlayer);
            expect(game.state).to.equal(Game.STATE.READY);
        });

        it("should set the game's state to SETTING when every players are ready", function () {
            game = new Game(1, '2 players', 2);
            game.players = {
                'Sonic': { isReady: true },
                'Tails': { isReady: false }
            };
            game.state = Game.STATE.READY;
            mockPlayer.nickname = 'Tails';
            game.setPlayerReady(mockPlayer, true);
            expect(game.state).to.equal(Game.STATE.SETTING);
            expect(game.players['Sonic']).to.have.property('isReady').to.equal(true);
            expect(game.players['Tails']).to.have.property('isReady').to.equal(true);
        });
    });

    describe("player leaving game", function () {

        beforeEach(function () {
            game = new Game(1, 'test', 5);
            mockPlayer = {
                id: 'tutu',
                nickname: 'testing dude',
                game: null,
                join: function () {},
                leave: function () {}
            };
        });

        it("should make the player leave the room when he leave", function () {
            mockPlayer.join = sinon.spy();
            mockPlayer.leave = sinon.spy();
            mockPlayer.nickname = 'party pooper';
            game.players = {
                'party pooper': {}
            };
            game.removePlayer(mockPlayer);
            var result = mockPlayer.join.calledWith('lobby');
            expect(result).to.be.true;
            result = mockPlayer.leave.calledWith(game.socket_room_name);
            expect(result).to.be.true;
        });

        it("should change from READY to WAITING_PLAYERS when a player leaves the game", function () {
            game = new Game(1, 'not ready', 2);
            mockPlayer.nickname = 'pac-man';
            game.players = {
                'blanca': {},
                'pac-man': mockPlayer
            };
            game.state = Game.STATE.READY;
            game.removePlayer(mockPlayer);
            expect(game.state).to.equal(Game.STATE.WAITING_PLAYERS);
            expect(game.players).to.not.have.property('pac-man');
        });

        it("should keep state PLAYING even if a player is leaving", function () {
            game = new Game(1, 'playing', 3);
            mockPlayer.nickname = 'Mario';
            game.players = {
                'Mario': {},
                'Peach': {},
                'Luidgi': {}
            };
            game.state = Game.STATE.PLAYING;
            game.removePlayer(mockPlayer);
            expect(game.state).to.equal(Game.STATE.PLAYING);
            expect(game.players).to.not.have.property('Mario');
        });
    });
});
