const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

MongoClient.connect(process.env.DB, (err, db) => {
    if(err) throw new Error(err); 

    const database = db.db('cryptokitties');
    const kitdb = database.collection('kittens');
    let processed = 0;

    if (fs.existsSync('features.dat')) fs.unlinkSync('features.dat');
    if (fs.existsSync('labels.dat')) fs.unlinkSync('labels.dat');

    kitdb.count((err, count) => {
        let numValid = 0;
        console.log(`processing ${count} kittens.`);
        kitdb.find().forEach((k) => {
            // generation,is_fancy,is_exclusive,fancy_type,cooldown_index,soldPrice,cattribute1,cattribute2,cattribute3,cattribute4,cattribute5,cattribute6,cattribute7,cattribute8,color
            if(k.cattributes.length === 8 && k.sales.length > 0) {
                let featureRow = `${k.generation},${k.is_fancy ? 1 : 0},${k.is_exclusive ? 1 : 0},${fancyTypes.indexOf(k.fancy_type)},${k.status.cooldown_index},`
                for(let i in k.cattributes) {
                    featureRow += `${cattributes.indexOf(k.cattributes[i].description)},`
                }
                featureRow += `${colors.indexOf(k.color)}\r\n`;

                fs.appendFileSync(`features.dat`, featureRow);
                fs.appendFileSync(`labels.dat`, `${k.sales[0].soldPrice}\r\n`);
                numValid++
            }

            processed++;
            if(processed === count) {
                console.log(`processed ${ numValid }.`)
                process.exit(1);
            }
        });
    });
});

// db.kittens.find(null, { sales: 1, cattributes: 1, _id: 0 });
// mongo.exe --host 192.168.16.33 --quiet cryptokitties --eval "db.kittens.find(null, { sales: 1, cattributes: 1, _id: 0 }).toArray()" > c:\temp\output.json

const fancyTypes = [ null, "Dracula", "DuCat", "Mistletoe", "ShipCat" ];
const colors = [ "bubblegum", "chestnut", "gold", "limegreen", "mintgreen", "sizzurp", "strawberry", "topaz" ];
const cattributes = [
    'aquamarine',
    'barkbrown',
    'beard',
    'belleblue',
    'bloodred',
    'bubblegum',
    'calicool',
    'cerulian',
    'chartreux',
    'chestnut',
    'chocolate',
    'cloudwhite',
    'coffee',
    'cottoncandy',
    'crazy',
    'cymric',
    'dali',
    'emeraldgreen',
    'fabulous',
    'gerbil',
    'gold',
    'googly',
    'granitegrey',
    'greymatter',
    'happygokitty',
    'himalayan',
    'jaguar',
    'kittencream',
    'laperm',
    'lemonade',
    'limegreen',
    'luckystripe',
    'mainecoon',
    'mauveover',
    'mintgreen',
    'munchkin',
    'oldlace',
    'orangesoda',
    'otaku',
    'peach',
    'persian',
    'pouty',
    'ragamuffin',
    'ragdoll',
    'raisedbrow',
    'royalblue',
    'royalpurple',
    'salmon',
    'saycheese',
    'scarlet',
    'shadowgrey',
    'simple',
    'sizzurp',
    'skyblue',
    'soserious',
    'sphynx',
    'spock',
    'strawberry',
    'swampgreen',
    'thicccbrowz',
    'tigerpunk',
    'tongue',
    'topaz',
    'totesbasic',
    'violet',
    'whixtensions',
    'wingtips',
    'wolfgrey'
];