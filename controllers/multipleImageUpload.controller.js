// const express = require('express')
// const router = express.Router()
const imageSchema = require("../models/image.model");
const aws = require("aws-sdk");
const multer = require("multer");
//const multerS3 = require("multer-s3");
const multerS3 = require("multer-s3-transform");
const sharp = require("sharp");
const mime = require("mime");
const { Router } = require("express");
const { Mongoose } = require("mongoose");
const urlParse = require("url");
const { v4: uuidv4 } = require("uuid");

const router = Router();
require("dotenv").config();
const s3 = new aws.S3();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf" ||
    file.mimetype ==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "application/zip"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type, only JPEG,PNG, PDF,XLSX, CSV, ZIP Type is allowed!"
      ),
      false
    );
  }
};

router.post("/multiple-image-upload", (req, res) => {
  const { section = "general" } = req.query;
  const fileId = req.query.fileId;
  const uniqueId = fileId ? fileId : uuidv4();
  console.log("fileId:", fileId, "uniqueId:", uniqueId);
  const upload = multer({
    fileFilter,
    // limits: {​​​​​fileSize: 1024*5}​​​​​,
    storage: multerS3({
      acl: "public-read",
      contentType: multerS3.AUTO_CONTENT_TYPE,
      s3,
      // limits: {​​​​​fileSize: 1024*5}​​​​​,
      contentLength: 100000000, //50 MB file size //100MB
      //process.env.AWS_BUCKET_NAME,
      bucket: function (req, file, cb) {
        const queryParams = req.query;
        if (queryParams.category == "DN") {
          var bktName =
            process.env.AWS_BUCKET_NAME +
            "/" +
            queryParams.category +
            "/" +
            queryParams.fileName +
            "/" +
            queryParams.fileSource +
            "/" +
            queryParams.language +
            "/" +
            queryParams.date;
        } else {
          var bktName =
            process.env.AWS_BUCKET_NAME +
            "/" +
            queryParams.category +
            "/" +
            queryParams.fileSource +
            "/" +
            queryParams.language +
            "/" +
            queryParams.date;
        }

        console.log("bktName", bktName);
        cb(null, bktName);
      },
      metadata(req, file, cb) {
        console.log("file value is");
        console.log(file);
        cb(null, { fieldName: file.fieldname });
      },
      key(req, file, cb) {
        console.log("file inside the key");
        console.log(file);
        const filename = uniqueId + "_" + file.originalname; //+ '.' + mime.getExtension(file.mimetype);
        cb(null, filename);
      },
    }),
  });
  const multipleUpload = upload.array("image", 1000);
  multipleUpload(req, res, (err) => {
    console.log("req", req);
    if (err) {
      return res.status(422).send({
        errors: [{ title: "Image Upload Error", detail: err.message }],
      });
    }
    if (req.files) {
      //console.log("files value is@@@@@@ inside multiple file upload", req.files)
      const uploadedFiles = req.files;
      const array = [];

      uploadedFiles.map((item) => {
        const key = item.key.split(".").slice(0, -1).join(".");
        const result = {
          imageUrl: item.location,
          key: key,
          objectId: key.substring(0, key.indexOf("_")),
        };

        array.push(result);
      });
      //const key = req.file.key.split('.').slice(0, -1).join('.')
      return res.json(array);
      //return res.json({ imageUrl: req.file.location, key: key })
    } else {
      return res.status(422).send("Error inside else function called");
    }
  });
});

function getSignedUrl(data) {
  // const contentDisposition = 'attachment; filename=\"' + name + '\"';
  var key = urlParse.parse(data).pathname;
  key = key.replace("/", "");
  var url = s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    // Key: 'general/1601018967848.png',
    // ResponseContentDisposition: contentDisposition,
    // Expires: 7200 //2 hours
    Expires: 604800, // Expire 7 days
  });
  return url;
}

router.get("/viewImage", (req, res) => {
  const url = getSignedUrl(req.query.file);
  return res.json({ imageUrl: url });
});

module.exports = router;
