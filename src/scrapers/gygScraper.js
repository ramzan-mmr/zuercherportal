// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());
// const { saveImageToBucket } = require('../utils/helper');

// const ScrapeData = async () => {
//   const browser = await puppeteer.launch({
//     headless: 'new',
//     args: ['--no-sandbox', '--disable-setuid-sandbox']
//   });
//   const page = await browser.newPage();

//   try {
//     console.log('Navigating to the page...');
//     await page.goto("https://oglala-pd-sd.zuercherportal.com/#/inmates", { waitUntil: 'networkidle2', timeout: 0 });

//     // Get the current timestamp for Export Date
//     const exportDate = new Date().toISOString();
//     let allInmatesData = [];
//     let pageNumber = 1;
//     let hasNextPage = true;

//     while (hasNextPage) {
//       console.log(`Scraping page ${pageNumber}...`);

//       // Wait for the table body to load
//       try {
//         await page.waitForSelector('tbody.row-group', { timeout: 30000 });
//       } catch (error) {
//         console.log('Table body not found or timed out. Ending scrape for this URL.');
//         break; 
//       }

//       // Scrape the table data for the current page
//       const pageData = await page.evaluate((exportDate, pageNumber) => {
//         const inmates = [];
//         const rows = document.querySelectorAll('tbody.row-group');

//         rows.forEach((row, index) => {
//           const name = row.querySelector('td[ordered-tag="name"]')?.textContent.trim() || '';
//           const holdReasons = row.querySelector('div[ng-bind-html="i.hold_reasons"]')?.innerHTML || '';
//           const imageUrl = row.querySelector('img[ng-src]')?.getAttribute('ng-src') || '';

//           // Split hold_reasons into individual entries and clean them
//           const chargeEntries = holdReasons.split('<br>').filter(entry => entry.trim() !== '');
//           let arrestDate = '';

//           // Extract the first arrest date
//           for (const entry of chargeEntries) {
//             const arrestDateMatch = entry.match(/Arrest Date (\d{2}\/\d{2}\/\d{4})/);
//             if (arrestDateMatch && !arrestDate) {
//               arrestDate = arrestDateMatch[1].trim();
//               break;
//             }
//           }

//           // Join all hold_reasons entries into a single string for Charges
//           const chargesText = chargeEntries.join('; ');

//           inmates.push({
//             id: (pageNumber - 1) * 51 + index + 1,
//             Export_Date: exportDate,
//             Name: name,
//             Arrest_Date: arrestDate,
//             Charges: chargesText,
//             Image_Url: imageUrl
//           });
//         });

//         return inmates;
//       }, exportDate, pageNumber);

//       // Save images and update Image_Url
//       for (const item of pageData) {
//         if (item.Image_Url && item.Image_Url.startsWith('data:image/png;base64,')) {
//           item.Image_Url = saveImageToBucket(item.Image_Url, item.id);
//         }
//       }

//       // Append current page data to the overall array
//       allInmatesData = allInmatesData.concat(pageData);

//       // Check if there is a next page
//       const nextButton = await page.$('button[ng-click="nextResults()"]');
//       hasNextPage = nextButton ? !(await (await nextButton.getProperty('disabled')).jsonValue()) : false;

//       if (hasNextPage) {
//         console.log('Clicking Next button...');
//         await Promise.all([
//           page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 1000 }).catch(() => { }),
//           nextButton.click()
//         ]);
//         pageNumber++;
//       }
//     }

//     await browser.close();
//     return allInmatesData;
//   } catch (error) {
//     console.error('Error during scraping:', error);
//     await browser.close();
//     throw error;
//   }
// };

// module.exports = { ScrapeData };




const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-extra');               // puppeteer-extra bundle
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { saveImageToBucket } = require('../utils/helper');


const ScrapeData = async () => {
  // note: we pass chromium.executablePath, chromium.args, chromium.headless
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    executablePath: await chromium.executablePath, 
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport,
  });

  const page = await browser.newPage();
  try {
    console.log('Navigating to the page...');
    await page.goto("https://oglala-pd-sd.zuercherportal.com/#/inmates", { waitUntil: 'networkidle2', timeout: 0 });

    // Get the current timestamp for Export Date
    const exportDate = new Date().toISOString();
    let allInmatesData = [];
    let pageNumber = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(`Scraping page ${pageNumber}...`);

      // Wait for the table body to load
      try {
        await page.waitForSelector('tbody.row-group', { timeout: 30000 });
      } catch (error) {
        console.log('Table body not found or timed out. Ending scrape for this URL.');
        break;
      }

      // Scrape the table data for the current page
      const pageData = await page.evaluate((exportDate, pageNumber) => {
        const inmates = [];
        const rows = document.querySelectorAll('tbody.row-group');

        rows.forEach((row, index) => {
          const name = row.querySelector('td[ordered-tag="name"]')?.textContent.trim() || '';
          const holdReasons = row.querySelector('div[ng-bind-html="i.hold_reasons"]')?.innerHTML || '';
          const imageUrl = row.querySelector('img[ng-src]')?.getAttribute('ng-src') || '';

          // Split hold_reasons into individual entries and clean them
          const chargeEntries = holdReasons.split('<br>').filter(entry => entry.trim() !== '');
          let arrestDate = '';

          // Extract the first arrest date
          for (const entry of chargeEntries) {
            const arrestDateMatch = entry.match(/Arrest Date (\d{2}\/\d{2}\/\d{4})/);
            if (arrestDateMatch && !arrestDate) {
              arrestDate = arrestDateMatch[1].trim();
              break;
            }
          }

          // Join all hold_reasons entries into a single string for Charges
          const chargesText = chargeEntries.join('; ');

          inmates.push({
            id: (pageNumber - 1) * 51 + index + 1,
            Export_Date: exportDate,
            Name: name,
            Arrest_Date: arrestDate,
            Charges: chargesText,
            Image_Url: imageUrl
          });
        });

        return inmates;
      }, exportDate, pageNumber);

      // Save images and update Image_Url
      for (const item of pageData) {
        if (item.Image_Url && item.Image_Url.startsWith('data:image/png;base64,')) {
          item.Image_Url = saveImageToBucket(item.Image_Url, item.id);
        }
      }

      // Append current page data to the overall array
      allInmatesData = allInmatesData.concat(pageData);

      // Check if there is a next page
      const nextButton = await page.$('button[ng-click="nextResults()"]');
      hasNextPage = nextButton ? !(await (await nextButton.getProperty('disabled')).jsonValue()) : false;

      if (hasNextPage) {
        console.log('Clicking Next button...');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 1000 }).catch(() => { }),
          nextButton.click()
        ]);
        pageNumber++;
      }
    }

    await browser.close();
    return allInmatesData;
  } catch (error) {
    console.error('Error during scraping:', error);
    await browser.close();
    throw error;
  }
};


module.exports = { ScrapeData };