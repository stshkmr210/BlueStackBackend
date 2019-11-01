const ScrapController = {};
const cheerio = require('cheerio');
const Url = require('url');
const ScrapModel = require('../Models/ScrapModel');
const ResponseController = require('./ResponseController');

ScrapController.top = async (req, res) =>  {
    try{
     let AppData = await ScrapModel.getAllApp();
     if(AppData.length <=0){
       return ResponseController.sendSuccessResponse(req,res,'No Data Found',{});
     }
     let finalResponse = {};
     AppData.forEach((value,index) => {
       if(!finalResponse.hasOwnProperty(value.appCatogerySlug)){
         finalResponse[value['appCatogerySlug']] = [value];
       }else{
         finalResponse[value['appCatogerySlug']].push(value);
       }
     });
     return ResponseController.sendSuccessResponse(req,res,'success',finalResponse);
    }catch(error){
        console.log(error);
        return ResponseController.sendErrorResponse(req,res);
    }
}

ScrapController.reScrap = async (req, res) =>  {
    try{
      await ScrapController.scrapTopApplications();
      return ResponseController.sendSuccessResponse(req,res,'success');
    }catch(error){
      console.log(error);
      return ResponseController.sendErrorResponse(req,res);
    }
}

ScrapController.getDetailedData = async (req, res) =>  {
    try{
      if(!req.query.id){
        return ResponseController.sendErrorResponse(req,res,'please provide app id');
      }
      let detailedInfo = await ScrapModel.getDetailedAppInfo(req.query.id);
      return ResponseController.sendSuccessResponse(req,res,'success',detailedInfo);
    }catch(error){
        console.log(error);
        return ResponseController.sendErrorResponse(req,res,error);
    }
}

ScrapController.scrapTopApplications = async () =>  {
    return new Promise(async (resolve,reject)=> {
      try{
         let playStoreTopUrl = `${PLAY_STORE_DOMAIN}/store/apps/top`;
         let options = {
             method  : 'GET',
             url     : playStoreTopUrl,
             json    : true
         }
         let playStoreData = await ScrapModel.makeRequest(options);
         await ScrapController.scrapTopApplicationUtill(playStoreData);
         console.log('here at done------------------------------------------------------------')
       return resolve('done');
     } catch(error){
       console.log(error);
       return reject(error);
     }
 });
}

ScrapController.scrapTopApplicationUtill =  function (htmlText) {
    return new Promise(async function(resolve, reject) {
        try{
            const $ = cheerio.load(htmlText);
            $(".Ktdaqe").each( async function (index, element) {
                let appCatogery = $(element).find('.sv0AUd ').html();
                let priority = index+1;
                $(element).find('.WHE7ib').each(async function (index1, elemnt1) {
                    let applicationData = {};
                    applicationData.appCatogery = appCatogery;
                    applicationData.appCatogerySlug = (appCatogery.replace(/ /g,"_")).toLocaleLowerCase();
                    applicationData.priority = priority;
                    applicationData.appIndex = index1+1; //$(elemnt1).find('.yNWQ8e ').children('span').children('img').attr('data-ils');
                    applicationData.imageUrl = ($(elemnt1).find('.yNWQ8e ').children('span').children('img').attr('data-src')||'').split('=')[0];
                    applicationData.appUrl = PLAY_STORE_DOMAIN+$(elemnt1).find('.wXUyZd ').children('a').attr('href');
                    let cost = ($(elemnt1).find('.VfPpfd').children('span').html() || '').replace('&#x20B9;','');
                    if(cost){
                        applicationData.cost = cost;
                    }

                    applicationData.appName = $(elemnt1).find('.WsMG1c ').html();
                    applicationData.appDevName = $(elemnt1).find('.KoLSrc').children('a').children('.KoLSrc').html();
                    applicationData.appDevUrl = PLAY_STORE_DOMAIN+$(elemnt1).find('.mnKHRc').attr('href');

                    let parsedUrl = Url.parse(applicationData.appUrl)
                    applicationData.appId = (parsedUrl.query || '').split('=')[1];
                    ScrapModel.saveApp(applicationData);
                });
            });
            resolve('done');
        }catch(error) {
            return reject(error);
        }
    });
}

module.exports = ScrapController;