import * as dynamoose from 'dynamoose';

const UserSchema = new dynamoose.Schema({
    cognitoId : {
        type: String,
        hashKey: true
    },
    name: {
        type: String,
        index: {
             name: 'nameIndex',
             global: true
        }
   },
   email: {
        type: String,
        index: {
             name: "emailIndex",
             global: true
        }
    },
    avatar : {type: String},
    followers: {type: Number, default: 0 },
    posts: {type: Number, default : 0},
    following: {type: Array, default: []}
}, { saveUnknown: true});

const userTable = process.env.USER_TABLE || '';
export const UserModel = dynamoose.model(userTable, UserSchema);