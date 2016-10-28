let express = require('express');
let bodyParser = require('body-parser');
let custMiddleware = require('./middleware');
let apis = require('./router');
let _ = require('lodash');
let timeout = require('connect-timeout');

module.exports = function(config) {
    let app = express()
    global.config = config;

    // =============== 设置express的middleware ===============
    // timeout
    app.use(timeout('900s'));
    // CROS
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methos', 'GET, PUT, POST, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
        next();
    });

    // no cookie, no session
    // parse get parameter to json
    app.use(custMiddleware.qsParser);
    // parse post body to json
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    
    // =============== 设置express的Router ===============
    let fullPath = `/${config.server.serviceRoot}/`;
    _.forEach(apis, (api) => {
        let routerPath = `${fullPath}`;
        if (api.rootPath != null && api.rootPath.length > 0) {
            routerPath += api.rootPath;
        }

        _.each(api.actions, (action, name) => {
            let apiPath = routerPath;
            if (action.path == null) {
                apiPath += `/${name}`;
            } else if (action.path.length > 0) {
                apiPath += `/${action.path}`;
            }

            let method = action.method.toUpperCase();
            let executors = action.executors;
            console.log(`add method: ${method} for path:[${apiPath}]`);
            switch (method) {
                case 'GET':
                    app.route(apiPath).get(executors);
                    break;
                case 'POST':
                    app.route(apiPath).post(executors);
                    break;
                case 'PUT':
                    app.route(apiPath).put(executors);
                    break;
                case 'DELETE':
                    app.route(apiPath).delete(executors);
                    break;
                default:
                    break;
            }
        });
    });
    app.use(function (req, res, next){
        if (!req.timedout) next();
    });
    // =============== 设置express的全局ErrorHandle ===============
    app.use(custMiddleware.commonErrorHandler);
    // start up server
    app.listen(config.server.port);
};
