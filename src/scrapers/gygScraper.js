const axios = require('axios');
const { saveImageToBucket } = require('../utils/helper');

const ScrapeData = async () => {
  try {
    const exportDate = new Date().toISOString();
    const allInmatesData = [];
    const seenNames = new Set(); // Track unique names to avoid duplicates
    let start = 0;
    const pageSize = 50;
    let totalRecords = 0; // Initialize to 0, update after first request
    let pageNumber = 1;
    const arrestDateRegex = /Arrest Date (\d{2}\/\d{2}\/\d{4})/;

    while (allInmatesData.length < totalRecords || (pageNumber === 1 && totalRecords === 0)) {
      console.log(`Fetching page ${pageNumber} (start: ${start})...`);

      const response = await axios.post(
        'https://oglala-pd-sd.zuercherportal.com/api/portal/inmates/load',
        {
          held_for_agency: 'any',
          in_custody: new Date().toISOString(),
          paging: {
            count: pageSize,
            start: start
          },
          sorting: {
            sort_by_column_tag: 'name',
            sort_descending: false
          }
        }
        
      );

      const records = response.data.records || [];
      totalRecords = response.data.total_record_count || 0;

      // Validate API response
      if (!Array.isArray(records)) {
        throw new Error(`Invalid records format on page ${pageNumber}`);
      }
      if (typeof totalRecords !== 'number') {
        throw new Error(`Invalid total_record_count on page ${pageNumber}`);
      }

      if (pageNumber === 1 && totalRecords === 0) {
        console.log('No total_record_count provided or no records available.');
        break;
      }

      if (records.length === 0) {
        console.log(`No records returned for page ${pageNumber}, ending fetch.`);
        break;
      }

      // Process records
      const pageData = records
        .filter((item) => {
          const name = item.name || '';
          if (seenNames.has(name)) {
            console.log(`Skipping duplicate record: ${name}`);
            return false;
          }
          seenNames.add(name);
          return true;
        })
        .map((item, index) => {
          const chargeEntries = item.hold_reasons.split('<br>').filter(entry => entry.trim());
          let arrestDate = item.arrest_date || '';

          if (!arrestDate) {
            for (const entry of chargeEntries) {
              const match = entry.match(arrestDateRegex);
              if (match) {
                arrestDate = match[1];
                break;
              }
            }
          }

          const chargesText = chargeEntries.join('; ');
          let imageUrl = item.mugshot ? `data:image/png;base64,${item.mugshot}` : '';

          if (imageUrl.startsWith('data:image/png;base64,')) {
            imageUrl = saveImageToBucket(imageUrl, allInmatesData.length + index + 1);
          }

          return {
            id: allInmatesData.length + index + 1,
            Export_Date: exportDate,
            Name: item.name || '',
            Arrest_Date: arrestDate,
            Charges: chargesText,
            Image_Url: imageUrl
          };
        });

      allInmatesData.push(...pageData);

      console.log(`Page ${pageNumber}: Fetched ${records.length}, Unique ${pageData.length}, Total ${allInmatesData.length}/${totalRecords}`);

      start += pageSize;
      pageNumber++;

      if (allInmatesData.length >= totalRecords) {
        break;
      }
    }

    console.log(`Completed: ${allInmatesData.length} unique records fetched.`);
    return allInmatesData;
  } catch (error) {
    console.error(`API scraping failed at page ${pageNumber}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

module.exports = { ScrapeData };