import JWT from "jsonwebtoken";

const secret = 'Flash$123!@';

function createTokenForUser(user){
    const payload = {
        _id: user._id,
    }
    const token = JWT.sign(payload, secret);
    return token;
}

function validateToken(token){
    const payload = JWT.verify(token, secret);
    return payload;
}

export {createTokenForUser, validateToken};