const Member = require("../models/Member");

const {

    readExcel,

} = require("../services/importService");

const importMembers = async(req,res)=>{

    try{

        const rows = readExcel(

            req.file.path

        );

        let imported = 0;

        let duplicates = 0;

        for(const row of rows){

            const exists = await Member.findOne({

                phone:row.phone

            });

            if(exists){

                duplicates++;

                continue;

            }

            await Member.create({

                firstName:row.firstName,

                middleName:row.middleName,

                lastName:row.lastName,

                phone:row.phone,

                email:row.email,

                county:row.county,

                legacyMember:true,

                activationStatus:"Not Activated",

                membershipStatus:"Active"

            });

            imported++;

        }

        res.json({

            success:true,

            imported,

            duplicates

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

module.exports={

    importMembers

};