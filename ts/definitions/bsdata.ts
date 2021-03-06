namespace BSData {
    export namespace State {
        export const READY: number = 0;
        export const PLAYING: number = 1;
        export const SETTING: number = 2;
        export const WAITING_PLAYERS: number = 3;
    }

    export namespace ShipType {
        export const CARRIER: BSShipType = { name: "CARRIER", length: 5 };
        export const CRUISER: BSShipType = { name: "CRUISER", length: 3 };
        export const ABSTRACT: BSShipType = { name: "ABSTRACT", length: 0 };
        export const SUBMARINE: BSShipType = { name: "SUBMARINE", length: 3 };
        export const DESTROYER: BSShipType = { name: "DESTROYER", length: 2 };
        export const BATTLESHIP: BSShipType = { name: "BATTLESHIP", length: 4 };
    }

    export namespace ActionType {
        export const BOMB: number = 0;
    }

    export namespace events {
        export const on = {
            READY: "ready",
            MESSAGE: "message",
            JOIN_GAME: "join game",
            PLAY_TURN: "play turn",
            LIST_GAMES: "list games",
            DISCONNECT: "disconnect",
            LEAVE_GAME: "leave game",
            CREATE_GAME: "create game",
            PLACE_SHIPS: "place ships",
            SOMEONE_IS_WRITING: "someone is writing",
            SOMEONE_STOPPED_WRITING: "someone stopped writing"
        };

        export const emit = {
            MESSAGE: "message",
            REFUSED: "refused",
            NICKNAME: "nickname",
            LEFT_ROOM: "left room",
            JOIN_ROOM: "join room",
            GAME_LEFT: "game left",
            PLAY_TURN: "play turn",
            NEW_ROUND: "new round",
            GAME_STATE: "game state",
            LIST_GAMES: "list games",
            NEW_PLAYER: "new player",
            PLAYER_LEFT: "player left",
            SERVER_RESET: "server reset",
            TURN_RESULTS: "turn results",
            GAME_CREATED: "game created",
            PLAYER_READY: "player ready",
            SHIP_PLACEMENT: "ship placement",
            PEOPLE_WRITING: "people writing",
            PEOPLE_IN_ROOM: "people in room"
        };
    }
}

export = BSData;
