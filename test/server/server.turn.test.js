var expect = require('chai').expect,
    sinon = require('sinon'),
    Game = require('../../src/game');

describe('turn process', function () {

    var player1,
        player2,
        player3,
        game;

    var Ships = {
        carrier: 5,
        battleship: 4,
        cruiser: 3,
        submarine: 3,
        destroyer: 2
    };

    beforeEach(function () {
        game = new Game(1, 'test', 3);
        game.map.width = 10;
        game.map.height = 10;
        game.ship = {destroyer : 1};
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

    var createMockPlayer = function (id) {
        return {
            id: id,
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
            type: 'destroyer'
        };
    };

    var makeBomb = function (x, y) {
        return {
            x: x,
            y: y,
            type: 'bomb'
        };
    };

    it('should save all the players actions during the turn', function () {
        game.max = {action: 1};

        expect(game.actions).to.deep.equal({});

        game.setNextActions(player1, [makeBomb(1, 1)]);
        game.setNextActions(player2, [makeBomb(2, 2)]);

        expect(game.actions['player1']).to.deep.equal([{
            x: 1, y: 1, type: 'bomb', owner: 'player1', id: 'player1-action-0'
        }]);
        expect(game.actions['player2']).to.deep.equal([{
            x: 2, y: 2, type: 'bomb', owner: 'player2', id: 'player2-action-0'
        }]);

        game.setNextActions(player1, [makeBomb(3, 3)]);
        expect(game.actions['player1'][0]).to.deep.equal({
            x: 3, y: 3, type: 'bomb', owner: 'player1', id: 'player1-action-0'
        });

        expect(game.hasEveryonePlayedTheTurn()).to.be.false;

        game.setNextActions(player2, [makeBomb(3, 3)]);
        expect(game.actions['player2'][0]).to.deep.equal({
            x: 3, y: 3, type: 'bomb', owner: 'player2', id: 'player2-action-0'
        });

        expect(game.hasEveryonePlayedTheTurn()).to.be.false;

        game.setNextActions(player3, [makeBomb(4, 4)]);
        expect(game.hasEveryonePlayedTheTurn()).to.be.true;

        expect(game.actions['player1']).to.deep.equal([{
            x: 3, y: 3, type: 'bomb', owner: 'player1', id: 'player1-action-0'
        }]);
        expect(game.actions['player2']).to.deep.equal([{
            x: 3, y: 3, type: 'bomb', owner: 'player2', id: 'player2-action-0'
        }]);
        expect(game.actions['player3']).to.deep.equal([{
            x: 4, y: 4, type: 'bomb', owner: 'player3', id: 'player3-action-0'
        }]);
    });

    it('should empty the actions when the turn is processed', function () {
        game.max = {action: 1};

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
        game.max = {action: 1};

        expect(game.actions).to.deep.equal({});

        game.setNextActions(player1, [makeBomb(5, 0)]);
        game.setNextActions(player2, [makeBomb(5, 0)]);
        game.setNextActions(player3, [makeBomb(5, 0)]);

        expect(game.hasEveryonePlayedTheTurn()).to.be.true;

        var result = game.playTheTurn();

        expect(result.actions).to.have.length(3);


    });
});