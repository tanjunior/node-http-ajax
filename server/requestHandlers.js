"use strict";

const url = require('url');
const qs = require('querystring');
const formidable = require('formidable');
const fileHand = require("./fileHandler");

const reqStart = async (req, res) => {
    await servePage(res, "public/html/index.html");
}


const reqAdd = async (req, res) => {
    await servePage(res, "public/html/add.html");
}

const reqSearch = async (req, res) => {
    await servePage(res, "public/html/search.html");
}

const servePage = async (res, filepath) => {
    let file = await fileHand.getFile(filepath);
    if (!file) return;
    res.writeHead(200, { 'content-type': file.mime });
    res.write(file.data);
    res.end();
}

const reqUpload = async (req, res) => {
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
    });
    let form = new formidable.IncomingForm({ uploadDir: "server/photos" });

    form.parse(req, async (err, field, files) => {

        if (err) {
            res.writeHead(417, { 'content-type': 'text/plain' });
            res.end(err);
            return;
        }

        // first read csv to check for duplicate student id
        let file = await fileHand.getFile("server/data/students.csv");
        if (!file) return;
        let data = file.data;
        let rows = data.split("\r\n");
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            let row = rows[rowIndex];
            let cols = row.split(",");
            if (cols[0] == field.sid) {
                res.writeHead(406, { 'content-type': 'text/plain' });
                res.write("Student ID already exists!");
                res.end();
                return;
            }
        }

        // check if files contains a photo
        if (files.photo.name != '') {
            // rename photo from temp to studentid while keeping the extension
            let photoName = await fileHand.renamePhoto(files.photo.path, files.photo.name, field.sid);
            if (photoName != false) {
                // add the new name into formdata
                field.photo = photoName;
            } else {
                res.writeHead(417, { 'content-type': 'text/plain' });
                res.write("Server encountered error, saving photo.");
                res.end();
                return;
            }
        }

        // loop through the formdata and push it into the values array
        let values = []
        for (const key in field) {
            if (Object.hasOwnProperty.call(field, key)) {
                let element = field[key];
                // santize strings to prevent attack
                if (typeof element === 'string') element = sanitizeString(element);
                values.push(element);
            }
        }

        // append values to newData array
        let newData = [];
        newData.push(values.join());

        // append newData to data array
        data += "\r\n" + newData;

        // write data to csv
        let added = fileHand.addToCSV(data);
        if (added) {
            res.writeHead(200, { 'content-type': 'text/plain' });
            res.write("Student added");
            res.end();
        } else {
            console.log("error writing to csv" + err);
            res.writeHead(417, { 'content-type': 'text/plain' });
            res.write(err);
            res.end();
        }

    });
}

const sanitizeString = (str) => {
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "");
    return str.trim();
}
const reqData = async (req, res) => {
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        body = Buffer.concat(body).toString();

        let { keyword } = JSON.parse(body);
        let file = await fileHand.getFile("server/data/students.csv");
        if (!file) return;
        let data = file.data;
        let matches = filterDataIntoJSON(data, keyword);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(matches));
    });
}

const filterDataIntoJSON = (data, keyword) => {
    let matches = [];
    let rows = data.split("\r\n");
    let csvHeaders = rows[0].split(",");
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) { //index starts at 1 to skip header
        let row = rows[rowIndex];
        let cols = row.split(",");
        for (let colIndex = 0; colIndex < cols.length; colIndex++) {
            let value = cols[colIndex];
            if (colIndex == 6) continue; // do not search photo
            if (keyword.toLowerCase() == value.toLowerCase()) {

                // create obj to be used as json {'obj[csvHeaders[headerIndex]]' : cols[headerIndex]}
                let obj = {};
                for (let headerIndex = 0; headerIndex < csvHeaders.length; headerIndex++) {
                    obj[csvHeaders[headerIndex]] = cols[headerIndex];
                }
                matches.push(obj);
            }
        }
    }
    return matches;
}


const reqPhoto = async (req, res) => {
    let qstr = url.parse(req.url).query;
    let query = qs.parse(qstr);
    if (Object.keys(query).length > 0) {
        let filename = query.photo;
        fileHand.streamFile(res, `server/photos/${filename}`);
    }
}

exports.reqStart = reqStart;
exports.reqAdd = reqAdd;
exports.reqSearch = reqSearch;
exports.reqUpload = reqUpload;
exports.reqData = reqData;
exports.reqPhoto = reqPhoto;