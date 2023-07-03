const filesModel = require("../models/reposFiles.model");
const userModel = require("../models/user.model");
const logModel = require("../models/log.model");
const personsModel = require("../models/reposPersons.model");
const namesModel = require("../models/name.model");
const regionalSurnameHindi = require("../models/regionalSurname.model");
const regionalSurnameGujrati = require("../models/regionalSurnameGuj.model");
const _ = require("lodash");
const mongoose = require("mongoose");
const fileSourceModel = require("../models/fileSource.model");
const constants = require("../util/constants");
const { v4: uuidv4 } = require("uuid");
const { s3 } = require("../util/aws");
const AWS = require("aws-sdk");
const csv = require("csvtojson");
const path = require("path");
const urlParse = require("url");

AWS.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

  accessKeyId: process.env.AWS_ACCESS_KEY_ID,

  region: process.env.AWS_REGION,
});
exports.createDataregional = async ({ body }, res) => {
  try {
    const getSurnameType = new regionalSurnameGujrati(body);
    if (getSurnameType) {
      await getSurnameType.save();
      res.status(201).send(getSurnameType);
    } else {
      res.status(404).send({
        message: "Data found!",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
// const ObjectsToCsv = require('objects-to-csv');

exports.getNameLocation = async (req, res) => {
  console.log("HI getNameLocation function");
  console.log(req.body);
  var SNSmessage = JSON.parse(req.body.Message);
  console.log(JSON.stringify(SNSmessage));
  res.json(req.body);

  mongoose.Promise = global.Promise;

  let S3 = new AWS.S3();
  let conn = null;

  //exports.handler = async function (event, context, callback) {
  //  console.log("Incoming Event: ", event);

  //connect to mongo DB
  const connectToDB = async () => {
    if (conn == null) {
      conn = mongoose.createConnection(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false, // Disable mongoose buffering
        serverSelectionTimeoutMS: 5000,
        useCreateIndex: true,
      });
      // `await`ing connection after assigning to the `conn` variable
      // to avoid multiple function calls creating new connections
      await conn;
      const nameSchema = conn.model(
        "names",
        new mongoose.Schema(
          {
            name: {
              type: String,
              trim: true,
              unique: true,
              // required: true
            },
            meaning: {
              type: String,
              trim: true,
              // required: true,
            },
            gender: [
              {
                type: String,
                trim: true,
                // required: true,
              },
            ],
            source: {
              type: String,
              trim: true,
              // required: true
            },
            tags: [{ type: String }],
            wikiUrl: {
              type: String,
              trim: true,
            },
            nStatus: {
              type: String,
              trim: true,
            },
            history: {
              type: String,
              trim: true,
            },
            numerology: {
              type: String,
              trim: true,
              // required: true
            },
            rashi: {
              type: String,
              trim: true,
              // required: true,
            },
            nakshatra: {
              type: String,
              trim: true,
              // required: true,
            },
            religion: [
              {
                type: String,
              },
            ],
            equalTo: {
              type: String,
              trim: true,
            },
            translations: [
              {
                lang: String,
                value: [
                  {
                    type: String,
                    trim: true,
                  },
                ],
              },
            ],
            createdBy: {
              type: mongoose.Schema.Types.ObjectId,
              required: false,
              default: null,
            },
            createdAt: {
              type: Date,
              trim: true,
            },
          },
          {
            timestamps: true,
          }
        )
      );
    }
    console.log("Connection successful");
    return conn;
  };

  //read contents from csv
  const bucket = SNSmessage.Records[0].s3.bucket.name;
  const filename = decodeURIComponent(
    SNSmessage.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const message = `File is uploaded in - ${bucket} -> ${filename}`;
  console.log(message);
  const params = {
    Bucket: bucket,
    Key: filename,
  };
  const logFileName = path.basename(filename);
  const trimmedLogFileName = logFileName.substring(14);
  console.log("folderName :", logFileName);

  //convert csv to JSON
  let getJsonFromCSV = async () => {
    let data = async function () {
      // get csv file and create stream
      const stream = S3.getObject(params).createReadStream();
      // convert csv file (stream) to JSON format data
      const json = await csv({
        colParser: { gender: "string", religion: "string" },
      }).fromStream(stream);
      return json;
    };

    let csvData = await data();
    return csvData;
  };

  let jsonData = await getJsonFromCSV();

  //connect to database
  conn = await connectToDB();
  const nameModel = conn.model("names");

  function validString(str) {
    var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (format.test(str)) {
      return false;
    } else {
      return true;
    }
  }

  //get all name strings in an array
  let allNames = [];

  jsonData = jsonData.map((obj) => {
    if (obj.name && validString(obj.name)) {
      allNames.push(obj.name.toUpperCase());
      obj.name = obj.name.toUpperCase();
      return obj;
    }
  });

  console.log("Csv data");
  console.log(jsonData);

  try {
    //get all names that exist in db that matches names in CSV
    const getExistingNames = await nameModel.find({
      name: { $in: allNames },
    });

    //Find new names and existing names
    let newNames = [],
      existingNames = [];
    jsonData.forEach((name) => {
      if (name && name.name) {
        const index = getExistingNames.findIndex((x) => x.name === name.name);
        if (index >= 0) {
          name.translations = getExistingNames[index].translations;
          name.oldGender = getExistingNames[index].gender;
          name.oldReligion = getExistingNames[index].religion;
          if (getExistingNames[index].meaning != "") {
            name.meaning = getExistingNames[index].meaning;
          }
          existingNames.push(name);
        } else {
          newNames.push(name);
        }
      }
    });

    console.log("New names", newNames);
    console.log("Existing users", existingNames);

    //function to set gender
    setGender = (genderString) => {
      if (
        genderString == "Boy" ||
        genderString == "boy" ||
        genderString == "BOY" ||
        genderString == "Male" ||
        genderString == "male" ||
        genderString == "MALE" ||
        genderString == "M" ||
        genderString == "m" ||
        genderString == "Masculine" ||
        genderString == "masculine"
      ) {
        return "M";
      } else if (
        genderString == "Girl" ||
        genderString == "girl" ||
        genderString == "GIRL" ||
        genderString == "Female" ||
        genderString == "female" ||
        genderString == "FEMALE" ||
        genderString == "F" ||
        genderString == "f" ||
        genderString == "Feminine" ||
        genderString == "feminine"
      ) {
        return "F";
      } else {
        return false;
      }
    };

    // save new names and update existing names
    saveNamesInMongoDB = async () => {
      try {
        let opArr = [];

        if (newNames.length > 0) {
          //insert new names
          console.log("Processing data for insertion");
          newNames.forEach((nameObj) => {
            nameObj.nStatus = "NN";
            let index = opArr.findIndex(
              (x) => x.insertOne.document.name == nameObj.name
            );
            console.log("Repeat index :", index);
            if (index != -1) {
              console.log(opArr[index]);
              currentNameObj = opArr[index].insertOne.document;
              nameObj.oldGender = currentNameObj.gender;
              if (nameObj.gender && nameObj.gender != "") {
                nameObj.nStatus = "NE";
                let genderArr = [];
                if (nameObj.oldGender instanceof Array) {
                  genderArr = nameObj.oldGender;
                } else if (
                  nameObj.oldGender instanceof String &&
                  nameObj.oldGender != ""
                ) {
                  genderArr.push(nameObj.oldGender);
                }
                let newGender = setGender(nameObj.gender);
                if (newGender) {
                  if (genderArr.findIndex((x) => x == newGender) == -1) {
                    genderArr.push(newGender);
                  }
                }
                nameObj.gender = genderArr;
              } else {
                nameObj.gender = [];
              }
              nameObj.oldReligion = currentNameObj.religion;
              if (nameObj.religion && nameObj.religion != "") {
                let religionArr = [];
                if (nameObj.oldReligion instanceof Array) {
                  religionArr = nameObj.oldReligion;
                } else if (
                  nameObj.oldReligion instanceof String &&
                  nameObj.oldReligion != ""
                ) {
                  religionArr.push(nameObj.oldReligion.toUpperCase());
                }
                let newReligion = nameObj.religion.toUpperCase();
                if (religionArr.findIndex((x) => x == newReligion) == -1) {
                  religionArr.push(newReligion);
                }
                nameObj.religion = religionArr;
              } else {
                nameObj.religion = [];
              }
              if (nameObj.meaning && nameObj.meaning != "") {
                let newMeaning = nameObj.meaning;
                if (newMeaning) {
                  nameObj.meaning = newMeaning;
                }
              } else {
                nameObj.meaning = "";
              }
              opArr[index] = {
                insertOne: { document: nameObj },
              };
            } else {
              if (
                nameObj.language &&
                nameObj.language != "" &&
                nameObj.value &&
                nameObj.value != ""
              ) {
                if (
                  nameObj.language == "GU" ||
                  nameObj.language == "MR" ||
                  nameObj.language == "HI" ||
                  nameObj.language == "BN" ||
                  nameObj.language == "TLG" ||
                  nameObj.language == "PA" ||
                  nameObj.language == "TA" ||
                  nameObj.language == "SD"
                ) {
                  nameObj.translations = [
                    { lang: nameObj.language, value: [nameObj.value] },
                  ];
                }
              }
              if (nameObj.meaning && nameObj.meaning != "") {
                nameObj.nStatus = "NE";
                let newMeaning = nameObj.meaning;
                if (newMeaning) {
                  nameObj.meaning = newMeaning;
                }
              } else {
                nameObj.meaning = "";
              }
              // if (nameObj.gender && nameObj.gender !== '') {
              //   let newGender = nameObj.gender.toUpperCase()
              //   let newGenderArr = newGender.split(", ")
              //   let splitgender = newGenderArr.map((gendervalue) => gendervalue[0])
              //   nameObj.gender = splitgender
              // }
              // else {
              //   nameObj.gender = []
              // }
              if (nameObj.gender && nameObj.gender !== "") {
                nameObj.nStatus = "NE";
                let newGender = setGender(nameObj.gender);
                if (newGender) {
                  nameObj.gender = [newGender];
                }
              } else {
                nameObj.gender = [];
              }
              if (nameObj.religion && nameObj.religion !== "") {
                nameObj.nStatus = "NE";
                nameObj.religion = [nameObj.religion.toUpperCase()];
              } else {
                nameObj.religion = [];
              }
              let opObj = {
                insertOne: { document: nameObj },
              };
              opArr.push(opObj);
            }
          });
        }
        if (existingNames.length > 0) {
          //bulk update records
          console.log("Processing data for updation");
          existingNames.forEach((nameObj) => {
            let opObj = {};
            let query = { name: nameObj.name };
            let updateObj = { $set: {} };
            if (nameObj.meaning && nameObj.meaning != "") {
              updateObj.$set.nStatus = "NE";
              updateObj.$set.meaning = nameObj.meaning;
            }
            if (nameObj.gender && nameObj.gender != "") {
              updateObj.$set.nStatus = "NE";
              let genderArr = [];
              if (nameObj.oldGender instanceof Array) {
                genderArr = nameObj.oldGender;
              } else if (
                nameObj.oldGender instanceof String &&
                nameObj.oldGender != ""
              ) {
                genderArr.push(nameObj.oldGender);
              }
              let newGender = setGender(nameObj.gender);
              if (newGender) {
                if (genderArr.findIndex((x) => x == newGender) == -1) {
                  genderArr.push(newGender);
                }
              }
              updateObj.$set.gender = genderArr;
            } else {
              nameObj.gender = [];
            }
            if (nameObj.religion && nameObj.religion != "") {
              updateObj.$set.nStatus = "NE";
              let religionArr = [];
              if (nameObj.oldReligion instanceof Array) {
                religionArr = nameObj.oldReligion;
              } else if (
                nameObj.oldReligion instanceof String &&
                nameObj.oldReligion != ""
              ) {
                religionArr.push(nameObj.oldReligion.toUpperCase());
              }
              let newReligion = nameObj.religion.toUpperCase();
              if (religionArr.findIndex((x) => x == newReligion) == -1) {
                religionArr.push(newReligion);
              }
              updateObj.$set.religion = religionArr;
            } else {
              nameObj.religion = [];
            }
            if (
              nameObj.language &&
              nameObj.language != "" &&
              nameObj.value &&
              nameObj.value != ""
            ) {
              if (
                nameObj.language == "GU" ||
                nameObj.language == "MR" ||
                nameObj.language == "HI" ||
                nameObj.language == "BN" ||
                nameObj.language == "TLG" ||
                nameObj.language == "PA" ||
                nameObj.language == "TA" ||
                nameObj.language == "SD"
              ) {
                if (nameObj.translations == null || !nameObj.translations) {
                  updateObj.$set.translations = [
                    { lang: nameObj.language, value: [nameObj.value] },
                  ];
                } else {
                  let index = nameObj.translations.findIndex(
                    (x) => x.lang == nameObj.language
                  );
                  if (index >= 0) {
                    let allTranslations = nameObj.translations;

                    let translationValues = [];
                    translationValues = allTranslations[index].value;
                    if (translationValues instanceof Array) {
                      if (
                        translationValues.findIndex(
                          (x) => x == nameObj.value
                        ) == -1
                      ) {
                        translationValues.push(nameObj.value);
                      }
                    } else if (
                      translationValues instanceof String &&
                      translationValues != ""
                    ) {
                      translationValues = [nameObj.value];
                    }
                    allTranslations[index].value = translationValues;
                    updateObj.$set.translations = allTranslations;
                  } else {
                    let allTranslations = nameObj.translations;
                    allTranslations.push({
                      lang: nameObj.language,
                      value: [nameObj.value],
                    });
                    //updateObj.$set.translations = { $concatArrays: ["$translations", [{ lang: nameObj.language, value: [nameObj.value] }]] }
                    updateObj.$set.translations = allTranslations;
                  }
                }
              }
            }
            if (updateObj && updateObj.$set !== {}) {
              opObj = {
                updateOne: {
                  filter: query,
                  update: updateObj,
                },
              };
              opArr.push(opObj);
            }
          });
        }
        if (opArr.length > 0) {
          console.log(`Processing ${opArr.length} records in mongodb`);
          await nameModel.bulkWrite(opArr, { ordered: false });
        }
        const log = new logModel({
          main_Option: "New Masters",
          sub_Option: "Upload New Names",
          newCount: newNames.length,
          updatedCount: existingNames.length,
          fileName: trimmedLogFileName,
          user: null,
          parameter: {
            endDate: null,
            language: null,
            range: null,
            startDate: null,
          },
        });
        if (log) {
          await log.save();
          console.log("--- line 503", log);
          res.status(201).send(log);
        } else {
          res.status(404).send({
            message: "Data found!",
          });
        }
        console.log("line 510 new names", newNames.length);
        console.log("line 511 existing Names", existingNames.length);
      } catch (e) {
        console.log(e);
      }
    };
    saveNamesInMongoDB();
  } catch (e) {
    console.log(e);
  }
  // };
};
exports.getSurnameLocation = async (req, res) => {
  console.log("Hi file location");
  // console.log("file controller lambda function:", req.validUser._id);
  console.log(req.body);
  var SNSmessage = JSON.parse(req.body.Message);
  //console.log(message);
  console.log(JSON.stringify(SNSmessage));
  // console.log("request", req);
  // console.log("response", res);

  res.json(req.body);
  // const AWS = require("aws-sdk");
  // const csv = require("csvtojson");
  // const mongoose = require("mongoose");

  mongoose.Promise = global.Promise;

  let S3 = new AWS.S3();
  let conn = null;

  //exports.handler = async function (event, context, callback) {
  //console.log("Incoming Event: ", Records);

  //connect to mongo DB
  const connectToDB = async () => {
    if (conn == null) {
      conn = mongoose.createConnection(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false, // Disable mongoose buffering
        serverSelectionTimeoutMS: 5000,
        useCreateIndex: true,
      });
      // `await`ing connection after assigning to the `conn` variable
      // to avoid multiple function calls creating new connections
      await conn;
      const surnameSchema = conn.model(
        "surnames",
        new mongoose.Schema(
          {
            surname: {
              type: String,
              trim: true,
              unique: true,
              // required: true
            },
            meaning: {
              type: String,
              trim: true,
              // required: true,
            },
            source: {
              type: String,
              trim: true,
              // required: true
            },
            origin: {
              type: String,
              trim: true,
              //required: true
            },
            community: [
              {
                type: String,
                trim: true,
                // required: true,
              },
            ],
            gotra: [
              {
                type: String,
                trim: true,
                // required: true,
              },
            ],
            religion: [
              {
                type: String,
                trim: true,
                // required: true
              },
            ],
            kuldevtaFamilyDeity: [
              {
                type: String,
                trim: true,
                // required: true,
              },
            ],
            script: [
              {
                type: String,
                trim: true,
                // required: true,
              },
            ],
            alternative: [
              {
                type: String,
                trim: true,
                // required: true,
              },
            ],
            vansha: {
              type: String,
              trim: true,
            },
            veda: {
              type: String,
              trim: true,
            },
            wikiUrl: {
              type: String,
              trim: true,
            },
            sStatus: {
              type: String,
              trim: true,
            },
            history: {
              type: String,
              trim: true,
            },
            type: {
              occupation: String,
              acharya: String,
              ancestorName: String,
              cast: String,
              title: String,
              place: {
                lat: Number,
                lon: Number,
                district: String,
              },
            },
            translations: [
              {
                lang: String,
                value: [
                  {
                    type: String,
                    trim: true,
                  },
                ],
              },
            ],
            createdBy: {
              type: mongoose.Schema.Types.ObjectId,
              required: false,
              default: null,
            },
          },
          {
            timestamps: true,
          }
        )
      );
    }
    console.log("Connection successful");
    return conn;
  };

  //read contents from csv
  const bucket = SNSmessage.Records[0].s3.bucket.name;
  const filename = decodeURIComponent(
    SNSmessage.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const message = `File is uploaded in - ${bucket} -> ${filename}`;
  console.log(message);
  const params = {
    Bucket: bucket,
    Key: filename,
  };
  const logFileName = path.basename(filename);
  const trimmedLogFileName = logFileName.substring(14);
  console.log("folderName :", logFileName);
  //convert csv to JSON
  let getJsonFromCSV = async () => {
    let data = async function () {
      // get csv file and create stream
      const stream = S3.getObject(params).createReadStream();
      // convert csv file (stream) to JSON format data
      const json = await csv({
        colParser: {
          script: "string",
          gotra: "string",
          religion: "string",
          kuldevtaFamilyDeity: "string",
          alternative: "string",
          community: "string",
        },
      }).fromStream(stream);
      return json;
    };

    let csvData = await data();
    return csvData;
  };
  jsonData = await getJsonFromCSV();

  //connect to database
  conn = await connectToDB();
  const surnameModel = conn.model("surnames");

  //get all name strings in an array
  let allSurnames = [];
  jsonData = jsonData.map((obj) => {
    if (obj.surname) {
      allSurnames.push(obj.surname.toUpperCase());
      obj.surname = obj.surname.toUpperCase();
      // obj.community = obj.community.toUpperCase()
      // obj.gotra = obj.gotra.toUpperCase()
      // obj.script = obj.script.toUpperCase()
      // obj.kuldevtaFamilyDeity = obj.kuldevtaFamilyDeity.toUpperCase()
      // obj.alternative = obj.alternative.toUpperCase()
    }
    return obj;
  });

  console.log("csv data");
  console.log(jsonData);

  try {
    //get all names that exist in db that matches names in CSV
    const getExistingNames = await surnameModel.find({
      surname: { $in: allSurnames },
    });
    console.log(
      "Existing surnames in database that matches CSV names",
      getExistingNames
    );

    //Find new names and existing names
    let newNames = [],
      existingNames = [];
    jsonData.forEach((surname) => {
      const index = getExistingNames.findIndex(
        (x) => x.surname === surname.surname
      );
      if (index >= 0) {
        surname.translations = getExistingNames[index].translations;
        surname.oldCommunity = getExistingNames[index].community;
        surname.oldGotra = getExistingNames[index].gotra;
        surname.oldReligion = getExistingNames[index].religion;
        surname.oldKuldevtaFamilyDeity =
          getExistingNames[index].kuldevtaFamilyDeity;
        surname.oldScript = getExistingNames[index].script;
        surname.oldAlternative = getExistingNames[index].alternative;
        surname.oldVansha = getExistingNames[index].vansha;
        surname.oldVeda = getExistingNames[index].veda;
        surname.oldWikiUrl = getExistingNames[index].wikiUrl;
        surname.oldHistory = getExistingNames[index].history;
        surname.oldMeaning = getExistingNames[index].meaning;
        // if (getExistingNames[index].meaning != "") {
        //   surname.meaning = getExistingNames[index].meaning;
        // }
        existingNames.push(surname);
      } else {
        newNames.push(surname);
      }
    });

    console.log("New names", newNames);
    console.log("Existing users", existingNames);
    // let newCount = newNames;
    // let updatedCount = existingNames;
    // count = async () => {
    //   try {
    //       const log = new logModel({main_Option:"newMasters", sub_Option:"Download New Surnames", newCount, updatedCount})
    //       if (log) {
    //           await log.save()
    //           console.log("--- line 297",log)
    //           res.status(201).send(log)
    //       } else {
    //           res.status(404).send({
    //               message: 'Data found!'
    //           })
    //       }
    //   } catch (e) {
    //     res.status(400).send(e);
    //   }
    // };
    // save new names and update existing names
    saveNamesInMongoDB = async () => {
      try {
        let opArr = [];
        if (newNames.length > 0) {
          //insert new names
          console.log("Processing newNames length", newNames.length);
          console.log("Processing data for insertion");
          newNames.forEach((nameObj) => {
            nameObj.sStatus = "SN";
            let index = opArr.findIndex(
              (x) => x.insertOne.document.surname == nameObj.surname
            );
            console.log("Repeat index :", index);
            if (index != -1) {
              nameObj.sStatus = "SE";
              console.log(opArr[index]);
              currentNameObj = opArr[index].insertOne.document;
              nameObj.oldGotra = currentNameObj.gotra;
              if (nameObj.gotra && nameObj.gotra != "") {
                let gotraArr = [];
                if (nameObj.oldGotra instanceof Array) {
                  gotraArr = nameObj.oldGotra;
                } else if (
                  nameObj.oldGotra instanceof String &&
                  nameObj.oldGotra != ""
                ) {
                  gotraArr.push(nameObj.oldGotra.toUpperCase());
                }
                let newGotra = nameObj.gotra.toUpperCase();
                let newGotraArr = newGotra.split(", ");
                console.log("line 325", newGotra);
                for (i in newGotraArr) {
                  if (gotraArr.findIndex((x) => x == newGotraArr[i]) == -1) {
                    gotraArr.push(newGotraArr[i]);
                  }
                }
                // if (gotraArr.findIndex((x) => x == newGotra) == -1) {
                //   gotraArr.push(newGotra);
                // }
                nameObj.gotra = gotraArr;
                console.log(" line 335", nameObj.gotra);
              } else {
                nameObj.gotra = [];
              }
              nameObj.oldReligion = currentNameObj.religion;
              if (nameObj.religion && nameObj.religion != "") {
                let religionArr = [];
                if (nameObj.oldReligion instanceof Array) {
                  religionArr = nameObj.oldReligion;
                } else if (
                  nameObj.oldReligion instanceof String &&
                  nameObj.oldReligion != ""
                ) {
                  oldReligion.push(nameObj.oldReligion.toUpperCase());
                }
                let newReligion = nameObj.religion.toUpperCase();
                let newReligionArr = newReligion.split(", ");
                console.log("line 325", newReligion);
                for (i in newReligionArr) {
                  if (
                    religionArr.findIndex((x) => x == newReligionArr[i]) == -1
                  ) {
                    religionArr.push(newReligionArr[i]);
                  }
                }
                // if (gotraArr.findIndex((x) => x == newGotra) == -1) {
                //   gotraArr.push(newGotra);
                // }
                nameObj.religion = religionArr;
                console.log(" line 335", nameObj.religion);
              } else {
                nameObj.religion = [];
              }
              nameObj.oldCommunity = currentNameObj.community;
              if (nameObj.community && nameObj.community != "") {
                let communityArr = [];
                if (nameObj.oldCommunity instanceof Array) {
                  communityArr = nameObj.oldCommunity;
                } else if (
                  nameObj.oldCommunity instanceof String &&
                  nameObj.oldCommunity != ""
                ) {
                  communityArr.push(nameObj.oldCommunity.toUpperCase());
                }
                let newCommunity = nameObj.community.toUpperCase();
                let newCommunityArr = newCommunity.split(", ");
                console.log("line 352", newCommunityArr);
                for (i in newCommunityArr) {
                  if (
                    communityArr.findIndex((x) => x == newCommunityArr[i]) == -1
                  ) {
                    communityArr.push(newCommunityArr[i]);
                  }
                }
                // if (communityArr.findIndex((x) => x == newCommunity) == -1) {
                //   communityArr.push(newCommunity);
                // }
                nameObj.community = communityArr;
              } else {
                nameObj.community = [];
              }
              nameObj.oldAlternative = currentNameObj.alternative;
              if (nameObj.alternative && nameObj.alternative != "") {
                let alternativeArr = [];
                if (nameObj.oldAlternative instanceof Array) {
                  alternativeArr = nameObj.oldAlternative;
                } else if (
                  nameObj.oldAlternative instanceof String &&
                  nameObj.oldAlternative != ""
                ) {
                  alternativeArr.push(nameObj.oldAlternative.toUpperCase());
                }
                let newAlternative = nameObj.alternative.toUpperCase();
                let newAlternativeArr = newAlternative.split(", ");
                console.log("line 325", newAlternative);
                for (i in newAlternativeArr) {
                  if (
                    alternativeArr.findIndex(
                      (x) => x == newAlternativeArr[i]
                    ) == -1
                  ) {
                    alternativeArr.push(newAlternativeArr[i]);
                  }
                }
                // if (gotraArr.findIndex((x) => x == newGotra) == -1) {
                //   gotraArr.push(newGotra);
                // }
                nameObj.alternative = alternativeArr;
                console.log(" line 335", nameObj.alternative);
              } else {
                nameObj.alternative = [];
              }
              nameObj.oldScript = currentNameObj.script;
              if (nameObj.script && nameObj.script != "") {
                let scriptArr = [];
                if (nameObj.oldScript instanceof Array) {
                  scriptArr = nameObj.oldScript;
                } else if (
                  nameObj.oldScript instanceof String &&
                  nameObj.oldScript != ""
                ) {
                  scriptArr.push(nameObj.oldScript.toUpperCase());
                }
                let newScript = nameObj.script.toUpperCase();
                let newScriptArr = newScript.split(", ");
                console.log("line 325", newScript);
                for (i in newScriptArr) {
                  if (scriptArr.findIndex((x) => x == newScriptArr[i]) == -1) {
                    scriptArr.push(newScriptArr[i]);
                  }
                }
                // if (gotraArr.findIndex((x) => x == newGotra) == -1) {
                //   gotraArr.push(newGotra);
                // }
                nameObj.script = scriptArr;
                console.log(" line 335", nameObj.script);
              } else {
                nameObj.script = [];
              }
              nameObj.oldKuldevtaFamilyDeity =
                currentNameObj.kuldevtaFamilyDeity;
              if (
                nameObj.kuldevtaFamilyDeity &&
                nameObj.kuldevtaFamilyDeity != ""
              ) {
                let kuldevtaFamilyDeityArr = [];
                if (nameObj.oldKuldevtaFamilyDeity instanceof Array) {
                  kuldevtaFamilyDeityArr = nameObj.oldKuldevtaFamilyDeity;
                } else if (
                  nameObj.oldKuldevtaFamilyDeity instanceof String &&
                  nameObj.oldKuldevtaFamilyDeity != ""
                ) {
                  kuldevtaFamilyDeityArr.push(
                    nameObj.oldKuldevtaFamilyDeity.toUpperCase()
                  );
                }
                let newKuldevtaFamilyDeity =
                  nameObj.kuldevtaFamilyDeity.toUpperCase();
                let newKuldevtaFamilyDeityArr =
                  newKuldevtaFamilyDeity.split(", ");
                console.log("line 325", newKuldevtaFamilyDeity);
                for (i in newKuldevtaFamilyDeityArr) {
                  if (
                    kuldevtaFamilyDeityArr.findIndex(
                      (x) => x == newKuldevtaFamilyDeityArr[i]
                    ) == -1
                  ) {
                    kuldevtaFamilyDeityArr.push(newKuldevtaFamilyDeityArr[i]);
                  }
                }
                nameObj.kuldevtaFamilyDeity = kuldevtaFamilyDeityArr;
                console.log(" line 335", nameObj.kuldevtaFamilyDeity);
              } else {
                nameObj.kuldevtaFamilyDeity = [];
              }
              opArr[index] = {
                insertOne: { document: nameObj },
              };
            } else {
              if (
                nameObj.language &&
                nameObj.language != "" &&
                nameObj.value &&
                nameObj.value != ""
              ) {
                if (
                  nameObj.language == "GU" ||
                  nameObj.language == "MR" ||
                  nameObj.language == "HI" ||
                  nameObj.language == "BN" ||
                  nameObj.language == "TLG" ||
                  nameObj.language == "PA" ||
                  nameObj.language == "TA" ||
                  nameObj.language == "SD"
                ) {
                  nameObj.translations = [
                    { lang: nameObj.language, value: nameObj.value },
                  ];
                }
              }
              if (nameObj.meaning && nameObj.meaning != "") {
                nameObj.sStatus = "SE";
                let newMeaning = nameObj.meaning;
                if (newMeaning) {
                  nameObj.meaning = newMeaning;
                }
              } else {
                nameObj.meaning = "";
              }
              if (nameObj.community && nameObj.community !== "") {
                nameObj.sStatus = "SE";
                let newCommunity = nameObj.community.toUpperCase();
                let newCommunityArr = newCommunity.split(", ");
                console.log("--- Gotra Array ---");
                console.log(newCommunityArr);
                nameObj.community = newCommunityArr;
              } else {
                nameObj.community = [];
              }
              if (nameObj.gotra && nameObj.gotra !== "") {
                nameObj.sStatus = "SE";
                // nameObj.gotra = nameObj.gotra
                let newGotra = nameObj.gotra.toUpperCase();
                let newGotraArr = newGotra.split(", ");
                console.log("--- Gotra Array ---");
                console.log(newGotraArr);
                nameObj.gotra = newGotraArr;
              } else {
                nameObj.gotra = [];
              }
              if (nameObj.religion && nameObj.religion !== "") {
                nameObj.sStatus = "SE";
                let newReligion = nameObj.religion.toUpperCase();
                let newReligionArr = newReligion.split(", ");
                console.log("--- religion Array ---");
                console.log(newReligionArr);
                nameObj.religion = newReligionArr;
              } else {
                nameObj.religion = [];
              }
              if (
                nameObj.kuldevtaFamilyDeity &&
                nameObj.kuldevtaFamilyDeity !== ""
              ) {
                nameObj.sStatus = "SE";
                // nameObj.kuldevtaFamilyDeity = nameObj.kuldevtaFamilyDeity
                let newKuldevtaFamilyDeity =
                  nameObj.kuldevtaFamilyDeity.toUpperCase();
                let newKuldevtaFamilyDeityArr =
                  newKuldevtaFamilyDeity.split(", ");
                console.log("--- kuldevtaFamilyDeity Array ---");
                console.log(newKuldevtaFamilyDeity);
                nameObj.kuldevtaFamilyDeity = newKuldevtaFamilyDeityArr;
              } else {
                nameObj.kuldevtaFamilyDeity = [];
              }
              if (nameObj.script && nameObj.script !== "") {
                nameObj.sStatus = "SE";
                let newScript = nameObj.script.toUpperCase();
                let newScriptArr = newScript.split(", ");
                console.log("--- Script Array ---");
                console.log(newScriptArr);
                nameObj.script = newScriptArr;
              } else {
                nameObj.script = [];
              }
              if (nameObj.alternative && nameObj.alternative !== "") {
                nameObj.sStatus = "SE";
                // nameObj.alternative = nameObj.alternative.toUpperCase()
                let newAlternative = nameObj.alternative.toUpperCase();
                let newAlternativeArr = newAlternative.split(", ");
                console.log("--- alternative Array ---");
                console.log(newAlternativeArr);
                nameObj.alternative = newAlternativeArr;
              } else {
                nameObj.alternative = [];
              }
              if (nameObj.vansha && nameObj.vansha !== "") {
                nameObj.sStatus = "SE";
                let newVansha = nameObj.vansha.toUpperCase();
                if (newVansha) {
                  nameObj.vansha = newVansha;
                }
              } else {
                nameObj.vansha = "";
              }
              if (nameObj.veda && nameObj.veda !== "") {
                nameObj.sStatus = "SE";
                let newVeda = nameObj.veda.toUpperCase();
                if (newVeda) {
                  nameObj.veda = newVeda;
                }
              } else {
                nameObj.veda = "";
              }
              if (nameObj.history && nameObj.history !== "") {
                nameObj.sStatus = "SE";
                let newHistory = nameObj.history.toUpperCase();
                if (newHistory) {
                  nameObj.history = newHistory;
                }
              } else {
                nameObj.history = "";
              }
              if (nameObj.wikiUrl && nameObj.wikiUrl !== "") {
                nameObj.sStatus = "SE";
                let newWikiURL = nameObj.wikiUrl;
                if (newWikiURL) {
                  nameObj.wikiUrl = newWikiURL;
                }
              } else {
                nameObj.wikiUrl = "";
              }
              let opObj = {
                insertOne: { document: nameObj },
              };
              opArr.push(opObj);
            }
          });
        }
        if (existingNames.length > 0) {
          //bulk update records
          console.log(
            "Processing data for existingNames length",
            existingNames.length
          );
          console.log("Processing data for updation");
          existingNames.forEach((nameObj) => {
            let opObj = {};
            let query = { surname: nameObj.surname };
            let updateObj = { $set: {} };
            if (nameObj.meaning && nameObj.meaning != "") {
              updateObj.$set.sStatus = "SE";
              updateObj.$set.meaning = nameObj.meaning;
            }
            if (nameObj.vansha && nameObj.vansha != "") {
              updateObj.$set.sStatus = "SE";
              let newVansha = nameObj.vansha.toUpperCase();
              updateObj.$set.vansha = newVansha;
            }
            if (nameObj.veda && nameObj.veda != "") {
              updateObj.$set.sStatus = "SE";
              let newVeda = nameObj.veda.toUpperCase();
              updateObj.$set.veda = newVeda;
            }
            if (nameObj.wikiUrl && nameObj.wikiUrl != "") {
              updateObj.$set.sStatus = "SE";
              updateObj.$set.wikiUrl = nameObj.wikiUrl;
            }
            if (nameObj.history && nameObj.history != "") {
              updateObj.$set.sStatus = "SE";
              updateObj.$set.history = nameObj.history;
            }
            if (nameObj.religion && nameObj.religion != "") {
              updateObj.$set.sStatus = "SE";
              let religionArr = [];
              if (nameObj.oldReligion instanceof Array) {
                religionArr = nameObj.oldReligion;
              } else if (
                nameObj.oldReligion instanceof String &&
                nameObj.oldReligion != ""
              ) {
                religionArr.push(nameObj.oldReligion.toUpperCase());
              }
              let newReligion = nameObj.religion.toUpperCase();
              let newReligionArr = newReligion.split(", ");
              for (i in newReligionArr) {
                if (
                  religionArr.findIndex((x) => x == newReligionArr[i]) == -1
                ) {
                  religionArr.push(newReligionArr[i]);
                }
              }
              updateObj.$set.religion = religionArr;
            }
            if (nameObj.community && nameObj.community != "") {
              updateObj.$set.sStatus = "SE";
              let communityArr = [];
              if (nameObj.oldCommunity instanceof Array) {
                communityArr = nameObj.oldCommunity;
              } else if (
                nameObj.oldCommunity instanceof String &&
                nameObj.oldCommunity != ""
              ) {
                communityArr.push(nameObj.oldCommunity.toUpperCase());
              }
              let newCommunity = nameObj.community.toUpperCase();
              let newCommunityArr = newCommunity.split(", ");
              for (i in newCommunityArr) {
                if (
                  communityArr.findIndex((x) => x == newCommunityArr[i]) == -1
                ) {
                  communityArr.push(newCommunityArr[i]);
                }
              }
              updateObj.$set.community = communityArr;
            }
            if (nameObj.gotra && nameObj.gotra != "") {
              updateObj.$set.sStatus = "SE";
              let gotraArr = [];
              if (nameObj.oldGotra instanceof Array) {
                gotraArr = nameObj.oldGotra;
              } else if (
                nameObj.oldGotra instanceof String &&
                nameObj.oldGotra != ""
              ) {
                gotraArr.push(nameObj.oldGotra.toUpperCase());
              }
              let newGotra = nameObj.gotra.toUpperCase();
              let newGotraArr = newGotra.split(", ");
              for (i in newGotraArr) {
                if (gotraArr.findIndex((x) => x == newGotraArr[i]) == -1) {
                  gotraArr.push(newGotraArr[i]);
                }
              }
              updateObj.$set.gotra = gotraArr;
            }
            if (
              nameObj.kuldevtaFamilyDeity &&
              nameObj.kuldevtaFamilyDeity != ""
            ) {
              updateObj.$set.sStatus = "SE";
              let kuldevtaFamilyDeityArr = [];
              if (nameObj.oldKuldevtaFamilyDeity instanceof Array) {
                kuldevtaFamilyDeityArr = nameObj.oldKuldevtaFamilyDeity;
              } else if (
                nameObj.oldKuldevtaFamilyDeity instanceof String &&
                nameObj.oldKuldevtaFamilyDeity != ""
              ) {
                kuldevtaFamilyDeityArr.push(
                  nameObj.oldKuldevtaFamilyDeity.toUpperCase()
                );
              }
              let newKuldevtaFamilyDeity =
                nameObj.kuldevtaFamilyDeity.toUpperCase();
              let newKuldevtaFamilyDeityArr =
                newKuldevtaFamilyDeity.split(", ");
              for (i in newKuldevtaFamilyDeityArr) {
                if (
                  kuldevtaFamilyDeityArr.findIndex(
                    (x) => x == newKuldevtaFamilyDeityArr[i]
                  ) == -1
                ) {
                  kuldevtaFamilyDeityArr.push(newKuldevtaFamilyDeityArr[i]);
                }
              }
              updateObj.$set.kuldevtaFamilyDeity = kuldevtaFamilyDeityArr;
            }
            if (nameObj.script && nameObj.script != "") {
              updateObj.$set.sStatus = "SE";
              let scriptArr = [];
              console.log("Script", nameObj.script);
              if (nameObj.oldScript instanceof Array) {
                scriptArr = nameObj.oldScript;
              } else if (
                nameObj.oldScript instanceof String &&
                nameObj.oldScript != ""
              ) {
                scriptArr.push(nameObj.oldScript.toUpperCase());
              }
              let newScript = nameObj.script.toUpperCase();
              let newScriptArr = newScript.split(", ");
              console.log(newScriptArr);
              for (i in newScriptArr) {
                if (scriptArr.findIndex((x) => x == newScriptArr[i]) == -1) {
                  scriptArr.push(newScriptArr[i]);
                }
              }
              updateObj.$set.script = scriptArr;
            }
            if (nameObj.alternative && nameObj.alternative != "") {
              let alternativeArr = [];
              if (nameObj.oldAlternative instanceof Array) {
                alternativeArr = nameObj.oldAlternative;
              } else if (
                nameObj.oldAlternative instanceof String &&
                nameObj.oldAlternative != ""
              ) {
                alternativeArr.push(nameObj.oldAlternative.toUpperCase());
              }
              let newAlternative = nameObj.alternative.toUpperCase();
              let newAlternativeArr = newAlternative.split(", ");
              for (i in newAlternativeArr) {
                if (
                  alternativeArr.findIndex((x) => x == newAlternativeArr[i]) ==
                  -1
                ) {
                  alternativeArr.push(newAlternativeArr[i]);
                }
              }
              updateObj.$set.alternative = alternativeArr;
            }
            if (
              nameObj.language &&
              nameObj.language != "" &&
              nameObj.value &&
              nameObj.value != ""
            ) {
              if (
                nameObj.language == "GU" ||
                nameObj.language == "MR" ||
                nameObj.language == "HI" ||
                nameObj.language == "BN" ||
                nameObj.language == "TLG" ||
                nameObj.language == "PA" ||
                nameObj.language == "TA" ||
                nameObj.language == "SD"
              ) {
                if (nameObj.translations == null || !nameObj.translations) {
                  console.log("translation is null");
                  updateObj.$set.translations = [
                    { lang: nameObj.language, value: nameObj.value },
                  ];
                } else {
                  let index = nameObj.translations.findIndex(
                    (x) => x.lang == nameObj.language
                  );
                  console.log(nameObj);
                  console.log(index);
                  if (index >= 0) {
                    //console.log(`translations[${index}].value`)
                    let allTranslations = nameObj.translations;

                    let translationValues = [];
                    translationValues = allTranslations[index].value;
                    if (translationValues instanceof Array) {
                      if (
                        translationValues.findIndex(
                          (x) => x == nameObj.value
                        ) == -1
                      ) {
                        translationValues.push(nameObj.value);
                      }
                    } else if (
                      translationValues instanceof String &&
                      translationValues != ""
                    ) {
                      translationValues = [nameObj.value];
                    }
                    allTranslations[index].value = translationValues;
                    console.log(allTranslations);
                    updateObj.$set.translations = allTranslations;
                    // updateObj.$set = {
                    //   "translations.$[].value": translationValues
                    // }
                  } else {
                    let allTranslations = nameObj.translations;
                    allTranslations.push({
                      lang: nameObj.language,
                      value: [nameObj.value],
                    });
                    //updateObj.$set.translations = { $concatArrays: ["$translations", [{ lang: nameObj.language, value: [nameObj.value] }]] }
                    updateObj.$set.translations = allTranslations;
                  }
                }
              }
            }
            console.log(updateObj);
            opObj = {
              updateOne: {
                filter: query,
                update: updateObj,
              },
            };
            opArr.push(opObj);
          });
        }
        if (opArr.length > 0) {
          console.log(`Processing ${opArr.length} records in mongodb`);
          await surnameModel.bulkWrite(opArr, { ordered: false });
        }
        const log = new logModel({
          main_Option: "New Masters",
          sub_Option: "Upload New Surnames",
          newCount: newNames.length,
          updatedCount: existingNames.length,
          fileName: trimmedLogFileName,
          user: null,
          parameter: {
            endDate: null,
            language: null,
            range: null,
            startDate: null,
          },
        });
        if (log) {
          await log.save();
          console.log("--- line 297", log);
          res.status(201).send(log);
        } else {
          res.status(404).send({
            message: "Data found!",
          });
        }
        console.log("line 1372 new names", newNames.length);
        console.log("line 1373 existing Names", existingNames.length);
      } catch (e) {
        console.log(e);
      }
    };
    saveNamesInMongoDB();
  } catch (e) {
    console.log(e);
  }
  // };
};

exports.streamZipImages = async (req, res) => {
  try {
    console.log("Hi Lambda");
  } catch (e) {
    res.status(400).json(e.message);
  }
};
exports.createFiles = async ({ body }, res) => {
  try {
    const file = await filesModel.find({
      category: body.category,
      fileSourceDate: new Date(body.fileSourceDate),
      fileName: body.fileName,
      fileSource: body.fileSource,
      language: body.language,
    });
    if (file.length) {
      res.status(404).send({
        message: "Data already present!",
      });
    } else {
      let objId = body.objectId ? body.objectId : uuidv4();
      const d = new Date(body.fileSourceDate);
      let year = d.getFullYear();
      console.log("line 36", year);
      const inputData = {
        _id: objId,
        // "fileId": body.fileId ? `${body.fileId}` : null,
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        fileSource: body.fileSource,
        createdBy: body.createdBy,
        fileSourceDate: body.fileSourceDate,
        fileSourceDateYear: year,
        fileType: body.fileType,
        language: body.language,
        category: body.category,
        fsId: body.fsId,
        fstatus: "FC",
      };
      console.log("inputData:", inputData);
      const files = new filesModel(inputData);
      console.log("files", files);

      if (files) {
        // console.log(mongoose.Types.ObjectId.isValid(body._id));
        const result = await files.save();
        console.log("result:", result);
        res.status(201).send(files);
      } else {
        res.status(404).send({
          message: "Data found!",
        });
      }
      ///////save in persons data

      files.fileUrl.forEach(async (imageUrl) => {
        console.log("n", imageUrl);

        if (files.fileUrl) {
          var obj = {
            fileId: files._id,
            imageUrl: imageUrl,
            // fileSourceDateInPerson: year
          };
          console.log("OBJ:", obj);
          const response = await personsModel(obj).save();
          console.log("RESPONSE :", response);
          //  res.status(201).send(response);
        }
      });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

// ---------------------------------API GET FILES DATA -----------

exports.files = async (req, res) => {
  try {
    // console.log("req", req)
    var id = req.params.userId;
    const qparams = req.query;
    const fstatus = constants.fileCreated;
    const files = await userModel.find({ _id: id }).populate("catAllocated");
    let catCode = [];
    if (files.length) {
      files[0].catAllocated.forEach(async (data) => {
        catCode.push(data.categoryCode);
      });
    }
    console.log("catCode:", catCode);
    let whereCondition;
    // {
    //     $match: {
    //         $and: [{
    //             fileSourceDate: {
    //                 $gt: qparams.fromdate,
    //                 $lt: qparams.todate
    //             }
    //         }, { category: { $eq: qparams.category } }]
    //     }
    // },
    // category: qparams.category,
    // fileSourceDate: {
    //     $gte: qparams.fromdate,
    //     $lte: qparams.todate
    // },

    // if (qparams.fstatus != constants.pending) {
    //     whereCondition = {
    //         $match: {
    //             $and: [{
    //                 fileSourceDate: {
    //                     $gte: qparams.fromdate,
    //                     $lte: qparams.todate
    //                 }
    //             }, {
    //                 category: { $eq: qparams.category },
    //                 fstatus: { $eq: qparams.fstatus }
    //             }]
    //         }
    //     }
    // }
    // console.log('whereCondition:', whereCondition)
    if (qparams.fstatus === constants.pending && qparams.category === "DN") {
      const result = await getPendingFilesList(qparams, files[0].fsAllocated);
      if (result) {
        res.status(201).send(result);
      } else {
        res.status(404).send({ message: "No Data found" });
      }
    } else {
      console.log("qparams:", qparams);
      console.log("qparams.category", qparams.category);
      let catWhere = {};
      let sourceWhere = "";
      if (qparams.category === "ALL") catWhere = { $ne: "DN", $in: catCode };
      else catWhere = { $eq: qparams.category };
      console.log("catWhere", catWhere);
      if (qparams.fileSource) {
        sourceWhere = {
          fileSourceDate: {
            $gte: new Date(qparams.fromdate),
            // new Date(qparams.fromdate).setHours(00, 00, 00)),
            $lte: new Date(qparams.todate),
            // new Date(qparams.todate).setHours(23, 59, 59))
          },
          category: catWhere,
          fstatus: { $eq: qparams.fstatus },
          fileSource: { $eq: qparams.fileSource },
        };
      } else {
        sourceWhere = {
          fileSourceDate: {
            $gte: new Date(qparams.fromdate),
            // new Date(qparams.fromdate).setHours(00, 00, 00)),
            $lte: new Date(qparams.todate),
            // new Date(qparams.todate).setHours(23, 59, 59))
          },
          category: catWhere,
          fstatus: { $eq: qparams.fstatus },
        };
      }
      const fileCat = await filesModel.aggregate([
        {
          $match: sourceWhere,
          // fileSourceDate: {
          //     $gte: new Date(qparams.fromdate),
          //     // new Date(qparams.fromdate).setHours(00, 00, 00)),
          //     $lte: new Date(qparams.todate)
          //         // new Date(qparams.todate).setHours(23, 59, 59))
          // },
          // category: catWhere,
          // fstatus: { $eq: qparams.fstatus },
          // // fileSource: sourceWhere
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { fileName: "$fileName" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fileName"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "fileNames",
          },
        },
        {
          $lookup: {
            from: "placesdatas",
            let: { fileSource: "$fileSource" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fileSource"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "fileSources",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { fileType: "$fileType" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fileType"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "fileTypes",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { language: "$language" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$language"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "languages",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { category: "$category" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$category"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "categorys",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { fstatus: "$fstatus" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fstatus"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "fstatuss",
          },
        },
        { $sort: { createdAt: -1 } },
      ]);
      if (fileCat) {
        console.log("FileCAt", fileCat);
        let data = [];
        data = fileCat.filter((element) => {
          if (element.category === "DN") {
            const result = files[0].fsAllocated.includes(element.fsId);
            if (result) {
              return element;
            }
          }
          if (element.category !== "DN") {
            console.log("element", element.category);
            return element;
          }
        });
        console.log("files data", data);
        data.filter((d, i) => {
          data[i] = {
            _id: d._id,
            fileName: d.fileNames[0] ? d.fileNames[0].categoryName : d.fileName,
            fileSource: d.fileSources[0] ? d.fileSources[0].categoryName : "",
            fileType: d.fileTypes[0] ? d.fileTypes[0].categoryName : "",
            language: d.languages[0] ? d.languages[0].categoryName : "",
            fstatus: d.fstatuss[0] ? d.fstatuss[0].categoryName : "",
            category: d.categorys[0] ? d.categorys[0].categoryName : "",
            // fileId: d.fileId,
            fileUrl: d.fileUrl,
            fileSourceDate: d.fileSourceDate,
          };
        });
        res.status(201).send(data);
      } else {
        res.status(404).send({ message: "No Data found" });
      }
    }
  } catch (e) {
    res.status(400).send(e.toString());
  }
};

// ----------------------------DELETE FIles DATA API ------------------

exports.deleteFiles = async (req, res) => {
  const _id = req.params._id;
  try {
    const persons = await personsModel.remove({ fileId: _id });
    const files = await filesModel.deleteOne({ _id: _id });
    if (files) {
      console.log("per", persons);
      res.status(201).send(files);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

// --------------------------------- API GET File uploaded -------------
exports.getPendingFileList = async (req, res) => {
  try {
    const qparams = req.query;
    const fs = qparams.fsId.split(",");
    const result = await getPendingFilesList(qparams, fs);
    if (result) {
      res.status(201).send(result);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e.toString());
  }
};

// get created file dates
const checkCreatedFileDate = (files, fs) => {
  let result = [];
  for (let i = 0; i < files.length; i++) {
    if (files[i].fsId.toString() === fs.toString()) {
      result.push(files[i].fileSourceDate);
    }
  }
  return result;
};

const getPendingFiles = (fsDates, fs, dateArray) => {
  let result = dateArray.slice();
  fsDates.forEach((fsd) => {
    dateArray.forEach((d, i) => {
      if (
        d.getUTCFullYear() === fsd.getUTCFullYear() &&
        d.getUTCMonth() === fsd.getUTCMonth() &&
        d.getUTCDay() === fsd.getUTCDay()
      ) {
        delete result[i];
      }
    });
  });
  return result;
};

// Returns an array of dates between the two dates
const getDates = function (startDate, endDate) {
  var dates = [],
    currentDate = startDate,
    addDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };
  while (currentDate <= endDate) {
    dates.push(currentDate);
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
};

const getPendingFilesList = async (qparams, fs) => {
  const dateArray = getDates(
    new Date(qparams.fromdate),
    new Date(qparams.todate)
  );
  const filedata = await filesModel
    .find({
      fsId: { $in: fs },
      fileSourceDate: {
        $gte: qparams.fromdate,
        $lte: qparams.todate,
      },
    })
    .sort({ createdAt: -1 });
  if (filedata) {
    let result = [];
    for (let i = 0; i < fs.length; i++) {
      let fileGroupByfsId = checkCreatedFileDate(filedata, fs[i]);
      let pendingfsDates = getPendingFiles(fileGroupByfsId, fs[i], dateArray);
      let fsValues = await fileSourceModel.aggregate([
        { $match: { _id: fs[i] } },
        {
          $lookup: {
            from: "masterdatas",
            let: { fileName: "$fileName" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fileName"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "fileNames",
          },
        },
        {
          $lookup: {
            from: "placesdatas",
            let: { fileSource: "$fileSource" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fileSource"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "fileSources",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { fileType: "$fileType" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fileType"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "fileTypes",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { language: "$language" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$language"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "languages",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { category: "$category" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$category"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "categorys",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { fstatus: "$fstatus" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fstatus"] } } },
              { $project: { categoryName: 1, _id: 0 } },
            ],
            as: "fstatuss",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            let: { fileName: "$fileName" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryCode", "$$fileName"] } } },
              { $project: { url: 1, _id: 0 } },
            ],
            as: "url",
          },
        },
      ]);
      fsValues = fsValues[0];
      console.log("fsValues:", fs[i]);
      const fsId = fs[i];

      pendingfsDates.forEach((element, i) => {
        if (element != null) {
          result.push({
            fileName: fsValues.fileNames[0].categoryName,
            fileNameCode: fsValues.fileName,

            fileSource: fsValues.fileSources[0].categoryName,
            fileSourceCode: fsValues.fileSource,

            fileSourceDate: element,

            fileType: fsValues.fileTypes[0].categoryName,
            fileTypeCode: fsValues.fileType,

            language: fsValues.languages[0].categoryName,
            languageCode: fsValues.language,

            category: fsValues.categorys[0].categoryName,
            categoryCode: fsValues.category,

            fstatus: "Pending",
            url: fsValues.url[0].url,

            fsId: fsId,

            fileNameConvention: fsValues.fileNameConvention,
          });
        }
      });
    }
    // console.log("result:", result)
    return result;
  } else {
    return "error";
  }
};

exports.updateStatusVerified = async (req, res) => {
  try {
    const fileId = req.body.fileId;
    const fstatus = req.body.fstatus;
    console.log("fileId:", fileId);
    const file = await filesModel.update(
      { _id: fileId },
      { $set: { fstatus: fstatus } }
    );
    if (file) {
      res.status(200).send({ message: "File Status Updated" });
    } else {
      res.status(404).send({
        message: "Data found!",
      });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

// ----------------------------UPDATE FIles DATA API ------------------

exports.updateFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    // const fileUrltoUpdate = req.body.fileUrltoUpdate;
    const body = req.body;
    console.log("body :", body);
    console.log(fileId);
    // get file
    const file = await filesModel.findOne({ _id: fileId });
    console.log("File :", file.fileUrl);
    const updatedFileUrl = file.fileUrl.concat(body.fileUrl);
    const newFileUrl = body.fileUrl;
    console.log("updatedFileUrl :", updatedFileUrl);
    // extract file key from file urls
    // const fileKey = file.fileUrl.map((url) => {
    //   return url.replace(constants.bucketName, "");
    // });
    //console.log("fileKey:", fileKey);
    /////////////////////////////////////////////////////////////////
    // console.log(fileKey);
    // delete the file from s3 with matching keys
    // fileKey.forEach(async (key) => {
    //     key = key.replace(/%/g, ":");
    //     key = key.replace(/3A/g, '')
    //     console.log("bucket:", process.env.AWS_BUCKET_NAME, "key:", key)
    //     s3.deleteObject({
    //         Bucket: process.env.AWS_BUCKET_NAME,
    //         Key: key
    //     }, (err, data) => {
    //         if (err) {
    //             console.log("err:", err)
    //         }
    //         console.log("data:", data)
    //     })
    //     // console.log(res)
    // })

    // update the file
    const fileUpdateResult = await filesModel.updateOne(
      { _id: fileId },
      {
        $set: {
          // fileName: body.fileName,
          fileUrl: updatedFileUrl,
          refUrl: body.refUrl,
          // fileSourceDate: req.body.fileSourceDate,
          updatedAt: Date.now(),
          fstatus: constants.fileCreated,
        },
      }
    );
    console.log("fileUpdateResult :", fileUpdateResult);
    if (file.category == "IM") {
      newFileUrl.forEach(async (imageUrl) => {
        //     console.log("n", imageUrl);
        // const personExists = await personsModel.findOne({
        //   fileId: fileId,
        //   imageUrl: imageUrl,
        // });
        // consoe.log("personExists :", personExists);
        // if (personExists.imageUrl != imageUrl) {
        if (newFileUrl) {
          var obj = {
            fileId: fileId,
            imageUrl: imageUrl,
          };
          // console.log("OBJ:", obj);
          const response = await personsModel(obj).save();
          console.log("RESPONSE :", response);
          //  res.status(201).send(response);
        }
        // } else {
        //   console.log("Person already exists");
        // }
      });
    }
    if (fileUpdateResult) {
      // console.log(fileUpdateResult)
      res.status(200).send({ message: "File updated succefully" });
    } else {
      res.status(404).send({
        message: "Data found!",
      });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getFileById = async (req, res) => {
  try {
    console.log("fileid:", req.params.fileId);
    const file = await filesModel.aggregate([
      { $match: { _id: req.params.fileId } },
      {
        $lookup: {
          from: "placesdatas",
          let: { fileSource: "$fileSource" },
          pipeline: [
            { $match: { $expr: { $eq: ["$categoryCode", "$$fileSource"] } } },
            // { $project: { "categoryName": 1, "_id": 0 } }
          ],
          as: "fileSource",
        },
      },
      {
        $lookup: {
          from: "masterdatas",
          let: { fileType: "$fileType" },
          pipeline: [
            { $match: { $expr: { $eq: ["$categoryCode", "$$fileType"] } } },
            // { $project: { "categoryName": 1, "_id": 0 } }
          ],
          as: "fileType",
        },
      },
      {
        $lookup: {
          from: "masterdatas",
          let: { language: "$language" },
          pipeline: [
            { $match: { $expr: { $eq: ["$categoryCode", "$$language"] } } },
            // { $project: { "categoryName": 1, "_id": 0 } }
          ],
          as: "language",
        },
      },
      {
        $lookup: {
          from: "masterdatas",
          let: { category: "$category" },
          pipeline: [
            { $match: { $expr: { $eq: ["$categoryCode", "$$category"] } } },
            // { $project: { "categoryName": 1, "_id": 0 } }
          ],
          as: "category",
        },
      },
    ]);
    if (file) {
      console.log(file);
      res.status(200).send(file);
    } else {
      res.status(404).send({
        message: "No data found!",
      });
    }
  } catch (e) {}
};

exports.getFilesCountByNP = async (req, res) => {
  try {
    console.log("getFilesCountByNP");
    const qparams = req.query;
    const where = {};

    where.fileSourceDate = {
      $gte: new Date(qparams.fromDate),
      $lt: new Date(qparams.toDate),
    };
    if (qparams.category) where.category = qparams.category;
    if (qparams.fstatus) where.fstatus = qparams.fstatus;
    const files = await filesModel.aggregate([
      {
        $match: where,
      },
      {
        $group: {
          _id: "$fileName",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log(files.length);
    if (files) {
      res.status(200).send(files);
    } else {
      res.status(404).send({ message: "no data found!" });
    }
  } catch (e) {}
};

exports.validate = async (req, res) => {
  try {
    // req.setTimeout(300000);
    const params = req.params;
    const page = parseInt(req.query.page);
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const offset = page ? page * limit : 0;
    const { NamesArray, NamesCount } = await validateName(
      params.fileId,
      offset,
      limit
    );
    // const { SurnamesArray, SurnamesCount } = await validateSurname(params.fileId,offset, limit);
    // console.log("result", result[0].map((e) => { return e.name }));
    if (NamesArray.length) {
      //|| SurnamesArray.length) {
      res.status(200).send({
        NamesCount: NamesCount,
        NamesDoesNotExist: NamesArray,
        // "SurnamesCount": SurnamesCount,
        // "Surname that does not exist": SurnamesArray
      });
    } else {
      res.status(200).send({
        "Data valid": "All names are present",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.toString());
  }
};

async function validateName(fileId, offset, limit) {
  console.log("fileId:", fileId);
  try {
    const names = await personsModel.aggregate([
      {
        $match: { fileId: { $eq: fileId } },
      },
      {
        $lookup: {
          from: "names",
          localField: "name",
          foreignField: "name",
          as: "inventory_docs",
        },
      },
      { $sort: { name: 1 } },
      //{ $unwind: : {path: "$inventory_docs"}},
      //{$match:{$and:[{"names.name":{$ne: "inventory_docs.name"} ]},
      { $match: { inventory_docs: [] } },
      {
        $project: {
          _id: 1,
          fileId: 1,
          name: 1,
        },
      },
    ]);

    // --------------------------old query-----------------------------------
    //     {
    //         $lookup: {
    //             from: "names",
    //             localField: "name",
    //             foreignField: "name",
    //             as: "namesExist"
    //         }
    //     },
    //     { $match: { namesExist: { $eq: [] } } },
    //     {
    //         $project: {
    //             name: 1
    //         }
    //     }
    // ]);

    //console.log("personArray:", names)
    return { NamesArray: names, NamesCount: names.length };
  } catch (e) {
    console.log("namesError:", e);
    throw e;
  }
}

exports.validateSurname = async (req, res) => {
  //async function validateSurname(fileId,offset,limit) {
  // console.log("fileId:", fileId)
  const params = req.params;
  const page = parseInt(req.query.page);
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  const offset = page ? page * limit : 0;
  try {
    // -------------TODO CHECKING QUERY WORKING OR NOT----------------------------
    const surnames = await personsModel.aggregate([
      {
        $match: { fileId: { $eq: params.fileId } },
      },
      {
        $lookup: {
          from: "surnames",
          localField: "lastName",
          foreignField: "surname",
          as: "inventory_docs",
        },
      },
      { $sort: { lastName: 1 } },
      //{ $unwind: : {path: "$inventory_docs"}},
      //{$match:{$and:[{"surnames.surname":{$ne: "inventory_docs.surname"} ]},
      { $match: { inventory_docs: [] } },
      {
        $project: {
          _id: 1,
          fileId: 1,
          lastName: 1,
        },
      },
    ]);

    // -----------------------------------------OLD QUERY START------------------------

    // const surnames = await personsModel.aggregate([{
    //         $match: {
    //             lastName: { '$exists': true },
    //             fileId: { $eq: params.fileId }
    //         }
    //     },
    //     { "$addFields": { "persons.lastName": { "$toLower": "$lastName" } } },
    //     {
    //         $lookup: {
    //             from: "surnames",
    //             let: { personLastname: "$persons.lastName" },
    //             pipeline: [
    //                 { "$addFields": { "ssurname": { "$toLower": "$surname" } } },
    //                 {
    //                     $match: {
    //                         $expr: { $eq: ["$ssurname", "$$personLastname"] }
    //                     }
    //                 },
    //             ],
    //             as: "surnamesExist"
    //         }
    //     },
    //     { $match: { surnamesExist: { $eq: [] } } },
    //     {
    //         $project: {
    //             surname: "$lastName",
    //             _id: 0
    //         }
    //     },
    //     { $skip: offset },
    //     { $limit: limit }
    // ]);

    // -----------------------------------------OLD QUERY END------------------------

    console.log("surnamesArray:", surnames);
    if (surnames.length) {
      res.status(200).send({
        SurnamesCount: surnames.length,
        "Surname that does not exist": surnames,
      });
    } else {
      res.status(200).send({ "Data valid": "All surnames are present" });
    }
  } catch (e) {
    console.log("surnamesError:", e);
    res.status(400).send(e.toString());
  }
};

exports.validateNamesAndSurnamesDownloadForMoreOptions = async (req, res) => {
  try {
    let downloadNewName = req.body.downloadNewName;
    let language = req.body.language;
    let range = req.body.range;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let NamesArray = [];
    if (downloadNewName === "DNN") {
      NamesArray = await pmkName(startDate, endDate, downloadNewName);
    } else if (downloadNewName === "DNS") {
      NamesArray = await pmkSurname(startDate, endDate, downloadNewName);
    } else if (downloadNewName === "DRS" && language === "HI") {
      NamesArray = await downloadRegionalSurnameHindi(
        startDate,
        endDate,
        downloadNewName
      );
    } else if (downloadNewName === "DRS" && language === "GU") {
      NamesArray = await downloadRegionalSurnameGujrati(
        startDate,
        endDate,
        downloadNewName
      );
    }
    if (NamesArray.length) {
      res.status(200).send({
        result: NamesArray,
      });
    } else {
      res.status(200).send({
        "Data valid": "All names are present",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.toString());
  }
};
async function pmkName(startDate, endDate, downloadNewName) {
  try {
    let finalData = [];
    const files = await filesModel.find(
      {
        category: "PMK",
        fileSource: { $regex: "IN-AP" },
        // createdAt: {
        //   $gte: new Date(startDate),
        //   $lte: new Date(endDate),
        // },
      },
      { _id: 1 }
    );
    _.forEach(files, async function (value) {
      finalData.push(value._id);
    });
    console.log(finalData);
    const personsData = await personsModel.aggregate([
      {
        $match: {
          fileId: { $in: finalData },
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $lookup: {
          from: "names",
          localField: "name",
          foreignField: "name",
          as: "inventory_docs",
        },
      },
      { $sort: { name: 1 } },
      //{ $unwind: : {path: "$inventory_docs"}},
      //{$match:{$and:[{"names.name":{$ne: "inventory_docs.name"} ]},

      {
        $project: {
          _id: 1,
          fileId: 1,
          name: 1,
          sex: 1,
        },
      },
    ]);
    console.log(personsData);
    if (!_.isEmpty(downloadNewName)) {
      namearray = [];
      _.forEach(personsData, async function (value) {
        let namefilter = {};
        if (!_.isUndefined(value.name)) {
          namefilter.name = value.name;
          namefilter.sex = value.sex;
          namearray.push(namefilter);
        }
      });
      // return namearray;
      const key = "name";
      const unique = [
        ...new Map(namearray.map((item) => [item[key], item])).values(),
      ];
      return unique;
    }
  } catch (e) {
    console.log("namesError:", e);
    throw e;
  }
}
async function pmkSurname(startDate, endDate, downloadNewName) {
  try {
    let finalData = [];
    const files = await filesModel.find(
      {
        category: "PMK",
        fileSource: { $regex: "IN-AP" },
      },
      { _id: 1 }
    );
    _.forEach(files, async function (value) {
      finalData.push(value._id);
    });
    console.log(finalData);
    const personsData = await personsModel.aggregate([
      {
        $match: {
          fileId: { $in: finalData },
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $lookup: {
          from: "surnames",
          localField: "lastName",
          foreignField: "surname",
          as: "inventory_docs",
        },
      },
      { $sort: { lastName: 1 } },
      //{ $unwind: : {path: "$inventory_docs"}},
      //{$match:{$and:[{"names.name":{$ne: "inventory_docs.name"} ]},
      // { $match: { inventory_docs: [] } },
      {
        $project: {
          _id: 1,
          fileId: 1,
          lastName: 1,
        },
      },
    ]);
    console.log(personsData);
    if (!_.isEmpty(downloadNewName)) {
      surnameArray = [];
      _.forEach(personsData, async function (value) {
        let surnamefilter = {};
        if (!_.isUndefined(value.lastName)) {
          surnamefilter.surname = value.lastName;
          surnameArray.push(surnamefilter);
        }
      });
      // return surnameArray;
      const key = "surname";
      const unique = [
        ...new Map(surnameArray.map((item) => [item[key], item])).values(),
      ];
      return unique;
    }
  } catch (e) {
    console.log("surnamesError:", e);
    throw e;
  }
}

// regionalSurname Hindi
async function downloadRegionalSurnameHindi(
  startDate,
  endDate,
  downloadNewName
) {
  try {
    const lastNameData = await regionalSurnameHindi.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $lookup: {
          from: "surnames",
          localField: "lastName",
          foreignField: "surname",
          as: "inventory_docs",
        },
      },
      { $sort: { lastName: 1 } },
      {
        $match: {
          $expr: {
            $eq: [{ $size: "$inventory_docs" }, 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          fileId: 1,
          lastName: 1,
          regionalLastName: 1,
        },
      },
    ]);
    console.log(lastNameData);
    if (!_.isEmpty(downloadNewName)) {
      surnameArray = [];
      _.forEach(lastNameData, async function (value) {
        let surnamefilter = {};
        if (!_.isUndefined(value.lastName)) {
          surnamefilter.surname = value.lastName;
          surnamefilter.regionalLastName = value.regionalLastName;
          surnameArray.push(surnamefilter);
        }
      });
      // return surnameArray;
      const key = "surname";
      const unique = [
        ...new Map(surnameArray.map((item) => [item[key], item])).values(),
      ];
      return unique;
    }
  } catch (e) {
    console.log("surnamesError:", e);
    throw e;
  }
}
// regionalSurname Gujrati
async function downloadRegionalSurnameGujrati(
  startDate,
  endDate,
  downloadNewName
) {
  try {
    const lastNameData = await regionalSurnameGujrati.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $lookup: {
          from: "surnames",
          localField: "lastName",
          foreignField: "surname",
          as: "inventory_docs",
        },
      },
      { $sort: { lastName: 1 } },
      {
        $match: {
          $expr: {
            $eq: [{ $size: "$inventory_docs" }, 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          fileId: 1,
          lastName: 1,
          regionalLastName: 1,
        },
      },
    ]);
    console.log(lastNameData);
    if (!_.isEmpty(downloadNewName)) {
      surnameArray = [];
      _.forEach(lastNameData, async function (value) {
        let surnamefilter = {};
        if (!_.isUndefined(value.lastName)) {
          surnamefilter.surname = value.lastName;
          surnamefilter.regionalLastName = value.regionalLastName;
          surnameArray.push(surnamefilter);
        }
      });
      // return surnameArray;
      const key = "surname";
      const unique = [
        ...new Map(surnameArray.map((item) => [item[key], item])).values(),
      ];
      return unique;
    }
  } catch (e) {
    console.log("surnamesError:", e);
    throw e;
  }
}
// ===========================S3 Pdf Download========
exports.downloadS3PDF = async (req, res) => {
  try {
    var fileName = req.body.fileName;
    var assembly = req.body.assembly.split(" ").join("");
    var district = req.body.district;
    var statename;
    var pdfName = req.body.pdfName;
    console.log(assembly);

    if (assembly.indexOf(" ") >= 0) {
      assembly = assembly.trim();
      // assembly=assembly.replace(/%20/g, " ");
      console.log("assembly contain space", assembly);
    }

    function splitStr(str) {
      // Function to split string
      var string = str.split(" ");

      console.log(string);
      stateName = string[0];
    }

    // Initialize string
    var str = fileName;

    // Function call
    splitStr(str);
    console.log(stateName);
    console.log(pdfName);

    if (_.isEmpty(district)) {
      var keyURLGener =
        process.env.AWS_BUCKET_ELECTORAL_PDF_FILE_URL +
        stateName +
        "/" +
        assembly +
        "/" +
        pdfName;
      console.log("keyURL--> ", typeof keyURLGener);
      console.log(keyURLGener);
    } else {
      var keyURLGener =
        process.env.AWS_BUCKET_ELECTORAL_PDF_FILE_URL +
        stateName +
        "/" +
        district +
        "/" +
        assembly +
        "/" +
        pdfName;
      console.log("keyURL--> ", typeof keyURLGener);
      console.log(keyURLGener);
    }

    console.log("Trying to download file", pdfName);
    keyUrl = getSignedUrl(keyURLGener);
    console.log("PDFURL", keyUrl);
    return res.json({ imageUrl: keyUrl });
  } catch (e) {
    res.status(400).json(e.message);
  }
};

function getSignedUrl(data) {
  // const contentDisposition = 'attachment; filename=\"' + name + '\"';
  var key = urlParse.parse(data).pathname;
  key = key.replace("/", "");
  var url = s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_BUCKET_NAME_PDF,
    Key: key,
    // Key: 'general/1601018967848.png',
    // ResponseContentDisposition: contentDisposition,
    Expires: 7200, //2 hours
  });
  return url;
}
