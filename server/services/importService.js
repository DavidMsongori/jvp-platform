const XLSX = require("xlsx");

const readExcel = (filePath) => {

    const workbook = XLSX.readFile(filePath);

    const firstSheet = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[firstSheet];

    return XLSX.utils.sheet_to_json(worksheet);

};

module.exports = {

    readExcel,

};