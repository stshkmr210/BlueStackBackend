var ScrapModel = {};
const request = require('request');
const cheerio = require('cheerio');

ScrapModel.saveApp = function(appData) {
    return new Promise(async function(resolve, reject) {
        try{
            //console.log("appData::",appData);
            if(!appData || !appData.appId){
                return reject('invalid app');
            }
            await masterExecutePromisified(`UPDATE app_details SET active = ? WHERE appCatogerySlug = ? 
            AND appIndex = ? AND appId != ?`,[0,appData.appCatogerySlug,appData.appIndex,appData.appId]);
            let exitingAppData =  await slaveExecutePromisified(`SELECT * FROM app_details WHERE appId = ?
            AND appCatogerySlug = ? `,[appData.appId,appData.appCatogerySlug]);
            appData.active = "1";
            if(exitingAppData.length > 0){
                exitingAppData = exitingAppData[0];
                //console.log("::exitingAppData::",exitingAppData,"::appData::",appData);
                if(parseInt(exitingAppData.active) === 0
                    || exitingAppData.appCatogerySlug != appData.appCatogerySlug
                    || exitingAppData.appIndex != appData.appIndex){
                    let updateQuery = `UPDATE app_details SET ${Object.keys(appData).join(' = ?, ')} = ? WHERE id = ?`;
                    let valueArray = Object.values(appData).concat([exitingAppData.id]);
                     masterExecutePromisified(updateQuery,valueArray)
                    return resolve('done');
                }
                return resolve('already exist');
            }
            let insertQuery = `INSERT INTO app_details (${Object.keys(appData).join(',')}) VALUES("${Object.values(appData).join('","')}")`;
            masterExecutePromisified(insertQuery,[]);
            return resolve('done');
        }catch(error) {
            return reject(error);
        }
    });
}

ScrapModel.saveDetailedInfo = function(detailedInfo) {
    return new Promise(async function(resolve, reject) {
        try{
            console.log("detailedInfo::",detailedInfo);
            if(!detailedInfo || !detailedInfo.appId){
                return reject('invalid app');
            }
            detailedInfo.imageJson = JSON.stringify(detailedInfo.imageJson);
            detailedInfo.videoJson = JSON.stringify(detailedInfo.videoJson);
            detailedInfo.metaData = JSON.stringify(detailedInfo.metaData);
            let insertQuery = `INSERT INTO app_detailed_info (${Object.keys(detailedInfo).join(',')}) VALUES('${Object.values(detailedInfo).join("','")}')`;
            await masterExecutePromisified(insertQuery,[]);
            return resolve('done');
        }catch(error) {
            return reject(error);
        }
    });
}

ScrapModel.getAllApp = function() {
    return new Promise(async function(resolve, reject) {
        try{
          let query = `SELECT * FROM app_details WHERE active = ? ORDER BY priority, appIndex ASC`;
          let data = await slaveExecutePromisified(query,[1]);
          return resolve(data);
        }catch(error) {
            return reject(error);
        }
    });
}

ScrapModel.getDetailedAppInfo = function(appId) {
    return new Promise(async function(resolve, reject) {
        try{
          if(!appId){
            return reject('please provide appId')
          }
          let query = `SELECT * FROM app_details ap 
                         LEFT JOIN app_detailed_info adi ON ap.appId = adi.appId 
                        WHERE ap.appId = ? ORDER BY ap.id DESC LIMIT 1`;
          let data = await masterExecutePromisified(query,[appId]);
          if(data.length <=0){
            return reject('app not found.');
          }
          if(!data[0].detail_id){
            await ScrapModel.scrapAppDetails(appId);
              let query = `SELECT * FROM app_details ap 
                         LEFT JOIN app_detailed_info adi ON ap.appId = adi.appId 
                        WHERE ap.appId = ? ORDER BY ap.id DESC LIMIT 1`;
              let data = await masterExecutePromisified(query,[appId]);
             // let data = await ScrapModel.getDetailedAppInfo(appId);
            data = data[0];
            data.imageJson = data.imageJson ? JSON.parse(data.imageJson) : null;
            data.videoJson = data.videoJson ? JSON.parse(data.videoJson) : null;
            data.metaData = data.metaData ? JSON.parse(data.metaData) : null;
            return resolve(data);
          }
          data = data[0];
          data.imageJson = data.imageJson ? JSON.parse(data.imageJson) : null;
          data.videoJson = data.videoJson ? JSON.parse(data.videoJson) : null;
          data.metaData = data.metaData ? JSON.parse(data.metaData) : null;
          return resolve(data);
        }catch(error) {
            return reject(error);
        }
    });
}

