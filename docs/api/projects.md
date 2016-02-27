# Projects

## GET /projects
List all public projects

## GET /projects/:username

  Get all projects for which the user is an owner or a collaborator

## GET /projects/:owner/:project

  Get a project's data based on its owner and name

## PATCH	/projects/:owner/:project

  edit a project

## GET	/projects/:owner/:project/collaborators

  get collaborators for a project

## POST	/projects/:owner/:project/collaborators
  Add collaborator to a project.

  **Authentication:** You must be the owner or a collaborator on the project to add others.

## DELETE	/projects/:owner/:project

  delete a project

  **NOTE:** You must be the owner or a collaborator on the project to add others.
