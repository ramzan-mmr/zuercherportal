const express = require('express');
const cors = require('cors');

const ScrapeRoutes = require('./src/routes/ScrapeRoutes.js');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./SwaggerConfig.js');
const moment = require('moment-timezone');
const schedule = require('node-schedule');
const { ScrapeData } = require('./src/scrapers/gygScraper.js');
const { generateExcel, sendEmail } = require('./src/utils/helper.js');
const { baseUrl } = require('./src/utils/Constant.js');


const app = express();
app.use(express.json());
app.use(cors({
  origin: '*'
}));

// Swagger Setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Serve static files from bucket and excel folders
app.use('/bucket', express.static('bucket'));
app.use('/download_file', express.static('excelFiles'));

// Routes
app.use('/api', ScrapeRoutes);


const scheduleExcelGeneration = () => {
  // Schedule the job to run daily at a specific time (e.g., 02:00 AM server time)
  const rule = new schedule.RecurrenceRule();
  rule.hour = 3;
  rule.minute = 0;
  // rule.tz = 'America/Denver';
  rule.tz = 'Asia/Karachi';

  schedule.scheduleJob(rule, async () => {
    console.log('Running scheduled Excel generation at 22:00 AM daily');
    try {
      const data = await ScrapeData(); // Fetch fresh data
      const result = await generateExcel(data);
      if (result) {
        console.log('Scheduled job completed:', result);
        // Send Email 
        const mailOptions = {
          from: 'info@nomapvt.com',
          to: 'mianmuhammadramzan99@gmail.com',
          subject: 'Inmates Data Excel File',
          text: 'Please find the attached Excel file containing inmates data.',
          attachments: [
            {
              filename: 'inmates.xlsx',
              path: result.url,
            },
          ],
        };
        const mailOptions1 = {
          from: 'info@nomapvt.com',
          to: 'abramneumann@live.com',
          subject: 'Inmates Data Excel File',
          text: 'Please find the attached Excel file containing inmates data.',
          attachments: [
            {
              filename: 'inmates.xlsx',
              path: result.url,
            },
          ],
        };
        sendEmail(mailOptions)
        // sendEmail(mailOptions1)
      }
    } catch (error) {
      console.error('Scheduled job failed:', error);
    }
  });
  console.log('Excel generation scheduled to run daily at 22:00 AM (UTC)');
};
scheduleExcelGeneration();

// Connect to MongoDB and Start Server
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
