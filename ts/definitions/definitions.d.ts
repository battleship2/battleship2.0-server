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

declare module NodeJS  {
    interface Global {
        DEBUG_ENABLED: boolean
    }
}

declare module SocketIO  {
    interface Socket {
        id: string
        game: string
        nickname: string
    }
}

declare module BSData {
    enum State { READY, PLAYING, SETTING, WAITING_PLAYERS }
    enum ActionType { BOMB }
    enum ShipType { CARRIER, BATTLESHIP, CRUISER, SUBMARINE, DESTROYER }
}

/**********************************************************************************/
/*                                                                                */
/*                                    INTERFACES                                  */
/*                                                                                */
/**********************************************************************************/

interface BSGameData {
    id: string
    name: string
    gameId: string
    password: string
    maxPlayers: number
}

interface BSGameSummary {
    id: string
    name: string
    players: number
    password: boolean
    maxPlayers: number
}

interface BSBuffer {
    games: { [gameId: string]: any } // Cannot reference Game here
    sockets: { [nickname: string]: SocketIO.Socket }
}

interface BSPlayer {
    score: number
    isReady: boolean
}

interface BSPlayerInfo {
    score: number
    health: number
    nickname: string
    maxHealth: number
}

interface BSCoordinates {
    x: number
    y: number
}

interface BSShip {
    x: number
    y: number
    id: string
    hits: Array<BSCoordinates>
    type: BSData.ShipType
    width: number
    height: number
    destroyed: boolean
}

interface BSAction {
    x: number
    y: number
    id: string
    type: BSData.ActionType
    owner: string
    result: Array<BSTurnResult>
}

interface BSMap {
    max: {
        action: number
        other: Array<BSActionAmount>
    }
    ships: Array<BSShipAmount>
    width: number
    height: number
    boards: { [nickname: string]: BSMapBoard }
}

interface BSMapBoard {
    ships?: { [shipId: string]: BSShip }
}

interface BsMapBoardToString {
    [nickname: string]: BSMapBoard
}

interface BSTurnResult {
    type: string
    owner: string
    target: string
    localHit: BSCoordinates
}

interface BSScore {
    miss: number
    score: number
}

interface BSActionAmount {
    type: BSData.ActionType
    amount: number
}

interface BSShipAmount {
    type: BSData.ShipType
    amount: number
}
