const {param} = require('express-validator');



// checks to make sure that the id provided in the url is valid.
exports.validateAPIids = () =>{
    return param('id').isMongoId().withMessage('Invalid ID format');

};

exports.validateCourseCode = () =>{
    return param('courseCode').matches(/^[a-zA-Z0-9 ]{9}$/).withMessage('Invalid course code format');
}