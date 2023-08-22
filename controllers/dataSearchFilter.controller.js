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


exports.getSearchFilterData = async(req, res) => {
  try {

    const religions = req.body.religion;
    const scripts = req.body.script;
    const searchText = req.body.searchText;

     
    const matchConditions = {}
    if (religions && religions.length>0) {
      matchConditions.religion = { $in: religions };
    }
    if (scripts && scripts.length>0) {
      matchConditions.script = { $in: scripts};
    }

    const searchQuery = searchText ? searchText.trim() : "";

    

    // If searchQuery has content, add it to the $search compound query
    

    const filteredUsers = await surnamesModel.aggregate([
      {
        
        $match: {
          $or: [
            { community: { $regex: searchQuery, $options: "i" } },
            { surname: { $regex: searchQuery, $options: "i" } },
            { meaning: { $regex: searchQuery, $options: "i" } },
          ],
          ...matchConditions,
        },
      },
      {
        $facet: {
          religionFacet: [
            {
              $group: {
                _id: "$religion",
                count: { $sum: 1 },
                artists: {
                  $push: {
                    name: "$surname",
                    religion: "$religion",
                    script: "$script",
                    community: "$community",
                    kuldevtaFamilyDeity: "$kuldevtaFamilyDeity",
                    alternative: "$alternative",
                    createdBy: "$createdBy",
                    meaning: "$meaning",
                    sStatus: "$sStatus",
                    vansha: "$vansha",
                    veda: "$veda",
                    history: "$history",
                    wikiUrl: "$wikiUrl",
                    translations: "$translations",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt"
                  }
                }
              }
            }
          ],
          scriptFacet: [
            {
              $group: {
                _id: "$script",
                count: { $sum: 1 },
                artists: {
                  $push: {
                    name: "$surname",
                    religion: "$religion",
                    script: "$script",
                    community: "$community",
                    kuldevtaFamilyDeity: "$kuldevtaFamilyDeity",
                    alternative: "$alternative",
                    createdBy: "$createdBy",
                    meaning: "$meaning",
                    sStatus: "$sStatus",
                    vansha: "$vansha",
                    veda: "$veda",
                    history: "$history",
                    wikiUrl: "$wikiUrl",
                    translations: "$translations",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt"
                  }
                }
              }
            }
          ],


      }
      }
    ])
    res.status(200).send(filteredUsers)
  } catch (e) {
    console.log(e)
    res.status(400).send(e)
  }
}
