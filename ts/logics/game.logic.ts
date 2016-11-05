/// <reference path="../definitions/definitions.d.ts" />

import Utils = require("../services/utils.service");
import BSData = require("../definitions/bsdata");

let _utils: Utils = new Utils();
let _instance: GameLogic = null;

class GameLogic {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor() {
        if (_utils.isNull(_instance)) {
            _instance = this;
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public isDispositionValid = (map: BSMap, ships: Array<BSShip>): boolean => {
        return _mapDimensionsAreValid(map) && _hasAllExpectedShips(map, ships) &&
            _allShipsAreWithinBoundaries(map, ships) && _noShipsAreOverlapping(ships);
    };

    public isActionsValid = (map: BSMap, actions: Array<BSAction>): boolean => {
        return _validNumberOfActions(map, actions) &&
            _actionsWithinBoundaries(map, actions) &&
            _actionsDoNotOverlap(map, actions);
    };

    public processTurn = (playersActions: BSActionRegistry, map: BSMap): Array<BSAction> => {
        let actionsResults: Array<BSAction> = [];
        _utils.forEach(playersActions, (actions: Array<BSAction>, bs_uuid: string) => {
            _utils.forEach(actions, (action: BSAction) => {
                actionsResults.push(_processAction(bs_uuid, action, map.boards));
            });
        });
        return actionsResults;
    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _processAction(bs_uuid: string, playerAction: BSAction, boards: BSMapBoardRegistry): BSAction {
    let action: BSAction = {
        x: playerAction.x,
        y: playerAction.y,
        id: playerAction.id,
        type: playerAction.type,
        owner: bs_uuid,
        result: []
    };

    switch (playerAction.type) {
        case BSData.ActionType.BOMB:
            action.result = _processBomb(bs_uuid, playerAction, boards);
            break;
    }
    return action;
}

function _processBomb(bs_uuid: string, bomb: BSAction, boards: BSMapBoardRegistry): Array<BSTurnResult> {
    let result = [];
    _utils.forEach(boards, (board: BSMapBoard, player: string) => {
        if (player === bs_uuid) {
            return;
        }

        _utils.forEach(board.ships, (ship: BSShip) => {
            let hit = _colliding(bomb, ship);
            if (hit) {
                result.push({
                    type: "hit ship",
                    owner: player,
                    target: ship.id,
                    localHit: hit
                });
            }
        });
    });
    return result;
}

function _colliding(bomb: BSAction, ship: BSShip): boolean | BSCoordinates {

    if (_utils.isDefined(ship.destroyed) && ship.destroyed) {
        return false;
    }

    try {
        if (_utils.isArray(ship.hits) && ship.hits.length) {
            _utils.forEach(ship.hits, (hit: BSCoordinates) => {
                if (hit.x + ship.x === bomb.x && hit.y + ship.y === bomb.y) {
                    throw new Error();
                }
            });
        }
    }
    catch (exception) { return false; }

    for (let x = 0; x < ship.width; ++x) {
        for (let y = 0; y < ship.height; ++y) {
            if (bomb.x === ship.x + x && bomb.y === ship.y + y) {
                return { x: x, y: y };
            }
        }
    }
    return false;
}

function _actionsDoNotOverlap(map: BSMap, actions: Array<BSAction>): boolean {
    try {
        let occupied = [];
        _utils.forEach(actions, (action: BSAction) => {
            let index = action.x + action.y * map.width;
            if (occupied.indexOf(index) !== -1) throw new Error();
            occupied.push(index);
        });
    } catch (exception) { return false; }
    return true;
}

function _actionsWithinBoundaries(map: BSMap, actions: Array<BSAction>): boolean {
    try {
        _utils.forEach(actions, (action: BSAction) => {
            if (!_actionWithinBoundaries(map, action)) throw new Error();
        });
    } catch (exception) { return false; }
    return true;
}

function _actionWithinBoundaries(map: BSMap, action: BSAction): boolean {
    switch (action.type) {
        case BSData.ActionType.BOMB:
            return action.x >= 0 && action.x < map.width && action.y >= 0 && action.y < map.height;
    }
    return false;
}

function _validNumberOfActions(map: BSMap, actions: Array<BSAction>): boolean {
    if (actions.length > map.max.action) return false;
    let check = {};
    try {
        _utils.forEach(actions, (action: BSAction) => {
            let result = check[action.type];
            check[action.type] = _utils.isDefined(result) ? result + 1 : 1;
        });

        _utils.forEach(map.max.other, (action: BSActionAmount) => {
            let counter = check[action.type];
            if (_utils.isDefined(counter) && counter > action.amount) throw new Error();
        });
    } catch (exception) { return false; }
    return true;
}

function _mapDimensionsAreValid(map: BSMap): boolean {
    return map.width >= 5 && map.height >= 5;
}

function _hasAllExpectedShips(map: BSMap, ships: Array<BSShip>): boolean {
    try {
        let check = {};
        _utils.forEach(map.ships, (ship: BSShipAmount) => {
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

function _noShipsAreOverlapping(ships: Array<BSShip>): boolean {
    try {
        _utils.forEach(ships, (shipA: BSShip) => {
            _utils.forEach(ships, (shipB: BSShip) => {
                if (shipA === shipB) return;
                if (_overlapping(shipA, shipB)) throw new Error();
            });
        });
    } catch (exception) { return false; }
    return true;
}

function _overlapping(shipA: BSShip, shipB: BSShip): boolean {
    return shipA.x + shipA.width > shipB.x && shipA.x < shipB.x + shipB.width &&
        shipA.y + shipA.height > shipB.y && shipA.y < shipB.y + shipB.height;
}

function _allShipsAreWithinBoundaries(map: BSMap, ships: Array<BSShip>): boolean {
    try {
        _utils.forEach(ships, (ship: BSShip) => {
            if (!_shipIsWithinBoundaries(map, ship)) throw new Error();
        });
    } catch (exception) { return false; }
    return true;
}

function _shipIsWithinBoundaries(map: BSMap, ship: BSShip): boolean {
    return (ship.x >= 0 && (ship.x + ship.width - 1) < map.width) &&
        (ship.y >= 0 && (ship.y + ship.height - 1) < map.height);
}

export = GameLogic;
