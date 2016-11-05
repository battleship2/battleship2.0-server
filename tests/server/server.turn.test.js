var expect = require('chai').expect,
    sinon = require('sinon'),
    BSData = require('../../src/release/definitions/bsdata'),
    Game = require('../../src/release/classes/game.class');

describe('server.turn:', function () {

    var player1,
        player2,
        player3,
        game;

    var createMockPlayer = function (id) {
        return {
            bs_uuid: id,
            nickname: id,
            game: null,
            join: function () {},
            leave: function () {}
        };
    };

    var makeDestroyer = function (x, y) {
        return {
            x: x,
            y: y,
            width: 2,
            height: 1,
            type: BSData.ShipType.DESTROYER
        };
    };

    var makeBomb = function (x, y) {
        return {
            x: x,
            y: y,
            type: BSData.ActionType.BOMB
        };
    };

    beforeEach(function () {
        game = new Game('test', 3);
        game.map.width = 10;
        game.map.height = 10;
        game.map.ships = [{type: BSData.ShipType.DESTROYER, amount: 1}];
        player1 = createMockPlayer('player1');
        game.addPlayer(player1);
        player2 = createMockPlayer('player2');
        game.addPlayer(player2);
        player3 = createMockPlayer('player3');
        game.addPlayer(player3);
        game.setPlayerReady(player1, true);
        game.setPlayerReady(player2, true);
        game.setPlayerReady(player3, true);
        game.placePlayerShips(player1, [makeDestroyer(0, 0)]);
        game.placePlayerShips(player2, [makeDestroyer(1, 1)]);
        game.placePlayerShips(player3, [makeDestroyer(2, 2)]);
    });

    it('should save all the players actions during the turn', function () {
        game.map.max.action = 1;
        game.map.max.other = [];

        expect(game.actions).to.deep.equal({});

        game.setNextActions(player1, [makeBomb(1, 1)]);
        game.setNextActions(player2, [makeBomb(2, 2)]);

        expect(game.actions['player1']).to.deep.equal([{
            x: 1, y: 1, type: BSData.ActionType.BOMB, owner: 'player1', id: 'player1-action-0'
        }]);
        expect(game.actions['player2']).to.deep.equal([{
            x: 2, y: 2, type: BSData.ActionType.BOMB, owner: 'player2', id: 'player2-action-0'
        }]);

        game.setNextActions(player1, [makeBomb(3, 3)]);
        expect(game.actions['player1'][0]).to.deep.equal({
            x: 3, y: 3, type: BSData.ActionType.BOMB, owner: 'player1', id: 'player1-action-0'
        });

        expect(game.hasEveryonePlayedTheTurn()).to.be.false;

        game.setNextActions(player2, [makeBomb(3, 3)]);
        expect(game.actions['player2'][0]).to.deep.equal({
            x: 3, y: 3, type: BSData.ActionType.BOMB, owner: 'player2', id: 'player2-action-0'
        });

        expect(game.hasEveryonePlayedTheTurn()).to.be.false;

        game.setNextActions(player3, [makeBomb(4, 4)]);
        expect(game.hasEveryonePlayedTheTurn()).to.be.true;

        expect(game.actions['player1']).to.deep.equal([{
            x: 3, y: 3, type: BSData.ActionType.BOMB, owner: 'player1', id: 'player1-action-0'
        }]);
        expect(game.actions['player2']).to.deep.equal([{
            x: 3, y: 3, type: BSData.ActionType.BOMB, owner: 'player2', id: 'player2-action-0'
        }]);
        expect(game.actions['player3']).to.deep.equal([{
            x: 4, y: 4, type: BSData.ActionType.BOMB, owner: 'player3', id: 'player3-action-0'
        }]);
    });

    it('should empty the actions when the turn is processed', function () {
        game.map.max = {action: 1};

        expect(game.actions).to.deep.equal({});

        game.setNextActions(player1, [makeBomb(1, 1)]);
        game.setNextActions(player2, [makeBomb(2, 2)]);
        game.setNextActions(player3, [makeBomb(3, 3)]);

        expect(game.actions).to.have.property('player1');
        expect(game.actions).to.have.property('player2');
        expect(game.actions).to.have.property('player3');

        game.playTheTurn();
        expect(game.actions).to.deep.equal({});
    });

    it('should return all the players actions at the end of the turn', function () {
        // one action per turn
        game.map.max = {action: 1};

        expect(game.actions).to.deep.equal({});

        game.setNextActions(player1, [makeBomb(5, 0)]);
        game.setNextActions(player2, [makeBomb(5, 0)]);
        game.setNextActions(player3, [makeBomb(5, 0)]);

        expect(game.hasEveryonePlayedTheTurn()).to.be.true;

        var result = game.playTheTurn();

        expect(result.actions).to.have.length(3);
    });

    it('should return the round score of the player', function () {
        game.map.max.action = 2;

        game.setNextActions(player1, [
            makeBomb(5, 5), // miss
            makeBomb(2, 1) // hit player2
        ]);
        game.setNextActions(player2, [
            makeBomb(1, 0) // hit player1
        ]);
        game.setNextActions(player3, []);

        expect(game.hasEveryonePlayedTheTurn()).to.be.true;

        var result = game.playTheTurn();

        expect(result.turnScores.player1).to.have.property('score').to.be.equal(1);
        expect(result.turnScores.player1).to.have.property('miss').to.be.equal(1);
        expect(result.turnScores.player2).to.have.property('score').to.be.equal(1);
        expect(result.turnScores.player2).to.have.property('miss').to.be.equal(0);

        expect(result.turnScores).to.not.have.property('player3');
    });

    it('should mark a touched ship', function () {
        game.map.max = {action: 2};

        game.setNextActions(player1, [
            makeBomb(2, 2) // hits player3
        ]);
        game.setNextActions(player2, [
            makeBomb(1, 1) // hits itself, thus noone
        ]);
        game.setNextActions(player3, []);

        var result = game.playTheTurn();

        expect(result.turnScores.player1).to.have.property('score').to.be.equal(1);
        expect(result.turnScores.player1).to.have.property('miss').to.be.equal(0);
        expect(result.turnScores.player2).to.have.property('score').to.be.equal(0);
        expect(result.turnScores.player2).to.have.property('miss').to.be.equal(1);

        game.setNextActions(player1, [
            makeBomb(2, 2) // hits player3 again
        ]);
        game.setNextActions(player2, [
            makeBomb(2, 2) // hits player3
        ]);
        game.setNextActions(player3, []);

        result = game.playTheTurn();

        expect(result.turnScores.player1).to.have.property('score').to.be.equal(0);
        expect(result.turnScores.player1).to.have.property('miss').to.be.equal(1);
        expect(result.turnScores.player2).to.have.property('score').to.be.equal(0);
        expect(result.turnScores.player2).to.have.property('miss').to.be.equal(1);
    });

    it('should return information on all players', function () {
        game.map.max = {action: 2};

        var playersInfos = game.getPlayersInfos();

        expect(playersInfos[0]).to.have.property('id', 'player1');
        expect(playersInfos[0]).to.have.property('nickname', 'player1');
        expect(playersInfos[0]).to.have.property('score', 0);
        expect(playersInfos[0]).to.have.property('maxHealth', 2);
        expect(playersInfos[0]).to.have.property('health', 2);
        expect(playersInfos[1]).to.have.property('id', 'player2');
        expect(playersInfos[1]).to.have.property('nickname', 'player2');
        expect(playersInfos[1]).to.have.property('score', 0);
        expect(playersInfos[1]).to.have.property('maxHealth', 2);
        expect(playersInfos[1]).to.have.property('health', 2);
        expect(playersInfos[2]).to.have.property('id', 'player3');
        expect(playersInfos[2]).to.have.property('nickname', 'player3');
        expect(playersInfos[2]).to.have.property('score', 0);
        expect(playersInfos[2]).to.have.property('maxHealth', 2);
        expect(playersInfos[2]).to.have.property('health', 2);

        game.setNextActions(player1, [
            makeBomb(4, 5), // miss
            makeBomb(2, 2) // hits player3
        ]);
        game.setNextActions(player2, [
            makeBomb(2, 2), // hits player3
            makeBomb(4, 5) // miss
        ]);
        game.setNextActions(player3, []);

        var result = game.playTheTurn();

        expect(result.players).to.have.length(3);

        expect(result.players[0]).to.have.property('id', 'player1');
        expect(result.players[0]).to.have.property('nickname', 'player1');
        expect(result.players[0]).to.have.property('score', 1);
        expect(result.players[0]).to.have.property('health', 2);

        expect(result.players[1]).to.have.property('id', 'player2');
        expect(result.players[1]).to.have.property('nickname', 'player2');
        expect(result.players[1]).to.have.property('score', 1);
        expect(result.players[1]).to.have.property('health', 2);

        expect(result.players[2]).to.have.property('id', 'player3');
        expect(result.players[2]).to.have.property('nickname', 'player3');
        expect(result.players[2]).to.have.property('score', 0);
        expect(result.players[2]).to.have.property('health', 1);

        game.setNextActions(player1, [
            makeBomb(1, 1) // hits player2
        ]);
        game.setNextActions(player2, [
            makeBomb(2, 2), // hits player3 again at the same place
            makeBomb(5, 5) // miss
        ]);
        game.setNextActions(player3, []);

        result = game.playTheTurn();

        expect(result.players[0]).to.have.property('id', 'player1');
        expect(result.players[0]).to.have.property('nickname', 'player1');
        expect(result.players[0]).to.have.property('score', 2);
        expect(result.players[0]).to.have.property('health', 2);

        expect(result.players[1]).to.have.property('id', 'player2');
        expect(result.players[1]).to.have.property('nickname', 'player2');
        expect(result.players[1]).to.have.property('score', 1);
        expect(result.players[1]).to.have.property('health', 1);

        expect(result.players[2]).to.have.property('id', 'player3');
        expect(result.players[2]).to.have.property('nickname', 'player3');
        expect(result.players[2]).to.have.property('score', 0);
        expect(result.players[2]).to.have.property('health', 1);
    });
});
