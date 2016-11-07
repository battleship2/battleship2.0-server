var expect = require('chai').expect,
    sinon = require('sinon'),
    BSData = require('../../src/release/definitions/bsdata'),
    ShipBattleship = require('../../src/release/classes/ships/ship.battleship.class'),
    ShipDestroyer = require('../../src/release/classes/ships/ship.destroyer.class'),
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

    var makeBomb = function (x, y) {
        return {
            x: x,
            y: y,
            type: BSData.ActionType.BOMB
        };
    };

    beforeEach(function () {
        game = new Game('test', 3);
        game.map.setShips([{type: BSData.ShipType.DESTROYER, amount: 1}]);
        player1 = createMockPlayer('player1');
        game.addPlayer(player1);
        player2 = createMockPlayer('player2');
        game.addPlayer(player2);
        player3 = createMockPlayer('player3');
        game.addPlayer(player3);
        game.setPlayerReady(player1, true);
        game.setPlayerReady(player2, true);
        game.setPlayerReady(player3, true);
        game.placePlayerShips(player1, [new ShipDestroyer(0, 0)]);
        game.placePlayerShips(player2, [new ShipDestroyer(1, 1)]);
        game.placePlayerShips(player3, [new ShipDestroyer(2, 2)]);
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
        game.map.max = {action: 1};

        var ship3 = new ShipBattleship(2, 2, true);
        game.map.boards[player3.bs_uuid].ships = {};
        game.map.boards[player3.bs_uuid].ships[ship3.bs_uuid] = ship3;

        expect(game.actions).to.deep.equal({});

        game.setNextActions(player1, [makeBomb(5, 0)]);
        game.setNextActions(player2, [makeBomb(5, 0)]);
        game.setNextActions(player3, [makeBomb(5, 0)]);

        expect(game.hasEveryonePlayedTheTurn()).to.be.true;

        var result = game.playTheTurn();

        expect(result.actions).to.have.length(3);

        expect(result.actions[0].result).to.deep.equal([]);
        expect(result.actions[1].result).to.deep.equal([]);
        expect(result.actions[2].result).to.deep.equal([]);

        game.setNextActions(player1, [
            makeBomb(2, 2) // hits player3
        ]);
        game.setNextActions(player2, [
            makeBomb(2, 2) // hits player3
        ]);
        game.setNextActions(player3, []);

        result = game.playTheTurn();

        expect(result).to.have.property('actions').to.have.length(2);

        expect(result.actions[0].result).to.deep.equal([{
            localHit: {x: 0, y: 0},
            owner: player3.bs_uuid,
            target: ship3.bs_uuid,
            type: 'hit ship'
        }]);
        expect(result.actions[1].result).to.deep.equal([{
            localHit: {x: 0, y: 0},
            owner: player3.bs_uuid,
            target: ship3.bs_uuid,
            type: 'hit ship'
        }]);
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

    it('should indicate if the bomb of a player sink a ship', function () {
        game.map.max = {action: 1};
        var ship1 = new ShipDestroyer(0, 0, true);
        var ship2 = new ShipDestroyer(1, 1, true);
        var ship3 = new ShipDestroyer(2, 2, true);
        game.map.boards[player1.bs_uuid].ships = {};
        game.map.boards[player2.bs_uuid].ships = {};
        game.map.boards[player3.bs_uuid].ships = {};
        game.map.boards[player1.bs_uuid].ships[ship1.bs_uuid] = ship1;
        game.map.boards[player2.bs_uuid].ships[ship2.bs_uuid] = ship2;
        game.map.boards[player3.bs_uuid].ships[ship3.bs_uuid] = ship3;

        game.setNextActions(player1, [
            makeBomb(2, 2) // hits player3
        ]);
        game.setNextActions(player2, [
            makeBomb(3, 2) // hits player3
        ]);
        game.setNextActions(player3, [
            makeBomb(0, 0) // hits player1
        ]);

        var result = game.playTheTurn();

        expect(result.actions[0]).to.have.property('owner', 'player1');
        expect(result.actions[1]).to.have.property('owner', 'player2');
        expect(result.actions[2]).to.have.property('owner', 'player3');

        expect(result.actions[0].result).to.have.length(2);
        expect(result.actions[0].result[0]).to.deep.equal({
            type: 'hit ship',
            owner: player3.bs_uuid,
            target: ship3.bs_uuid,
            localHit: {x: 0, y: 0}
        });
        expect(result.actions[0].result[1]).to.deep.equal({
            type: 'sink ship',
            owner: player3.bs_uuid,
            target: ship3.bs_uuid
        });

        expect(result.actions[1].result).to.have.length(2);
        expect(result.actions[1].result[0]).to.deep.equal({
            type: 'hit ship',
            owner: player3.bs_uuid,
            target: ship3.bs_uuid,
            localHit: {x: 1, y: 0}
        });
        expect(result.actions[1].result[1]).to.deep.equal({
            type: 'sink ship',
            owner: player3.bs_uuid,
            target: ship3.bs_uuid
        });

        expect(result.actions[2].result).to.have.length(1);
        expect(result.actions[2].result[0]).to.deep.equal({
            type: 'hit ship',
            owner: player1.bs_uuid,
            target: ship1.bs_uuid,
            localHit: {x: 0, y: 0}
        });
    });
});
