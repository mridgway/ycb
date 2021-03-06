/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true*/

var Y = require('yui').YUI({useSync: true}).use('json', 'oop', 'test'),
    libpath = require('path'),
    libfs = require('fs'),
    libycb = require('../index'),
    cases = {},
    A = Y.Assert,
    AA = Y.ArrayAssert,
    OA = Y.ObjectAssert;


function readFixtureFile(file){
    var path = libpath.join(__dirname, 'fixtures' , file);
    var data = libfs.readFileSync(path, 'utf8');
    return Y.JSON.parse(data);
}


function cmp(x, y, msg) {
    var i;
    if (Y.Lang.isArray(x)) {
        A.isArray(x, msg || 'first arg should be an array');
        A.isArray(y, msg || 'second arg should be an array');
        A.areSame(x.length, y.length, msg || 'arrays are different lengths');
        for (i = 0; i < x.length; i += 1) {
            cmp(x[i], y[i], msg);
        }
        return;
    }
    if (Y.Lang.isObject(x)) {
        A.isObject(x, msg || 'first arg should be an object');
        A.isObject(y, msg || 'second arg should be an object');
        A.areSame(Object.keys(x).length, Object.keys(y).length, msg || 'object keys are different lengths');
        for (i in x) {
            if (x.hasOwnProperty(i)) {
                cmp(x[i], y[i], msg);
            }
        }
        return;
    }
    A.areSame(x, y, msg || 'args should be the same');
}


