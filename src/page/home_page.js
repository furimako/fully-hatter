const fs = require('fs')
const mustache = require('mustache')
const { logging, JST } = require('node-utils')
const BasePage = require('./base_page')
const rooting = require('../../static/rooting')
const mongodbDriver = require('../mongodb_driver')

const template = fs.readFileSync('./static/template/template.mustache', 'utf8')
const homeTemplate = fs.readFileSync('./static/template/home.mustache', 'utf8')

module.exports = class HomePage extends BasePage {
    constructor({ lan, isMultilingual, element }) {
        super({
            lan,
            element,
            urlPath: element.urlPath,
            contentType: 'text/html'
        })
        this.setView({
            cssPath: '/css/styles-home.css',
            isMultilingual
        })
    }
    
    async get(options) {
        logging.info(`    L lan: ${this.lan}, options: ${JSON.stringify(options)}`)
        const {
            pageNum, registration, email, messageSent
        } = options
        
        const summary = await mongodbDriver.findCountsForHome(this.lan)
        const comments = await mongodbDriver.find(
            'comments',
            { urlPath: { $ne: '/temp' }, lan: this.lan }
        )
        this._updateViewHome(pageNum, summary, comments, this.lan, registration, email, messageSent)
        
        this.view.bodyHTML = mustache.render(homeTemplate, this.viewHome, this.partial)
        return mustache.render(template, this.view, this.partial)
    }
    
    _updateViewHome(pageNum, summary, comments, lan, registration, email, messageSent) {
        this.viewHome = {
            world: [],
            story: []
        }
        this.viewHome.lan = { [lan]: true }
        this.viewHome.registration = registration
        this.viewHome.email = email
        this.viewHome.messageSent = messageSent
        this.viewHome.registerFormHome = { registerFormId: 'registerHome' }

        rooting.forEach((v) => {
            v.elements.forEach((e) => {
                if (v.styleInHome && e[lan]) {
                    this.viewHome[v.styleInHome].push({
                        urlPath: (e.numOfChapters) ? `${e.urlPath}-1` : e.urlPath,
                        picturePath: `/images${e.urlPath}.jpg`,
                        title: e[lan].title,
                        description: e[lan].description,
                        isNew: e[lan].isNew,
                        letter: e[lan].letter,
                        hasTitleTags() {
                            return this.isNew || this.letter
                        }
                    })
                }
            })
        })
        
        for (let i = 0; i < this.viewHome.world.length; i += 1) {
            if (!this.viewHome.world[i].advertisement) {
                const likeCount = summary.likeCount[this.viewHome.world[i].urlPath] || 0
                const commentCount = summary.commentCount[this.viewHome.world[i].urlPath] || 0
                this.viewHome.world[i].numOfLikes = `${likeCount}`
                this.viewHome.world[i].numOfComments = `${commentCount}`
            }
            
            if (i === 0) {
                this.viewHome.world[i].headHTML = '<div class="column">'
            }
            if (i === Math.floor((this.viewHome.world.length - 1) / 2)) {
                this.viewHome.world[i].footHTML = '</div>'
                this.viewHome.world[i].footHTML += '<div class="column">'
            }
            if (i === this.viewHome.world.length - 1) {
                this.viewHome.world[i].footHTML = '</div>'
            }
        }
        
        for (let i = 0; i < this.viewHome.story.length; i += 1) {
            const likeCount = summary.likeCount[this.viewHome.story[i].urlPath] || 0
            this.viewHome.story[i].numOfLikes = `${likeCount}`
            
            if (i === 0) {
                this.viewHome.story[i].headHTML = '<div class="column">'
            }
            if (i === Math.floor((this.viewHome.story.length - 1) / 2)) {
                this.viewHome.story[i].footHTML = '</div>'
                this.viewHome.story[i].footHTML += '<div class="column">'
            }
            if (i === this.viewHome.story.length - 1) {
                this.viewHome.story[i].footHTML = '</div>'
            }
        }
        
        // create comment list
        const commentListSize = 8
        const pageTotal = Math.ceil(comments.length / commentListSize)
        let pageNumValidated
        
        if (pageTotal === 0) {
            pageNumValidated = 0
        } else if (pageNum >= 1 && pageNum <= pageTotal) {
            pageNumValidated = pageNum
        } else {
            pageNumValidated = 1
        }
        
        this.viewHome.commentListPagination = {
            pageNum: pageNumValidated,
            pageTotal,
            previousPageNum: (pageNumValidated <= 1) ? 1 : pageNumValidated - 1,
            disabledPrevious: (pageNumValidated <= 1) ? 'disabled' : '',
            nextPageNum: (pageNumValidated >= pageTotal) ? pageTotal : pageNumValidated + 1,
            disabledNext: (pageNumValidated >= pageTotal) ? 'disabled' : ''
        }
        
        // from latest to oldest
        comments.sort((obj1, obj2) => obj2.date.getTime() - obj1.date.getTime())
        
        const commentListView = []
        comments
            .slice(
                pageNumValidated * commentListSize - commentListSize,
                pageNumValidated * commentListSize
            )
            .forEach((commentObj) => {
                const viewObj = this.viewHome.world.find((e) => e.urlPath === commentObj.urlPath)
                const commentStr = mustache.render('{{raw}}', { raw: commentObj.comment }).replace(/(\r\n|\n|\r)/gm, ' ')
            
                let urlPath
                let pageTitle
                if (lan === 'ja') {
                    urlPath = commentObj.urlPath
                    pageTitle = (viewObj) ? viewObj.title : '掲示板'
                } else if (lan === 'en') {
                    urlPath = `/en${commentObj.urlPath}`
                    pageTitle = (viewObj) ? viewObj.title : 'Board'
                }
                commentListView.push({
                    date: JST.convertToDate(commentObj.date),
                    urlPath,
                    pageTitle,
                    name: commentObj.name,
                    excerptOfComment: (commentStr.length > 30) ? `${commentStr.slice(0, 30)}...` : commentStr
                })
            })
        this.viewHome.comments = commentListView
    }
}
