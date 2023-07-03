//const professionModel = require('../models/profession.model')
const _ = require('lodash');
const aws = require('aws-sdk')
aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION,
})

const multer = require('multer')
//const multerS3 = require('multer-s3')
const multerS3 = require('multer-s3-transform')
const sharp = require('sharp');
const mime = require('mime')
const { Mongoose } = require('mongoose')
const urlParse = require("url")
var mongoose = require('mongoose');

const tagModel = require("./tag.model");
const assetModel = require("./asset.model");
const s3 = new aws.S3()


const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'
        || file.mimetype === 'video/mp4' || file.mimetype === 'video/x-msvideo'
        || file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mid' || file.mimetype === 'audio/mp4'
        || file.mimetype === 'video/3gp') {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type, upload valid file only!'), false)
    }
}

exports.upload = async (req, res) =>{
       
    try {
        const { section = 'general' } = req.query
        const upload = multer({
            fileFilter,
            // limits: {​​​​​fileSize: 1024*5}​​​​​,
            storage: multerS3({
                // acl: 'public-read',
                contentType: multerS3.AUTO_CONTENT_TYPE,
                s3,
                // limits: {​​​​​fileSize: 1024*5}​​​​​,
                contentLength: 50000000, //50 MB file size
                bucket: //process.env.BUCKET_NAME,
                   async function (req, file, cb) {
                        const assetId = req.params.id;
                       // const assetDbObj = new assetModel({ assetName: file.originalname, assetType: "IMG", fileType:file.mimetype, assetPath:"/" + file.originalname});
                       const assetDbObj = { assetName: file.originalname, assetType: "IMG", fileType:file.mimetype, assetPath:"/" + file.originalname};
                        if(assetId == '-1')
                          assetObj = await new assetModel(assetDbObj).save();
                        else{
                          const assetUpdate = await assetModel.updateOne({_id:assetId}, assetDbObj, {upsert: true});

                          assetObj = await assetModel.findOne({_id:assetId});
                        }

                          console.log("asset details ", assetObj);

                        var bktName = process.env.AWS_BUCKET_NAME_ASSETS + "/" + "assets" + "/" + assetObj._id + "/" + file.originalname

                        cb(null, bktName)
                    },
                shouldTransform: function (req, file, cb) {
                    cb(null, /^image/i.test(file.mimetype))
                },
                transforms: [{
                    id: 'original',
                    key: function (req, file, cb) {
                        console.log("Adding key")
                        //const filename = Date.now().toString() + '_' + file.originalname //+ '.' + mime.getExtension(file.mimetype);
                        cb(null, file.originalname)
                    },
                    metadata(req, file, cb) {
                        console.log("Adding metadata")
                        cb(null, { fieldName: file.fieldname })
                    },                        
                    transform: function (req, file, cb) {
                        cb(null, sharp().jpeg({ mozjpeg: true }))
                    }
                    }, 
                    {
                    id: 'thumbnail',
                    key: function (req, file, cb) {
                        console.log("Adding key")
                        //const filename = Date.now().toString() + '_' + file.originalname+"-thumbnail" //+ '.' + mime.getExtension(file.mimetype);
                        const filename = file.originalname+"-thumbnail"
                        cb(null, filename)
                    },
                    metadata(req, file, cb) {
                        console.log("Adding metadata")
                        cb(null, { fieldName: file.fieldname })
                    },                    
                    transform: function (req, file, cb) {
                        cb(null, sharp().resize(350, 250).jpeg())
                    }
                    },
                    {
                        id: 'mid',
                        key: function (req, file, cb) {
                            console.log("Adding key")
                            //const filename = Date.now().toString() + '_' + file.originalname+"-thumbnail" //+ '.' + mime.getExtension(file.mimetype);
                            const filename = file.originalname+"-mid";
                            cb(null, filename)
                        },
                        metadata(req, file, cb) {
                            console.log("Adding metadata")
                            cb(null, { fieldName: file.fieldname })
                        },                    
                        transform: function (req, file, cb) {
                            cb(null, sharp().resize(370, 350).jpeg())
                        }
                    },
                ]  
                 
            })
        })
        
        const multipleUpload = upload.array('image')
        multipleUpload(req, res, async (err) => {
            try {
                if (err) {
                    console.log(err)
                    return res.status(422).send({
                        errors: [{ title: 'Media Upload Error', detail: err.message }]
                    })
                }
                if (req.files) {
                  
                    res.status(201).send(await getSignedUrlForPreview(assetObj));
                } else {
                    return res.status(422).send('Error')
                }
            } catch (e) {
                console.log(e)
                res.status(400).send(e)
            }
        })

    } catch (e) {
        res.status(400).send(e)
    }
}
//upload an array of media to S3
exports.assetUpload = async (req, res) => {
    var assetObj;
    
    try {
        const { section = 'general' } = req.query
      
        const upload = multer({
            fileFilter,
            // limits: {​​​​​fileSize: 1024*5}​​​​​,
            storage: multerS3({
                // acl: 'public-read',
                contentType: multerS3.AUTO_CONTENT_TYPE,
                s3,
                // limits: {​​​​​fileSize: 1024*5}​​​​​,
                contentLength: 50000000, //50 MB file size
                bucket: //process.env.BUCKET_NAME,
                   async function (req, file, cb) {
                        const queryParams = req.params;
                        const assetTitle = req.params.assetTitle;
                        const tagList = req.params.tags.split(",");                        
                        const assetDbObj = new assetModel({assetTitle:assetTitle, tagNames: tagList, assetName: file.originalname, assetType: "IMG", fileType:file.mimetype, assetPath:"/" + file.originalname});

                        assetObj = await assetDbObj.save();
                        var bktName = process.env.AWS_BUCKET_NAME_ASSETS + "/" + "assets" + "/" + assetObj._id + "/" + file.originalname

                        cb(null, bktName)
                    },
                shouldTransform: function (req, file, cb) {
                    cb(null, /^image/i.test(file.mimetype))
                },
                transforms: [{
                    id: 'original',
                    key: function (req, file, cb) {
                        console.log("Adding key")
                        //const filename = Date.now().toString() + '_' + file.originalname //+ '.' + mime.getExtension(file.mimetype);
                        cb(null, file.originalname)
                    },
                    metadata(req, file, cb) {
                        console.log("Adding metadata")
                        cb(null, { fieldName: file.fieldname })
                    },                        
                    transform: function (req, file, cb) {
                        cb(null, sharp().jpeg({ mozjpeg: true }))
                    }
                    }, 
                    {
                    id: 'thumbnail',
                    key: function (req, file, cb) {
                        console.log("Adding key")
                        //const filename = Date.now().toString() + '_' + file.originalname+"-thumbnail" //+ '.' + mime.getExtension(file.mimetype);
                        const filename = file.originalname+"-thumbnail"
                        cb(null, filename)
                    },
                    metadata(req, file, cb) {
                        console.log("Adding metadata")
                        cb(null, { fieldName: file.fieldname })
                    },                    
                    transform: function (req, file, cb) {
                        cb(null, sharp().resize(350, 250).jpeg())
                    }
                    },
                    {
                        id: 'mid',
                        key: function (req, file, cb) {
                            console.log("Adding key")
                            //const filename = Date.now().toString() + '_' + file.originalname+"-thumbnail" //+ '.' + mime.getExtension(file.mimetype);
                            const filename = file.originalname+"-mid";
                            cb(null, filename)
                        },
                        metadata(req, file, cb) {
                            console.log("Adding metadata")
                            cb(null, { fieldName: file.fieldname })
                        },                    
                        transform: function (req, file, cb) {
                            cb(null, sharp().resize(350, 250).jpeg())
                        }
                    },
                ]  
                 
            })
        })
       
        const multipleUpload = upload.array('image')
        multipleUpload(req, res, async (err) => {
            try {
                if (err) {
                    console.log(err)
                    return res.status(422).send({
                        errors: [{ title: 'Media Upload Error', detail: err.message }]
                    })
                }
                if (req.files) {
                    let allFiles = []
                    req.files.forEach((file)=>{
                        if(file.transforms && file.transforms.length > 0){
                            file.transforms.forEach(transformed => {
                                var key = transformed.key.split('.').slice(0, -1).join('.')
                                allFiles.push({ imageUrl: transformed.location, key: key })
                            })
                            
                        } 
                        // var key = file.key.split('.').slice(0, -1).join('.')
                        // allFiles.push({ imageUrl: file.location, key: key })                       
                        
                    });
                    res.json(allFiles);
                } else {
                    return res.status(422).send('Error')
                }
            } catch (e) {
                console.log(e)
                res.status(400).send(e)
            }
        })

    } catch (e) {
        res.status(400).send(e)
    }
}


