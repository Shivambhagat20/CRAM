const userRepository = require('../repositories/userRepository');
const passwordServices = require('./passwordServices');

exports.getUserById = async (id) => {
    const user = await userRepository.findUserById(id);
    return user;
}
exports.updateUserById = async (id, userData) => {
    return await userRepository.updateUserById(id, userData);
}
exports.deleteUserById = async (id) => {
    return await userRepository.deleteUserById(id);
}

//verifies that the user can create an account, and that no duplicate accounts exist with the same email, then creates a new user document in the database
exports.createUser = async (userData) => {
    const { name, email, password } = userData; // extract data

    // incomplete if any field is missing
    if (!name || !email || !password) {
        throw new Error('User data is incomplete');
    }

    // check domain
    const allowedDomains = ['@umanitoba.ca', '@myumanitoba.ca'];

    const allowed = allowedDomains.some(domain => email.endsWith(domain));
    if (!allowed) throw new Error('Email domain is not allowed');
    
    // check if user already exists
    const doesExist = await userRepository.findUserByEmail(email);
    if (doesExist) throw new Error('An account with this email already exists');

    // hash password
    const passwordHash = await passwordServices.hashPassword(password);
    
    // assign role
    let role;
    if(email.endsWith('@myumanitoba.ca')) {
        role = 'student';
    }
    else if(email.endsWith('@umanitoba.ca')) {
        role = 'professor';
    }

    // create new user object
    const newUser = {
        user_name: name,
        email,
        password_hash: passwordHash,
        role
    };

    return await userRepository.createUser(newUser);
}

//verifies that the user exists, and that the password matches the stored hash
exports.loginUser = async (userData) => {
    const { email, password } = userData; // extract data
    const normalizedEmail = email.toLowerCase();

    // check if user exists
    const user = await userRepository.findUserByEmail(normalizedEmail);

    if (!user) {
        throw new Error("Invalid email");
    }

    // checks if passwords match
    const valid = await passwordServices.verifyPassword(password, user.password_hash);

    if (!valid) {
        throw new Error("Invalid password");
    }

    return user;
}