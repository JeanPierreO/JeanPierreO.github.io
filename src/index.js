import $ from "jquery";
import idb from "idb";
import moment from "moment";


let toCurrency;
let fromCurrency;
let toValue = 0;
let fromValue = 0;
let fromValueEntered = 0;
let toValueEntered = 0;
let convertValue = 0;
let fromChanged = false;

const dbPromise = idb.open("keyval-store", 2, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore("countries", { keyPath: "currencyName" });
    case 1:
      var store = upgradeDB.createObjectStore("conversions", {
        keyPath: "key"
      });
  }
});

class App {
  constructor() {}
  init() {
    $(".currency-input-to").attr("disabled", true);
    $(".currency-input-from").attr("disabled", true);
    pullDBValues();
    registerServiceWorker();
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
    }).catch((err) => {
      console.log(err);
    });
  }
}

function fetchCountries() {
  fetch("https://free.currencyconverterapi.com/api/v5/countries")
    .then(response => {
      if (response.ok) {
        return Promise.resolve(response);
      } else {
        return Promise.reject(new Error("Failed to load"));
      }
    })
    .then(response => response.json()) // parse response as JSON
    .then(data => {
      populateDropdowns(data.results);
      populateDB(data.results);
    })
    .catch(function(error) {
    });
}

function populateDB(data) {
  for (let country in data) {
    let item = data[country];
    dbPromise.then(db => {
      const tx = db.transaction("countries", "readwrite");
      tx.objectStore("countries").put({
        keyPath: item.currencyName,
        currencyName: item.currencyName,
        currencyId: item.currencyId
      });

      return tx.complete;
    });
  }
}

function pullDBValues() {
  dbPromise
    .then(db => {
      return db
        .transaction("countries")
        .objectStore("countries")
        .getAll();
    })
    .then(data => {
      if (data.length) {
        populateDropdowns(data);
      } else {
        fetchCountries();
      }
    });
}

function populateDropdowns(data) {
  $.each(data, function(i, country) {
    let li = `<li class='dropdown-item' href='#' value="${
      country.currencyId
    }">${country.currencyName}</li>`;
    $(".dropdown-menu").append(li);
  });

  addDropwdownUpdateEvent();
}

function pullConversionID() {
  dbPromise
    .then(db => {
      return db
        .transaction("conversions")
        .objectStore("conversions")
        .get(`${fromCurrency}_${toCurrency}`);
    })
    .then(conversion => {
      if (conversion != undefined) {
        let timeAdded = conversion.timeAdded;
        if (moment().isAfter(moment(timeAdded).add(60, "minutes"))) {
          convertCurrency();
        } else {
          convertValue = conversion.convertValue;

          
      if(fromChanged){
        $(".currency-input-from").trigger("input");
      }else{
        $(".currency-input-to").trigger("input");
      }
        }
      } else {
        convertCurrency();
      }
    });
}

function addDropwdownUpdateEvent() {
  $(function() {
    $(".dropdown-menu li").click(function() {
      $(this)
        .closest(".currency-select")
        .find(".currency-text")
        .text($(this).text());
      $(this)
        .closest(".currency-select")
        .find(".currency-text")
        .val($(this).text());
    });
  });

  $("#currency-from li").on("click", function() {
    fromCurrency = $(this).attr("value");
    checkCurrencies();
  });

  $("#currency-to li").on("click", function() {
    toCurrency = $(this).attr("value");
    checkCurrencies();
  });

  $(".currency-input-from").on("input", function() {
    fromChanged = true;
    toValue = $(this).val() * convertValue;
    fromValueEntered = $(this).val();
    toValueEntered = 0;
    $(".currency-input-to").val(toValue);
  });

  $(".currency-input-to").on("input", function() {
    fromChanged = false;
    fromValue = $(this).val() / convertValue;
    toValueEntered = $(this).val();
    $(".currency-input-from").val(fromValue);
  });
}

function checkCurrencies() {
  if (toCurrency != undefined && fromCurrency != undefined) {
    pullConversionID();
    if (toValueEntered != undefined && toValueEntered > 0) {
      $(".currency-input-to").val(toValueEntered);
      if (fromValue != undefined) {
        $(".currency-input-to").trigger("input");
      }
    } else {
      $(".currency-input-from").val(fromValueEntered);
      if (fromValue != undefined) {
        $(".currency-input-from").trigger("input");
      }
    }
    $(".currency-input-to").attr("disabled", false);
    $(".currency-input-from").attr("disabled", false);
  }
}

function convertCurrency() {
  fetch(
    `https://free.currencyconverterapi.com/api/v5/convert?q=${fromCurrency}_${toCurrency}`
  )
    .then(response => {
      if (response.ok) {
        return Promise.resolve(response);
      } else {
        return Promise.reject(new Error("Failed to load"));
      }
    })
    .then(response => response.json())
    .then(data => {
      convertValue = data.results[`${fromCurrency}_${toCurrency}`].val;
      addConversion(`${fromCurrency}_${toCurrency}`);

      if(fromChanged){
        $(".currency-input-from").trigger("input");
      }else{
        $(".currency-input-to").trigger("input");
      }
      
    })
    .catch(function(error) {
    });
}

function addConversion(conversionId) {
  dbPromise.then(db => {
    const tx = db.transaction("conversions", "readwrite");
    tx.objectStore("conversions").put({
      key: conversionId,
      convertValue: convertValue,
      timeAdded: moment().format()
    });

    return tx.complete;
  });
}
const app = new App();

window.addEventListener("load", () => app.init());
