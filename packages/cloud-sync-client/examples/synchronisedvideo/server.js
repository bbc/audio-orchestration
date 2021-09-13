var app, bodyParser, express, path, server, writelog;

bodyParser = require("body-parser");
express = require("express");
path = require("path");
writelog = require("./src/js/writelog");

app = express();

app.set("port", 3000);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "www")));
app.use(express.static(path.join(__dirname, "media")));

app.post("/log*", writelog, httpOK);

server = app.listen(app.get("port"), function() {
    console.log("'Synchronised Video' app server running at port " + server.address().port);
});

function httpOK (req, res) {
    res.send("okay");
}