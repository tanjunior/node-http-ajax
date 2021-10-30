"use strict";
const reqHand = require("./requestHandlers");
const fileHand = require("./fileHandler");

const handle = {
    "/": reqHand.reqStart,
    "/add": reqHand.reqAdd,
    "/search": reqHand.reqSearch,
    "/upload": reqHand.reqUpload,
    "/data": reqHand.reqData,
    "/photo": reqHand.reqPhoto,
};

const route = async(pathname, req, res) => {
    if (typeof handle[pathname] === "function") {
        handle[pathname](req, res);
    } else {
        // this is to automatically serve js and css files.
        let file = await fileHand.getFile('public/' + pathname.substr(1));
        if (file != false) {
            res.writeHead(200, { 'content-type': file.mime });
            res.write(file.data);
            res.end();
        } else {
            file = fileHand.serve404(res);
        }
    }
}

exports.route = route;