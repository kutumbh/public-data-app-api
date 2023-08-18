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
      const filteredUsers = await surnamesModel.aggregate([
        {
          $search: {
            index: "fuzzy3",
            compound: {
              should: [
                {
                  autocomplete: {
                    query: searchText, // Use the search text from the request
                    path: "community",
                  },
                },
                {
                  autocomplete: {
                    query: searchText, // Use the search text from the request
                    path: "surname",
                  },
                },
                {
                  autocomplete: {
                    query: searchText, // Use the search text from the request
                    path: "meaning",
                  },
                },
              ],
            },
          },
        },
        {
          $match: {
            religion: { $in: religions },
            script: { $in: scripts },
            // Additional match conditions if needed
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
      // const data = await surnamesModel.find({}).limit(1)
      console.log(filteredUsers)
      res.status(200).send(filteredUsers)

      // res.send(data);
   } catch (e) {
    console.log(e)
        res.status(400).send(e)
    }
}
