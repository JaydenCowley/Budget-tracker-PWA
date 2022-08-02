// variable to hold database connection
let db;
// establish connection to the budget database and set it to version 1
const request = indexedDB.open("budget", 1);

// if the version is changed this function will fire
request.onupgradeneeded = function (e) {
  // save the target result to the database
  const db = e.target.result;
  // object to store table called 'new_tran' which is set to autoincrement
  db.createObjectStore("new_tran", { autoIncrement: true });
};

// succesful connection
request.onsuccess = function (e) {
  // when the database is successfully created with its object store (reference onupgradeneeded funtion) or simply established a connection, save reference to the database in a global variable
  db = e.target.result;
};
// If an error accures console log the error
request.onerror = function (e) {
  console.log(e.target.errorCode);
};

// this function executes if the user attempts to send data with no internet
function saveRecord(record) {
  // open new transaction with db with read write permissions
  const transaction = db.transaction(["new_tran"], "readwrite");

  // access the object store from 'new_tran'
  const tranObjectStore = transaction.objectStore("new_tran");

  // add the record to the store
  tranObjectStore.add(record);
}

function uploadTran() {
  // open a transaction on your database
  const transaction = db.transaction(["new_tran"], "readwrite");

  // access the object store
  const tranObjectStore = transaction.objectStore("new_tran");

  // get records from store and set it to a variable
  const getAll = tranObjectStore.getAll();

  // upon successful .getAll() execution run this function
  getAll.onsuccess = function () {
    // if data in indexedDB store send to api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_tran"], "readwrite");
          // access the new_tran object
          const tranObjectStore = transaction.objectStore("new_tran");
          // clear all items in your store
          tranObjectStore.clear();

          alert("All saved transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for internet connection
window.addEventListener("online", uploadTran);