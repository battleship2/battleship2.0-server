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
        bs_uuid: string;
        nickname: string;
    }
}

declare namespace BSData {
    namespace State {}
    namespace ShipType {}
    namespace ActionType {}
}

/**********************************************************************************/
/*                                                                                */
/*                                    INTERFACES                                  */
/*                                                                                */
/**********************************************************************************/

interface BSShipType {
    name: string;
    length: number;
}

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
    nickname: string;
}

interface BSPlayerInfo {
    id: string;
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
    type: string;
    horizontal: boolean;
}

interface BSAction {
    x: number;
    y: number;
    id: string;
    type: number;
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

interface BSTurn {
    actions: Array<BSAction>;
    players: Array<BSPlayerInfo>;
    turnScores: BSScoreRegistry;
}

interface BSScore {
    miss: number;
    score: number;
}

interface BSActionAmount {
    type: number;
    amount: number;
}

interface BSShipAmount {
    type: BSShipType;
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
    [bs_uuid: string]: Array<BSAction>;
}

interface BSMapBoardRegistry {
    [bs_uuid: string]: BSMapBoard;
}

interface BSSocketRegistry {
    [bs_uuid: string]: SocketIO.Socket;
}

interface BSPlayerRegistry {
    [bs_uuid: string]: BSPlayer;
}

interface BSScoreRegistry {
    [bs_uuid: string]: BSScore;
}

interface BSGameRegistry {
    [gameId: string]: any; // Cannot reference Game here
}
