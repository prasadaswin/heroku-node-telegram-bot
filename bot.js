process.env.NTBA_FIX_319 = 1;

const token = process.env.TOKEN;
const https = require("https");
const date = require('date-and-time');
const kerala_ids = require('./kerala_dist_ids.json');
//
const axios=require('axios');
const querystring=require('querystring');


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

// test//
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message from server');
});
// test//



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
        console.log(val);
        finalString = val.error;
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





const byPin = 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin';
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

// function test(x, pinFlag = false, callback) {
//
//
// };
//
// test( (response) => {
//   console.log(response)
// });

function test(x,pinFlag=false,callback){
let aliasFunc = pinFlag ? getByPin : getAllDistrictSlots;

axios.get(aliasFunc(x),

{
 headers:{
   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
    'cache-control':'no-cache',
    'scheme':'https',
     'X-Requested-With': 'XMLHttpRequest'
 },
 withCredentials: true


})
  .then(response => {
    console.log("here")
        console.log(response);
        callback(null,response.data);

  }).catch(error=>{
     console.log(error);
    callback(true,error.response.data);
  })
};



//scrapper
let i=0;
setInterval(function() {
 console.log(i++);
 axios.get(getAllDistrictSlots(),
 {
  headers:{
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
     'cache-control':'no-cache',
     'scheme':'https'
  }

 })
   .then(response => {
      let finalVal=response.data;
      console.log(finalVal);
      console.log(response.status);
      if(finalVal.sessions.length!==0)

         { clearInterval(this);
           succes(finalVal);}

}).catch('error', (e) => {
    console.error(e);
  });

}, 30000); //every 30sec



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
