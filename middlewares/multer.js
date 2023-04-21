const multer = require('multer');


//uploads product img
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/product-img");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const uploadMultiple = multer({ storage: multerStorage }).fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }])

//uploads category img
const multerStorageCategory = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/category-img");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const uploadSingleFile = multer({ storage: multerStorageCategory }).fields([{ name: 'image', maxCount: 1 }])

//uploads banner img
const multerStorageBanner = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/banner-img");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const uploadTwoBanner = multer({ storage: multerStorageBanner }).fields([{ name: 'largeImg', maxCount: 1 }, { name: 'smallImg', maxCount: 1 }])


module.exports = {
  uploadMultiple, uploadSingleFile, uploadTwoBanner
}