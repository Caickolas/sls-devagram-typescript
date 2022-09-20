import type {Handler,APIGatewayEvent} from 'aws-lambda';
import { emailRegex, passwordRegex } from '../constants/Regexes';
import { CognitoServices } from '../services/CognitoServices';
import { ConfirmEmailRequest } from '../types/auth/ConfirmEmailRequest';
import { UserRegisterRequest } from '../types/auth/UserRegisterRequest';
import { DefaultJsonResponse, formatDefaultResponse } from '../utils/formatResponseUtil';


export const register : Handler = async(event: APIGatewayEvent) 
    : Promise<DefaultJsonResponse> => {
    try{
        const {USER_POOL_ID, USER_POOL_CLIENT_ID} = process.env;
        if(!USER_POOL_ID || !USER_POOL_CLIENT_ID){
            return formatDefaultResponse(500, 'ENVs do Cognito não encontradas.')
        }

        if(!event.body){
            return formatDefaultResponse(400, 'Parametros de entrada invalidos');
        }

        const request = JSON.parse(event.body) as UserRegisterRequest;
        const {name, password, email} = request;

        if(!email || !email.match(emailRegex)){
            return formatDefaultResponse(400, 'Email invalido');
        }

        if(!password || !password.match(passwordRegex)){
            return formatDefaultResponse(400, 'Senha invalida');
        }

        if(!name || name.trim().length < 2){
            return formatDefaultResponse(400, 'Nome invalido');
        }

        await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).signUp(email,password);

        return formatDefaultResponse(200, 'Usuario Cadastrado com sucesso!');

    }catch(error){
        console.log('Error on register user:', error)
        return formatDefaultResponse(500, 'Erro ao cadastrar usuario! tente novamente ou contacte o administrador do sistema');
    }
}

export const confirmEmail : Handler = async(event: APIGatewayEvent) 
: Promise<DefaultJsonResponse> =>{
    try {
        const {USER_POOL_ID, USER_POOL_CLIENT_ID} = process.env;
        if(!USER_POOL_ID || !USER_POOL_CLIENT_ID){
            return formatDefaultResponse(500, 'ENVs do Cognito não encontradas.')
        }

        if(!event.body){
            return formatDefaultResponse(400, 'Parametros de entrada invalidos');
        }

        const request = JSON.parse(event.body) as ConfirmEmailRequest;
        const {email, verificationCode} = request;

        if(!email || !email.match(emailRegex)){
            return formatDefaultResponse(400, 'Email invalido');
        }

        if(!verificationCode || verificationCode.length !== 6){
            return formatDefaultResponse(400, 'Codigo invalido');
        }

        await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).confirmEmail(email, verificationCode);
        return formatDefaultResponse(200, 'Usuario verificado com sucesso!')

    } catch (error) {
        console.log('Error on confirm user:', error)
        return formatDefaultResponse(500, 'Erro ao confirmar usuario! tente novamente ou contacte o administrador do sistema');
    }
}