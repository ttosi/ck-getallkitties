const request = require('request-promise');
const DEFAULT_URL = 'https://kittysales.herokuapp.com/';

function KittySalesClient(opts = {}) {
    let self = {};
    self.opts = opts;
    self.opts.url = self.opts.url || DEFAULT_URL
    self.credentials = self.opts.credentials || {};

    self.skeleton = (url, method = "GET") => {
        console.log(self.opts.url + url)
        return {
            method: method,
            uri: self.opts.url + url,
            headers: {
                "Authorization": self.credentials.jwt
            },
            json: true
        };
    };

    self.getKitten = function (id) {
        let o = self.skeleton(`data?offset=0&count=25&filterBy=kittenID&filterValue=${ id }`)
        return request(o);
    };

    return self;
};

module.exports = KittySalesClient();