# [Tessellate](http://tessellate.elasticbeanstalk.com)

This repo is the **SERVER** for the Tessellate API, [Matter](http://github.com/KyperTech/matter) and [Build](http://github.com/KyperTech/build).

## Getting Started

### Server Local Development

1. Make sure you have NodeJS and GruntJS installed.
2. Clone this repository `git clone git@github.com:prescottprue/hypercube.git`
3. Run `npm install` to install node/development dependencies
4. Run `bower install` to install front end libraries
5. Run `grunt` to start a local server on `localhost:4000` for development.

## Parts

This application consists of a NodeJS backend (API routes) and an AngularJS frontend. These two parts are completly decoupled and placed in different folders. The frontend is located within the `public/` folder and the main file for the server is `server.js`, but the rest of the backend is located within the `backend` folder.

The connection between these two parts is created when NodeJS renders the `views/index.ejs` template, which contains the AngularJS application.

## Backend

### Docs

Documentation pages, located in `./public/docs`, are automatically generated with a grunt task that uses [grunt-apidoc](). The placement within the public folder makes the main page for the backend REST docs available on the server by navigating to `/docs/index.html`.

### Routes

Route configuration is located in the `config/routes.js` file.

### Controllers

Controllers contain route functions such as `get()`, `update()`, and `delete()` that are ran when route requests are receieved.

### Models

Models organize data and how it will be saved in the database as well as apply methods to objects like the `saveNew()` method on the `User` object.

## Frontend

The front end AngularJS application is located within the `./public` and consists of app javascript files and main folders. The main folders contain modules which each represent a resource located within the backend REST API. For example `./public/roles` contains an angular module that represents the roles resource of the backend API.

Each module contains a module file and files for any controllers/services/directives.

### Modules

#### User

List and detail views/controllers for users

#### Roles

List and detail views/controllers for roles

#### Applications

List and detail views/controllers for applications

#### Account

Login and Signup pages.

## TODO
* Change Password route
* App Name Middleware to handle app specific requests
