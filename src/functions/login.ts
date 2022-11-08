import { APIGatewayEvent, Handler } from "aws-lambda";
import { CognitoServices } from "../services/CognitoServices";
import { LoginRequest } from "../types/login/LoginRequest";
import { DefaultJsonResponse, formatDefaultResponse } from "../utils/formatResponseUtil";

export const handler : Handler = async(event: APIGatewayEvent) 
: Promise<DefaultJsonResponse> =>{
    try {
        const {USER_POOL_ID, USER_POOL_CLIENT_ID} = process.env;
        if(!USER_POOL_ID || !USER_POOL_CLIENT_ID){
            return formatDefaultResponse(500, 'ENVs do Cognito não encontradas.')
        }

        if(!event.body){
            return formatDefaultResponse(400, 'Parametros de entrada invalidos');
        }

        const request = JSON.parse(event.body) as LoginRequest;
        const {login, password} = request;

        if(!password || !login){
            return formatDefaultResponse(400, 'Parametros de entrada invalidos!');
        }

        const result = await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).login(login, password);
        return formatDefaultResponse(200, undefined, result )
    } catch (error) {
        console.log('Error on login user:', error)
        return formatDefaultResponse(500, 'Erro ao autenticar usuario! tente novamente ou contacte o administrador do sistema');
    }
}