exports.viewImage = async (req, res) => {
    // router.get('/viewImage', (req, res) => {
    try {
        const url = getSignedUrl(req.query.file)
        // user.find({_id:id})
        // const key = url.split('/')[3] + '/' + url.split('/')[4];
        return res.json({ imageUrl: url })
    } catch (e) {
        res.status(400).send(e)
    }
}


exports.getAssetById = async(req, res) => {
    const id = req.params.id;
    try {

        const asset = await assetModel.find({_id:id});

        if (asset) {        
           //let signedAssets = await getSignedUrlList(assets);
            res.status(200).send(asset)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        } 
        
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.deleteAsset = async(req, res) => {
        const { id } = req.params;
        console.log("delete req param ", id, req.body);
        if (!(id && id.length>0)) { 
            res.status(404).send({
                message: "Not able to delete!" 
            })
            return;
        }

        try {
            const deleteAssetResult = await assetModel.deleteOne({_id:id});
    
            if (deleteAssetResult.deletedCount == 1) {        
                res.status(200).send({isDeleted:true})
            } else {
                res.status(404).send({
                    message: "Not able to delete!",isDeleted:false
                })
            } 
            
        } catch (e) {
            res.status(400).send(e)
        }
}

exports.getAssets = async(req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const userEmail = req.query.userEmail;
    const skipIndex = (page - 1) * limit;

    console.log("skip Index ..", skipIndex, page, limit, userEmail);

    try {
        const assets = await assetModel.find({createdByUser:userEmail}).sort({ updatedAt: -1}).limit(limit).skip(skipIndex);

        if (assets) {        
           let signedAssets = await getSignedUrlList(assets);
            res.status(200).send(signedAssets)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        } 
        
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.updateAsset = async (req, res) => {
    const { tagNames, _id, assetSource, remark, personNames,user }= req.body;
    

     if (!(_id && tagNames &&  tagNames.length>0)) { 
        res.status(404).send({
            message: "No Data Found!" 
        })
        return;
    }

    const filter = {_id:this._id};
     try {
        const options = { upsert: true };
        const result =  await assetModel.updateOne({_id:_id}, {assetSource, remark, tagNames, personNames, createdByUser:user.email}, options);

        if (result && result.nModified >= 1) {        
            //let signedAssets = await getSignedUrlList(assets);
            console.log(
                `${result.matchedCount} document(s) matched the filter, updated ${result.nModified} document(s)`,
              );
             res.status(200).send(true);
         } else {
             res.status(404).send({
                 message: "No Data Found!"
             })
         } 

    } catch (e) {
        console.log("exception ..", e);
        res.status(400).send(e)
    } 

}
exports.assetSearchByTags = async (req, res) => {
    const { tags }= req.body;

    if (!(tags &&  tags.length>0)) { 
        res.status(404).send({
            message: "No Data Found!"
        })
        return;
    }

    try {
       
        const assets =  await assetModel.find({tagNames:{$all:tags}});

        if (assets && assets.length > 0) {        
            let signedAssets = await getSignedUrlList(assets);
             res.status(200).send(signedAssets);
         } else {
             res.status(404).send({
                 message: "No Data Found!"
             })
         } 

    } catch (e) {
        console.log("exception ..", e);
        res.status(400).send(e)
    }

}


exports.search = async (req, res) => {
    const { searchText }= req.body;

    console.log("search by Tag", searchText);
    
  
    if (!(searchText &&  searchText.length>0)) { 
        res.status(404).send({
            message: "No Data Found!"
        })
        return;
    }

    try {
       //let searchInput = '"\"+searchText+\""';
        const assets =  await assetModel.find({ $text: { $search: searchText }});

        if (assets && assets.length > 0) {        
            let signedAssets = await getSignedUrlList(assets);
             res.status(200).send(signedAssets);
         } else {
             res.status(404).send({
                 message: "No Data Found!"
             })
         } 

    } catch (e) {
        console.log("exception ..", e);
        res.status(400).send(e)
    }

}

exports.getTags = async(req, res) => {
    try {
        const assets = await assetModel.find().sort({ updatedAt: -1});
        const tagSet = new Set();

        if (assets) {  
            console.log(assets)
            assets.forEach(function(a){
                console.log(a.tagNames);
                
                if(a.tagNames){
                    a.tagNames.forEach(function(t){
                        tagSet.add(t);
                    });
                }
                    
            });
            console.log(tagSet);
            res.status(200).send(Array.from(tagSet))
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        } 
        
    } catch (e) {
        res.status(400).send(e)
    }
}

async function getSignedUrlList(assets) {

    try {
        
          await Promise.all(assets.map(async (a) => {
              console.log(a)
            const signedUrlThumbnail = await s3.getSignedUrl("getObject", {
                Bucket: process.env.AWS_BUCKET_NAME_ASSETS,
                Key: 'assets/'+a._id+a.assetPath+a.assetPath+'-thumbnail',
                Expires: 604800 // Expire 7 days   //on 
    
            })

            const signedUrlMid = await s3.getSignedUrl("getObject", {
                Bucket: process.env.AWS_BUCKET_NAME_ASSETS,
                Key: 'assets/'+a._id+a.assetPath+a.assetPath+'-mid',
                Expires: 604800 // Expire 7 days   //on 
    
            })

            const signedUrl = await s3.getSignedUrl("getObject", {
                Bucket: process.env.AWS_BUCKET_NAME_ASSETS,
                Key: 'assets/'+a._id+a.assetPath+a.assetPath,
                Expires: 604800 // Expire 7 days   //on 
    
            })
            a.assetPath =signedUrlThumbnail;
            a.url =signedUrl;
            a.renditionPaths.push(signedUrl)
            a.renditionPaths.push(signedUrlThumbnail)
            a.renditionPaths.push(signedUrlMid);
          }));
          return assets;
    } catch (e) {
        console.log("Error", e.toString())
        return e
    }
}


async function getSignedUrlForPreview(a) {

    try {
        
        const signedUrlMid = await s3.getSignedUrl("getObject", {
            Bucket: process.env.AWS_BUCKET_NAME_ASSETS,
            Key: 'assets/'+a._id+a.assetPath+a.assetPath+"-mid",
            Expires: 604800 // Expire 7 days   //on 

        })
        const signedUrl = await s3.getSignedUrl("getObject", {
            Bucket: process.env.AWS_BUCKET_NAME_ASSETS,
            Key: 'assets/'+a._id+a.assetPath+a.assetPath,
            Expires: 604800 // Expire 7 days   //on 

        })
        a.assetPath =signedUrlMid;
        a.renditionPaths.push(signedUrl);
        a.renditionPaths.push(signedUrlMid);
          return a;
    } catch (e) {
        console.log("Error", e.toString())
        return e
    }
}


