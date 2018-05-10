const moment = require('moment');
const path = require('path');
const omelo = require('omelo');
const fs = require('mz/fs');

class Http304Filter {
    constructor() {
        this._pathMap = new Set();
        this.staticDir = path.join(omelo.app.getBase(), 'app/servers', omelo.app.getServerType(), 'public');
    }

    async before(ctx, next) {
        let canNext = true;
        for (let route of this._pathMap) {
            if (ctx.url.search(route) >= 0) {
                try {
                    let stats = await fs.stat(path.join(this.staticDir, ctx.url));
                    let file_modified = stats.mtime.toUTCString();
                    let modified_since = ctx.request.get('if-modified-since');
                    if (file_modified && modified_since && moment(file_modified) <= moment(modified_since)) {
                        ctx.status = 304;
                        canNext = false;
                    }
                } catch (e) {
                    logger.info(e);
                }
                break;
            }
        }

        if(canNext){
            await next();
        }
    }

    async after(ctx, next) {
        await next();
    }

    addPath(path) {
        this._pathMap.add(path);
    }
}

module.exports = Http304Filter;