
const path = require('path')
const fs = require("fs")
const ExcelJS = require("exceljs")
const nodemailer = require('nodemailer');
const { baseUrl } = require('./Constant');
const moment = require('moment-timezone');

// Ensure bucket folder exists
const bucketDir = path.join(__dirname, '../../bucket');
if (!fs.existsSync(bucketDir)) {
  fs.mkdirSync(bucketDir);
}

// Save base64 image to bucket and return URL
const saveImageToBucket = (base64Data, id) => {
  try {
    // Extract base64 content (remove "data:image/png;base64," prefix)
    const base64Content = base64Data.replace(/^data:image\/png;base64,/, '');
    const filename = `${id}.png`;
    const imagePath = path.join(bucketDir, filename);

    fs.writeFileSync(imagePath, base64Content, 'base64');

    return `${baseUrl}bucket/${filename}`;
  } catch (error) {
    console.error(`Error saving image for ID ${id}:`, error.message);
    return '';
  }
};

// Generate Excel file and return its URL
const generateExcel = async (data) => {
  // 1) Create workbook + sheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Inmates");

  // 2) Define your columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Export Date', key: 'Export_Date', width: 20 },
    { header: 'Name', key: 'Name', width: 40 },
    { header: 'Arrest Date', key: 'Arrest_Date', width: 15 },
    { header: 'Charges', key: 'Charges', width: 60 },
    { header: 'Image URL', key: 'Image_Url', width: 50 },
  ];

  // 3) Add your data rows
  data.forEach((item, index) => {
    // const date = new Date(item.Export_Date);
    // const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    const date = moment.tz(item.Export_Date, 'UTC');
    const formattedDate = date.tz('America/Denver').format('YYYY-MM-DD HH:mm:ss');

    const row = worksheet.addRow({
      id: item.id,
      Export_Date: formattedDate,
      Name: item.Name,
      Arrest_Date: item.Arrest_Date,
      Charges: item.Charges,
      Image_Url: item.Image_Url,
    });

    // Make Image_Url a hyperlink
    if (item.Image_Url && item.Image_Url.startsWith('http')) {
      const cell = row.getCell('Image_Url');
      cell.value = {
        text: item.Image_Url,
        hyperlink: item.Image_Url,
        tooltip: 'Click to view image'
      };
      cell.style = { font: { color: { argb: 'FF0000FF' }, underline: true } }; // Blue, underlined text
    }
  });

  const excelDir = path.resolve(__dirname, "../../excelFiles");
  fs.mkdirSync(excelDir, { recursive: true });
  const filename = "excelFiles/inmates.xlsx";
  const excelPath = path.join(excelDir, "inmates.xlsx");
  if (fs.existsSync(excelPath)) {
    fs.unlinkSync(excelPath);
    console.log('✔ Old file deleted:', excelPath);
  }
  await workbook.xlsx.writeFile(filename);

  let url = `${baseUrl}${filename}`

  // 6) Return for your API
  return {
    path: excelPath,
    url: url,
    filename: filename
  };
};

const sendEmail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'server215.web-hosting.com',
      port: 465,
      secure: true,
      auth: {
        user: 'info@abramneumann.com',
        pass: '3,.EW4oYS-jI',
      },
      tls: {
        rejectUnauthorized: false
      },
    });
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      }
      resolve(info);
    });
  });
};



module.exports = { saveImageToBucket, generateExcel, sendEmail };
