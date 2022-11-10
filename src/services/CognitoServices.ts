import { AuthenticationDetails, CognitoUser, CognitoUserPool } from "amazon-cognito-identity-js";

export class CognitoServices {
    constructor(
        private userPoolId: string,
        private userPoolClient: string
    ) { }

    private poolData = {
        UserPoolId: this.userPoolId,
        ClientId: this.userPoolClient
    };

    public signUp = (email: string, password: string): Promise<any> => {
        return new Promise<any>((resolve, reject) => {
            try {


                const userPool = new CognitoUserPool(this.poolData);
                const userAttributes = [];

                userPool.signUp(email, password, userAttributes,
                    userAttributes, (err, result) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(result)
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    public confirmEmail = (email: string, verificationCode: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            try {
                const userPool = new CognitoUserPool(this.poolData);

                const userData = {
                    Username: email,
                    Pool: userPool
                }

                const user = new CognitoUser(userData);

                user.confirmRegistration(verificationCode, true, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });

            } catch (error) {
                reject(error);
            }
        })
    }

    public forgotPassword(email: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const userPool = new CognitoUserPool(this.poolData);

                const userData = {
                    Username: email,
                    Pool: userPool
                };

                const cognitoUser = new CognitoUser(userData);

                cognitoUser.forgotPassword({
                    onSuccess(data) {
                        resolve(data)
                    },
                    onFailure(err) {
                        reject(err)
                    }
                });

            } catch (error) {
                reject(error)
            }
        })
    }

    public changePassword(email: string, password: string, verificationCode: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const userPool = new CognitoUserPool(this.poolData);

                const userData = {
                    Username: email,
                    Pool: userPool
                };

                const cognitoUser = new CognitoUser(userData);

                cognitoUser.confirmPassword(verificationCode, password, {
                    onSuccess(success) {
                        resolve(success);
                    },
                    onFailure(err) {
                        reject(err)
                    }
                })

            } catch (error) {
                reject(error)
            }
        })
    }

    public login(login: string, password: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                const userPool = new CognitoUserPool(this.poolData);

                const userData = {
                    Username: login,
                    Pool: userPool
                };

                const authenticationData = {
                    Username: login,
                    Password: password
                }

                const authenticationDetails = new AuthenticationDetails(authenticationData);
                const cognitoUser = new CognitoUser(userData);

                cognitoUser.authenticateUser(authenticationDetails, {
                    onFailure(err) {
                        reject(err)
                    },
                    onSuccess(result) {
                        const accessToken = result.getAccessToken().getJwtToken();
                        const refreshToken = result.getRefreshToken().getToken();

                        resolve({
                            email: login,
                            token: accessToken,
                            refreshToken
                        })
                    }
                })

            } catch (error) {
                reject(error)
            }
        })
    }
}
