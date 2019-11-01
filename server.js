
const express     = require('express');
const app         = express();
//const moment      = require('moment');

app.use(function (req, res, next) {

    console.log("==================================================>",req.url,req.method);

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});






require('./App/Config/Constants');
require('./App/Config/Config');
require('./App/Config/Connection');

const webApi = require('./App/Routes/web');
app.use('/web/', webApi);

// app.use(function(req, res, next) {
//     console.log('her');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', '*');
//     res.setHeader('Access-Control-Allow-Headers', '*,X-Requested-With,content-type,Content-Type,application/json');
//     res.setHeader('Access-Control-Allow-Credentials', true);
//     next();
// });

app.listen(8081, function () {
    console.log("Listening on 8081");
});