ScrapModel.scrapAppDetails = async (appId) =>  {
    return new Promise(async (resolve,reject)=> {
        try {
            if(!appId){
              return reject("please provide required params");
            }
            let detailedData = await slaveExecutePromisified(`SELECT * FROM app_detailed_info WHERE appId =?`,[appId]);
            if(detailedData.length > 0){
                return resolve('already scraped');
            }
            let scrapData = await ScrapModel.getScrapAppDetails(appId);
            await ScrapModel.saveDetailedInfo(scrapData);
            resolve('done');
        } catch (error) {
            console.log(error);
            return reject(error);
        }
    });
}

ScrapModel.getScrapAppDetails = (appId) =>  {
    return new Promise(async (resolve,reject)=>{
        try{
            if(!appId){
                return reject('please provide required params');
            }
            let appUrl = `${PLAY_STORE_DOMAIN}/store/apps/details?id=${appId}`;
            let options = {
                method  : 'GET',
                url     : appUrl,
                json    : true
            }
            let playStoreData = await ScrapModel.makeRequest(options);
            const $ = cheerio.load(playStoreData);
            //let mainHtml = $(".JNury").html();
            //console.log(mainHtml);
            //return resolve('done');
            let fullDetails = {
                imageJson     : [],
                videoJson     : [],
                metaData      : [],
                appId         : appId
            };
            fullDetails.description = $('.DWPxHb').children('span').children('div').html();
            $(".MSLVtf").each( async function (index, element) {
                let videoJsonObj = {}
                videoJsonObj.imageUrl = ($(element).find('img').attr('src') || '').split("=")[0];
                if(!videoJsonObj.imageUrl || !(videoJsonObj.imageUrl).startsWith('http')){
                    videoJsonObj.imageUrl = ($(element).find('img').attr('data-src') || '').split("=")[0];
                }
                videoJsonObj.videoUrl = ($(element).find('button').attr('data-trailer-url') || '').split("?")[0];
                fullDetails.videoJson.push(videoJsonObj);
            });
            $("button.Q4vdJd").each( async function (index, element) {
                let imageJsonObj = {}
                imageJsonObj.imageUrl = ($(element).find('img').attr('src') || '').split("=")[0];
                if(!imageJsonObj.imageUrl || !(imageJsonObj.imageUrl).startsWith('http')){
                    imageJsonObj.imageUrl = ($(element).find('img').attr('data-src') || '').split("=")[0];
                }
                fullDetails.imageJson.push(imageJsonObj);
            });
            $(".hAyfc").each( async function (index, element) {
                if($(element).find('.IQ1z0d').children('span').children().length == 0){
                    let metaDataObj = {}
                    metaDataObj[$(element).find('.BgcNfc').html()] = $(element).find('.IQ1z0d').children('span').html();
                    fullDetails.metaData.push(metaDataObj);
                }
            });
            return resolve(fullDetails);
        } catch(error){
            console.log(error);
            return reject(error);
        }
    });
}

/*var options = {
 method  : 'PUT', //'GET','POST','PUT'
 url     : URL,
 body    : {acknowledgementNo : data.body.acknowledgementNo, paymentStatus: status},
 json    : true,
 headers : {'access-token': 'token'}
 }*/
ScrapModel.makeRequest = function(options) {
    return new Promise(function(resolve, reject) {
        //console.log("options > ", options)
        request(options,
            function(error, response, body){
                // console.log("error , body > ", error , body);
                if(error) {
                    return reject(error);
                }
                return resolve(body);
            });
    });
}

module.exports = ScrapModel;
