/// <reference path="../definitions/definitions.d.ts" />

import Utils = require("../services/utils.service");
import BSData = require("../definitions/bsdata");
import Map = require("../classes/map.class");
import Ship = require("../classes/entities/entity.ship.class");

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

    public isDispositionValid = (map: Map, ships: Array<Ship>): boolean => {
        return _mapDimensionsAreValid(map)
            && _hasAllExpectedShips(map, ships)
            && _allShipsAreWithinBoundaries(map, ships)
            && _noShipsAreOverlapping(ships);
    };

    public isActionsValid = (map: Map, actions: Array<BSAction>): boolean => {
        return _validNumberOfActions(map, actions)
            && _actionsWithinBoundaries(map, actions)
            && _actionsDoNotOverlap(map, actions);
    };

    public processTurn = (playersActions: BSActionRegistry, map: Map): Array<BSAction> => {
        let actionsResults: Array<BSAction> = [];
        _utils.forEach(playersActions, (actions: Array<BSAction>, nickname: string) => {
            _utils.forEach(actions, (action: BSAction) => {
                actionsResults.push(_processAction(nickname, action, map.boards));
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

function _processAction(nickname: string, playerAction: BSAction, boards: BSMapBoardRegistry): BSAction {
    let action: BSAction = {
        x: playerAction.x,
        y: playerAction.y,
        id: playerAction.id,
        type: playerAction.type,
        owner: nickname,
        result: []
    };

    switch (playerAction.type) {
        case BSData.ActionType.BOMB:
            action.result = _processBomb(nickname, playerAction, boards);
            break;
    }
    return action;
}

function _processBomb(nickname: string, bomb: BSAction, boards: BSMapBoardRegistry): Array<BSTurnResult> {
    let result = [];
    _utils.forEach(boards, (board: BSMapBoard, player: string) => {
        if (player === nickname) {
            return;
        }

        _utils.forEach(board.ships, (ship: Ship) => {
            let hit = ship.isAffectedByAction(bomb);
            if (hit) {
                result.push({
                    type: "hit ship",
                    owner: player,
                    target: ship.bs_uuid,
                    localHit: hit
                });
            }
        });
    });
    return result;
}

function _actionsDoNotOverlap(map: Map, actions: Array<BSAction>): boolean {
    return map.actionsDoNotOverlap(actions);
}

function _actionsWithinBoundaries(map: Map, actions: Array<BSAction>): boolean {
    try {
        _utils.forEach(actions, (action: BSAction) => {
            if (!_actionWithinBoundaries(map, action)) throw new Error();
        });
    } catch (exception) { return false; }
    return true;
}

function _actionWithinBoundaries(map: Map, action: BSAction): boolean {
    switch (action.type) {
        case BSData.ActionType.BOMB:
            return action.x >= 0 && action.x < map.dimensions.x && action.y >= 0 && action.y < map.dimensions.y;
    }
    return false;
}

function _validNumberOfActions(map: Map, actions: Array<BSAction>): boolean {
    return map.isNumberOfActionsValid(actions);
}

function _mapDimensionsAreValid(map: Map): boolean {
    return map.dimensions.x >= 5 && map.dimensions.y >= 5;
}

function _hasAllExpectedShips(map: Map, ships: Array<Ship>): boolean {
    return map.hasAllExpectedShips(ships);
}

function _noShipsAreOverlapping(ships: Array<Ship>): boolean {
    try {
        _utils.forEach(ships, (shipA: Ship) => {
            _utils.forEach(ships, (shipB: Ship) => {
                if (shipA.bs_uuid === shipB.bs_uuid) return;
                if (shipA.overlapping(shipB)) throw new Error();
            });
        });
    } catch (exception) { return false; }
    return true;
}

function _allShipsAreWithinBoundaries(map: Map, ships: Array<Ship>): boolean {
    return map.allShipsAreWithinBoundaries(ships);
}


export = GameLogic;