cases = {

    name: 'ycb unit tests',

    setUp: function() {},

    tearDown: function() {},


    'test if we can use the module': function() {
        A.isTrue(libycb.version === '1.0.2');
    },


    'test _calculateHierarchy': function() {
        var dims = readFixtureFile('dimensions.json'),
            ycb = new libycb.Ycb(dims),
            flat = ycb._calculateHierarchy(['*'], dims[0].dimensions[6].lang);

        AA.itemsAreSame(['en', '*'], flat.en);
        AA.itemsAreSame(['en_CA', 'en', '*'], flat.en_CA);
        AA.itemsAreSame(['fr', '*'], flat.fr);
        AA.itemsAreSame(['fr_CA', 'fr_FR', 'fr', '*'], flat.fr_CA);
    },


    'test _calculateHierarchies': function() {
        var dims = readFixtureFile('dimensions.json'),
            ycb = new libycb.Ycb(dims),
            flat = ycb._dimensionHierarchies;


        AA.itemsAreSame(['en', '*'], flat.lang.en);
        AA.itemsAreSame(['en_CA', 'en', '*'], flat.lang.en_CA);
        AA.itemsAreSame(['fr', '*'], flat.lang.fr);
        AA.itemsAreSame(['fr_CA', 'fr_FR', 'fr', '*'], flat.lang.fr_CA);
    },


    'test _makeOrderedLookupList': function() {
        var dims = readFixtureFile('dimensions.json'),
            ycb = new libycb.Ycb(dims),
            context, list;
        context = {
            'region': 'ir',
            'environment': 'preproduction',
            'lang': 'fr_CA'
        };
        list = ycb._makeOrderedLookupList(context, {useAllDimensions: true});
        AA.itemsAreSame([
            'preproduction',
            '*'
        ], list.environment);
        AA.itemsAreSame([
            'fr_CA',
            'fr_FR',
            'fr',
            '*'
        ], list.lang);
        AA.itemsAreSame([
            'ir',
            'gb',
            '*'
        ], list.region);
    },


    'test _getLookupPath': function() {
        var dims = readFixtureFile('dimensions.json'),
            ycb = new libycb.Ycb(dims),
            context, path;
        context = {
            'region': 'ir',
            'environment': 'preproduction',
            'lang': 'fr_FR'
        };
        path = ycb._getLookupPath(context, {useAllDimensions: true});

        A.areSame('preproduction/*/*/*/*/*/fr_FR/ir/*/*/*', path);
    },


    'test _getLookupPaths': function() {
        var dims = readFixtureFile('dimensions.json'),
            ycb = new libycb.Ycb(dims),
            context, paths, expected;
        context = {
            'region': 'ir',
            'environment': 'preproduction',
            'lang': 'fr_FR'
        };
        paths = ycb._getLookupPaths(context, {useAllDimensions: true});

        expected = [
            "*/*/*/*/*/*/*/*/*/*/*",
            "*/*/*/*/*/*/*/gb/*/*/*",
            "*/*/*/*/*/*/*/ir/*/*/*",
            "*/*/*/*/*/*/fr/*/*/*/*",
            "*/*/*/*/*/*/fr/gb/*/*/*",
            "*/*/*/*/*/*/fr/ir/*/*/*",
            "*/*/*/*/*/*/fr_FR/*/*/*/*",
            "*/*/*/*/*/*/fr_FR/gb/*/*/*",
            "*/*/*/*/*/*/fr_FR/ir/*/*/*",
            "preproduction/*/*/*/*/*/*/*/*/*/*",
            "preproduction/*/*/*/*/*/*/gb/*/*/*",
            "preproduction/*/*/*/*/*/*/ir/*/*/*",
            "preproduction/*/*/*/*/*/fr/*/*/*/*",
            "preproduction/*/*/*/*/*/fr/gb/*/*/*",
            "preproduction/*/*/*/*/*/fr/ir/*/*/*",
            "preproduction/*/*/*/*/*/fr_FR/*/*/*/*",
            "preproduction/*/*/*/*/*/fr_FR/gb/*/*/*",
            "preproduction/*/*/*/*/*/fr_FR/ir/*/*/*"
        ];
        AA.itemsAreEqual(expected, paths);
    },


    'test _processRawBundle': function() {
        var bundle, ycb;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json')[0]);
        ycb = new libycb.Ycb(bundle);

        A.areSame('YRB_YAHOO', ycb.settings['*/*/*/*/*/*/*/*/*/*/*'].title_key);
        A.isNotUndefined(ycb.dimensions[7].region.us);
    },


    'test _processRawBundle with dupe error': function() {
        var bundle, ycb;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'))
            .concat(readFixtureFile('simple-2.json'));
        ycb = new libycb.Ycb(bundle);

        A.areSame('YRB_YAHOO_2nd', ycb.settings['*/*/*/*/*/*/*/*/*/*/*'].title_key);
        A.areSame('yahoo.png', ycb.settings['*/*/*/*/*/*/*/*/*/*/*'].logo1);
        A.areSame('tests/fixtures/simple-2.json', ycb.settings['*/*/*/*/*/*/*/*/*/*/*'].__ycb_source__);
        A.isNotUndefined(ycb.dimensions[7].region.us);
    },


    'test _processRawBundle with many settings': function() {
        var bundle, ycb;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'))
            .concat(readFixtureFile('simple-3.json'));
        ycb = new libycb.Ycb(bundle);

        A.areSame('YRB_YAHOO', ycb.settings['*/*/*/*/*/*/*/*/*/*/*'].title_key);
        A.areSame('http://fr.yahoo.com', ycb.settings['*/*/*/*/*/*/*/fr/*/*/*'].links.home);
        A.areSame('yahoo_bt_FR.png', ycb.settings['*/*/*/*/*/*/*/fr/*/*/bt'].logo);
        A.isNotUndefined(ycb.dimensions[7].region.us);
    },


    'test _applySubstitutions': function() {
        var config, ycb;
        config = readFixtureFile('substitutions.json');
        ycb = new libycb.Ycb([]);
        ycb._applySubstitutions(config);

        A.isTrue(config.key0.key4 === 'The value of key0.key2 is value2');
        A.isTrue(config.key5.key4 === 'The value of key0.key2 is value2');
        A.isTrue(config.key6.key7.key8.key4 === 'The value of key0.key2 is value2');
        A.isTrue(config.key6.key9[2] === 'The value of key0.key2 is value2');
        A.isTrue(config['$$key0.key1$$'] === '--YCB-SUBSTITUTION-ERROR--');
        A.isTrue(config.key10.key11.key4 === 'The value of key0.key2 is value2');
        A.isTrue(config.key11[4] === 'The value of key0.key2 is value2');
        A.isTrue(config.key8.key4 === 'The value of key0.key2 is value2');
    },

    'test _applySubstitutions against ./fixtures/subs-expected.json': function() {
        var config = require('./fixtures/substitutions.json'),
            expected = require('./fixtures/subs-expected.json'),
            ycb;

        ycb = new libycb.Ycb([]);
        ycb._applySubstitutions(config);
        cmp(config, expected);
    },


    'test _applySubstitutions replaces': function() {
        var ycb = new libycb.Ycb([]),
            config,
            expected;

        config = {
            key0: {
                key1: 'value1',
                key2: 'value2',
                key3: '$$key0.key1$$',
                key4: 'values of keys 1-3: $$key0.key1$$, $$key0.key2$$, $$key0.key3$$'
            }
        };

        expected = {
            key0: {
                key1: 'value1',
                key2: 'value2',
                key3: 'value1',
                key4: 'values of keys 1-3: value1, value2, value1'
            }
        };

        ycb._applySubstitutions(config);
        cmp(config, expected);
    },

    'test _applySubstitutions empty string': function() {
        var ycb = new libycb.Ycb([]),
            config,
            expected;

        config = {
            key0: {
                key1: 'value1',
                key2: '',
                key3: '$$key0.key1$$',
                key4: '$$key0.key2$$$$key0.key2$$',
                key5: 'values of keys 1-4: $$key0.key1$$, $$key0.key2$$, $$key0.key3$$, $$key0.key2$$$$key0.key2$$'
            }
        };

        expected = {
            key0: {
                key1: 'value1',
                key2: '',
                key3: 'value1',
                key4: '',
                key5: 'values of keys 1-4: value1, , value1, '
            }
        };

        ycb._applySubstitutions(config);
        cmp(config, expected);
    },


    'test _applySubstitutions wrt ./fixtures/subs-expected.json': function() {
        var config = require('./fixtures/substitutions.json'),
            expected = require('./fixtures/subs-expected.json'),
            ycb;

        ycb = new libycb.Ycb([]);
        ycb._applySubstitutions(config);
        cmp(config, expected);
    },


    'test with substitutions': function() {
        var bundle, config, expected;
        bundle = readFixtureFile('substitutions.json');
        bundle.settings = ["master"];
        bundle = [bundle];
        bundle = readFixtureFile('dimensions.json').concat(bundle);

        config = (new libycb.Ycb(bundle)).read(bundle, {
            applySubstitutions: true
        });
        expected = readFixtureFile('subs-expected.json');

        cmp(config, expected);
    },


    'test with noSubstitutions': function() {
        var bundle, config, expected;
        bundle = readFixtureFile('substitutions.json');
        bundle.settings = ["master"];
        bundle = [bundle];
        bundle = readFixtureFile('dimensions.json').concat(bundle);

        config = (new libycb.Ycb(bundle)).read(bundle, {
            applySubstitutions: false
        });
        expected = readFixtureFile('substitutions.json');

        cmp(config, expected);
    },


    'test if we can use a simple config': function() {
        var bundle, config;
        bundle = readFixtureFile('simple-1.json');
        config = libycb.read(bundle);

        A.areSame('YRB_YAHOO', config.title_key);
        A.areSame('http://www.yahoo.com', config.links.home);
        A.areSame('http://mail.yahoo.com', config.links.mail);
        A.isUndefined(config.__ycb_source__);
    },


    'test if we can use a simple config with dimensions': function() {
        var bundle, config;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'));
        config = libycb.read(bundle);

        A.areSame('YRB_YAHOO', config.title_key);
        A.areSame('http://www.yahoo.com', config.links.home);
        A.areSame('http://mail.yahoo.com', config.links.mail);
    },


    'test if we can use a simple config with dimensions and extra settings': function() {
        var bundle, config;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'))
            .concat(readFixtureFile('simple-3.json'));
        config = libycb.read(bundle);

        A.areSame('YRB_YAHOO', config.title_key);
        A.areSame('http://www.yahoo.com', config.links.home);
        A.areSame('http://mail.yahoo.com', config.links.mail);
    },


    'test if we can use a simple config with dimensions and context IR': function() {
        var bundle, context, config;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'))
            .concat(readFixtureFile('simple-3.json'));
        context = {
            'region': 'ir',
            'environment': 'preproduction',
            'lang': 'fr_FR'
        };
        config = libycb.read(bundle, context);
        A.areSame('YRB_YAHOO', config.title_key);
        A.areSame('yahoo_FR.png', config.logo);
        A.areSame('http://gb.yahoo.com', config.links.home);
        A.areSame('http://gb.mail.yahoo.com', config.links.mail);
    },


    'test if we can use a simple config with dimensions and context FR': function() {
        var bundle, context, config;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'))
            .concat(readFixtureFile('simple-3.json'));
        context = {
            'region': 'fr',
            'environment': 'preproduction',
            'lang': 'fr_FR'
        };
        config = libycb.read(bundle, context);

        A.areSame('YRB_YAHOO', config.title_key);
        A.areSame('yahoo_FR.png', config.logo);
        A.areSame('http://fr.yahoo.com', config.links.home);
        A.areSame('http://fr.mail.yahoo.com', config.links.mail);
    },


    'test if we can use a simple config with dimensions and context GB & BT': function() {
        var bundle, context, config;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'))
            .concat(readFixtureFile('simple-3.json'));
        context = {
            'region': 'gb',
            'environment': 'preproduction',
            'flavor': 'bt'
        };
        config = libycb.read(bundle, context);

        A.areSame('YRB_YAHOO', config.title_key);
        A.areSame('yahoo_bt_GB.png', config.logo);
        A.areSame('http://gb.yahoo.com', config.links.home);
        A.areSame('http://gb.mail.yahoo.com', config.links.mail);
    },


    'test ycb accepts falsey config values': function() {
        var bundle,
            config,
            foo = {
                settings: [ 'master' ],
                title_key: 'YRB_YAHOO',
                'data-url': 'http://service.yahoo.com',
                logo: 'yahoo.png',
                false_ok: false,
                zero: 0,
                undef: undefined,
                links: { home: 'http://www.yahoo.com', mail: 'http://mail.yahoo.com' }
            };

        bundle = readFixtureFile('dimensions.json').concat([foo]);
        config = libycb.read(bundle);

        A.areEqual(config['data-url'], foo['data-url']);
        A.isTrue('false_ok' in config);
        A.areEqual(config.false_ok, foo.false_ok);
        A.isTrue('undef' in config);
        A.areEqual(config.undef, foo.undef);
        A.isTrue('zero' in config);
        A.areEqual(config.zero, foo.zero);
    },


    'skip unused dimensions': function() {
        var bundle, ycb;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'))
            .concat(readFixtureFile('simple-3.json'));
        ycb = new libycb.Ycb(bundle);

        A.areSame(3, Object.keys(ycb.dimsUsed).length);
        A.isNotUndefined(ycb.dimsUsed.region);
        A.areSame(4, Object.keys(ycb.dimsUsed.region).length);
        A.isTrue(ycb.dimsUsed.region.ca);
        A.isTrue(ycb.dimsUsed.region.gb);
        A.isTrue(ycb.dimsUsed.region.fr);
        A.isTrue(ycb.dimsUsed.region.ir);
        A.areSame(3, Object.keys(ycb.dimsUsed.lang).length);
        A.isTrue(ycb.dimsUsed.lang.fr);
        A.isTrue(ycb.dimsUsed.lang.fr_FR);
        A.isTrue(ycb.dimsUsed.lang.fr_CA);
        A.areSame(2, Object.keys(ycb.dimsUsed.flavor).length);
        A.isTrue(ycb.dimsUsed.flavor.att);
        A.isTrue(ycb.dimsUsed.flavor.bt);

        var context = {
            'region': 'ir',
            'environment': 'preproduction',
            'lang': 'fr_FR'
        };
        var paths = ycb._getLookupPaths(context, {});
        var expected = [
            '*/*/*/*/*/*/*/*/*/*/*',
            '*/*/*/*/*/*/*/gb/*/*/*',
            '*/*/*/*/*/*/*/ir/*/*/*',
            '*/*/*/*/*/*/fr/*/*/*/*',
            '*/*/*/*/*/*/fr/gb/*/*/*',
            '*/*/*/*/*/*/fr/ir/*/*/*',
            '*/*/*/*/*/*/fr_FR/*/*/*/*',
            '*/*/*/*/*/*/fr_FR/gb/*/*/*',
            '*/*/*/*/*/*/fr_FR/ir/*/*/*'
        ];
        AA.itemsAreEqual(expected, paths);
    },


    'get dimensions': function() {
        var bundle, ycb;
        bundle = readFixtureFile('dimensions.json');
        ycb = new libycb.Ycb(Y.clone(bundle, true));
        cmp(bundle[0].dimensions, ycb.getDimensions());
    },


    'walk settings': function() {
        var bundle, ycb;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'))
            .concat(readFixtureFile('simple-3.json'));
        ycb = new libycb.Ycb(bundle);
        var ctxs = {};
        ycb.walkSettings(function(settings) {
            ctxs[JSON.stringify(settings)] = true;
            return true;
        });
        A.areSame(9, Object.keys(ctxs).length);
        A.isTrue(ctxs['{}']);
        A.isTrue(ctxs['{"region":"ca"}']);
        A.isTrue(ctxs['{"region":"gb"}']);
        A.isTrue(ctxs['{"lang":"fr"}']);
        A.isTrue(ctxs['{"region":"fr"}']);
        A.isTrue(ctxs['{"flavor":"att"}']);
        A.isTrue(ctxs['{"region":"ca","flavor":"att"}']);
        A.isTrue(ctxs['{"region":"gb","flavor":"bt"}']);
        A.isTrue(ctxs['{"region":"fr","flavor":"bt"}']);
    },


    'clone object': function() {
        var bundle, ycb;
        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-1.json'));
        ycb = new libycb.Ycb(bundle);

        var obj, copy;
        obj = {
            inner: {
                string: "value",
                number: 1,
                fn: function() {}
            },
            list: ['a', 'b', 'c']
        };
        copy = ycb._cloneObj(obj);

        A.areNotSame(obj, copy);

        A.areNotSame(obj.inner, copy.inner);
        OA.areEqual(obj.inner, copy.inner);

        A.areSame(obj.inner.string, copy.inner.string);
        A.areSame(obj.inner.number, copy.inner.number);
        A.areSame(obj.inner.fn, copy.inner.fn);

        A.areNotSame(obj.list, copy.list);
        AA.itemsAreEqual(obj.list, copy.list);
    },

    'test objectMerge': function () {
        var bundle,
            ycb;

        bundle = readFixtureFile('dimensions.json')
            .concat(readFixtureFile('simple-4.json'));
        ycb = new libycb.Ycb(bundle);
        var config = ycb.read({
            'lang': 'fr'
        });
        OA.areEqual({
            foo: 1,
            bar: 2,
            baz: 3,
            oof: null,
            rab: 0,
            zab: false
        }, config);
    },

    'unknown dimension values dont polute master': function() {
        var bundle,
            ycb,
            config;

        bundle = readFixtureFile('dimensions.json');
        bundle.push({
            settings: ['master'],
            appPort: 80
        });
        bundle.push({
            settings: ['environment:lkjsdflksdhlskdfs'],
            appPort: 81
        });
        ycb = new libycb.Ycb(bundle);
        config = ycb.read({});
        A.areSame(80, config.appPort);
    },

    'unknown dimension should be ignored': function() {
        var bundle,
            ycb,
            config;

        bundle = readFixtureFile('dimensions-other.json');
        bundle.push({
            settings: ['master'],
            appPort: 80
        });
        bundle.push({
            settings: ['unknown:value'],
            appPort: 81
        });
        ycb = new libycb.Ycb(bundle);
        config = ycb.read({ environment: 'desktop'});
        A.areSame(80, config.appPort);
    },

    'multi-level match': function() {
        var bundle,
            ycb,
            config;

        bundle = readFixtureFile('dimensions-other.json');
        bundle = bundle.concat([
            {
                "settings": [ "master" ],
                "appPort": 8666
            },
            {
                "settings": [ "environment:prod" ],
                "appPort": 80
            },
            {
                "settings": [ "environment:prod", "device:smartphone" ],
                "appPort": 8888
            },
            {
                "settings": [ "environment:prod", "device:desktop" ],
                "appPort": 8080
            }
        ]);
        ycb = new libycb.Ycb(bundle);
        config = ycb.read({});
        A.areSame(8666, config.appPort);
        config = ycb.read({
            environment: 'prod',
            device: 'smartphone'
        });
        A.areSame(8888, config.appPort);
        config = ycb.read({
            environment: 'prod',
            device: 'desktop'
        });
        A.areSame(8080, config.appPort);
        config = ycb.read({
            environment: 'prod'
        });
        A.areSame(80, config.appPort);
    }

};


Y.Test.Runner.add(new Y.Test.Case(cases));
Y.Test.Runner.subscribe(Y.Test.Runner.COMPLETE_EVENT, function (results) {
    var resultsXML = Y.Test.Runner.getResults(Y.Test.Format.XML);
    libfs.writeFileSync('./results.xml', resultsXML);
    if (results.results.failed > 0 || results.results.errors > 0) {
        process.exit(1);
    }
});

Y.Test.Runner.run();
