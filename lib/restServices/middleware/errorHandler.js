module.exports = (error, req, res) => {
    res.status(500);
    let errorInfo = {
        message: error.message
    };
    
    if (process.env.NODE_ENV !== 'producation') {
        errorInfo.stack = error.stack;
    }

    res.json(errorInfo);
};
