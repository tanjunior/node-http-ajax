"use strict";

const http = require('http');
const url = require('url');
const router = require("./router");
const PORT = 40057;


const startServer = () => {
    http.createServer((req, res) => {
        let path = url.parse(req.url).pathname;        
        router.route(path, req, res);
    }).listen(PORT, error => {
        if (error) console.log("error");
        else console.log(`server is listening on port: ${PORT}\n`);
    });   
}

exports.startServer = startServer;

//http://localhost:40057
//http://http://ceto.murdoch.edu.au:40057