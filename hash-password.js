const bcrypt = require('bcryptjs');

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.log('Usage: node hash-password.js yourPasswordHere');
  process.exit(1);
}

bcrypt.hash(plainPassword, 10).then((hash) => {
  console.log('Hashed password:');
  console.log(hash);
});