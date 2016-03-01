# Authentication

## Login

  Upload an avatar to a user's account

  `PUT /login`

  **Body Parameters**

  | Name     | Type   | Required | Description
  |----------|--------|----------|---------------------
  | username | String | `true`  | Username of user to login as
  | email    | String | `false` | Email of user to login as (required if username is not provided)
  | password | String | `true`  | User's password

  **Example**

  *Request*

  `curl -i PUT http://tessellate.kyper.io/login`

  *Response*

  ```json
  {
    "token": "asdfijasofijasdf",
    "user": {
      "username": "testuser",
      "email": "test@test.com",
      "avatar_url": "https://someurl.com/img.jpg"
    }
  }
  ```

## Signup

  Signup for a new account and login with that account

  `PUT /signup`

  **Example**

  *Request*
  `curl -i PUT http://tessellate.kyper.io/signup`

  *Response*

  | Name     | Type   | Required | Description
  |----------|--------|----------|---------------------
  | username | String | `true`  | Username to be associated with new user account
  | name     | String | `true`  | Name to be associated with new user account
  | email    | String | `true`  | Email to be associated with new user account
  | password | String | `true`  | Password to be associated with new user account (must be at least 6 characters long)
