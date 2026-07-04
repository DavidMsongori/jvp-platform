const mongoose = require("mongoose");

const migrationMemberSchema = new mongoose.Schema({

    firstName:String,

    middleName:String,

    lastName:String,

    phone:String,

    email:String,

    county:String,

    constituency:String,

    ward:String,

    imported:{
        type:Boolean,
        default:false
    },

    activated:{
        type:Boolean,
        default:false
    },

    duplicate:{
        type:Boolean,
        default:false
    },

    errors:[String]

},{
    timestamps:true
});

module.exports = mongoose.model(
    "MigrationMember",
    migrationMemberSchema
);