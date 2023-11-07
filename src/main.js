// For more information, see https://crawlee.dev/
import { Actor } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';
// import { router } from './routes.js';
// const { getTitle } = require("helpers/title")
import { getLinks } from './helpers/links.js'
import { getBodyText } from './helpers/body.js'
import { getWordcount } from './helpers/count.js'

await Actor.init();

const input = await Actor.getInput();

const crawler = new CheerioCrawler({
    async requestHandler({ $, request, enqueueLinks }) {
        // Extract <title> text with Cheerio.
        // See Cheerio documentation for API docs.
        const title = $('title').text();
        const links = getLinks($, request.url)
        const body = getBodyText($)
        const wordcount = getWordcount(body)

        // Log stuff
        console.log(`Found ${wordcount} words on ${title}.`);
        // console.log(`Links: `, links);

        // Store the data
        await Dataset.pushData({
            title,
            // links,
            wordcount,
        })

        // The default behavior of enqueueLinks is to stay on the same hostname,
        // so it does not require any parameters.
        await enqueueLinks({
            transformRequestFunction(req) {
                // ignore all links ending with `.pdf`
                if (req.url.endsWith('.pdf')) return false;
                return req;
            },
        });

        // To include subdomains use the same-domain strategy argument.
        // await enqueueLinks({strategy: 'same-domain'});
    }
});

await crawler.run(input.startUrls);
// await crawler.run(['https://vetframe.com']);

await Actor.exit();