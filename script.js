"use strict";

async function main() {

    //variabler med "main"-scope:

    let countryList;
    let cityList;
    let visitedList = [];

    //Hämtar listan på länder från JSON via fetch och lagrar den i "main"-scope

    let response1 = await fetch('./json/land.json');
    countryList = await response1.json();

    //Hämtar listan på städer från JSON via fetch

    let response2 = await fetch('./json/stad.json');
    cityList = await response2.json();

    makeStartView(); //anrop som genererar landningsvyn

    async function makeStartView() {

        //Skapar Vy 1: meny som visar länder
        //skapar divs "heading", "main" och "countries"

        let body = document.getElementById("body");
        body.innerHTML = `<div id="heading"><h1>Städer och länder</h1></div>` +
            `<div id="countries"></div><div id="main"></div>`;

        let output = "";

        for (let i = 0; i < countryList.length; i++) {
            output += `<div class="countryItem"><button type="button" id="countryBut${i}" class="countryBtn btn btn-secondary btn-lg"
            >${countryList[i].countryname}</button>
            </div>`;
        }

        output += `<div class="countryItem">
        <button type="button" id="countryButVisit" class="countryBtn btn btn-primary btn-lg">Städer
            jag besökt</button></div>`;

        document.getElementById("countries").innerHTML = output;

        //skapar event listeners för att göra knapparna funktionella

        for (let i = 0; i < countryList.length; i++) {

            document.getElementById("countryBut" + i).addEventListener("click", function () {
                makeCityView(i + 1); //problem
            });
        }

        //funktionalitet till "städer jag besökt"-knappen

        document.getElementById("countryButVisit").addEventListener("click", function () {
            makeVisitedView();
        });

    }

    async function makeCityView(countryId) {

        //Skapar Vy 2: meny som visar städer sorterade i alfabetisk ordning.
        //suddar sidinnehåll förutom navigation innan den gör något annat.

        eraseMain();

        let output = "";

        document.getElementById("main").innerHTML = `<div class="cityDiv" id="cityDiv"></div>`;

        for (let i = 0; i < cityList.length; i++) {

            if (cityList[i].countryid === countryId) {

                output += `<button type="button" class="cityBut" id="cityBut${cityList[i].id}">${cityList[i].stadname}</button>`;
            }
        }

        document.getElementById("cityDiv").innerHTML = output;

        //skapar event listners för att göra knapparna funktionella

        for (let i = 0; i < cityList.length; i++) {

            if (cityList[i].countryid === countryId) {

                document.getElementById("cityBut" + cityList[i].id).addEventListener("click", function () {
                    makeCityInfoView(cityList[i].id);
                });
            }
        }
    }

    async function makeCityInfoView(cityID) {

        //Skapar Vy 3: Vy som ger information om viss stad.

        eraseMain();

        let main = document.getElementById("main");

        //eftersom index i arrays startar med 0:

        let index = cityID - 1;

        //följande gör att länderna blir utbyggbara, eftersom "Sverige" etc. inte blir hårdkodat:

        let displayName = countryList[cityList[index].countryid - 1].countryname;
        let cityDisplayName = cityList[cityID - 1].stadname;
        let revName = await reverseName(cityDisplayName);

        main.insertAdjacentHTML("beforeend", "<div id='cityInfo'></div>");

        document.getElementById("cityInfo").innerHTML = `<p id="infoP"><span>${cityList[cityID - 1].stadname}` +
            `</span> är en stad i ${displayName} där det bor ${cityList[cityID - 1].population} invånare.</p>` +
            `Ungefär ${Math.round(cityList[cityID - 1].population / 2)} av dem är kvinnor och de flesta andra är män.` +
            `<br>Har du tänkt på att "${cityList[cityID - 1].stadname}" blir "${revName}" baklänges?` +
            `<button type="button" id="visitBut" class="btn btn-primary">Lägg till besökt-listan</button>`;

        //funktionalitet till knappen

        document.getElementById("visitBut").addEventListener("click", function () {
            storeCity(cityID);
        });

    }

    async function storeCity(cityID) {

        //hanterar användarinteraktion vid sparning av besökt stad till localStorage
        //söker för att kolla om värdet inte redan finns

        let already;

        try { already = JSON.parse(localStorage.getItem("visitedList")).includes(cityID); }
        catch { already = false; }

        //ger feedback till användaren (samma stad kan ändå komma med två gånger i array, men det hanteras senare)

        if (already === false) {
            document.getElementById("visitBut").innerHTML = `Tillagd`;
            visitedList.push(cityID); //behövs bara första gången någon sparar en stad, inmatning i array sköts därefter
            //av updateLocalStorage() efter anrop från storeCity()
        }
        else if (already === true) {
            document.getElementById("visitBut").innerHTML = `Redan tillagd!`;
        }

        updateLocalStorage(cityID);
    }

    async function updateLocalStorage(cityID) {

        //Denna metod matar in besökta städer i localStorage
        //om det finns lagrade besökta städer sedan tidigare uppdateras array

        if (localStorage.getItem("visitedList") !== null) {
            let prevList = JSON.parse(localStorage.getItem("visitedList"));
            prevList.push(cityID);
            visitedList = prevList;
            localStorage.setItem("visitedList", JSON.stringify(visitedList))
        }

        //om det inte finns lagrade besökta städer sedan tidigare skapas array

        else if (localStorage.getItem("visitedList") === null) {
            localStorage.setItem("visitedList", JSON.stringify(visitedList));
        }

    }

    async function makeVisitedView() {

        //Skapar Vy 4: Vy som visar de städer som besökts
        //suddar sidinnehåll förutom navigation innan den gör något annat.

        eraseMain();

        //skapar sidinnehåll

        document.getElementById("main").innerHTML = `<div id='visitedDiv'><h3 id='visitedHead'> Du har besökt följande städer: </h3><ul id="visitedUl"></ul></div>` +
            ` <div id="countDiv"><h4> Du kan ha råkat träffa detta antal människor:</h4><p id="countSum"></p></div>` +
            `<div id="eraseDiv"><button type="button" id="eraseBut" class="btn btn-primary btn-lg">Rensa historik</button></div>`;

        //funktionalitet för suddknapp

        document.getElementById("eraseBut").addEventListener("click", function () {
            clearHistory();
        });

        //Tar bort eventuella dubbla inmatningar av samma stad i arrayen

        let unSetList = JSON.parse(localStorage.getItem("visitedList"));
        let retrievedList = [...new Set(unSetList)];
        // console.log("retrieved", retrievedList);

        // skriver ut lista på besökta städer

        let output = "";

        for (let i = 0; i < retrievedList.length; i++) {
            output += `<li>${cityList[retrievedList[i] - 1].stadname}</li>`;
        }

        if (output === "") {

            //Hantering av fall då det inte finns några besökta städer

            document.getElementById("visitedHead").innerHTML = "Du har inte besökt några städer";
            document.getElementById("eraseBut").remove();
        }

        document.getElementById("visitedUl").innerHTML = output;

        //samt summerar även befolkning:

        let output2 = 0;

        for (let i = 0; i < retrievedList.length; i++) {
            output2 += cityList[retrievedList[i] - 1].population;
        }

        document.getElementById("countSum").innerHTML = output2;
    }

    async function clearHistory() {

        // rensar historik och tömmer lista på besökta städer

        visitedList = [];
        localStorage.removeItem("visitedList");
        makeVisitedView();
    }

    function eraseMain() {

        // suddar div med id ”main”.
        document.getElementById("main").innerHTML = "";
    }

    async function reverseName(name) {

        //Skapar omvända namn på städer

        let revName = "";
        for (let i = name.length - 1; i >= 0; i--) {
            revName += name[i];
        }
        revName = revName.toLowerCase();

        //gör första bokstaven stor
        async function makeBig(name) {
            return name.charAt(0).toUpperCase() + name.slice(1);
        }

        return makeBig(revName);
    }
}

//Inledande anrop när "body" laddas
main();