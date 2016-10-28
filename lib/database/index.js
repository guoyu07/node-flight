let mongoose = require('mongoose');

module.exports = {
    connect: (config) => {
        let opts = {
            server: {
                poolSize: config.poolSize,
                socketOptions: {
                    keepAlive: 1
                }
            },
            user: config.user,
            pass: config.passwd
        };

        let mongodbUrl = `mongodb://${config.url}:${config.port}/${config.schema}`;

        mongoose.connect(mongodbUrl, opts);
    },
    getConnection: () => mongoose.connection
};
