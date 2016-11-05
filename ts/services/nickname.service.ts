/// <reference path="../definitions/definitions.d.ts" />

import Utils = require("../services/utils.service");

let _utils: Utils = new Utils();
let _words: { nouns: Array<string>, adjectives: Array<string> } = null;
let _instance: Nickname = null;

class Nickname {

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

            _words = {
                nouns: [
                    "robin",
                    "temper",
                    "bubble",
                    "play",
                    "ladybug",
                    "ear",
                    "crack",
                    "lunch",
                    "weather",
                    "pie",
                    "treatment",
                    "bike",
                    "hour",
                    "cactus",
                    "argument",
                    "turn",
                    "amount",
                    "things",
                    "act",
                    "mist",
                    "digestion",
                    "tray",
                    "birthday",
                    "war"
                ],

                adjectives: [
                    "brilliant",
                    "superb",
                    "grotesque",
                    "envious",
                    "parabolic",
                    "shiny",
                    "gloomy",
                    "speedy",
                    "flippant",
                    "maniacal",
                    "changeable",
                    "determined",
                    "needy",
                    "tart",
                    "raspy",
                    "purple",
                    "psychedelic",
                    "ossified",
                    "kaput",
                    "obedient"
                ]
            };
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public get = (): string => {
        return _pickRandomWordIn(_words.adjectives) + " " + _pickRandomWordIn(_words.nouns);
    };

}


/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _pickRandomWordIn(words: Array<string>): string {
    return words[Math.floor(Math.random() * words.length)];
}

export = Nickname;
