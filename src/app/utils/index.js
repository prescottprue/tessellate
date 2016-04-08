import auth from './auth'
export const validatePresenceOf = value => value && value.length

export default Object.assign(
  {},
  { validatePresenceOf },
  auth
)
