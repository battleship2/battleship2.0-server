/// <reference path="definitions.d.ts" />

module BSData {
    export enum State { READY, PLAYING, SETTING, WAITING_PLAYERS }
    export enum ActionType { BOMB }
    export enum ShipType { CARRIER, BATTLESHIP, CRUISER, SUBMARINE, DESTROYER }

    export let events = {
        on: {
            READY: 'ready',
            MESSAGE: 'message',
            JOIN_GAME: 'join game',
            LIST_GAME: 'list games',
            PLAY_TURN: 'play turn',
            DISCONNECT: 'disconnect',
            LEAVE_GAME: 'leave game',
            CREATE_GAME: 'create game',
            PLACE_SHIPS: 'place ships'
        },

        emit: {
            MESSAGE: 'message',
            REFUSED: 'refused',
            NICKNAME: 'nickname',
            GAME_LEFT: 'game left',
            PLAY_TURN: 'play turn',
            NEW_ROUND: 'new round',
            GAME_STATE: 'game state',
            LIST_GAMES: 'list games',
            NEW_PLAYER: 'new player',
            PLAYER_LEFT: 'player left',
            SERVER_RESET: 'server reset',
            TURN_RESULTS: 'turn results',
            GAME_CREATED: 'game created',
            PLAYER_READY: 'player ready',
            SHIP_PLACEMENT: 'ship placement'
        }
    };
}

export = BSData;
