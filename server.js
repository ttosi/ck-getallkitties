const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const cryptoKittiesClient = require('./cryptokitties-client');
const kittySalesClient = require('./kittysales-client');

MongoClient.connect('mongodb://192.168.16.33:27017/', (err, db) => {
    assert.equal(null, err);
    
    let database = db.db('cryptokitties');
    let kittenId = 2;

    getKitten(kittenId, (kitten) => {
        console.log('got kitten');
        getKittenSalesData(kittenId, (sales) => {
            console.log('got sales');
            kitten.sales = sales;
            console.log(JSON.stringify(kitten))
        });
    });

    // insertKitten({
    //     name: 'kitty',
    //     age: 13
    // }, database, () => {
    //     console.log('inserted cat');
    //     db.close();
    // });
});

const getKitten = (id, callback) => {
    cryptoKittiesClient.getKitten(id).then(kitten => {
        callback(kitten);
    });
};

const getKittenSalesData = (id, callback) => {
    kittySalesClient.getKitten(id).then(response => {
        if (response.sales.length === 1) {
            callback(response.sales);
        }
    });
};

const insertKitten = (kitten, db, callback) => {
    db.collection('kittens').insertOne(kitten, (err, res) => {
        assert.equal(null, err);
        callback();
    });
};

const getAllKitties = function (startId) {

}