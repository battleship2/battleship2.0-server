/**********************************************************************************/
/*                                                                                */
/*                                    LIBRARIES                                   */
/*                                                                                */
/**********************************************************************************/

/// <reference path="../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../node_modules/@types/bunyan/index.d.ts" />
/// <reference path="../../node_modules/@types/restify/index.d.ts" />
/// <reference path="../../node_modules/@types/socket.io/index.d.ts" />

/**********************************************************************************/
/*                                                                                */
/*                                    OVERRIDES                                   */
/*                                                                                */
/**********************************************************************************/

declare namespace NodeJS  {
    interface Global {
        DEBUG_ENABLED: boolean;
    }
}

declare namespace SocketIO  {
    interface Socket {
        id: string;
        game: string;
        nickname: string;
    }
}

declare namespace BSData {
    enum State {}
    enum ShipType {}
    enum ActionType {}
}

/**********************************************************************************/
/*                                                                                */
/*                                    INTERFACES                                  */
/*                                                                                */
/**********************************************************************************/

interface BSGameData {
    id: string;
    name: string;
    gameId: string;
    password: string;
    maxPlayers: number;
}

interface BSGameSummary {
    id: string;
    name: string;
    players: number;
    password: boolean;
    maxPlayers: number;
}

interface BSBuffer {
    games: BSGameRegistry;
    sockets: BSSocketRegistry;
}

interface BSPlayer {
    score: number;
    isReady: boolean;
}

interface BSPlayerInfo {
    score: number;
    health: number;
    nickname: string;
    maxHealth: number;
}

interface BSVector2 {
    x: number;
    y: number;
}

interface BSCoordinates extends BSVector2 {}

interface BSDimensions extends BSVector2 {}

interface BSShip {
    x: number;
    y: number;
    type: BSData.ShipType;
    horizontal: boolean;
}

interface BSAction {
    x: number;
    y: number;
    id: string;
    type: BSData.ActionType;
    owner: string;
    result: Array<BSTurnResult>;
}

interface BSMap {
    max: {
        action: number;
        other: Array<BSActionAmount>;
    };
    ships: Array<BSShipAmount>;
    width: number;
    height: number;
    boards: BSMapBoardRegistry;
}

interface BSMapBoard {
    ships?: BSShipRegistry;
}

interface BSTurnResult {
    type: string;
    owner: string;
    target: string;
    localHit: BSCoordinates;
}

interface BSScore {
    miss: number;
    score: number;
}

interface BSActionAmount {
    type: BSData.ActionType;
    amount: number;
}

interface BSShipAmount {
    type: BSData.ShipType;
    amount: number;
}

/**********************************************************************************/
/*                                                                                */
/*                                    REGISTRIES                                  */
/*                                                                                */
/**********************************************************************************/

interface BSShipRegistry {
    [shipId: string]: any;
}

interface BSActionRegistry {
    [nickname: string]: Array<BSAction>;
}

interface BSMapBoardRegistry {
    [nickname: string]: BSMapBoard;
}

interface BSSocketRegistry {
    [nickname: string]: SocketIO.Socket;
}

interface BSPlayerRegistry {
    [nickname: string]: BSPlayer;
}

interface BSScoreRegistry {
    [owner: string]: BSScore;
}

interface BSGameRegistry {
    [gameId: string]: any; // Cannot reference Game here
}
