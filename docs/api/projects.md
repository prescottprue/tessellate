# Projects

## List Projects
  List all public projects

  `GET /projects`

  **Example**

  *Request*

  `curl -i -X GET http://tessellate.kyper.io/projects`

  *Response*

  ```json
  [
    {
      "name": "exampleProject",
      "owner": {
        "username": "testuser"
      },
      "collaborators": [
        {
          "username": "someguy1"
        }
      ]
    }, {
      "name": "testProject",
      "owner": {
        "username": "someguy"
      },
      "collaborators": []
    }
  ]
  ```

  **Authentication**

  Providing authentication during request will also return any private projects for which you have access rights.

## Get User's Projects

  Get all projects for which the user is an owner or a collaborator

  `GET /projects/:username`

  **Example**

  *Request*

  `curl -i -X GET http://tessellate.kyper.io/projects/testuser`

  *Response*

  ```json
  [
    {
      "name": "exampleProject",
      "owner": {
        "username": "testuser"
      },
      "collaborators": [
        {
          "username": "someguy1"
        }
      ]
    }, {
      "name": "testProject",
      "owner": {
        "username": "someguy"
      },
      "collaborators": []
    }
  ]
  ```


  **Authentication**

  Without auth token, all public projects for this user are displayed. Providing the auth token during request will also return any private projects for which you have access rights.

## New Project

  Create a new project owned by the provided user

  `POST /projects/:username`

  **Body Parameters**

  | Name          | Type   | Required | Description         
  |---------------|--------|----------|---------------------
  | name          | String | `true`   | Name of new project
  | collaborators | Array  | `false`  | List of collaborators usernames to add to new project

  **Example**

  *Request*

  `curl -i -X POST http://tessellate.kyper.io/projects/testuser`

  *Response*

  ```json
  {
    "name": "exampleProject",
    "owner": {
      "username": "testuser"
    },
    "collaborators": [
      {
        "username": "someguy1"
      }
    ]
  }
  ```

  **Authentication**

  You must have access rights to the account to which you are attempting to add a project.

## Get a Project

  Get a project"s data provided its owner and name

  `GET /projects/:owner/:project`

  **Example**

  *Request*

  `curl -i -X GET http://tessellate.kyper.io/projects/testuser/exampleProject`

  *Response*

  ```json
  [
    {
      "name": "exampleProject",
      "owner": {
        "username": "testuser"
      }
    }
  ]
  ```

  **Authentication**

  You must have access rights to the account to which you are attempting to add a project.

## Update Project

  Edit/Update an already existing project

  `PATCH /projects/:owner/:project`

  **Example**

  *Request*

  `curl -i -X GET http://tessellate.kyper.io/projects/testuser/exampleProject`

  *Response*

  ```json
  [
    {
      "name": "exampleProject",
      "owner": {
        "username": "testuser"
      }
    }
  ]
  ```

  | Name          | Type   | Required | Description         
  |---------------|--------|----------|---------------------
  | name          | String | `false`  | Name of new project
  | owner         | String | `false`  | Username of user that owns the project
  | collaborators | Array  | `false`  | List of collaborators usernames to add to new project

### Delete Project

  Delete a project provided its owner and name

  `DELETE /projects/:owner/:project`

  **Example**

  *Request*

  `curl -i -X DELETE http://tessellate.kyper.io/projects/testuser/exampleProject/collaborators`

  *Response*

  ```json
  [
    {
      "name": "exampleProject",
      "owner":{
        "username": "testuser"
      }
    }
  ]
  ```

  **Authentication** You must be the owner or a collaborator on the project to add others.



## Collaborators

### Get Project Collaborators

  Get list of collaborators for a project

  `GET	/projects/:owner/:project/collaborators`

  **Example:**

  *Request*

  `curl -i -X GET http://tessellate.kyper.io/projects/testuser/exampleProject/collaborators`

  *Response*

  ```json
  [
    {
      "username": "someguy1",
      "name": "Some Guy",
    }
  ]
  ```

### Add Collaborator

  Add collaborator to a project.

  `PUT	/projects/:owner/:project/collaborators/:collaborator/:collaborator`

  **Example:**

  *Request*

  `curl -i -X POST http://tessellate.kyper.io/projects/testuser/exampleProject/collaborators/someguy1`

  *Response*

  ```json
  {
    "name": "exampleProject",
    "owner": {
      "username": "testuser"
    },
    "collaborators": [
      {
        "username": "someguy1"
      }
    ]
  }
  ```

  **Authentication**

  You must be the owner or a collaborator on the project to add others.

### Remove Collaborator

  Remove collaborator from a project.

  `DELETE	/projects/:owner/:project/collaborators/:collaborator`

  **Example:**

  *Request*

  `curl -i -X POST http://tessellate.kyper.io/projects/testuser/exampleProject/collaborators/someguy1`

  *Response*

  ```json
  {
    "name": "exampleProject",
    "owner": {
      "username": "testuser"
    },
    "collaborators": [
    ]
  }
  ```

  **Authentication**

  You must be the owner or a collaborator on the project to add others.
