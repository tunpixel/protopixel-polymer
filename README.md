Express Polymer Boilerplate
===========================

Check package.json scripts section and grunt/gulp file for test, build and run commands.

Check [Development Guidelines](./DEVELOPMENT.md).

```
# create and customize environment configurations files for development and test
cp env.default .env
cp env.default .env.test

# install dependencies
npm install
bower install

# run db server
npm run db

# load envirement configuration in terminal session (before starting server)
source .env

# start development server
npm start

# run backend tests
npm run test:back

# run frontend tests
npm run test:front

# build and watch
npm run build

# build for distribution
npm run dist

# generate docs
npm run docs


```
