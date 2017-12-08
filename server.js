const MongoClient = require('mongodb').MongoClient;
const request = require('request-promise');
const assert = require('assert');
const cheerio = require('cheerio');
const fs = require('fs')

const cryptoKittiesClient = require('./cryptokitties-client');

const kittySalesUrl = `http://kittysales.herokuapp.com/data?offset=0&count=25&filterBy=kittenID&filterValue=`

MongoClient.connect('mongodb://192.168.16.33:27017/', (err, db) => {
    assert.equal(null, err);

    let database = db.db('cryptokitties');
    let startId = 103;
    let endId = 106;
    let id = startId;
    let kittyCount = endId - startId + 1;

    let getCatInterval = setInterval(() => {
        getKitten(id).then((kitten) => {
            getKittenSalesData(id).then((res) => {
                let js = JSON.parse(res);
                kitten.sales = js.sales;
                insertKitten(kitten, database, () => {
                kittyCount--;
                console.log(`Captured kitty ${ kitten.name } (${ kitten.id })!`);
                });
            }).catch((err) => {
                kittyCount--;
                logError(`SKIPPING - Unable to get sales data for kitty ${ id }.`);
            });
        }).catch((err) => {
            kittyCount--;
            logError(`SKIPPNING - Kitty ${ id } not found.`);
        });

        id++

        if(id > endId) {
            clearInterval(getCatInterval);
            let waitToComplete = setInterval(() => {
                if(kittyCount === 0) {
                    clearInterval(waitToComplete);
                    db.close();
                    console.log('Complete.');
                }
            }, 1000);
        }
    }, 1000);
});

const getKitten = (id, callback) => {
    return cryptoKittiesClient.getKitten(id);
};

const getKittenSalesData = (id, callback) => {
   return request(`${ kittySalesUrl}${ id }`);
};

const insertKitten = (kitten, db, callback) => {
    db.collection('kittens').findOne({
        id: kitten.id
    }, (err, result) => {
        if (!result) {
            db.collection('kittens').insertOne(kitten, (err, res) => {
                assert.equal(null, err);
                callback();
            });
        } else {
            callback(kitten)
        }
    });
};

const logError = (err) => {
    fs.appendFileSync('error.log', `${ err }\n`);
    console.error(err);
};