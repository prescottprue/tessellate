# Authentication

## Login

  Upload an avatar to a user's account

  **Endpoint**  `PUT /login`

  **Example**

  `PUT http://tessellate.kyper.io/login`

  | Name     | Type   | Required | Description
  |----------|--------|----------|---------------------
  | username | String | `true`  | Username of user to login as
  | email    | String | `false` | Email of user to login as (required if username is not provided)
  | password | String | `true`  | User's password

## Signup

  Signup for a new account and login with that account

  **Endpoint**  `PUT /signup`

  **Example**

  `PUT http://tessellate.kyper.io/signup`

  | Name     | Type   | Required | Description
  |----------|--------|----------|---------------------
  | username | String | `true`  | Username to be associated with new user account
  | name     | String | `true`  | Name to be associated with new user account
  | email    | String | `true`  | Email to be associated with new user account
  | password | String | `true`  | Password to be associated with new user account (must be at least 6 characters long)
