const MongoClient = require('mongodb').MongoClient;
const request = require('request-promise');
const assert = require('assert');
const cheerio = require('cheerio');

const cryptoKittiesClient = require('./cryptokitties-client');

const kittySalesUrl = `http://kittysales.herokuapp.com/data?offset=0&count=25&filterBy=kittenID&filterValue=`

MongoClient.connect('mongodb://192.168.16.33:27017/', (err, db) => {
    assert.equal(null, err);

    let database = db.db('cryptokitties');
    let startId = 120;
    let endId = 130;
    let id = startId;
    let kittyCount = endId - startId;

    let interval = setInterval(function() {
        console.log(`Fetching kitty with id ${ id }.`);
        getKitten(id, (kitten) => {
            if (kitten !== 404) {
                getKittenSalesData(id, (sales) => {
                    kitten.sales = sales;
                    insertKitten(kitten, database, () => {
                        console.log(`${ kittyCount } - Captured kitty ${ kitten.name } [${ kitten.id }]!`);
                        kittyCount--;
                    });
                });
            } else {
                console.log(`Kitten ${ id } not found.`)
            }
        });
        id++
        if(id > endId) {
            clearInterval(interval);
            while()
            setTimeout(() => {
                db.close();
                console.log('Complete.');
            }, 2000);
        }
    }, 1000);
});

const getKitten = (id, callback) => {
    cryptoKittiesClient.getKitten(id).then((kitten) => {
        callback(kitten);
    }).catch((err) => {
        callback(err.statusCode)
    });
};

const getKittenSalesData = (id, callback) => {
    request(`${ kittySalesUrl}${ id }`, (err, res, json) => {
        if (err) {
            console.log(err);
        }
        let js = JSON.parse(json);
        callback(js.sales);
    });
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

const wait = (ms) => {
    var waitDateOne = new Date();
    while ((new Date()) - waitDateOne <= ms) {
    }
}