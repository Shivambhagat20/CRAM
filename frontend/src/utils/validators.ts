// define the signup input to validate
type SignupInput = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

/*
Validate the signup input by checking each attribute
against the decided-upon requirements.
Returns an errors object which may contain error messages
corresponding to the failed check(s).
*/

export function validateSignup(input: SignupInput) {
    const { name, email, password, confirmPassword } = input;
    const errors: {
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    } = {};

    // name to not be empty
    if (!name.trim()) {
        errors.name = "Name field was empty";
    }

    // email domain may only be @myumanitoba or @umanitoba
    if (!email.endsWith("@myumanitoba.ca") && !email.endsWith("@umanitoba.ca")) {
        errors.email = "Email domain is not valid";
    }

    // password must be at least 8 chars long
    if (password.length < 8) {
        errors.password = "Password too short";
    }

    // password must match confirmPassword
    if (confirmPassword !== password) {
        errors.confirmPassword = "Passwords do not match";
    }

    // return empty object if valid
    return errors;
}