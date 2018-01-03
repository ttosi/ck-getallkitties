// packages
const MongoClient = require('mongodb').MongoClient;
const request = require('request-promise');
const assert = require('assert');
const args = require('commander');
const readline = require('readline');
const fs = require('fs');
require('dotenv').config();

// modules
const cryptoKittiesClient = require('./cryptokitties-client');

// config
const kittySalesUrl = 'http://kittysales.herokuapp.com/data?offset=0&count=25&filterBy=kittenID&filterValue=';
const kittyExplorerUrl = 'http://www.kittyexplorer.com/api/kitties/';
const requestIntervalMillis = 150;
let errorLogFileName;

args.version('0.0.1')
    .option('-s, --start-id [n]', 'Starting kitten id')
    .option('-e, --end-id [n]', 'Ending kitten id')
    .option('-fl, --from-log [value]', 'Process kittens from error.log')
    .parse(process.argv);

let idsToProcess = getKittenIds();

console.time("runtime");
MongoClient.connect(process.env.DB, (err, db) => {
    assert.equal(null, err);
    const database = db.db('cryptokitties');

    // unique log file name for this run
    errorLogFileName = `errors_${ args.startId }-${ args.endId }_${ new Date().getTime() }.log`;
    
    let kittyRequestsRmaining = idsToProcess.length;
    
    // on every { requestIntervalMillis }
    // 1. check if kitty already exists in local db
    // 2. query cryptokittens api to get kitten
    // 3. query kittysales to get sales data
    // 4. insert kitten into db
    let getKittenInterval = setInterval(() => {
        let id = idsToProcess.shift();
        isKittenCaptured(id, database, (isCaptured) => {
            // don't make request for a kitten we already have
            if(!isCaptured) {
                getKitten(id).then((kitten) => {
                    getKittenSalesData(id).then((res) => {
                        kitten.sales = JSON.parse(res).sales;
                        //kitten.sales = JSON.parse(res);
                        insertKitten(kitten, database, () => {
                            kittyRequestsRmaining--;
                            console.log(`Captured kitty ${ kitten.name } - ${ kitten.id } (remaining ${ kittyRequestsRmaining })`);
                        });
                    }).catch((err) => {
                        kittyRequestsRmaining--;
                        console.error(`${ id },unable to get sales data`);
                        //logError(`${ id },unable to get sales data`);
                    });;
                }).catch((err) => {
                    kittyRequestsRmaining--;
                    console.error(`${ id },not found at cryptokitties.co`);
                    //logError(`${ id },not found at cryptokitties.co`);
                });
            } else {
                kittyRequestsRmaining--;
                console.log(`Already captured kitten ${ id }`);
            }
        });

        // all requests have been made, start polling when
        // { kittyRequestsRmaining } is zero, we're done
        if(idsToProcess.length === 0) {
            clearInterval(getKittenInterval);
            let waitToComplete = setInterval(() => {
                // all requested kittens captured, clean up & exit
                if (kittyRequestsRmaining === 0) {
                    clearInterval(waitToComplete);
                    db.close();
                    console.timeEnd("runtime");
                    console.log('Complete.');
                }
            }, 1000);
        }
    }, requestIntervalMillis);
});

// return a kitten from cryptokitties.co
const getKitten = (id, callback) => {
    return cryptoKittiesClient.getKitten(id);
};

// return array of all sales from kittysales
const getKittenSalesData = (id, callback) => {
    return request(`${ kittySalesUrl}${ id }`);
    //return request(`${ kittyExplorerUrl}${ id }`);
};

const isKittenCaptured = (id, db, callback) => {
    db.collection('kittens').findOne({ id: id }, (err, result) => {
        callback(result !== null);
    }); 
};

const insertKitten = (kitten, db, callback) => {
    db.collection('kittens').insertOne(kitten, (err, res) => {
        assert.equal(null, err);
        callback();
    });
};

// doh!
const logError = (err) => {
    fs.appendFileSync(`errors/${ errorLogFileName }`, `errors${ err },${ new Date().getTime() }\n`);
    console.error(err);
};

// if a start-id and end-id is provided, create array
// of individual ids within that range
// if a from-log file is provided, parse the csv
// file to create the array of ids
function getKittenIds() {
    let ids = [];
    if (args.startId && args.endId) {
        for(let id = parseInt(args.startId); id <= parseInt(args.endId); id++) {
            ids.push(id);
        }
    } else if (args.fromLog) {
        let file = fs.readFileSync(args.fromLog, 'utf8');
        let rows = file.split('\n');
        for(let index in rows) {
            ids.push(parseInt(rows[index].split(',')[0]));
        }
    } else {
        args.outputHelp();
        process.exit(1);
    }
    return ids;
};
