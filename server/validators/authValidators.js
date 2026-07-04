const { body } = require("express-validator");

exports.registerValidation = [
  body("email").isEmail().withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("firstName").notEmpty(),

  body("lastName").notEmpty(),

  body("nationalId").notEmpty(),

  body("phone").notEmpty(),

  body("county").notEmpty(),

  body("dateOfBirth").notEmpty(),
];