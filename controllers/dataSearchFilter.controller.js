const surnamesModel = require("../models/surname.model");
const religionModel = require("../models/religion.model");
const communityModel = require("../models/community.model");
const scriptModel = require("../models/script.model");
const mongoose = require("mongoose");
const ObjectsToCsv = require("objects-to-csv");
const multer = require("multer");
const multerS3 = require("multer-s3");
const mime = require("mime");
const ITEM_PER_PAGE = 10;
const _ = require("lodash");
require("dotenv").config();


exports.getSearchFilterData = async (req, res) => {
  try {
    const religions = req.body.religion || [];
    const scripts = req.body.script || [];
    const searchText = req.body.searchText || "";
    const sStatuss = req.body.sStatus || [];
    const assignTo = req.body.assignTo || [];
    const weekOfYear = req.body.weekOfYear || null;

    const matchConditions = {};
    if (religions.length > 0) {
      matchConditions.religion = { $in: religions };
    }
    if (scripts.length > 0) {
      matchConditions.script = { $in: scripts };
    }
    if (sStatuss.length > 0) {
      matchConditions.sStatus = { $in: sStatuss };
    }
    if (assignTo.length > 0) {
      const assignToIds = assignTo.map((id) => mongoose.Types.ObjectId(id));
      matchConditions.assignTo = { $in: assignToIds };
    }
    if (weekOfYear !== null) {
      matchConditions.weekOfYear = weekOfYear;
    }

    const searchQuery = searchText.trim();

    if (
      Object.keys(matchConditions).length === 0 && // No filter options provided
      searchQuery === "" // No search query provided
    ) {
      // Respond with an empty array
      return res.status(200).send([]);
    }

    const filteredUsers = await surnamesModel.aggregate([
      {
        $match: {
          $or: [
            {
              $or: [
                { community: { $regex: searchQuery, $options: "i" } },
                { surname: { $regex: searchQuery, $options: "i" } },
                { meaning: { $regex: searchQuery, $options: "i" } },
              ],
              ...matchConditions,
            },
          ],
        },
      },
    ]);
    res.status(200).send(filteredUsers);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
};
