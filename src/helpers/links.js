import Url from 'url-parse'
import { getElementLocation, getElementDomPath } from './dom.js'

/**
 * Extract all links from html
 *
 * @param  {Function} $html Page html as Cheerio function
 * @param  {String} baseUrl Url used to make relative links absolute
 * @return {Array} Returns array of link objects
 */
const getLinks = ($html, baseUrl) => {
    return $html('a').map(function() {
        return getStructuredLink($html(this), baseUrl)
    }).get()
}

/**
 * Constrcut a link object with properties we want
 *
 * @param  {Function} $link Link html as Cheerio function
 * @param  {String} baseUrl Url used to make relative links absolute
 * @return {Object} Returns link as an object
 */
const getStructuredLink = ($link, baseUrl) => {
    // Parse URL parts
    const url = new Url($link.attr('href'), baseUrl)

    // Check type
    if (getLinkType(url) === 'link') {
        return {
            text: getLinkText($link),
            url: getLinkUrl(url),
            // domPath: getElementDomPath($link),
            // type: getLinkType(url),
            location: getElementLocation($link),
            hostname: url.hostname,
        }
    }
}

/**
 * Get link text without unwanted html
 *
 * @param  {Function} $link Link html as Cheerio function
 * @return {String} Returns clean link text as string
 */
const getLinkText = ($link) => {
    return $link
        // .children().remove().end() // Select and remove any html in link
        .text() // Get text
        .replace(/\s+/g, ' ') // Remove line breaks
        .trim() // Trim outer spaces
}

/**
 * Get link type (e.g., link, phone, email, pdf)
 *
 * @param  {Object} url Parsed url as object
 * @return {String} Returns type of link as string
 */
const getLinkType = (url) => {
    // Detect Links
    if (url.protocol == 'https:' || url.protocol == 'http:' ) {

        // Detect links to documents
        if (isDocument(url.pathname)) {
            return 'document'
        }

        // Detect links to media
        if (isMedia(url.pathname)) {
            return 'media'
        }

        // Detect links to social platforms
        if (isSocial(url.host)) {
            return 'social'
        }

        return 'link'
    }

    // Detect telephone links
    if (url.protocol == 'tel:') {
        return 'phone'
    }

    // Detect email links
    if (url.protocol == 'mailto:' ) {
        return 'email'
    }

    return undefined
}

/**
 * Get domain from url
 *
 * @param  {Object} url Parsed url as object
 * @return {String} Returns domain as string
 */
const getLinkDomain = (url) => {
    // This regular expression attempts to match a simple domain from a URL.
    // Note that this regex is quite basic and may not cover all edge cases.
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9][a-z0-9\-]{1,63}\.[a-z\.]{2,6})/i);
    return match ? match[1] : null;
}

/**
 * Get clean and formatted link url
 *
 * @param  {Object} url Parsed url as object
 * @return {String} Returns url as string
 */
const getLinkUrl = (url) => {
    // Construct urls without hashes
    if (url.protocol == 'https:' || url.protocol == 'http:' ) {
        return url.origin + url.pathname + url.query
    }

    // Construct telephone urls
    if (url.protocol == 'tel:') {
        return 'tel:' + url.pathname
    }

    // Construct email urls
    if (url.protocol == 'mailto:' ) {
        return 'mailto:' + url.pathname
    }
}

/**
 * Check if URL points to a document
 *
 * @param  {String} host Pathname of URL, e.g., '/uploads/file.pdf'
 * @return {Boolean} Returns true or false
 */
const isDocument = (pathname) => {
    pathname = pathname.toLowerCase()

    const extensions = [
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx',
        '.odt',
        '.ods',
        '.odp',
        '.rtf',
        '.exe',
        '.txt'
    ]

    return extensions.some(extension => pathname.includes(extension))
}

/**
 * Check if URL points to media
 *
 * @param  {String} host Pathname of URL, e.g., '/uploads/image.jpg'
 * @return {Boolean} Returns true or false
 */
const isMedia = (pathname) => {
    pathname = pathname.toLowerCase()

    const extensions = [
        '.avi',
        '.gif',
        '.jpg',
        '.jpeg',
        '.png',
        '.svg',
        '.webp',
        '.tif',
        '.tiff',
        '.mid',
        '.midi',
        '.mp3',
        '.mp4',
        '.mpg',
        '.mpeg',
        '.mov',
        '.qt',
        '.ram',
        '.rar',
        '.wav'
    ]

    return extensions.some(extension => pathname.includes(extension))
}

/**
 * Check if URL points to a social network
 *
 * @param  {String} host Host of URL, e.g., 'youtube.com'
 * @return {Boolean} Returns true or false
 */
const isSocial = (host) => {
    host = host.toLowerCase()

    const socials = [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'linkedin.com',
        'youtube.com'
    ]

    return socials.some(social => host.includes(social))
}

export {
    getLinks
}
