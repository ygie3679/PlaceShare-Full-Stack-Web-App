const multer = require('multer');
const uuid = require('uuid').v1;

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',

}

const fileUpload = multer({
  //500000 bytes size(500 KB) limit of uploaed image
  limits: 500000,
  //Generate a driver and provide to storage
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      //Set the path where we want to store the images
      cb(null, 'uploads/images')
    },

    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      //Generate a unique random file name with correct extension:
      cb(null, uuid() + '.' + ext);
    }
  }),
  fileFilter: (req, file, cb) => {
    //double ban operator: !!
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error('Invalid mime type!');
    cb(error, isValid);
  }
});

module.exports = fileUpload;