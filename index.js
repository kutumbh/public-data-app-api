const express = require("express");
const bodyParser = require("body-parser");
global.request = require("request");
global.jwkToPem = require("jwk-to-pem");
global.jwt = require("jsonwebtoken");
global.navigator = () => null;
global.config = require("./config");
require("./db/mongoose");
require("./db/awsconnect");
require("dotenv").config();

let host = process.env.HOST;
let port = process.env.PORT;
const fs = require("fs");
// Create express instance
const app = express();
app.use(express.json());
var cors = require("cors");
// Require API routes
const files = require("./routes/files.route");
const persons = require("./routes/persons.route");
const imagUpload = require("./controllers/imageUpload.controller");
const multipleImageUpload = require("./controllers/multipleImageUpload.controller");
const fileSource = require("./routes/fileSource.route");
const masterData = require("./routes/masterData.route");
const placesData = require("./routes/placesData.route");
const userData = require("./routes/user.route");
const name = require("./routes/name.routes");
const surname = require("./routes/surname.routes");
const log = require("./routes/log.route");
// const community = require("./routes/communityMaster.route");
const community = require("./routes/community.route");
const gotra = require("./routes/gotra.route");
const religion = require("./routes/religion.route");
const kuldevta = require("./routes/kuldevta.route");
const surnameType = require("./routes/surnameType.route");
const script = require("./routes/script.route");
const searchData = require("./routes/searchData.route");
const dataSearchFilter = require("./routes/dataSearchFilter.route");
const entityLog=require("./routes/entityLog.route")

const dam = require("./dam/dam.route");
// Import API Routes
//app.use(bodyParser());
app.use(function (req, res, next) {
  if (req.headers["x-amz-sns-message-type"]) {
    req.headers["content-type"] = "application/json;charset=UTF-8";
  }
  next();
});
app.use(
  bodyParser.urlencoded({
    limit: "200mb",
    extended: true,
  })
);
app.use(bodyParser.json({ limit: "200mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
app.use(files);
app.use(persons);
app.use(imagUpload);
app.use(multipleImageUpload);
app.use(fileSource);
app.use(masterData);
app.use(placesData);
app.use(userData);
app.use(name);
app.use(surname);
app.use(log);
app.use(community);
app.use(gotra);
app.use(religion);
app.use(kuldevta);
app.use(surnameType);
app.use(script);
app.use(dam);
app.use(searchData);
app.use(dataSearchFilter);
app.use(entityLog)

app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

//Start Server
app.listen(port, () => {
  console.log(`Server is listening ${host}:${port}`);
});

