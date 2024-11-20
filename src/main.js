import { Actor } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';
import { getLinks } from './helpers/links.js';
import { getBodyText } from './helpers/body.js';

await Actor.init();

// Structure of input is defined in input_schema.json
const {
    url = 'https://static-scraper-testing-site.netlify.app',
    maxRequestsPerCrawl = 999,
} = await Actor.getInput() ?? {};

// Counter for discovered pages
let pageCount = 0;

const crawler = new CheerioCrawler({
    maxRequestsPerCrawl,
    async requestHandler({ $, request, enqueueLinks, log }) {
        // Enqueue discovered links
        await enqueueLinks({
            transformRequestFunction(request) {
                // Ignore URLs containing fragments
                const blockedFragments = ['?', '#'];
                if (blockedFragments.some(frag => request.url.includes(frag))) return false;

                // Ignore URLs to media
                const blockedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
                if (blockedExtensions.some(ext => request.url.endsWith(ext))) return false;

                return request;
            },
        });

        // Get page information
        let title = $('title').text() || 'Title not found';
        const links = getLinks($, request.url);

        // Log useful information
        log.info(`${title}`, { url: request.loadedUrl });

        // Increment page count
        pageCount++;

        // Store the data for the current page
        await Dataset.pushData({
            title,
            url: request.loadedUrl,
            links,
        });
    },
});

// Run the crawler
await crawler.run([url]);

// Push metadata after the crawl is complete
await Dataset.pushData({
    url: url,
    totalPages: pageCount,
});

await Actor.exit();
