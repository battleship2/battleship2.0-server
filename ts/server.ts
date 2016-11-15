/// <reference path="definitions/definitions.d.ts" />


(() => {
    global.DEBUG_ENABLED = (require.main === module) || true /*__debugEnabled__*/;

    let ServerClass: any = require("./classes/server.class");
    let server = new ServerClass();
    server.setup().start();
})();
