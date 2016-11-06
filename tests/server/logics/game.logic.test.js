var expect = require('chai').expect,
    GameLogic = require('../../../src/release/logics/game.logic'),
    BSData = require('../../../src/release/definitions/bsdata'),
    ShipCarrier = require('../../../src/release/classes/ships/ship.carrier.class'),
    ShipBattleship = require('../../../src/release/classes/ships/ship.battleship.class'),
    ShipSubmarine = require('../../../src/release/classes/ships/ship.submarine.class'),
    ShipCruiser = require('../../../src/release/classes/ships/ship.cruiser.class'),
    ShipDestroyer = require('../../../src/release/classes/ships/ship.destroyer.class'),
    Map = require('../../../src/release/classes/map.class');

describe('game.logic:', function () {

    var mechanics = new GameLogic();
    var ships = [],
        actions = [],
        map;

    var makeBomb = function (x, y) {
        return {
            type: BSData.ActionType.BOMB,
            x: x,
            y: y
        };
    };

    describe('[Ships settings]', function () {

        var isValid = mechanics.isDispositionValid;

        beforeEach(function () {
            ships = [];
            map = new Map({x: 10, y: 10});
            map.setShips([
                {type: BSData.ShipType.CARRIER, amount: 1},
                {type: BSData.ShipType.BATTLESHIP, amount: 1},
                {type: BSData.ShipType.CRUISER, amount: 1},
                {type: BSData.ShipType.SUBMARINE, amount: 1},
                {type: BSData.ShipType.DESTROYER, amount: 1}]);
        });

        it('should not be valid if the map has any dimension smaller than 5', function () {
            ships = [new ShipCarrier(0, 0)];
            map.setShips([{type: BSData.ShipType.CARRIER, amount: 1}]);

            map.dimensions = {x: 4, y: 5};
            expect(isValid(map, ships)).to.be.false;

            map.dimensions = {x: 5, y: 4};
            expect(isValid(map, ships)).to.be.false;

            map.dimensions = {x: 5, y: 5};
            expect(isValid(map, ships)).to.be.true;
        });

        it('should not be valid if not all ships have been set', function () {
            ships = [
                new ShipCarrier(0, 1),
                new ShipBattleship(0, 2),
                new ShipCruiser(0, 3),
                new ShipSubmarine(0, 4)];
            expect(isValid(map, ships)).to.be.false;
            ships.push(new ShipDestroyer(0, 5));
            expect(isValid(map, ships)).to.be.true;
            ships.push(new ShipDestroyer(0, 6));
            expect(isValid(map, ships)).to.be.false;
        });

        it('should not be valid if not all specified ships are present', function () {
            map.ships = [{type: BSData.ShipType.DESTROYER, amount: 2}];

            ships = [new ShipSubmarine(0, 0), new ShipSubmarine(0, 1)];
            expect(isValid(map, ships)).to.be.false;
            ships = [new ShipDestroyer(0, 0), new ShipSubmarine(0, 1)];
            expect(isValid(map, ships)).to.be.false;
            ships = [new ShipDestroyer(0, 0), new ShipDestroyer(0, 1)];
            expect(isValid(map, ships)).to.be.true;
        });

        it('should not be valid if ships are out of boundaries', function () {
            map.ships = [{type: BSData.ShipType.CARRIER, amount: 1}];
            ships = [new ShipCarrier(-1, 0, true)];
            expect(isValid(map, ships)).to.be.false;
            ships = [new ShipCarrier(0, -1, true)];
            expect(isValid(map, ships)).to.be.false;
            ships = [new ShipCarrier(9, 0, true)];
            expect(isValid(map, ships)).to.be.false;
            ships = [new ShipCarrier(0, 9, false)];
            expect(isValid(map, ships)).to.be.false;
        });

        it('should be valid when all ships are within boundaries', function () {
            map.ships = [
                {type: BSData.ShipType.CARRIER, amount: 1},
                {type: BSData.ShipType.CRUISER, amount: 2}
            ];

            var carrier = new ShipCarrier(9 - 5, 0),
                cruiser1 = new ShipCruiser(2, 1),
                cruiser2 = new ShipCruiser(9 - 3, 1);

            ships = [cruiser1, carrier, cruiser2];
            expect(isValid(map, ships)).to.be.true;
        });

        it('should not be valid if two or more ships are overlapping', function () {
            map.ships = [{type: BSData.ShipType.CARRIER, amount: 2}];
            ships = [new ShipCarrier(0, 0), new ShipCarrier(0, 0)];
            expect(isValid(map, ships)).to.be.false;
            ships[1].coord.x = 5;
            expect(isValid(map, ships)).to.be.true;

            ships[0] = new ShipCarrier(0, 3, true);
            ships[1] = new ShipCarrier(3, 0, false);
            expect(isValid(map, ships)).to.be.false;

            ships[1].coord.x = 5;
            expect(isValid(map, ships)).to.be.true;

            map.ships = [
                {type: BSData.ShipType.BATTLESHIP, amount: 1},
                {type: BSData.ShipType.DESTROYER, amount: 1}
            ];

            ships = [new ShipBattleship(1, 1), new ShipDestroyer(2, 1)];
            expect(isValid(map, ships)).to.be.false;

            ships[1] = new ShipDestroyer(2, 1);
            expect(isValid(map, ships)).to.be.false;

            ships[1] = new ShipDestroyer(4, 1);
            expect(isValid(map, ships)).to.be.false;

            ships[1] = new ShipDestroyer(5, 1);
            expect(isValid(map, ships)).to.be.true;
        });
    });

    describe('[Bombs position]', function () {

        var isValid = mechanics.isActionsValid;

        beforeEach(function () {
            map = new Map({x: 10, y: 10});
            map.setActionsLimit(3, [{type: BSData.ActionType.BOMB, amount: 3}]);
            actions = [];
        });

        it('should be valid if the number of actions does not exceed what is authorized', function () {
            map.max.action = 3;
            actions = [];
            expect(isValid(map, actions)).to.be.true;
            actions.push(makeBomb(1, 1));
            expect(isValid(map, actions)).to.be.true;
            actions.push(makeBomb(2, 1));
            expect(isValid(map, actions)).to.be.true;
            actions.push(makeBomb(3, 1));
            expect(isValid(map, actions)).to.be.true;
            actions.push(makeBomb(4, 1));
            expect(isValid(map, actions)).to.be.false;
        });

        it('should be valid if the number of bombs does not exceed what is authorized', function () {
            map.max.action = 3;
            delete map.max.bomb;
            actions = [makeBomb(1, 1), makeBomb(2, 1), makeBomb(3, 1)];
            expect(isValid(map, actions)).to.be.true;

            map.max.other = [{type: BSData.ActionType.BOMB, amount: 2}];
            expect(isValid(map, actions)).to.be.false;
            actions.pop();
            expect(isValid(map, actions)).to.be.true;
        });

        it('should be valid if all the bombs are within boundaries', function() {
            actions = [makeBomb(-1, 0)];
            expect(isValid(map, actions)).to.be.false;
            actions = [makeBomb(0, -1)];
            expect(isValid(map, actions)).to.be.false;
            actions = [makeBomb(5, 5)];
            expect(isValid(map, actions)).to.be.true;

            map.dimensions.x = 5;
            map.dimensions.y = 5;

            expect(isValid(map, actions)).to.be.false;
            actions = [makeBomb(4, 4)];
            expect(isValid(map, actions)).to.be.true;
        });

        it('should be valid if none of the bombs are overlapping', function() {

            var bombA = makeBomb(1, 1),
                bombB = makeBomb(1, 1),
                bombC = makeBomb(2, 3);

            actions = [bombA, bombB];
            expect(isValid(map, actions)).to.be.false;

            bombA.x = 0;
            expect(isValid(map, actions)).to.be.true;

            actions.push(bombC);
            expect(isValid(map, actions)).to.be.true;

            bombC.x = 0;
            bombC.y = 1;
            expect(isValid(map, actions)).to.be.false;
        })
    });

    describe('[Process turn (bomb)]', function () {

        var processTurn = mechanics.processTurn,
            map,
            actions;

        beforeEach(function () {
            map = {
                width: 10,
                height: 10,
                boards: {
                    player1: {
                        ships: [new ShipCarrier(0, 0)]
                    },
                    player2: {
                        ships: []
                    },
                    player3: {
                        ships: []
                    }
                }
            };
            actions = {
                player1: [],
                player2: []
            };
        });

        it("should return information for every hits", function () {
            var ship1 = new ShipDestroyer(3, 2, false);
            var ship2 = new ShipCarrier(0, 0, true);
            ship1.bs_uuid = 'player1-ship-0';
            ship2.bs_uuid = 'player2-ship-0';
            map.boards.player1.ships = {'player1-ship-0': ship1};
            map.boards.player2.ships = {'player2-ship-0': ship2};
            actions.player1 = [makeBomb(0, 0), makeBomb(5, 5)];
            actions.player2 = [];

            var result = processTurn(map, actions);
            expect(result).to.have.length(2);

            var action1 = result[0];
            expect(action1.x).to.be.equal(0);
            expect(action1.y).to.be.equal(0);
            expect(action1.owner).to.be.equal('player1');
            expect(action1.type).to.be.equal(BSData.ActionType.BOMB);
            expect(action1.result).to.deep.equal([{
                type: 'hit ship',
                localHit: {x: 0, y: 0},
                target: 'player2-ship-0',
                owner: 'player2'
            }]);

            var action2 = result[1];
            expect(action2.x).to.be.equal(5);
            expect(action2.y).to.be.equal(5);
            expect(action2.owner).to.be.equal('player1');
            expect(action2.type).to.be.equal(BSData.ActionType.BOMB);
            expect(action2.result).to.deep.equal([]);

            actions.player2 = [makeBomb(3, 3)];
            result = processTurn(map, actions);

            expect(result).to.have.length(3);

            var action3 = result[2];
            expect(action3.x).to.be.equal(3);
            expect(action3.y).to.be.equal(3);
            expect(action3.owner).to.be.equal('player2');
            expect(action3.type).to.be.equal(BSData.ActionType.BOMB);
            expect(action3.result).to.deep.equal([{
                type: 'hit ship',
                target: 'player1-ship-0',
                owner: 'player1',
                localHit: {x: 0, y: 1}
            }]);
        });
    });
});
