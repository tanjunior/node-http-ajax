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
        let file = await fileHand.getFile('public/' + pathname.substr(1));
        if (!file) return fileHand.serve404(res);
        res.writeHead(200, { 'content-type': file.mime });
        res.write(file.data);
        res.end();
    }
}

exports.route = route;