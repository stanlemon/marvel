
var nconf = require('nconf');
var nomnom = require('nomnom');
var http = require('http');
var crypto = require('crypto');
var yaml = require('yamljs');

module.exports = new Marvel();

/**
 * Browse the Marvel Developer API
 *
 * For more information checkout http://developer.marvel.com/docs
 */
function Marvel() {}

Marvel.prototype.configure = function() {
    nconf
        .argv()
        .env()
        .file({ file: '~/.marvel.json' })
        .file({ file: process.cwd() + '/marvel.json' })
        .defaults({
            publickey: null,
            privatekey: null
        })
    ;

    this.publicKey = nconf.get('publickey');
    this.privateKey = nconf.get('privatekey');
    this.params = {};
    
    if (this.publicKey === null || this.privateKey === null) {
        console.log(
            "You must specify a public and private key for accessing the Marvel API. " +
            "If you do not have one please check out http://developer.marvel.com"
        );
        process.exit(1);
    }
};

Marvel.prototype.run = function() {
    var app = this;

    this.configure();

    nomnom
        .script('marvel')
        .nocommand()
            .option('publickey', {
               help: 'Public key for accessing the Marvel API'
            })
            .option('privatekey', {
               help: 'Private key for accessing the Marvel API'
            })
            .callback(function(){
                console.log("Try something like this... ./marvel characters --nameStartsWith=Thor\n");
            });
    ;

    ['characters', 'comics', 'creators', 'events', 'series', 'stories'].forEach(function(command) {
        nomnom
            .command(command)
                .callback(function(opts){
                    app[command].apply(app, [app.makeParams(opts)]);
                });
        ;
    });

    nomnom.parse();
};

Marvel.prototype.makeParams = function(opts) {
    var params = [];
    Object.keys(opts).forEach(function(k){
        var v = opts[k];

        if (isNaN(parseInt(k)) && k != '_' && k != 'publickey' && k != 'privatekey') {
            params[k] = v;
        }
    });
    return params;
}

Marvel.prototype.makeUrl = function(path, params) {
    var md5 = crypto.createHash('md5');
    var ts = Date.now();

    md5.update(ts + this.privateKey + this.publicKey)

    var hash = md5.digest('hex');

    var url = path + '?ts=' + ts + '&apikey=' + this.publicKey + '&hash=' + hash;

    if (params !== undefined) {
        for (var key in params) {
            url += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
        }
    }

    return url;
};

Marvel.prototype.makeRequest = function(path, params, callback) {
    var options = {
        host: 'gateway.marvel.com',
        path: this.makeUrl('/v1/public/' + path, params)
    };

    http.request(options, function(response) {
        var str = '';

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            var response = JSON.parse(str);
            
            callback(response);
        });
    }).end();
};

Marvel.prototype.renderResponse = function(response) {
    if (response.code !== undefined && response.message !== undefined) {
        console.log(response.message);
        process.exit(1);
    }

    console.log(response.attributionText);
    console.log('');

    response.data.results.map(function(result){
        var r = {};

        Object.keys(result).filter(function(k, i){
            var v = result[k];

            if (v !== null && v !== '' &&
                (!Array.isArray(v) || (Array.isArray(v) && v.length > 0)) && 
                (typeof v !== 'object' || (typeof v === 'object' && Object.keys(v).length > 0))
            ) {
                r[k] = v;
            }
        });

        console.log( yaml.stringify(r, 6, 2) );
        console.log('');
    });
};

Marvel.prototype.characters = function(params) {
    this.makeRequest('characters', params, this.renderResponse);
};

Marvel.prototype.comics = function(params) {
    this.makeRequest('comics', params, this.renderResponse);
};

Marvel.prototype.creators = function(params) {
    this.makeRequest('creators', params, this.renderResponse);
};

Marvel.prototype.events = function(params) {
    this.makeRequest('events', params, this.renderResponse);
};

Marvel.prototype.series = function(params) {
    this.makeRequest('series', params, this.renderResponse);
};

Marvel.prototype.stories = function(params) {
    this.makeRequest('stories', params, this.renderResponse);
};
