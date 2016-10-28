let qs = require('qs');
let parseurl = require('parseurl');

module.exports = (req, res, next) => {
    let method = req.method.toUpperCase();
    if (method === 'GET') {
        let query = qs.parse(parseurl(req).query, {
            'arrayLimit': 0
        });

        req.queryString = JSON.parse(JSON.stringify(query));
    }

    next();
};
