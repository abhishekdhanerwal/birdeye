const express = require('express');
const BodyParser = require('body-parser');
const responseFormat = require('./util/response');
const logger = require('./util/logger');

const app = express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

const reviewRouter = require('./routes/review.routes')();
const port = process.env.PORT || 3000;

app.use('/reviews', reviewRouter);

//Default middleware in case of wrong url request
app.use(function(req, res){
    const functionName = 'Middleware wrong url';
    logger.errorLog(req.url, null, functionName, 'wrong url');
    res.json(responseFormat.getResponse('wrong url', null, false));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));