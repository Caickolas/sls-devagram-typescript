import { CognitoUser, CognitoUserPool } from "amazon-cognito-identity-js";

export class CognitoServices{
    constructor(
        private userPoolId: string,
        private userPoolClient: string
    ) {}

    private poolData = {
        UserPoolId: this.userPoolId,
        ClientId: this.userPoolClient
    };

        public signUp = (email: string, password: string) : Promise<any> => {
            return new Promise<any>((resolve, reject) => {
                try{
                    

                    const userPool = new CognitoUserPool(this.poolData);
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
        
        public confirmEmail = (email: string, verificationCode: string) : Promise<any> => {
            return new Promise((resolve,reject) => {
                try {
                    const userPool = new CognitoUserPool(this.poolData);

                    const userData = {
                        Username: email,
                        Pool: userPool
                    }

                    const user = new CognitoUser(userData);

                    user.confirmRegistration(verificationCode, true, (err,result) =>{
                        if(err){
                            return reject(err);
                        }
                        resolve(result);
                    });

                } catch (error) {
                    reject(error);
                }
            })
        }
}
