# Grout
<p align="center">
  <!-- Npm Version -->
  <a href="https://npmjs.org/package/kyper-grout">
    <img src="https://img.shields.io/npm/v/kyper-grout.svg" alt="npm version">
  </a>
  <!-- Build Status -->
  <a href="https://travis-ci.org/KyperTech/grout">
    <img src="http://img.shields.io/travis/KyperTech/grout.svg" alt="build status">
  </a>
  <!-- Dependency Status -->
  <a href="https://david-dm.org/KyperTech/grout">
    <img src="https://david-dm.org/KyperTech/grout.svg" alt="dependency status">
  </a>
  <!-- Codeclimate -->
  <a href="https://codeclimate.com/github/kypertech/grout">
    <img src="https://codeclimate.com/github/KyperTech/grout/badges/gpa.svg" alt="codeclimate">
  </a>
  <!-- Coverage -->
  <a href="https://codeclimate.com/github/KyperTech/grout">
    <img src="https://codeclimate.com/github/KyperTech/grout/badges/coverage.svg" alt="coverage">
  </a>
  <!-- License -->
  <a href="https://github.com/KyperTech/grout/blob/master/LICENSE.md">
    <img src="https://img.shields.io/npm/l/kyper-grout.svg" alt="license">
  </a>
</p>

Client library to simplify communication with Tessellate application building service.

## Getting Started

Grout is isomorphic, so it can be used within a frontend or on a server. Below are setups for both:

### Browser
1. Include the Grout library using one of the following:
  #### CDN
  Add script tag to index.html:
    
    ```html
    <script src="http://cdn.kyper.io/js/grout/0.0.5/grout.js"></script>
    ```

  #### Bower
  Run `bower install --save kyper-grout`

### Node
1. Run:
    ```
    npm install --save kyper-grout
    ```
2. Include and use grout

    ```javascript
    require('grout');
    var grout = new Grout();
    ```
    **or in ES6:**
    ```javascript
    import Grout from ('grout');
    let grout = new Grout();
    ```

## Documentation

### [API Documentation](https://github.com/KyperTech/grout/wiki/API-Documentation)

### [Main Wiki](https://github.com/KyperTech/grout/wiki)
