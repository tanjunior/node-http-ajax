"use strict";

const url = require('url');
const qs = require('querystring');
const formidable = require('formidable');
const fileHand = require("./fileHandler");

const reqStart = async (req, res) => {
    await servePage(res, "public/index.html");
}


const reqAdd = async (req, res) => {
    await servePage(res, "public/add.html");
}

const reqSearch = async (req, res) => {
    await servePage(res, "public/search.html");
}

const servePage = async (res, filepath) => {
    let file = await fileHand.getFile(filepath);
    if (file != false) {
        res.writeHead(200, { 'content-type': file.mime });
        res.write(file.data);
        res.end();
    }
}

const reqUpload = (req, res) => {
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
    });
    let form = new formidable.IncomingForm({ uploadDir: "server/photos" });

    form.parse(req, async(err, field, files) => {

        if (err) {
            console.log(err);
            res.writeHead(404, { 'content-type': 'text/plain' });
            res.end();
            return;
        }

        if (files.photo.name != '') {
            let photoName = await fileHand.renamePhoto(files.photo.path, files.photo.name, field['sid']);
            if (photoName != false) {
                field['photo'] = photoName;
            } else {
                res.writeHead(404, { 'content-type': 'text/plain' });
                res.write("Server encountered error, saving photo.");
                res.end();
                return;
            }
        }

        let values = []
        for (const key in field) {
            if (Object.hasOwnProperty.call(field, key)) {
                const element = field[key];
                values.push(element);

            }
        }
        let newData = [];
        newData.push(values.join());
        let file = await fileHand.getFile("server/data/students.csv");
        if (file == false) {
            console.log("error reading file" + err);
            res.writeHead(404, { 'content-type': 'text/plain' });
            res.write(err);
            res.end();
            return;

        } else {
            let data = file.data;
            let rows = data.split("\r\n");
            for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
                let row = rows[rowIndex];
                let cols = row.split(",");
                if (cols[0] == field['sid']) {
                    console.log("exist");
                    res.writeHead(404, { 'content-type': 'text/plain' });
                    res.write("Student ID already exists!");
                    res.end();
                    return;
                }
            }

            data += "\r\n" + newData;
            let added = fileHand.addToCSV(data);
            if (added) {
                console.log("student added")
                res.writeHead(200, { 'content-type': 'text/plain' });
                res.write("Student added");
                res.end();
            } else {
                console.log("error writing to csv" + err);
                res.writeHead(404, { 'content-type': 'text/plain' });
                res.write(err);
                res.end();
            }
        }
    });
}

const reqData = async (req, res) => {
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        body = Buffer.concat(body).toString();

        let { keyword } = JSON.parse(body);
        let file = await fileHand.getFile("server/data/students.csv");
        if (file != false) {
            let data = file.data;
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
                        //matches.push(cols)
                        let obj = {};
                        for (let headerIndex = 0; headerIndex < csvHeaders.length; headerIndex++) {
                            obj[csvHeaders[headerIndex]] = cols[headerIndex];
                        }
                        matches.push(obj);
                    }
                }
            }
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify(matches));
        }
    });
}

const reqPhoto = async (req, res) => {
    let qstr = url.parse(req.url).query;
    let query = qs.parse(qstr);
    if (Object.keys(query).length > 0) {
        let filename = query['photo'];
        fileHand.streamFile(res, `server/photos/${filename}`);
    }
}

exports.reqStart = reqStart;
exports.reqAdd = reqAdd;
exports.reqSearch = reqSearch;
exports.reqUpload = reqUpload;
exports.reqData = reqData;
exports.reqPhoto = reqPhoto;