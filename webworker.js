'use strict';
const ioHook = require('iohook');

ioHook.on('keydown', e => {
    postMessage(e);
});

onmessage = (e) => {
    if (e.start) {
        ioHook.start(true);
    }
}
