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


// exports.getSearchFilterData = async (req, res) => {
//   try {
//     const religions = req.body.religion || [];
//     const scripts = req.body.script || [];
//     const searchText = req.body.searchText || "";
//     const sStatuss = req.body.sStatus || [];
//     const assignTo = req.body.assignTo || [];
//     const weekOfYear = req.body.weekOfYear || null;
//     const page = parseInt(req.query.page) || 1; // Get the page number from the request
//     const pageSize = parseInt(req.query.pageSize) || 50;

//     const matchConditions = {};
//     if (religions.length > 0) {
//       matchConditions.religion = { $in: religions };
//     }
//     if (scripts.length > 0) {
//       matchConditions.script = { $in: scripts };
//     }
//     if (sStatuss.length > 0) {
//       matchConditions.sStatus = { $in: sStatuss };
//     }
//     if (assignTo.length > 0) {
//       const assignToIds = assignTo.map((id) => mongoose.Types.ObjectId(id));
//       matchConditions.assignTo = { $in: assignToIds };
//     }
//     if (weekOfYear !== null) {
//       matchConditions.weekOfYear = weekOfYear;
//     }

//     const searchQuery = searchText.trim();

//     if (
//       Object.keys(matchConditions).length === 0 && // No filter options provided
//       searchQuery === "" // No search query provided
//     ) {
//       // Respond with an empty array
//       return res.status(200).send([]);
//     }

//     const filteredUsers = await surnamesModel.aggregate([
//       {
//         $match: {
//           $or: [
//             {
//               $or: [
//                 { community: { $regex: searchQuery, $options: "i" } },
//                 { surname: { $regex: searchQuery, $options: "i" } },
//                 { meaning: { $regex: searchQuery, $options: "i" } },
//               ],
//               ...matchConditions,
//             },
//           ],
//         },
//       },
//         {
//           $lookup: {
//             from: "pdUsers",
//             localField: "assignTo",
//             foreignField: "_id",
//             as: "assignTo",
//           },
//         },
//         {
//           $skip: (page - 1) * pageSize,
//         },
//         {
//           $limit: pageSize,
//         },
      
        
//     ]);
//     const totalCount = await surnamesModel.countDocuments(matchConditions);

//     const totalPages = Math.ceil(totalCount / pageSize);
//     res.status(200).send({
//       totalCount,
//       totalPages,
//       filteredUsers, // Your paginated data
//     });
//   } catch (e) {
//     res.status(400).send(e);
//   }
// };

exports.getSearchFilterData = async (req, res) => {
  try {
    const religions = req.body.religion || [];
    const scripts = req.body.script || [];
    const searchText = req.body.searchText || "";
    const sStatuss = req.body.sStatus || [];
    const assignTo = req.body.assignTo || [];
    const weekOfYear = req.body.weekOfYear || [];
    const aggregationPipeline=[
      
            {
              $match: {
                $or: [
                  { religion: { $in: religions } },
                  { script: { $in: scripts } },
                  { sStatus: { $in: sStatuss } },
                  { assignTo: { $in: assignTo.map((id) => mongoose.Types.ObjectId(id)) } },
                  {weekOfYear: weekOfYear}
                ]
                // Additional match conditions if needed
              },
            }
            
              
                //weekOfYear: {$in:weekOfYear}
          //       community: { $exists: true, $not: { $size: 0 } },
          //       gotra: { $exists: true, $not: { $size: 0 } }
          
            
    ]
    
    
          if (searchText) {
              aggregationPipeline.unshift({
                $search: {
                  index: "fuzzy3",
                  compound: {
                    should: [
                      {
                        autocomplete: {
                          query: searchText,
                          path: "community"
                        }
                      },
                      {
                        autocomplete: {
                          query: searchText,
                          path: "surname"
                        }
                      },
                      {
                        autocomplete: {
                          query: searchText,
                          path: "meaning"
                        }
                      }
                    ]
                  }
                }
              });
            }
            aggregationPipeline.push({
              $lookup: {
                from: "pdUsers", // The name of the collection to join
                localField: "assignTo", // The field from your current collection
                foreignField: "_id", // The field from the "pdUsers" collection
                as: "assignTo", // The name of the output array
              },
            });
            aggregationPipeline.push({
              $project: {
                _id:1,
                community: 1,
                gotra: 1,
                religion: 1,
                script: 1,
                surname: 1,
                sStatus: 1,          
                weekOfYear: 1,
                assignTo: "$assignTo.fname",
                // Add other fields you want to include
              },
            });

            const filteredUsers = await surnamesModel.aggregate(aggregationPipeline);          
    res.status(200).send({filteredUsers, // Your paginated data
    });
  } catch (e) {
    console.log(e)
    res.status(400).send(e);
  }
};

exports.getCountsOfSurname = async (req, res) => {
  try {
    const script = req.body.script;
    const religion = req.body.religion;
    const assignTo = req.body.assignTo;
    const sStatus = req.body.sStatus;
    const weekOfYear=req.body.weekOfYear

    const matchConditions = {};

    if (religion.length > 0) {
      matchConditions.religion = { $in: religion };
    }
    if (script.length > 0) {
      matchConditions.script = { $in: script };
    }
    if (assignTo.length > 0) {
      const assignToIds = assignTo.map((id) => mongoose.Types.ObjectId(id));
      matchConditions.assignTo = { $in: assignToIds };
    }
    if (sStatus.length > 0) {
      matchConditions.sStatus = { $in: sStatus };
    }
    if (weekOfYear.length > 0) {
      matchConditions.weekOfYear = { $in: weekOfYear};
    }

    // Define a variable to store the aggregation pipeline
    let aggregationPipeline = [];

    // Add the match stage
    aggregationPipeline.push({ $match: matchConditions });
    aggregationPipeline.push({
      $lookup: {
      from: "pdUsers", // The name of the collection to join
      localField: "assignTo", // The field from your current collection
      foreignField: "_id", // The field from the "pdUsers" collection
      as: "assignTo", // The name of the output array
    }
  })

    // Combine both facets into a single stage
    aggregationPipeline.push({
      
      $facet: {
        ReligionFacet: [
          {
            $group: {
              _id: "$religion",
              count: { $sum: 1 },
                 }
          }
        ],
           ScriptFacet: [
          {
            $group: {
              _id: "$script",
              count: { $sum: 1 },
                 }
          }
        ],
        AssigntoFacet: [
          {
            $group: {
              _id: "$assignTo.fname",
              count: { $sum: 1 },
              // artists: {
              //   $push: {
              //     name: "$surname",
              //     religion: "$religion",
              //     // Add other fields as needed
              // },
             // },
            },
          },
        ],
        WeekNoFacet: [
          {
            $group: {
              _id: "$weekOfYear",
              count: { $sum: 1 },
              // artists: {
              //   $push: {
              //     name: "$surname",
              //     religion: "$religion",
              //     // Add other fields as needed
              //   },
              // },
            },
          },
        ],
      },
    });

    // Perform the MongoDB aggregation
    const result = await surnamesModel.aggregate(aggregationPipeline);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
};


