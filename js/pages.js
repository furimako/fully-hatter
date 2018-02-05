
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
            const MARKDOWN = fs.readFileSync('./static' + urlPath + '.md', 'utf8')
            contentHTML = marked(MARKDOWN)
        }
        
        const TEMPLATE = fs.readFileSync('./static/template.mustache', 'utf8')
        const HTML = mustache.render(TEMPLATE, {'description': description, 'title': title, 'body': contentHTML})
        this.pages.set(urlPath, HTML)
    }
    
    addText (urlPath) {
        const fs = require('fs')
        const TEXT = fs.readFileSync('.' + urlPath, 'utf8')
        this.pages.set(urlPath, TEXT)
        
        if (urlPath.match(/\.css$/)) {
            this.contentTypes.set(urlPath, 'text/css')
        }
    }
    
    addBinary (urlPath) {
        const fs = require('fs')
        const BINARY = fs.readFileSync('.' + urlPath)
        this.pages.set(urlPath, BINARY)
        
        if (urlPath.match(/\.png$/)) {
            this.contentTypes.set(urlPath, 'image/png')
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