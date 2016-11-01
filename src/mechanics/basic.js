var Mechanic = {

    isDispositionValid: function (map, ships) {
        return Mechanic._mapDimensionsAreValid(map) &&
            Mechanic._hasAllExpectedShips(map, ships) &&
            Mechanic._allShipsAreWithinBoundaries(map, ships) &&
            Mechanic._noShipsAreOverlapping(ships);
    },

    isActionsValid: function (map, actions) {
        return actions.length <= map.max.action &&
            Mechanic._validNumberOfActions(map, actions) &&
            Mechanic._actionsWithinBoundaries(map, actions) &&
            Mechanic._actionsDoNotOverlap(map, actions);
    },

    processTurn: function (playersActions, map) {
        var actionsResults = [];
        for (var player in playersActions) {
            if (!playersActions.hasOwnProperty(player)) {
                continue;
            }
            playersActions[player].forEach(function(playerAction) {
                var actionResult = Mechanic._processAction(player, playerAction, map.boards);
                actionsResults.push(actionResult);
            });
        }
        return actionsResults;
    },

    _processAction: function (nickname, playerAction, boards) {
        var action = {
            x: playerAction.x,
            y: playerAction.y,
            id: playerAction.id,
            type: playerAction.type,
            owner: nickname,
            result: []
        };
        switch (playerAction.type) {
            case 'bomb':
                action.result = Mechanic._processBomb(nickname, playerAction, boards);
                break;
        }
        return action;
    },

    _processBomb: function (player, bomb, boards) {
        var result = [];
        for (var p in boards) {
            if (!boards.hasOwnProperty(p) || p === player) {
                continue;
            }
            for (var shipId in boards[p].ships) {
                if (!boards[p].ships.hasOwnProperty(shipId)) {
                    continue;
                }
                var ship = boards[p].ships[shipId];
                var hit = Mechanic._colliding(bomb, ship);
                if (hit) {
                    result.push({
                        type: 'hit ship',
                        owner: p,
                        target: ship.id,
                        localHit: hit
                    });
                }
            }
        }
        return result;
    },

    _colliding: function (bomb, ship) {
        if (ship.destroyed) {
            return false;
        }
        if (ship.hits && ship.hits.length) {
            for (var hit in ship.hits) {
                if (!ship.hits.hasOwnProperty(hit)) {
                    continue;
                }
                if (ship.hits[hit].x === bomb.x && ship.hits[hit].y === bomb.y) {
                    return false;
                }
            }
        }
        for (var x = 0; x < ship.width; ++x) {
            for (var y = 0; y < ship.height; ++y) {
                if (bomb.x === ship.x + x && bomb.y === ship.y + y) {
                    return {
                        x: x,
                        y: y
                    }
                }
            }
        }
        return false;
    },

    _actionsWithinBoundaries: function (map, actions) {
        for (var i = 0; i < actions.length; ++i) {
            if (!Mechanic._actionWithinBoundaries(map, actions[i])) {
                return false;
            }
        }
        return true;
    },

    _actionWithinBoundaries: function (map, action) {
        if (action.type === 'bomb') {
            return action.x >= 0 && action.x < map.width &&
                action.y >= 0 && action.y < map.height;
        }
        return false;
    },

    _actionsDoNotOverlap: function (map, actions) {
        var occupied = [];

        for (var i = 0; i < actions.length; ++i) {
            var index = actions[i].x + actions[i].y * map.width;
            if (occupied.indexOf(index) !== -1) {
                return false;
            }
            occupied.push(index);
        }
        return true;
    },

    _validNumberOfActions: function (map, actions) {
        var check = {},
            result;

        actions.forEach(function (action) {
            result = check[action.type];
            check[action.type] = (result !== undefined) ? result + 1 : 1;
        });

        for (var type in check) {
            if (!check.hasOwnProperty(type)) {
                continue;
            }
            if (map.max[type] !== undefined && check[type] > map.max[type]) {
                return false;
            }
        }
        return true;
    },

    _mapDimensionsAreValid: function (map) {
        return map.width >= 5 && map.height >= 5;
    },

    _hasAllExpectedShips: function (map, ships) {
        var check = {};
        var types = Object.keys(map.ships);

        for (var t = 0; t < types.length; ++t) {
            check[types[t]] = {
                expected: map.ships[types[t]]
            };
        }
        var result, type;
        for (var i = 0; i < ships.length; ++i) {
            type = ships[i].type;
            if (!check[type]) {
                return false;
            }
            result = check[type].result;
            check[type].result = (result !== undefined) ? result + 1 : 1;
        }

        for (var element in check) {
            if (!check.hasOwnProperty(element)) {
                continue;
            }
            if (check[element].expected !== check[element].result) {
                return false;
            }
        }
        return true;
    },

    _allShipsAreWithinBoundaries: function (map, ships) {
        for (var i = 0; i < ships.length; ++i) {
            if (!Mechanic._shipIsWithinBoundaries(map, ships[i])) {
                return false;
            }
        }
        return true;
    },

    _shipIsWithinBoundaries: function (map, ship) {
        return (ship.x >= 0 && (ship.x + ship.width - 1) < map.width) &&
            (ship.y >= 0 && (ship.y + ship.height - 1) < map.height);
    },

    _noShipsAreOverlapping: function (ships) {
        for (var i = 0; i < ships.length; ++i) {
            for (var j = 0; j < ships.length; ++j) {
                if (i === j) {
                    continue;
                }
                if (Mechanic._overlapping(ships[i], ships[j])) {
                    return false;
                }
            }
        }
        return true;
    },

    _overlapping: function (shipA, shipB) {
        return shipA.x + shipA.width > shipB.x &&
            shipA.x < shipB.x + shipB.width &&
            shipA.y + shipA.height > shipB.y &&
            shipA.y < shipB.y + shipB.height;
    }
};

module.exports = Mechanic;
