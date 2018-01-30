
module.exports = class Pages {
    constructor() {
        this.pages = new Map()
        this.contentTypes = new Map()
    }
    
    addPage (title, description, urlPath, contentPath=false) {
        const fs = require('fs')
        const mustache = require('mustache')
        const marked = require('marked')
        marked.setOptions({breaks: true})
        
        let contentHTML
        if (contentPath) {
            contentHTML = fs.readFileSync(contentPath, 'utf8')
        } else {
            const MARKDOWN = fs.readFileSync('./static/markdown' + urlPath + '.md', 'utf8')
            contentHTML = marked(MARKDOWN)
        }
        
        const TEMPLATE = fs.readFileSync('./static/template.mustache', 'utf8')
        const HTML = mustache.render(TEMPLATE, {'description': description, 'title': title, 'body': contentHTML})
        this.pages.set(urlPath, HTML)
    }
    
    addBinary (urlPath) {
        const fs = require('fs')
        const BINARY = fs.readFileSync('.' + urlPath)
        this.pages.set(urlPath, BINARY)
        
        if (urlPath.match(/\.png$/)) {
            this.contentTypes.set(urlPath, 'image/png')
        } else if (urlPath.match(/\.woff$/)) {
            this.contentTypes.set(urlPath, 'application/font-woff woff')
        } else if (urlPath.match(/\.eot$/)) {
            this.contentTypes.set(urlPath, 'application/vnd.ms-fontobject eot')
        }
    }
    
    has (urlPath) {
        return this.pages.has(urlPath)
    }
    
    get (urlPath) {
        return this.pages.get(urlPath)
    }
    
    contentType (urlPath) {
        return this.contentTypes.get(urlPath)
    }
}