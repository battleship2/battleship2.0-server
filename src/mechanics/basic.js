Mechanic = {

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

        var results = {
            hits: [],
            scores: {}
        };
        for (var player in playersActions) {
            if (!playersActions.hasOwnProperty(player)) {
                continue;
            }
            results.scores[player] = 0;
            playersActions[player].forEach(function(action) {
                Mechanic._processAction(results, player, action, map.boards);
            });
        }

        return results
    },

    _processAction: function (results, player, action, boards) {
        switch (action.type) {
            case 'bomb':
                Mechanic._processBomb(results, player, action, boards);
                break;
        }
    },

    _processBomb: function (results, player, bomb, boards) {
        for (var p in boards) {
            if (!boards.hasOwnProperty(p) || p === player) {
                continue;
            }
            for (var shipId in boards[p].ships) {
                if (!boards[p].ships.hasOwnProperty(shipId)) {
                    continue;
                }
                var hit = Mechanic._colliding(bomb, boards[p].ships[shipId]);
                if (hit) {
                    results.scores[player] += 1;
                    results.hits.push({
                        x: bomb.x,
                        y: bomb.y,
                        owner: player,
                        ship: {
                            owner: p,
                            id: shipId,
                            localHit: hit
                        }
                    });
                }
            }
        }
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
