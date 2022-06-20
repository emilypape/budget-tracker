// create a variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget-tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function (event) {
  // save reference to the database
  const db = event.target.result;
  // create an object store (table), set it up to have an auto incrementing primary key
  db.createObjectStore('new_budget', { autoIncrement: true });
};

// upon success
request.onsuccess = function (event) {
  // when db is created with its object store, save reference to db in global variable
  db = event.target.result;
  // check if app is online, if yes send all local db data to api
  if (navigator.online) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  // log error
  console.log(event.target.errorCode);
};

// This function will execute if we attempt to submit a new budget when there's no internet
function saveRecord(record) {
  // open new transaction with the database with read and write permissions
  const transaction = db.transaction(['new_budget'], 'readwrite');

  // access the object store for `new_budjet`
  const budgetObjectStore = transaction.objectStore('new_budget');

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function uploadBudget() {
  // open a transaction on your db
  const transaction = db.transaction(['new_budget'], 'readwrite');

  // acess your object store
  const budgetObjectStore = transaction.objectStore('new_budget');

  // get all records from store and set to a  variable
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in the store lets send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_budget'], 'readwrite');
          // access the new object store
          const budgetObjectStore = transaction.objectStore('new_budget');
          // clear all items in your store
          budgetObjectStore.clear();
          alert('All saved budgets have been submitted');
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);
