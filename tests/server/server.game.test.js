var expect = require('chai').expect,
    sinon = require('sinon'),
    bsdata = require('../../src/release/definitions/bsdata'),
    Game = require('../../src/release/classes/game.class');

describe('server.game:', function () {
    var mockPlayer,
        game;

    describe('[Player trying to join]', function () {
        beforeEach(function (done) {
            game = new Game('test', 5);
            mockPlayer = {
                id: 'toto',
                nickname: 'testing dude',
                game: null
            };
            done();
        });

        it('should accept a player when the game is public (no password)', function () {
            var result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.true;
        });

        it('should refuse a player if he does not provide the correct password', function () {
            game.password = 'the password';
            var conf = {};
            var result = game.acceptPlayer(mockPlayer, conf);
            expect(result).to.be.false;
            conf.password = 'the password';
            result = game.acceptPlayer(mockPlayer, conf);
            expect(result).to.be.true;
        });

        it('should refuse a player if the state of the game is not WAITING_PLAYERS', function () {
            game.state = bsdata.State.WAITING_PLAYERS;
            var result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.true;
            game.state = bsdata.State.READY;
            result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.false;
            game.state = bsdata.State.STARTED;
            result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.false;
        });

        it('should refuse a player if the limit of players is reached in the game', function () {
            game = new Game('3 players', 3);
            game.players = {
                'Huey': {},
                'Dewey': {},
                'Louie': {}
            };
            var result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.false;
        });

        it('shoud refuse a player wich is already in an other game', function () {
            mockPlayer.game = 2;
            var result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.false;
            mockPlayer.game = null;
            result = game.acceptPlayer(mockPlayer, {});
            expect(result).to.be.true;
        });
    });

    describe('[Player in game]', function () {

        beforeEach(function () {
            game = new Game('test', 5);
            mockPlayer = {
                bs_uuid: 'titi',
                nickname: 'testing dude',
                game: null,
                join: function () {},
                leave: function () {}
            };
        });

        it('should set the game property of the player when he is joining', function () {
            game.addPlayer(mockPlayer);
            expect(mockPlayer).to.have.property('game').to.have.property('id').to.equal(game.id);
            expect(Object.keys(game.players)).to.have.length(1);
            expect(game.players).to.have.property(mockPlayer.bs_uuid);
        });

        it('should add the new player to the room of the game and leave lobby', function () {
            mockPlayer.join = sinon.spy();
            mockPlayer.leave = sinon.spy();
            game.addPlayer(mockPlayer);
            var result = mockPlayer.join.calledWith(game.socketRoomName);
            expect(result).to.be.true;
        });

        it('should set the state of the game to READY when the number of player is reached', function () {
            game = new Game('2 players', 2);
            expect(game.state).to.equal(bsdata.State.WAITING_PLAYERS);
            game.players = {
                'dupont': {}
            };
            mockPlayer.nickname = 'dupond';
            game.addPlayer(mockPlayer);
            expect(game.state).to.equal(bsdata.State.READY);
        });

        it('should set the state of the game to SETTING when every players are ready', function () {
            game = new Game('2 players', 2);
            game.players = {
                'Sonic': { isReady: true },
                'Tails': { isReady: false }
            };
            game.state = bsdata.State.READY;
            mockPlayer.bs_uuid = 'Tails';
            game.setPlayerReady(mockPlayer, true);
            expect(game.state).to.equal(bsdata.State.SETTING);
            expect(game.players['Sonic']).to.have.property('isReady').to.equal(true);
            expect(game.players['Tails']).to.have.property('isReady').to.equal(true);
        });
    });

    describe('[Player leaving game]', function () {

        beforeEach(function () {
            game = new Game('test', 5);
            mockPlayer = {
                id: 'tutu',
                nickname: 'testing dude',
                game: null,
                join: function () {},
                leave: function () {}
            };
        });

        it('should make the player leave the room when he leaves', function () {
            mockPlayer.join = sinon.spy();
            mockPlayer.leave = sinon.spy();
            mockPlayer.nickname = 'party pooper';
            game.players = {
                'party pooper': {}
            };
            game.removePlayer(mockPlayer);
            result = mockPlayer.leave.calledWith(game.socketRoomName);
            expect(result).to.be.true;
        });

        it('should change from READY to WAITING_PLAYERS when a player leaves the game', function () {
            game = new Game('not ready', 2);
            mockPlayer.bs_uuid = 'pac-man';
            game.players = {
                'blanca': {},
                'pac-man': mockPlayer
            };
            game.state = bsdata.State.READY;
            game.removePlayer(mockPlayer);
            expect(game.state).to.equal(bsdata.State.WAITING_PLAYERS);
            expect(game.players).to.not.have.property('pac-man');
        });

        it('should keep state PLAYING even if a player is leaving', function () {
            game = new Game('playing', 3);
            mockPlayer.bs_uuid = 'Mario';
            game.players = {
                'Mario': {},
                'Peach': {},
                'Luidgi': {}
            };
            game.state = bsdata.State.PLAYING;
            game.removePlayer(mockPlayer);
            expect(game.state).to.equal(bsdata.State.PLAYING);
            expect(game.players).to.not.have.property('Mario');
        });
    });
});
