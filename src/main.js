import { Actor } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';
import { getLinks } from './helpers/links.js';

await Actor.init();

// Structure of input is defined in input_schema.json
const {
    url = 'https://static-scraper-testing-site.netlify.app',
    maxRequestsPerCrawl = 999,
} = await Actor.getInput() ?? {};

// Counter for discovered pages and storage for pages
let pageCount = 0;
const pages = [];

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

        // Increment page count and add to pages array
        pageCount++;
        pages.push({
            title,
            url: request.loadedUrl,
            links,
        });
    },
});

// Run the crawler
await crawler.run([url]);

// Prepare and push the final dataset structure
const result = {
    url,
    totalPages: pageCount,
    pages,
};

await Dataset.pushData(result);

await Actor.exit();
