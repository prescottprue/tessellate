import FirebaseTokenGenerator from 'firebase-token-generator'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

import config from './../../config/config'

/**
 * Pure utilities
 */

export const createFirebaseToken = payload => {
  const { _id, username, email, provider } = payload
  if (!_id) throw Error('_id parameter is required to create firebase token')
  const tokenGenerator = new FirebaseTokenGenerator(config.firebase.secret)
  return tokenGenerator.createToken({ uid: JSON.stringify(_id), _id, username, email, provider })
}

export const createAuthToken = payload => {
  const { _id, username, email, provider } = payload
  if (!_id || !username) throw Error('_id and username parameters are required to create token')
  return jwt.sign({ _id, username, email, provider }, config.auth.secret)
}

export const makeSalt = () =>
  Math.round((new Date().valueOf() * Math.random())) + ''

export const encryptPassword = (password, salt) => {
  if (!password) return ''
  try {
    return crypto
      .createHmac('sha1', salt)
      .update(password)
      .digest('hex')
  } catch (err) {
    return ''
  }
}

export default {
  createFirebaseToken,
  createAuthToken,
  makeSalt,
  encryptPassword

}
