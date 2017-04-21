const Boom = require('boom');

// Parse the boom errors
module.exports = () => (e, req, res, next) => {
    let err = e;
    if (err) {
        // If JWT unauthorized, wrap in Boom
        if (err.name == 'UnauthorizedError') err = new Boom.unauthorized();

        // If there's a Boom error
        if (err.output) {
            err.output.payload.message = err.message;
            if (err.data) err.output.payload.data = err.data;
            res.status(err.output.statusCode).send(err.output.payload);

        // Otherwise return generic 500 error
        } else {
            console.log(err);
            const error = 500;
            res.status(error).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'There was an unknown error with the request'
            });
        }

    // If there's no error, continue
    } else next();
};
