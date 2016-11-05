/// <reference path="../definitions/definitions.d.ts" />

import Utils = require("../services/utils.service");
import Ship = require("./entities/entity.ship.class");

let _utils: Utils = new Utils();

class Map {

    public max: {
        action: number;
        other: Array<BSActionAmount>;
    };
    public ships: Array<BSShipAmount> = [];
    public dimensions: BSDimensions;
    public boards: BSMapBoardRegistry;

    constructor (dimensions: BSDimensions) {
        this.dimensions = dimensions;
        this.boards = {};
        this.max = {
            action: 1,
            other: []
        };
    }

    public setActionsLimit (action: number, other?: Array<BSActionAmount>) {
        this.max.action = action;
        if (_utils.isDefined(other)) {
            this.max.other = other;
        }
    }

    public setShips (ships: Array<BSShipAmount>) {
        this.ships = ships;
    }

    public setShipDisposition (playerId: string, ships: Array<Ship>) {

        if (_utils.isUndefined(this.boards[playerId])) {
            this.boards[playerId] = {};
        }
        this.boards[playerId].ships = {};

        _utils.forEach(ships, (ship: Ship) => {
            this.boards[playerId].ships[ship.bs_uuid] = ship;
        });
    }

    public isNumberOfActionsValid (actions: Array<BSAction>): boolean {
        if (actions.length > this.max.action) return false;
        let check = {};
        try {
            _utils.forEach(actions, (action: BSAction) => {
                let result = check[action.type];
                check[action.type] = _utils.isDefined(result) ? result + 1 : 1;
            });

            _utils.forEach(this.max.other, (action: BSActionAmount) => {
                let counter = check[action.type];
                if (_utils.isDefined(counter) && counter > action.amount) throw new Error();
            });
        } catch (exception) { return false; }
        return true;
    }

    public hasAllExpectedShips (ships: Array<Ship>): boolean {
        try {
            let check = {};
            _utils.forEach(this.ships, (ship: BSShipAmount) => {
                if (!_utils.isDefined(check[ship.type])) {
                    check[ship.type] = {
                        expected: 0,
                        result: 0
                    };
                }
                check[ship.type].expected += ship.amount;
            });

            _utils.forEach(ships, (ship: BSShip) => {
                if (_utils.isUndefined(check[ship.type])) {
                    throw new Error();
                }
                check[ship.type].result += 1;
            });

            _utils.forEach(check, element => {
                if (element.expected !== element.result) {
                    throw new Error();
                }
            });
        } catch (exception) { return false; }

        return true;
    }

    public allShipsAreWithinBoundaries(ships: Array<Ship>) {
        try {
            _utils.forEach(ships, (ship: Ship) => {
                if (!_shipIsWithinBoundaries(this, ship)) throw new Error();
            });
        } catch (exception) { return false; }
        return true;
    }

    public actionsDoNotOverlap (actions: Array<BSAction>): boolean {
        try {
            let occupied = [];
            _utils.forEach(actions, (action: BSAction) => {
                let index = action.x + action.y * this.dimensions.x;
                if (occupied.indexOf(index) !== -1) throw new Error();
                occupied.push(index);
            });
        } catch (exception) { return false; }
        return true;
    }
}

function _shipIsWithinBoundaries(map: Map, ship: Ship): boolean {
    return (ship.dimensions.x >= 0 && (ship.coord.x + ship.dimensions.x - 1) < map.dimensions.x) &&
        (ship.dimensions.x >= 0 && (ship.coord.y + ship.dimensions.y - 1) < map.dimensions.y);
}

export = Map;
