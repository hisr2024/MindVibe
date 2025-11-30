const { randomBytes, scryptSync, timingSafeEqual } = require('crypto')

const SALT_BYTES = 16
const KEY_LENGTH = 32
const DEFAULT_COST = 14

function deriveKey(pin, salt, cost) {
  const workCost = Number.isFinite(cost) ? cost : DEFAULT_COST
  return scryptSync(pin, salt, KEY_LENGTH, { N: 1 << workCost })
}

function hash(pin, saltRounds = DEFAULT_COST) {
  const salt = randomBytes(SALT_BYTES)
  const derived = deriveKey(pin, salt, saltRounds)
  return Promise.resolve(`scrypt$${saltRounds}$${salt.toString('base64')}$${derived.toString('base64')}`)
}

function compare(pin, encrypted) {
  if (typeof encrypted !== 'string' || !encrypted.startsWith('scrypt$')) {
    return Promise.resolve(false)
  }
  const [, costRaw, saltB64, derivedB64] = encrypted.split('$')
  const salt = Buffer.from(saltB64, 'base64')
  const derived = deriveKey(pin, salt, Number(costRaw) || DEFAULT_COST)
  const known = Buffer.from(derivedB64, 'base64')

  if (derived.length !== known.length) {
    return Promise.resolve(false)
  }

  return Promise.resolve(timingSafeEqual(derived, known))
}

module.exports = { hash, compare }
