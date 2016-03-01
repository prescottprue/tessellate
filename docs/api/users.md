# Users

## List Users
  List all public users

  **Endpoint** `GET /users`

  **Example**

  `curl http://tessellate.kyper.io/users`

  **Authentication**

  Providing authentication during request will also return any private users for which you have access rights.

## Get a User

  Get all users for which the user is an owner or a collaborator

  **Endpoint** `GET /users/:username`

  **Example**

  `GET http://tessellate.kyper.io/users/testuser`

  **Authentication**

  Without auth token, all public users for this user are displayed. Providing the auth token during request will also return any private users for which you have access rights.

## Search Users

  Get all users for which the user is an owner or a collaborator

  **Endpoint** `GET /users/search`

  **Examples**

  Search by username
  `GET http://tessellate.kyper.io/users/search?username=testuser`

  Search by email
  `GET http://tessellate.kyper.io/users/search?email=test@test.com`

## Upload Avatar

  Upload an avatar to a user's account

  **Endpoint** `GET /users/:username/avatar`

  **Example**

  Search by username
  `GET http://tessellate.kyper.io/users/`

  **Authentication**

  You must be logged in as the user for which you are attempting to upload the avatar.
