const personsModel = require("../models/reposPersons.model");
const filesModel = require("../models/reposFiles.model");
const surnameModel = require("../models/surname.model");
const namesModel = require("../models/name.model");
const aws = require("aws-sdk");
const urlParse = require("url");
const _ = require("lodash");
const { response } = require("express");
var mongo = require("mongodb");
exports.createPersons = async ({ body }, res) => {
  try {
    // Persons data
    const persons = await personsModel.find({
      dateOfDeath: new Date(body.dateOfDeath),
      name: body.name,
      middleName: body.middleName,
      lastName: body.lastName,
      imageUrl: body.imageUrl,
    });
    if (persons.length) {
      res.status(404).send({
        message: "Data already present!",
      });
    } else {
      const persons = new personsModel(body);
      if (persons) {
        await persons.save();
        // console.log('persons', persons.fileId)
        const updateStatus = await filesModel.updateOne(
          { _id: persons.fileId },
          { fstatus: "PerC" }
        );
        if (updateStatus) {
          res.status(201).send(persons);
        }
      } else {
        res.status(404).send({
          message: "Data found!",
        });
      }
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
// --------------------------------- API GET ONE PERSON DATA -------------

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_REGION,
  signatureVersion: "v4",
});
const s3 = new aws.S3();
exports.getOnePerson = async (req, res) => {
  try {
    var id = req.params._id;
    const Oneperson = await personsModel.findOne({ _id: id });
    if (Oneperson) {
      console.log("Oneperson", Oneperson);
      // const url = getSignedUrl(Oneperson.imageUrl)
      // Oneperson.save();
      // console.log('Oneperson', Oneperson)
      res.status(201).send(Oneperson);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
exports.getPersonByImage = async (req, res) => {
  try {
    var imageUrl = req.body.imageUrl;
    const Oneperson = await personsModel.find({ imageUrl: imageUrl });
    if (Oneperson) {
      console.log("Oneperson", Oneperson);
      // const url = getSignedUrl(Oneperson.imageUrl)
      // Oneperson.save();
      // console.log('Oneperson', Oneperson)
      res.status(201).send(Oneperson);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

function getSignedUrl(data) {
  // const contentDisposition = 'attachment; filename=\"' + name + '\"';
  var key = urlParse.parse(data).pathname;
  key = key.replace("/", "");
  var url = s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    // Key: 'general/1601018967848.png',
    // ResponseContentDisposition: contentDisposition,
    Expires: 7200, //2 hours
  });
  return url;
}
// --------------------------------- API GET All PERSONS DATA -------------
exports.getAllPersons = async (req, res) => {
  try {
    var fileId = req.params.fileId;
    const persons =
      // await personsModel.find({ fileId: fileId },
      //     { fileId: 0 }
      // );
      await personsModel.aggregate([
        {
          $match: {
            fileId: { $eq: fileId },
          },
        },
        // {
        //     "$addFields": {
        //         "dateOfBirth": {
        //             "$toDate": "$dateOfBirth"
        //         }
        //     }
        // },
        {
          $project: {
            refno: 1,
            name: 1,
            middleName: 1,
            lastName: 1,
            originName: 1,
            spouse: 1,
            birthOfPlace: 1,
            deathOfPlace: 1,
            age: 1,
            sex: 1,
            language: 1,
            regionalName: 1,
            regionalMiddleName: 1,
            regionalLastName: 1,
            regionalPlaceOfBirth: 1,
            regionalPlaceOfDeath: 1,
            caste: 1,
            employer: 1,
            remarks: 1,
            arrival: 1,
            place: 1,
            contactNo: 1,
            contactEmail: 1,
            companyName: 1,
            designation: 1,
            education: 1,
            regionalSpouseName: 1,
            address: 1,
            dateOfDeath: 1,
            BD_Flag: 1,
            DD_Flag: 1,
            spouseType: 1,
            dateOfBirth: 1, // { $dateToString: { format: "%d/%m/%Y", date: "$dateOfBirth" } },
            imageUrl: 1,
          },
        },
      ]);
    if (persons) {
      res.status(201).send(persons);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

// ----------------------------UPDATE PERSON DATA API ------------------
exports.updatePersons = async ({ params, body }, res) => {
  const id = params.id;
  //console.log('params', params)
  //console.log('body', body)
  try {
    const persons = await personsModel.findByIdAndUpdate({ _id: id }, body, {
      new: true,
    });
    if (persons) {
      res.status(201).send(persons);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

// ----------------------------DELETE PERSON DATA API ------------------

exports.deletePerson = async (req, res) => {
  const _id = req.params._id;
  try {
    const persons = await personsModel.deleteOne({ _id: _id });
    if (persons) {
      res.status(201).send(persons);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.searchPersons = async (req, res) => {
  try {
    const searchParams = req.query;
    console.log("search", searchParams);
    const where = getSearchParams(searchParams);
    let orCondition;

    let name = null; // new RegExp(searchParams.name, "i");
    let lastName = null;
    var persons = null;

    if (searchParams.lastName && !searchParams.name) {
      lastName = new RegExp(searchParams.lastName, "i");
      if (searchParams.sex && !searchParams.age) {
        persons = await personsModel.aggregate([
          {
            $match: {
              $and: [
                { lastName: { $regex: lastName } },
                {
                  $or: [{ sex: { $eq: searchParams.sex } }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "fileId",
              foreignField: "_id",
              as: "fileMaster",
            },
          },
          {
            $lookup: {
              from: "masterdatas",
              localField: "fileMaster.category",
              foreignField: "categoryCode",
              as: "categoryMaster",
            },
          },
        ]);
      } else if (!searchParams.sex && searchParams.age) {
        persons = await personsModel.aggregate([
          {
            $match: {
              $and: [
                { lastName: { $regex: lastName } },
                {
                  $or: [{ age: where.age }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "fileId",
              foreignField: "_id",
              as: "fileMaster",
            },
          },
          {
            $lookup: {
              from: "masterdatas",
              localField: "fileMaster.category",
              foreignField: "categoryCode",
              as: "categoryMaster",
            },
          },
        ]);
      } else if (
        !searchParams.sex &&
        !searchParams.age &&
        searchParams.lastName
      ) {
        persons = await personsModel.aggregate([
          {
            $match: {
              $and: [{ lastName: { $regex: lastName } }],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "fileId",
              foreignField: "_id",
              as: "fileMaster",
            },
          },
          {
            $lookup: {
              from: "masterdatas",
              localField: "fileMaster.category",
              foreignField: "categoryCode",
              as: "categoryMaster",
            },
          },
        ]);
      } else {
        persons = await personsModel.aggregate([
          {
            $match: {
              $and: [
                { lastName: { $regex: lastName } },
                {
                  $or: [{ sex: { $eq: searchParams.sex } }, { age: where.age }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "fileId",
              foreignField: "_id",
              as: "fileMaster",
            },
          },
          {
            $lookup: {
              from: "masterdatas",
              localField: "fileMaster.category",
              foreignField: "categoryCode",
              as: "categoryMaster",
            },
          },
        ]);
      }
      if (persons) {
        res.status(201).send(persons);
      } else {
        res.status(404).send({ message: "No Data found" });
      }
    } else if (!searchParams.lastName && searchParams.name) {
      name = new RegExp(searchParams.name, "i");
      if (searchParams.sex && !searchParams.age) {
        persons = await personsModel.aggregate([
          {
            $match: {
              $and: [
                { name: { $regex: name } },
                {
                  $or: [{ sex: { $eq: searchParams.sex } }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "fileId",
              foreignField: "_id",
              as: "fileMaster",
            },
          },
          {
            $lookup: {
              from: "masterdatas",
              localField: "fileMaster.category",
              foreignField: "categoryCode",
              as: "categoryMaster",
            },
          },
        ]);
      } else if (!searchParams.sex && searchParams.age) {
        persons = await personsModel.aggregate([
          {
            $match: {
              $and: [
                { name: { $regex: name } },
                {
                  $or: [{ age: where.age }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "fileId",
              foreignField: "_id",
              as: "fileMaster",
            },
          },
          {
            $lookup: {
              from: "masterdatas",
              localField: "fileMaster.category",
              foreignField: "categoryCode",
              as: "categoryMaster",
            },
          },
        ]);
      } else if (!searchParams.sex && !searchParams.age && searchParams.name) {
        persons = await personsModel.aggregate([
          {
            $match: {
              $and: [{ name: { $regex: name } }],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "fileId",
              foreignField: "_id",
              as: "fileMaster",
            },
          },
          {
            $lookup: {
              from: "masterdatas",
              localField: "fileMaster.category",
              foreignField: "categoryCode",
              as: "categoryMaster",
            },
          },
        ]);
      } else {
        persons = await personsModel.aggregate([
          {
            $match: {
              $and: [
                { name: { $regex: name } },
                {
                  $or: [{ sex: { $eq: searchParams.sex } }, { age: where.age }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "fileId",
              foreignField: "_id",
              as: "fileMaster",
            },
          },
          {
            $lookup: {
              from: "masterdatas",
              localField: "fileMaster.category",
              foreignField: "categoryCode",
              as: "categoryMaster",
            },
          },
        ]);
      }
      if (persons) {
        res.status(201).send(persons);
      } else {
        res.status(404).send({ message: "No Data found" });
      }
    } else {
      lastName = new RegExp(searchParams.lastName, "i");
      name = new RegExp(searchParams.name, "i");

      const persons = await personsModel.aggregate([
        {
          $match: {
            $and: [
              { name: { $regex: name }, lastName: { $regex: lastName } },
              {
                $or: [
                  { sex: { $eq: searchParams.sex } },
                  { age: where.age },
                  {
                    lastName: { $regex: lastName },
                  },
                ],
              },
            ],
          },
        },
        {
          $lookup: {
            from: "files",
            localField: "fileId",
            foreignField: "_id",
            as: "fileMaster",
          },
        },
        {
          $lookup: {
            from: "masterdatas",
            localField: "fileMaster.category",
            foreignField: "categoryCode",
            as: "categoryMaster",
          },
        },
      ]);
      if (persons) {
        res.status(201).send(persons);
      } else {
        res.status(404).send({ message: "No Data found" });
      }
    }
  } catch (e) {
    res.status(400).send(e.toString());
  }
};

function getSearchParams(searchParams) {
  let where = {};

  // age filter
  if (searchParams.age == "LTT") where.age = { $gte: 0, $lt: 20 };
  if (searchParams.age == "TWTT") where.age = { $gte: 20, $lt: 35 };
  if (searchParams.age == "TWTT") where.age = { $gte: 35, $lt: 50 };
  if (searchParams.age == "FA") where.age = { $gte: 50 };

  console.log("...", where);
  return where;
}

// Used to filter the Surname Result with Place Count and Surname Meaning

exports.searchSurname = async (req, res) => {
  try {
    const searchParams = req.query;
    let lastName = req.query.lastName;
    console.log("search", searchParams);
    // const where = getSearchParams(searchParams);
    let orCondition;
    //let name = new RegExp(searchParams.name, "i");
    // let lastName = new RegExp(searchParams.lastName, "i");

    const personsSurName = await personsModel.aggregate([
      {
        $match: {
          $and: [{ place: { $ne: null } }, { lastName: lastName }],
        },
      },

      // Count all occurrences
      {
        $group: {
          _id: {
            place: "$place",
          },
          count: { $sum: 1 },
        },
      },

      // Sum all occurrences and count distinct
      {
        $group: {
          _id: {
            place: "$_id.place",
          },
          totalCount: { $sum: "$count" },
          // "distinctCount": { "$sum": 1 }
        },
      },
    ]);

    const surnameMeaning = await surnameModel.find({
      surname: { $regex: lastName },
    });
    if (personsSurName) {
      console.log(surnameMeaning);
      const surnameResult = {
        personsSurName: personsSurName,
        surnameMeaning:
          surnameMeaning.length > 0 ? surnameMeaning[0].meaning : "",
      };
      // console.log(persons.length);
      res.status(200).send(surnameResult);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e.toString());
  }
};

exports.updatePersonTranslietration = async (req, res) => {
  try {
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let downloadNewName = req.body.downloadNewName;
    let language = req.body.language;
    let namesArray = [];
    if (downloadNewName === "DNN") {
      namesArray = await updateName(
        downloadNewName,
        language,
        startDate,
        endDate
      );
      // res.status(200).send({
      //     result: namesArray,
      // });
    } else if (downloadNewName === "DNS") {
      namesArray = await updateSurname(
        downloadNewName,
        language,
        startDate,
        endDate
      );
    }
    if (namesArray) {
      res.status(200).send({
        result: namesArray,
      });
    } else {
      res.status(200).send({
        "Data valid": "update data",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.toString());
  }
};
async function updateName(downloadNewName, language, startDate, endDate) {
  if (!_.isEmpty(downloadNewName)) {
    const fileid1 = await filesModel.find({ language: language });
    let newfileid = [];
    _.forEach(fileid1, async function (value) {
      newfileid.push(value._id);
    });
    console.log(newfileid);
    const fileid2 = await personsModel.find({
      $and: [
        { fileId: { $in: newfileid } },
        {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      ],
    });
    console.log("=== fileid2", fileid2);
    _.forEach(fileid2, async function (entry) {
      if (entry.regionalName) {
        const fileid3 = await namesModel.find({
          "translations.value": entry.regionalName,
        });
        let updateNameData = fileid3 && fileid3.length > 0 ? fileid3[0] : "";
        // if(updateNameData.hasOwnProperty('name') === true){
        if (updateNameData) {
          console.log("updateNameData ===", updateNameData);
          let name = !_.isUndefined(updateNameData.name)
            ? updateNameData.name
            : null;
          if (!_.isNull(name)) {
            var updateData = await personsModel.updateMany(
              { _id: entry._id },
              { $set: { name: updateNameData.name } }
            );
          }
          // res.status(200).send(updateData)
          return updateData;
        }
        // }
      }
    });
  }
  // return updateData;
}
async function updateSurname(downloadNewName, language, startDate, endDate) {
  if (!_.isEmpty(downloadNewName)) {
    const fileid1 = await filesModel.find({ language: language });
    let newfileid = [];
    _.forEach(fileid1, async function (value) {
      newfileid.push(value._id);
    });
    console.log(newfileid);
    const fileid2 = await personsModel.find({
      $and: [
        { fileId: { $in: newfileid } },
        {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      ],
    });
    console.log("=== fileid2", fileid2);
    _.forEach(fileid2, async function (entry) {
      if (entry.regionalLastName) {
        const fileid3 = await surnameModel.find({
          "translations.value": entry.regionalLastName,
        });
        let updateSurnameData = fileid3 && fileid3.length > 0 ? fileid3[0] : "";
        if (updateSurnameData) {
          console.log("updateSurnameData ===", updateSurnameData);
          let surname = !_.isUndefined(updateSurnameData.surname)
            ? updateSurnameData.surname
            : null;
          if (!_.isNull(surname)) {
            var updateData = await personsModel.updateMany(
              { _id: entry._id },
              { $set: { lastName: updateSurnameData.surname } }
            );
          }
          // res.status(200).send(updateData)
          return updateData;
        }
      }
    });
  }
}

exports.searchSurnameByCategory = async (req, res) => {
  try {
    category = req.params.category;
    const surnameCategory = await filesModel.aggregate([
      {
        $match: {
          category: category,
        },
      },
      {
        $lookup: {
          from: "persons", // person table name
          localField: "_id", // name of files table field
          foreignField: "fileId", // name of files table field
          as: "inventory_data", // alias for person table
        },
      },
      { $unwind: "$inventory_data" },
      {
        $project: {
          "inventory_data.lastName": 1,
        },
      },
    ]);
    res.status(200).send(surnameCategory);
  } catch (e) {
    res.status(400).send(e.toString());
  }
};
