# User

**Authentication**

You must be logged in for ALL user endpoints to work

## Upload Avatar

  Upload an avatar to a user's account

  `PUT /user/avatar`

  **Example**

  *Request*

    `curl -i PUT http://tessellate.kyper.io/user/avatar`

  *Response*

  ```json
  {
    "username": "someguy1",
    "email": "someguy1@email.com",
    "name": "Some Guy",
    "avatar_url": "https://someimagelink.com"
  }
  ```
