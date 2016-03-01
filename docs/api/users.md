# Users

## List Users
  List all public users

  `GET /users`

  **Example**

  *Request*

  `curl http://tessellate.kyper.io/users`

  *Response*

  ```json
  [
    {
      "username": "someguy1",
      "email": "someguy1@email.com",
      "name": "Some Guy"
    },
    {
      "username": "bob",
      "email": "bob@gmail.com",
      "name": "Bob Dasso"
    }
  ]
  ```

  **Authentication**

  Providing authentication during request will also return any private users for which you have access rights.

## Get a User

  Get all users for which the user is an owner or a collaborator

  `GET /users/:username`

  **Example**

  *Request*

  `GET http://tessellate.kyper.io/users/testuser`

  *Response*

  ```json
  [
    {
      "username": "someguy1",
      "email": "someguy1@email.com",
      "name": "Some Guy"
    },
    {
      "username": "bob",
      "email": "bob@gmail.com",
      "name": "Bob Dasso"
    }
  ]
  ```

  **Authentication**

  Without auth token, all public users for this user are displayed. Providing the auth token during request will also return any private users for which you have access rights.

## Search Users

  Get all users for which the user is an owner or a collaborator

  `GET /users/search`

  **Examples**

  Search by username
  *Request*

  `curl -i GET http://tessellate.kyper.io/users/search?username=testuser`

  *Response*

  ```json
  [
    {
      "username": "someguy1",
      "email": "someguy1@email.com",
      "name": "Some Guy"
    },
    {
      "username": "bob",
      "email": "bob@gmail.com",
      "name": "Bob Dasso"
    }
  ]
  ```

  Search by email

  *Request*

  `curl -i GET http://tessellate.kyper.io/users/search?email=test@test.com`

  *Response*

  ```json
  [
    {
      "username": "someguy1",
      "email": "someguy1@email.com",
      "name": "Some Guy"
    },
    {
      "username": "bob",
      "email": "bob@gmail.com",
      "name": "Bob Dasso"
    }
  ]
  ```

## Upload Avatar

  Upload an avatar to a user's account

  `PUT /users/:username/avatar`

  **Example**

  *Request*

  `curl -i PUT http://tessellate.kyper.io/users/someguy1/avatar`

  *Response*

  ```json
  {
    "username": "someguy1",
    "email": "someguy1@email.com",
    "name": "Some Guy",
    "avatar_url": "https://someimagelink.com"
  }
  ```

  **Authentication**

  You must be logged in as the user for which you are attempting to upload the avatar.
