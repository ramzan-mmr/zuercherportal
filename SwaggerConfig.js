const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "Gyg API",
        version: "1.0.0",
        description: "Scraping and Search APIs for GetYourGuide.com"
    },
    paths: {
        "/api/scrape": {
            get: {
                summary: "Trigger scraping process",
                responses: {
                    "200": {
                        description: "Scraping started successfully"
                    }
                }
            }
        }
    }
};

module.exports = swaggerDocument;
