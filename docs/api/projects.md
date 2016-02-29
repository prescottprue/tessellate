# Projects

## List Projects
  List all public projects

  `GET /projects`

  **Example**

  `curl -i -X GET http://tessellate.kyper.io/projects`

  **Authentication**

  Providing authentication during request will also return any private projects for which you have access rights.

## Get User's Projects

  Get all projects for which the user is an owner or a collaborator

  `GET /projects/:username`

  **Example**

  `curl -i -X GET http://tessellate.kyper.io/projects/testuser`

  **Authentication**

  Without auth token, all public projects for this user are displayed. Providing the auth token during request will also return any private projects for which you have access rights.

## New Project

  Create a new project owned by the provided user

  `POST /projects/:username`

  **Example**

  `curl -i -X POST http://tessellate.kyper.io/projects/testuser`

  | Name          | Type   | Required | Description         
  |---------------|--------|----------|---------------------
  | name          | String | `true`   | Name of new project
  | collaborators | Array  | `false`  | List of collaborators usernames to add to new project

  **Authentication**

  You must have access rights to the account to which you are attempting to add a project.

## Get a Project

  Get a project's data provided its owner and name

  `GET /projects/:owner/:project`

  **Example**
  `GET http://tessellate.kyper.io/projects/testuser/exampleProject`

  **Authentication**

  You must have access rights to the account to which you are attempting to add a project.

## Update Project

  Edit/Update an already existing project

  `PATCH /projects/:owner/:project`

  **Example**
  `GET http://tessellate.kyper.io/projects/testuser/exampleProject`

  | Name          | Type   | Required | Description         
  |---------------|--------|----------|---------------------
  | name          | String | `false`  | Name of new project
  | owner         | String | `false`  | Username of user that owns the project
  | collaborators | Array  | `false`  | List of collaborators usernames to add to new project

### Delete Project

  Delete a project provided its owner and name

  `DELETE /projects/:owner/:project`

  **Example**
  `DELETE http://tessellate.kyper.io/projects/testuser/exampleProject/collaborators`


  **Authentication** You must be the owner or a collaborator on the project to add others.


## Collaborators

### Get Project Collaborators

  Get list of collaborators for a project

  `GET	/projects	/:owner	/:project	/collaborators`

  **Example:**
  `GET http://tessellate.kyper.io/projects/testuser/exampleProject/collaborators`


### Add Collaborator

  Add collaborator to a project.

  `POST	/projects/:owner/:project/collaborators/:collaborator`

  **Example:**
  `POST http://tessellate.kyper.io/projects/testuser/exampleProject/collaborators/someguy1`

  **Authentication**

  You must be the owner or a collaborator on the project to add others.
