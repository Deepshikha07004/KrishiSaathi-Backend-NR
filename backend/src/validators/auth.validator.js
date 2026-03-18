const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    // Use custom validator so length is counted in Unicode characters,
    // not bytes — a Bengali/Hindi name like "রাম" is 2 chars but 6 bytes.
    // isLength() in some validator.js versions counts bytes, breaking
    // multi-byte scripts. [...str].length correctly counts code points.
    .custom((value) => {
      const trimmed = value.trim();
      const charCount = [...trimmed].length;
      if (charCount < 2) {
        throw new Error('Name must be at least 2 characters');
      }
      if (charCount > 100) {
        throw new Error('Name must be 100 characters or fewer');
      }
      return true;
    }),

  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits')
    .isNumeric().withMessage('Phone number must contain digits only')
];

const loginValidator = [
  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 })
    .isNumeric().withMessage('Invalid phone number')
];

module.exports = {
  registerValidator,
  loginValidator
};