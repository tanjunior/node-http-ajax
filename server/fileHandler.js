"use strict";
const fs = require('fs');
const path = require('path');

const CONTENT_TYPE = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
};

const streamFile = (res, filepath) => {
    let ext = path.parse(filepath).ext;
    const stream = fs.createReadStream(filepath)
    stream.on('error', () => {
        res.writeHead(404, 'Content-Type', 'text/plain');
        res.end("not found");
    });
    stream.on('open', () => {
        res.writeHead(200, { 'content-type': CONTENT_TYPE[ext] });
        stream.pipe(res);
    })
}

const renamePhoto = async(filepath, filename, newName) => {   
    let ext = path.parse(filename).ext;
    try {
        await fs.promises.rename(filepath, `server/photos/${newName+ext}`);
        return newName+ext;
    } catch (err) {
        return false;
    }
}


const getFile = async(filepath) => {
    let ext = path.parse(filepath).ext;
    try {
        let data = await fs.promises.readFile(filepath, 'utf8');
        return {"data":data, "mime": CONTENT_TYPE[ext]};
    } catch (error) {
        return false;
    }
}

const addToCSV = async(data) => {
    try {
        await fs.promises.writeFile("server/data/students.csv", data);
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }
}

const serve404 = async(res) => {
    let file = await getFile('public/html/404.html');
    if (!file) return
    res.writeHead(404, { 'content-type': 'text/html' });
    res.write(file.data);
    res.end();
}

exports.serve404 = serve404;
exports.renamePhoto = renamePhoto;
exports.getFile = getFile;
exports.addToCSV = addToCSV;
exports.streamFile = streamFile;