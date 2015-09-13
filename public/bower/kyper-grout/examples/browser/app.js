    var grout = new Grout();
    //Set logged in status when dom is loaded
    document.addEventListener("DOMContentLoaded", function(event) { 
      setStatus();
    });
    //Set status styles
    function setStatus() {
      var statusEl = document.getElementById("status");
      var logoutButton = document.getElementById("logout-btn");

      if(grout.isLoggedIn){
        statusEl.innerHTML = "True";
        statusEl.style.color = 'green';
        // statusEl.className = statusEl.className ? ' status-loggedIn' : 'status-loggedIn';
        logoutButton.style.display='inline';
      } else {
        statusEl.innerHTML = "False";
        statusEl.style.color = 'red';
        logoutButton.style.display='none';
      }
    }
    //Login user based on entered credentials
    function login(){
      console.log('Login called');
      var username = document.getElementById('login-username').value;
      var password = document.getElementById('login-password').value;
      
      grout.login({username:username, password:password}).then(function (loginInfo){
        console.log('successful login:', loginInfo);
        setStatus();
      }, function (err){
        console.error('login() : Error logging in:', err);
      });
    }
    //Log currently logged in user out
    function logout(){
      console.log('Logout called');
      grout.logout().then(function(){
        console.log('successful logout');
        setStatus();
      }, function (err){
        console.error('logout() : Error logging out:', err);
      });   
    }
    //Signup and login as a new user
    function signup(){
      console.log('signup called');

      var name = document.getElementById('signup-name').value;
      var username = document.getElementById('signup-username').value;
      var email = document.getElementById('signup-email').value;
      var password = document.getElementById('signup-password').value;

      matter.signup().then(function(){
        console.log('successful logout');
        setStatus();
      }, function(err){
        console.error('logout() : Error logging out:', err);
      });   
    }
    //Get list of applications
    function getApps(){
      console.log('getApps called');
      grout.apps.get().then(function(appsList){
        console.log('apps list loaded:', appsList);
        var outHtml = '<h2>No app data</h2>';
        if (appsList) {
          outHtml = '<ul>';
          appsList.forEach(function(app){
            outHtml += '<li>' + app.name + '</li></br>'
          });
          outHtml += '</ul>';
        }
        document.getElementById("output").innerHTML = outHtml;
      });   
    }
    //Get File/Folder structure for application
    function getStructure(){
      console.log('getStructure called');
      grout.app('exampleApp').getStructure().then(function(app){
        console.log('apps list loaded:', app);
        document.getElementById("output").innerHTML = JSON.stringify(app);
      });
    }
    //Get list of users
    function getUsers(){
      console.log('getUsers called');
      grout.users.get().then(function(app){
        console.log('apps list loaded:', app);
        document.getElementById("output").innerHTML = JSON.stringify(app);
      }, function(err){
        console.error('Error getting users:', err);
      });
    }
    //Search users based on a provided string
    function searchUsers(searchStr){
      console.log('getUsers called');
      if(!searchStr){
        searchStr = document.getElementById('search').value;
      }
      grout.users.search(searchStr).then(function(users){
        console.log('search users loaded:', users);
        document.getElementById("search-output").innerHTML = JSON.stringify(users);
      });
    }