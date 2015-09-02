# Matter

[![Travis build status](https://travis-ci.org/KyperTech/matter.svg?branch=master)](https://travis-ci.org/kypertech/matter)
[![Code Climate](https://codeclimate.com/github/KyperTech/matter/badges/gpa.svg)](https://codeclimate.com/github/kypertech/matter)
[![Test Coverage](https://codeclimate.com/github/KyperTech/matter/badges/coverage.svg)](https://codeclimate.com/github/KyperTech/matter)
[![Dependency Status](https://david-dm.org/kypertech/matter.svg)](https://david-dm.org/kypertech/matter)
[![devDependency Status](https://david-dm.org/kypertech/matter/dev-status.svg)](https://david-dm.org/kypertech/matter#info=devDependencies)

Isomorphic javascript library that provides common web application functionality such as user authentication and local/session/token storage. Matter communicates with [Tessellate](https://github.com/KyperTech/tessellate) for application data.

## Getting Started

Using Matter requires having created an application on [Tessellate](http://tessellate.elasticbeanstalk.com) or [running your own Tessellate server]().

### Browser
1. Include the Matter library using one of the following:
  
  #### CDN

  To use the CDN, add the following script tag to your `index.html`:
    
    ```html
    <script src="http://cdn.kyper.io/js/matter/0.0.2/matter.bundle.js"></script>
    ```
  #### Bower
  Run `bower install --save kyper-matter`

1. Start using Matter by providing the name of the app you created on [Tessellate](http://tessellate.elasticbeanstalk.com).

  ```javascript
  //New matter object with the application name 'exampleApp'
  var matter = new Matter('exampleApp');
  //Login to account with username "test" and password "test"
  matter.login({username:"test", password:"test"}).then(function(user){
      console.log('User logged into exampleApp:', user);
  });
  ```

### ES6 or NodeJS
1. Run `npm install --save kyper-matter`
2. Start using matter:
```javascript
//New matter object with the application name 'exampleApp'
var matter = new Matter('exampleApp');
//Login to account with username "test" and password "test"
matter.login({username:"test", password:"test"}).then(function(user){
    console.log('User logged into exampleApp:', user);
});
```

## API Documentation

### Methods
Methods are part of the matter object you create in the getting started guide:

```javascript
var matter = new Matter('exampleApp');
```
### Authentication

#### `login()`

Log user in provided username/email and password.

**Example:**
```javascript
matter.login({username: 'test', password: 'test'})
.then(function(userData){ console.log('User logged in', userData)});
```

#### `signup()`

Create a new user and login

**Example:**
```javascript
Matter.signup({username: 'test', name:'Test User', password: 'test'})
.then(function(userData){ console.log('User signed up.', userData)});
```
#### `logout()`

Log current user out.

**Example:**
```javascript
Matter.logout().then(function(){ 
  console.log('User logged out');
});
```

#### `isLoggedIn`

Get whether or not there is a user currently logged in

**Example:**
```javascript
if(matter.isLoggedIn){

}
```

#### `currentUser()`

Get currently logged in user.

**Example:**
```javascript
Matter.currentUser().then(function(user){ console.log('Currently logged in user:', user)});
```


### token
Get Auth token for currently logged in user

**Example:**
```javascript
//Get token as a string
var token = matter.token.string;

//Get Decoded token data
var tokenData = matter.token.data;

```

### storage

Internal storage that safley uses session storage when available.

#### `storage.setItem()`

Safley store item within in memory storage and session storage when available (in the browser). Works for strings and objects.

Alias: `storage.item`

**Example:**

```javascript
//Storing a string
storage.setItem('myString', 'AnyStringValue');

//Storing an object
var myData = {some:'example data'};
storage.setItem('myObject', myData);

//Using item alias
storage.item('myString', 'AnyStringValue');

```
#### `storage.getItem()`

Safley get an item within in memory storage and session storage when available (in the browser). Works for strings and objects.

**Example:**

```javascript
//Getting a string
var myStr = storage.getItem('myString');

//Getting an object
var myObj = storage.getItem('myObject');
```

### Settings
Pass a settings object when creating a new Matter object:

```javascript
//Reference another tessellate server
var matter = new Matter('exampleApp', {serverUrl:'https://test.elasticbeanstalk.com'});

//Set api server to local (for local tessellate instance)
var localMatter = new Matter('exampleApp', {localServer:true});

```
#### serverUrl
**type**: `string`

Set server url. If you are using a separately hosted Tessellate server or a server of your own, this is where you will set your server's base url.

#### localServer 
**type**: `Boolean`

Use local server url instead of hosted version of [Tessellate](http://tessellate.elasticbeanstalk.com)


## TODO
* 3rd Party provider logins (keys set on tessellate)
* Update user info Method
* Improve Documentation
* Run tests git pre-push
* More local storage capabilities
* Version release gulp task

