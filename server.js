const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const ejs = require("ejs");
const bodyParser = require("body-parser");
const https = require("https");

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

let days, current, hours, city=null, err=null;


// ******************************************* get methods ***********************************

app.get("/", (req, res) => {
    if(city == null){
        city = 'Kolkata';
        apicalls(res);
    }else{
    let image = "images/api1/"+current.icon+".gif";
    res.render('index',{city:city, hours:hours, days:days, current:current});
    }
})
app.get("/weekly-forecast", (req, res) => {
    if(city == null){
        res.redirect('/');
    }else{
        res.render('weekly-forecast',{days:days});
    }
})
app.get("/not-found", (req, res)=>{
    if(err == null){
        res.redirect('/');
    }else{
        res.render('error',{error:err});
    }
})


//**************************************  post methods ****************************************

app.post("/", async (req, res) => {
    city = req.body.city;
    city = city.slice(0,1).toUpperCase() + city.slice(1).toLowerCase();
    apicalls(res);
})
app.post("/current-weather", (req, res) => {
    res.redirect('/');
})
app.post("/weekly-forecast", (req, res) => {
    res.redirect('/weekly-forecast');
})
app.post("/not-found",(req,res)=>{
    res.redirect('/');
})


// ************************************ listen method **********************************************

app.listen(port, () => {
    console.log(`Server started at port ${port}.`);
})


// ************************************** api call function ***************************************

function apicalls(res){
    const url1 = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=metric&elements=datetime%2CdatetimeEpoch%2Cname%2Ctempmax%2Ctempmin%2Ctemp%2Cfeelslikemax%2Cfeelslike%2Cdew%2Chumidity%2Cprecipprob%2Cwindspeed%2Csunrise%2Csunset%2Cconditions%2Cdescription%2Cicon&include=current%2Cfcst%2Cremote%2Cobs%2Cdays&key=K4EZD49HSKVH7DTF5AHLQFZA6&contentType=json`;
    const url2 = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&cnt=10&appid=b5b5d8dcb4ccf7ec3d6d38acf55f1caf#`;

    let apiData1 = '', apiData2 = '';
    const p = new Promise((resolve, reject) => {
        https.get(url1, (response) => {
            if(response.statusCode != 200){
                reject(response.statusCode);
            }
            response.on('data', (chunk) => {
                apiData1 += chunk;
            })
            response.on('end', () => {
                resolve('Done');
            })
            response.on('error',()=>{
                console.log('error');
                reject('error');
            })
        })
    });

    const q = new Promise((resolve, reject) => {
        https.get(url2, (response) => {
            if(response.statusCode != 200){
                reject(response.statusCode);
            }
            response.on('data', (chunk) => {
                apiData2 += chunk;
            })
            response.on('end', () => {
                resolve('Done');
            })
            response.on('error',()=>{
                reject('error');
            })
        })
    });

    Promise.all([p, q])
    .then((values)=>{
        apiData1 = JSON.parse(apiData1);
        apiData2 = JSON.parse(apiData2);
        setCurrent(apiData1);
        setDays(apiData1);
        setHours(apiData2);
        res.redirect('/');
    })
    .catch((error)=>{
        city = null;
        err = error;
        res.redirect('/not-found');
    });
}



// ************************************** other fuctions **************************************

function setCurrent(apiData){
    current = apiData.currentConditions;
    current.sunrise = time(current.sunrise);
    current.sunset = time(current.sunset);
    current.precipprob = apiData.days[0].precipprob;
}
function setDays(apiData){
    days = apiData.days;
    days.forEach(element => {
        element.sunrise = time(element.sunrise);
        element.sunset = time(element.sunset);
        let weekDays = ['Sunday', 'Monday', 'TuesDay', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        element.datetime = weekDays[new Date(element.datetime).getDay()];
    });
}
function setHours(apiData){
    hours = [];
    for(let i=0; i<10; i++){
        let hour = {temp:0,icon:'',time:''};
        hour.temp = Math.round(apiData.list[i].main.temp);
        hour.icon = apiData.list[i].weather[0].main.toLowerCase();
        hour.time = time(apiData.list[i].dt_txt.slice(11));
        hours.push(hour);
    }
}
function time(timeString){
    return new Date('1970-01-01T' + timeString + 'Z')
    .toLocaleTimeString('en-US',{timeZone:'UTC',hour12:true,hour:'numeric',minute:'numeric'});
}