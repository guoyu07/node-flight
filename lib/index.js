module.exports = {
    startup: (config) => {
        // 初始化数据库
//        let database = require('./database');
//        database.connect(config.database);
        // 初始化Express服务器
        let server = require('./restServices');
        server(config);
    }
};
