const express = require('express');
const cors = require('cors');

const ScrapeRoutes = require('./src/routes/ScrapeRoutes.js');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./SwaggerConfig.js');
const moment = require('moment-timezone');
const schedule = require('node-schedule');
const { ScrapeData } = require('./src/scrapers/gygScraper.js');
const { generateExcel } = require('./src/utils/helper.js');


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
  schedule.scheduleJob(
    { hour: 22, minute: 0, second: 0, tz: 'America/Denver' },
    async () => {
      console.log('Running scheduled Excel generation at 10:00:00 PM Mountain Time');
      try {
        const data = await ScrapeData(); // Fetch fresh data daily
        const result = await generateExcel(data);
        console.log('Scheduled job completed:', result);
      } catch (error) {
        console.error('Scheduled job failed:', error);
      }
    }
  );
  console.log('Excel generation scheduled to run daily at 10:00:00 PM Mountain Time (America/Denver)');
};
scheduleExcelGeneration()

// Connect to MongoDB and Start Server
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
