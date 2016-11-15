/// <reference path="../definitions/definitions.d.ts" />

import Utils = require("../services/utils.service");
import Ship = require("./ships/abstract.ship.class");

let _utils: Utils = new Utils();

class Map {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    public max: { action: number; other: Array<BSActionAmount>; } = { action: 1, other: [] };
    public ships: Array<BSShipAmount> = [];
    public boards: BSMapBoardRegistry = {};

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor (public dimensions: BSDimensions) {}

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public setActionsLimit (action: number, other?: Array<BSActionAmount>) {
        this.max.action = action;
        if (_utils.isArray(other)) {
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
                if (!_utils.isDefined(check[ship.type.name])) {
                    check[ship.type.name] = {
                        expected: 0,
                        result: 0
                    };
                }
                check[ship.type.name].expected += ship.amount;
            });

            _utils.forEach(ships, (ship: Ship) => {
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

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _shipIsWithinBoundaries(map: Map, ship: Ship): boolean {
    return (ship.coord.x >= 0 && (ship.coord.x + ship.dimensions.x - 1) < map.dimensions.x) &&
        (ship.coord.y >= 0 && (ship.coord.y + ship.dimensions.y - 1) < map.dimensions.y);
}

export = Map;
