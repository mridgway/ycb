# Yahoo! Configuration Bundle

[![Build Status](https://secure.travis-ci.org/yahoo/ycb.png?branch=master)](http://travis-ci.org/yahoo/ycb)

YCB is a multi-dimensional configuration library that builds bundles from resource files describing a variety of values. The library allows applications to configure themselves based on multiple dimensions describing locations, languages, environments, etc.

### Install

`npm install ycb --save`

### Usage

```
var YCB = require('ycb');
var configArray = [
    {
        "dimensions": [
            {
                "environment": {
                    "dev": null,
                    "prod": null
                }
            }
        ]
    },
    {
        "settings": ["master"],
        "host": "example.com"
    },
    {
        "settings": ["environment:dev"],
        "host": "dev.example.com"
    }
];

var ycbObj = new YCB.Ycb(configArray);
var computedConfig = ycbObj.read({ environment: 'dev' });

console.log(computedConfig.host); // dev.example.com
```

### Examples

Examples are provided in [the tests directory](https://github.com/yahoo/ycb/tree/master/tests).

### License

BSD see LICENSE.txt
