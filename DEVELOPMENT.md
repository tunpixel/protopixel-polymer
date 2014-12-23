
Development Guidlines
=====================

## Todo

* switch test assertion library from should.js to chai
* add integration testing

## Enviremennt Setup

* git clone dependency projects
    * [kool-db](https://bitbucket.org/kool-tn/kool-db) `git clone git@bitbucket.org:kool-tn/kool-db.git`
    * [kool-media](https://bitbucket.org/kool-tn/kool-media)  `git clone git@bitbucket.org:kool-tn/kool-media.git`
    * [kool-cache](https://bitbucket.org/kool-tn/kool-cache)  `git clone git@bitbucket.org:kool-tn/kool-cache.git`
* install dependencies `npm install && bower install`
* create .env and .env.test file (modified copies of env.default)
* ...

## Styleguides:

Coding style is described and enforced by a set of plugin configuration files (.editorconfig, .jshintrc, .jscsrc, ...).

[JavaScript Style Guide](https://github.com/airbnb/javascript)

## Editor/IDE

Sublime Text 3 + plugins

* [Sublime Text 3](http://www.sublimetext.com/3)
* [SublimeLinter](https://github.com/SublimeLinter/SublimeLinter3)
* [SublimeLinter jshint](https://github.com/SublimeLinter/SublimeLinter-jshint)
* [SublimeLinter jscs](https://github.com/SublimeLinter/SublimeLinter-jscs)
* [DocBlockr](https://github.com/spadgos/sublime-jsdocs)
* Color Highlighter
* EditorConfig
* JsFormat
* Sass/SCSS

## Linting

* JSHint
* JSCS

## Testing

* [Mocha](http://mochajs.org/) test runner and framework
* [Istanbul](https://github.com/gotwarlost/istanbul) code coverage tool
* [should.js](https://github.com/shouldjs/should.js) assertion library (to be replaced with [chai](http://chaijs.com/))

Test Reports in `./test` directory.

### Backend Unit Testing

Located under `./app/tests` directory. Reports under `./test/back`.

* [SuperTest](https://github.com/tj/supertest) HTTP assertion library
* ...

### Frontend Unit Testing

Located under `*.test.js` files in `./public` directory. Reports under `./test/front`

* [Karma](http://karma-runner.github.io/) test runner
* [Angular Mocks](https://github.com/angular/bower-angular-mocks)
* ...

## Documentation

[JSDoc](http://usejsdoc.org/)


