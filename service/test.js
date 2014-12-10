var crypto = require('crypto')
, key = 'salt_from_the_user_document'
, plaintext = 'password'
, cipher = crypto.createCipher('aes-256-cbc', key)
, decipher = crypto.createDecipher('aes-256-cbc', key);
cipher.update(plaintext, 'utf8', 'base64');
var encryptedPassword = cipher.final('base64')

decipher.update(encryptedPassword, 'base64', 'utf8');
var decryptedPassword = decipher.final('utf8');

console.log('encrypted :', encryptedPassword);
console.log('decrypted :', decryptedPassword);
