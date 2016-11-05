var expect = require('chai').expect,
    GameLogic = require('../../../src/release/logics/game.logic'),
    BSData = require('../../../src/release/definitions/bsdata');

describe('game.logic:', function () {

    var mechanics = new GameLogic();
    var ships = [],
        actions = [],
        map = {};

    var Ships = {};
    Ships[BSData.ShipType.CARRIER] = 5;
    Ships[BSData.ShipType.BATTLESHIP] = 4;
    Ships[BSData.ShipType.CRUISER] = 3;
    Ships[BSData.ShipType.SUBMARINE] = 3;
    Ships[BSData.ShipType.DESTROYER] = 2;

    var makeShip = function (x, y, type, horizontal) {
        return {
            x: x,
            y: y,
            width: horizontal ? Ships[type] : 1,
            height: horizontal ? 1 : Ships[type],
            type: type,
            hits: []
        };
    };

    var makeBomb = function (x, y) {
        return {
            type: BSData.ActionType.BOMB,
            x: x,
            y: y
        };
    };

    describe('[Ships settings]', function () {

        var isValid = mechanics.isDispositionValid;

        beforeEach(function (done) {
            ships = [];
            map = {
                width: 10,
                height: 10,
                ships: [
                    {type: BSData.ShipType.CARRIER, amount: 1},
                    {type: BSData.ShipType.BATTLESHIP, amount: 1},
                    {type: BSData.ShipType.CRUISER, amount: 1},
                    {type: BSData.ShipType.SUBMARINE, amount: 1},
                    {type: BSData.ShipType.DESTROYER, amount: 1}
                ]
            };
            done();
        });

        it('should not be valid if the map has any dimension smaller than 5', function () {
            ships = [makeShip(0, 0, BSData.ShipType.CARRIER, true)];
            map.ships = [{type: BSData.ShipType.CARRIER, amount: 1}];
            map.width = 4;
            map.height = 5;
            expect(isValid(map, ships)).to.be.false;
            map.width = 5;
            map.height = 4;
            expect(isValid(map, ships)).to.be.false;
            map.width = 5;
            map.height = 5;
            expect(isValid(map, ships)).to.be.true;
        });

        it('should not be valid if not all ships have been set', function () {
            ships.push(makeShip(0, 1, BSData.ShipType.CARRIER, true));
            ships.push(makeShip(0, 2, BSData.ShipType.BATTLESHIP, true));
            ships.push(makeShip(0, 3, BSData.ShipType.CRUISER, true));
            ships.push(makeShip(0, 4, BSData.ShipType.SUBMARINE, true));
            expect(isValid(map, ships)).to.be.false;
            ships.push(makeShip(0, 5, BSData.ShipType.DESTROYER, true));
            expect(isValid(map, ships)).to.be.true;
            ships.push(makeShip(0, 6, BSData.ShipType.DESTROYER, true));
            expect(isValid(map, ships)).to.be.false;
        });

        it('should not be valid if not all specified ships are present', function () {
            map.ships = [{type: BSData.ShipType.DESTROYER, amount: 2}];

            ships = [makeShip(0, 0, BSData.ShipType.SUBMARINE, true), makeShip(0, 1, BSData.ShipType.SUBMARINE, true)];
            expect(isValid(map, ships)).to.be.false;
            ships = [makeShip(0, 0, BSData.ShipType.DESTROYER, true), makeShip(0, 1, BSData.ShipType.SUBMARINE, true)];
            expect(isValid(map, ships)).to.be.false;
            ships = [makeShip(0, 0, BSData.ShipType.DESTROYER, true), makeShip(0, 1, BSData.ShipType.DESTROYER, true)];
            expect(isValid(map, ships)).to.be.true;
        });

        it('should not be valid if ships are out of boundaries', function () {
            map.ships = [{type: BSData.ShipType.CARRIER, amount: 1}];

            ships = [makeShip(-1, 0, BSData.ShipType.CARRIER, true)];
            expect(isValid(map, ships)).to.be.false;
            ships = [makeShip(0, -1, BSData.ShipType.CARRIER, true)];
            expect(isValid(map, ships)).to.be.false;
            ships = [makeShip(9, 0, BSData.ShipType.CARRIER, true)];
            expect(isValid(map, ships)).to.be.false;
            ships = [makeShip(0, 9, BSData.ShipType.CARRIER, false)];
            expect(isValid(map, ships)).to.be.false;
        });

        it('should be valid when all ships are within boundaries', function () {
            map.ships = [
                {type: BSData.ShipType.CARRIER, amount: 1},
                {type: BSData.ShipType.CRUISER, amount: 2}
            ];

            var carrier = makeShip(9 - 5, 0, BSData.ShipType.CARRIER, true),
                cruiser1 = makeShip(2, 1, BSData.ShipType.CRUISER, true),
                cruiser2 = makeShip(9 - 3, 1, BSData.ShipType.CRUISER, true);

            ships = [cruiser1, carrier, cruiser2];
            expect(isValid(map, ships)).to.be.true;
        });

        it('should not be valid if two or more ships are overlapping', function () {
            map.ships = [{type: BSData.ShipType.CARRIER, amount: 2}];

            ships = [makeShip(0, 0, BSData.ShipType.CARRIER, true), makeShip(0, 0, BSData.ShipType.CARRIER, true)];
            expect(isValid(map, ships)).to.be.false;
            ships[1].x = 5;
            expect(isValid(map, ships)).to.be.true;

            ships[0] = makeShip(0, 3, BSData.ShipType.CARRIER, true);
            ships[1] = makeShip(3, 0, BSData.ShipType.CARRIER, false);
            expect(isValid(map, ships)).to.be.false;

            ships[1].x = 5;
            expect(isValid(map, ships)).to.be.true;

            map.ships = [
                {type: BSData.ShipType.BATTLESHIP, amount: 1},
                {type: BSData.ShipType.DESTROYER, amount: 1}
            ];

            ships = [makeShip(1, 1, BSData.ShipType.BATTLESHIP, true), makeShip(2, 1, BSData.ShipType.DESTROYER, true)];
            expect(isValid(map, ships)).to.be.false;

            ships[1] = makeShip(2, 1, BSData.ShipType.DESTROYER, true);
            expect(isValid(map, ships)).to.be.false;

            ships[1] = makeShip(4, 1, BSData.ShipType.DESTROYER, true);
            expect(isValid(map, ships)).to.be.false;

            ships[1] = makeShip(5, 1, BSData.ShipType.DESTROYER, true);
            expect(isValid(map, ships)).to.be.true;
        });
    });

    describe('[Bombs position]', function () {

        var isValid = mechanics.isActionsValid;

        beforeEach(function (done) {
            map = {
                width: 10,
                height: 10,
                max: {
                    action: 3,
                    other: [{type: BSData.ActionType.BOMB, amount: 3}]
                }
            };
            actions = [];
            done();
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

            map.width = 5;
            map.height = 5;

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

        beforeEach(function (done) {
            map = {
                width: 10,
                height: 10,
                boards: {
                    player1: {
                        ships: [makeShip(0, 0, BSData.ShipType.CARRIER, true)]
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
            done();
        });

        it("should return information for every hits", function () {
            var ship1 = makeShip(3, 2, BSData.ShipType.DESTROYER, false);
            var ship2 = makeShip(0, 0, BSData.ShipType.CARRIER, true);
            ship1.id = 'player1-ship-0';
            ship2.id = 'player2-ship-0';
            map.boards.player1.ships = {'player1-ship-0': ship1};
            map.boards.player2.ships = {'player2-ship-0': ship2};
            actions.player1 = [makeBomb(0, 0), makeBomb(5, 5)];
            actions.player2 = [];

            var result = processTurn(actions, map);
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
            result = processTurn(actions, map);

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
