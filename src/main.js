// For more information, see https://crawlee.dev/
import { Actor } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';
import { getTitle } from './helpers/title.js'
import { getLinks } from './helpers/links.js'
import { getIFrames } from './helpers/iFrames.js'
import { getTables } from './helpers/tables.js'
import { getScripts } from './helpers/scripts.js'
import { getBodyText } from './helpers/body.js'
import { getWordcount } from './helpers/count.js'

await Actor.init();
const input = await Actor.getInput();

const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 1000,

    async requestHandler({ $, request, enqueueLinks }) {
        // Enqueue discovered links.
        // The default behavior of enqueueLinks is to stay on the same hostname.
        await enqueueLinks({
            transformRequestFunction(req) {
                // Ignore urls containing fragments
                // if (req.url.includes('?')) return false;
                if (req.url.includes('#')) return false;

                // Ignore urls to media
                if (req.url.endsWith('.pdf')) return false;
                if (req.url.endsWith('.jpg')) return false;
                if (req.url.endsWith('.jpeg')) return false;
                if (req.url.endsWith('.png')) return false;
                return req;
            },
        });

        // Get page information
        let title = $('title').text();
        if (title === '') {
            title = 'Title not found'
        }
        
        const links = getLinks($, request.url)

        const iframes = getIFrames($)

        const scripts = getScripts($)

        const tables = getTables($) 

        const body = getBodyText($)

        const wordcount = getWordcount(body)

        let redirected = false;
        if (request.url != request.loadedUrl) {
            redirected = true;
        }

        // Log anything that might be useful to see during crawl.
        // console.log(`Found ${wordcount} words on ${request.loadedUrl}.`);
        // console.log('html: ', $.text())
        // console.log('Scripts: ', scripts)
        // console.log('IFrames: ', iframes)
        // console.log('Tables: ', tables)
        // console.log(`Links: `, links);

        // Store the data
        await Dataset.pushData({
            // http_status: status,
            title: title,
            wordcount: wordcount,
            redirected: redirected,
            requested_url: request.url,
            url: request.loadedUrl,
            scripts: scripts,
            iframes: iframes,
            links: links
        })
    }
});

// await crawler.run(input.startUrls);
await crawler.run(['https://nuxt-scraper-testing-site.netlify.app']);
// await crawler.run(['https://vetframe.com']);

await Actor.exit();