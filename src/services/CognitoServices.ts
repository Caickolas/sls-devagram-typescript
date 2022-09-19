import { CognitoUserPool } from "amazon-cognito-identity-js";

export class CognitoServices{
    constructor(
        private userPoolId: string,
        private userPoolClient: string
    ) {}

        public signUp = (email: string, password: string) : Promise<any> => {
            return new Promise<any>((resolve, reject) => {
                try{
                    const poolData = {
                        UserPoolId: this.userPoolId,
                        ClientId: this.userPoolClient
                    };

                    const userPool = new CognitoUserPool(poolData);
                    const userAttributes = [];

                    userPool.signUp(email, password, userAttributes, 
                        userAttributes, (err, result) => {
                            if(err){
                               return reject(err)
                            }
                            resolve(result)
                        }
                    );
                }catch(error){
                    reject(error);
                }
            });
        }
}
