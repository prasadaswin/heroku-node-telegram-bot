process.env.NTBA_FIX_319 = 1;

const token = process.env.TOKEN;
const https = require("https");
const date = require('date-and-time');
const kerala_ids = require('./kerala_dist_ids.json');
//console.log(kerala_ids);
const Bot = require('node-telegram-bot-api');
let bot;


// globals
const groupChatID='-1001490277857';
let cowinLink='https://www.cowin.gov.in/home';

if (process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, {
    polling: true
  });
};

//test//
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});
//test//




let todaysDate = new Date();
let tommorowsDate = date.addDays(todaysDate, 1);
tommorowsDate = date.format(tommorowsDate, 'DD-MM-YYYY');
console.log(todaysDate);
console.log(tommorowsDate);


bot.onText(/\/help/,(msg)=>{
   const chatID = msg.chat.id;
    let helpText="Type /slots <x> ; \n 'x' can be a district name[Kerala]/pincode[Any]. eg: /slots kannur reutrns details of vac center at Kannur. if 'x' is not entered the slots for defualt Kozhikode will be fetched.Fetched Slots are for the next Day"
    bot.sendMessage(chatID,helpText);
});


bot.onText(/\/slots/, (msg, match) => {

  const chatId = msg.chat.id;
  let addonText = match.input.split(' ')[1];
  console.log(addonText);

  let district_id = 305;

  if (addonText === undefined) botMain()
  else {
    district_id = parseInt(addonText);
    if (!(Number.isNaN(district_id))) {
      botMain(district_id, true);
    } else {
      if (getIDfromDistrictName(addonText))
        botMain(district_id, false);
      else
        botErromsg(1);
    }
  }
  //todo: replace with switch.


  function getIDfromDistrictName(dist_name) {

    let formatedString = dist_name.charAt(0).toUpperCase() + dist_name.substring(1).toLowerCase();
    console.log(formatedString)
    let arr = kerala_ids.districts;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].district_name == formatedString) {
        district_id = arr[i].district_id;
        return true;
        break;
      }

    }
    return false;
  };


  function botErromsg(n) {
    console.log("err  ")
    let sendText = n ? 'District gorrect para Mwona' : 'ultra_error'
    bot.sendMessage(chatId, sendText);
    return;
  }

  function botMain(district_id, pinFlag) {
    let finalString = '';
    test(district_id, pinFlag, (err, val) => {
      if (err) {
        console.log(err);
        finalString = "PinCode Invalid";
      } else {

        let arr = val.sessions;
        if (arr.length != 0) {
          arr.forEach((item) => {
            finalString += item.name + '-' + item.block_name + '-Ozhiv:' + item.available_capacity + '-' + item.fee_type;
            finalString += '\n' + '**' + '\n';
          });
        } else
          finalString = 'NO VACCANCIES';
      }

      console.log(finalString);
      bot.sendMessage(chatId, finalString);

    });

  }; //test end


});



bot.on("polling_error", (err) => console.log(err));





const byPin = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=673612&date=05-05-2021";
const byDistrictID = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=305&date=05-05-2021";
const accessToken = "1787534913:AAEaQ0nIdQ5t9YJs6uTtVFtyus7WpLSwoEI";

const getByPin = function(pincode) {
  let api = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=" + pincode + "&date=" + tommorowsDate;
  return api;
}

const getAllDistrictSlots = function(id = 305) {
  let api = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=" + id + "&date=" + tommorowsDate;
  return api;
}

function test(x, pinFlag = false, callback) {
  let aliasFunc = pinFlag ? getByPin : getAllDistrictSlots;

  https.get(aliasFunc(x), (response) => {

    // console.log('statusCode:', response.statusCode);
    //console.log('headers:', res.headers);
    if (response.statusCode === 400) {
      callback(true, response);
      return;
    }

    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });
    let finalVal;
    response.on('end', () => {
      finalVal = JSON.parse(data);
      // console.log(finalVal);
      callback(null, finalVal);
    });

  }).on('error', (e) => {
    // console.error(e);
    callback(true, e)
  });

};

// scrapper
//let i=0;
setInterval(function() {
 //console.log(i++);
  https.get(getAllDistrictSlots(), (response) => {

    console.log('statusCode:', response.statusCode);
    if (response.statusCode !== 200) {
      console.error(response.statusCode);

    }
    else if (response.statusCode===200) {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });
    let finalVal;
    response.on('end', () => {
      finalVal = JSON.parse(data);
      console.log(finalVal);
      if(finalVal.sessions.length!==0)

         { clearInterval(this);
           succes(finalVal);}
    });
}
  }).on('error', (e) => {
    console.error(e);
  });

}, 60000); //every 1 min


function succes(finalVal){
  bot.sendMessage(groupChatID, "Slot nde begam Bukk aakikoli");
  bot.sendMessage(groupChatID,cowinLink);
   let finalString='';
   let arr = finalVal.sessions;
    arr.forEach((item) => {
      finalString += item.name + '-' + item.block_name + '-Ozhiv:' + item.available_capacity + '-' + item.fee_type;
      finalString += '\n' + '**' + '\n';
    });
  bot.sendMessage(groupChatID,finalString);
   }




module.exports = bot;
