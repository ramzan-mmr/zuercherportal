const express = require('express');
const router = express.Router();
const {ScrapeData } = require('../scrapers/gygScraper');
const fs  = require('fs');
const { generateExcel } = require('../utils/helper');

// Get /api/scrape
router.get('/scrape', async (req, res) => {
  try {
    const result = await ScrapeData();
    if (result.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    // ←── change here ──→
    const { path: excelPath, url } = await generateExcel(result);

    res.download(excelPath, 'inmates.xlsx', err => {
      if (err) {
        console.error('Error sending file:', err);
        return res.status(500).json({ status: 'error', message: 'File download error' });
      }
    });

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    res.status(500).json({ error: 'Scraping failed', details: error.message });
  }
});



module.exports = router;
