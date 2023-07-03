const userModel = require("../models/user.model");
// const filesModel = require('../models/reposFiles.model');
const fileSourceModel = require("../models/fileSource.model");

exports.createUser = async ({ body }, res) => {
  try {
    const userData = new userModel(body);
    if (userData) {
      await userData.save();
      res.status(201).send(userData);
    } else {
      res.status(404).send({
        message: "Data found!",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

// --------------------------------- API GET All PERSONS DATA -------------
exports.getAllUsers = async (req, res) => {
  try {
    // var id = req.params.pId;
    const userData = await userModel.find();
    if (userData) {
      res.status(201).send(userData);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

// --------------------------------- API GET ONE PERSON DATA -------------
exports.getUserDetails = async (req, res) => {
  try {
    const uname = req.params.uname;
    console.log("uname:", uname);
    const userData = await userModel
      .find({ uname: uname })
      .populate("role")
      .populate("catAllocated")
      .populate("psAllocated");
    console.log(userData);
    if (userData) {
      const fsData = await fileSourceModel.aggregate([
        {
          $match: {
            _id: {
              $in: userData[0].fsAllocated,
            },
          },
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
      ]);
      fsData.filter((data, i) => {
        fsData[i] = {
          _id: data._id,
          fileName: data.fileNames[0].categoryName,
          fileNameCode: data.fileName,
          fileSource: data.fileSources[0].categoryName,
          fileSourceCode: data.fileSource,
          fileType: data.fileTypes[0].categoryName,
          fileTypeCode: data.fileType,
          language: data.languages[0].categoryName,
          languageCode: data.language,
          fileNameConvention: data.fileNameConvention,
          fileSourceLabel: `${data.fileNames[0].categoryName}-${data.fileSources[0].categoryName}-${data.languages[0].categoryName}`,
        };
      });
      let result = [];
      const role = userData[0].role.map((data) => {
        return data.categoryCode;
      });
      const data = userData[0];
      data.catAllocated.push({
        categoryCode: "ALL",
        categoryName: "All",
      });
      result[0] = {
        catAllocated: data.catAllocated,
        fsAllocated: fsData,
        psAllocated: data.psAllocated,
        createdBy: data.createdBy,
        _id: data._id,
        fname: data.fname,
        lname: data.lname,
        uname: data.uname,
        role: data.role,
        roleCode: role,
      };
      res.status(201).send(result);
      // res.status(201).send(userData)
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e.toString());
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.userId;
    console.log("userId:", id);
    const user = await userModel.remove({ _id: id });
    if (user) {
      res.status(201).send({ message: "User deleted successfully" });
    } else {
      res.status(404).send({
        message: "Data not found!",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.updateUserDetails = async (req, res) => {
  try {
    console.log(req.body);
    const id = req.params.id;
    console.log("id:", id);
    const user = await userModel.findByIdAndUpdate({ _id: id }, req.body, {
      new: true,
    });
    if (user) {
      res.status(201).send(user);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
