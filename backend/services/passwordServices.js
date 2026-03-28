const argon2 = require('argon2');
const User = require('../models/User');

exports.hashPassword = async (password) => {
    try {
        const hash = await argon2.hash(password, {
            type: argon2.argon2id, // Specifies to use Argon2id
            memoryCost: 2 ** 16, // Sets memory usage, currently at 64 MB
            timeCost: 3, // the number of iterations it will do, first iteration uses argon2i
            parallelism: 1, //Limit on number of CPU cores it will use
        });
        return hash;

    }catch (err){
        err.message = 'Error hashing password';
        throw new Error(err);        
    }
}

exports.getPasswordById = async (id) => {
    const user = await User.findById(id).select('password_hash').lean();
    return user.password_hash;
}

// verify a given password and hash
exports.verifyPassword = async (password, hashedPassword) => {
    return await argon2.verify(hashedPassword, password);
};