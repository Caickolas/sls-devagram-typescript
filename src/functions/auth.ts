import type { Handler, APIGatewayEvent } from 'aws-lambda';
import { emailRegex, imageExtensionsAllowed, passwordRegex } from '../constants/Regexes';
import { UserModel } from '../models/UserModel';
import { CognitoServices } from '../services/CognitoServices';
import { ConfirmEmailRequest } from '../types/auth/ConfirmEmailRequest';
import { UserRegisterRequest } from '../types/auth/UserRegisterRequest';
import { User } from '../types/models/User';
import { DefaultJsonResponse, formatDefaultResponse } from '../utils/formatResponseUtil';
import { parse } from 'aws-multipart-parser'
import { FileData } from 'aws-multipart-parser/dist/models';
import { S3Service } from '../services/S3Services';
import { ChangePasswordRequest } from '../types/auth/ChangePasswordRequest';
import { validateEnvs } from '../utils/environmentsUtils';


export const register: Handler = async (event: APIGatewayEvent)
    : Promise<DefaultJsonResponse> => {
    try {
        const { USER_POOL_ID, USER_POOL_CLIENT_ID, AVATAR_BUCKET, error }
            = validateEnvs(['USER_POOL_ID', 'USER_POOL_CLIENT_ID', 'AVATAR_BUCKET', 'USER_TABLE'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        if (!event.body) {
            return formatDefaultResponse(400, 'Parametros de entrada invalidos');
        }

        const formData = parse(event, true);
        const file = formData.file as FileData;
        const name = formData.name as string;
        const email = formData.email as string;
        const password = formData.password as string;

        if (!email || !email.match(emailRegex)) {
            return formatDefaultResponse(400, 'Email invalido');
        }

        if (!password || !password.match(passwordRegex)) {
            return formatDefaultResponse(400, 'Senha invalida');
        }

        if (!name || name.trim().length < 2) {
            return formatDefaultResponse(400, 'Nome invalido');
        }

        if (file && !imageExtensionsAllowed.exec(file.filename)) {
            return formatDefaultResponse(400, "Extens??o informada do arquivo nao ?? valida");
        }

        const cognitoUser = await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).signUp(email, password);
        let key = undefined;
        if (file) {
            key = await new S3Service().saveImage(AVATAR_BUCKET, 'avatar', file);
        }

        const user = {
            name,
            email,
            cognitoId: cognitoUser.userSub,
            avatar: key
        } as User;

        await UserModel.create(user);

        return formatDefaultResponse(200, 'Usuario Cadastrado com sucesso!');

    } catch (error) {
        console.log('Error on register user:', error)
        return formatDefaultResponse(500, 'Erro ao cadastrar usuario! tente novamente ou contacte o administrador do sistema');
    }
}
export const confirmEmail: Handler = async (event: APIGatewayEvent)
    : Promise<DefaultJsonResponse> => {
    try {
        const { USER_POOL_ID, USER_POOL_CLIENT_ID, error }
            = validateEnvs(['USER_POOL_ID', 'USER_POOL_CLIENT_ID'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        if (!event.body) {
            return formatDefaultResponse(400, 'Parametros de entrada invalidos');
        }

        const request = JSON.parse(event.body) as ConfirmEmailRequest;
        const { email, verificationCode } = request;

        if (!email || !email.match(emailRegex)) {
            return formatDefaultResponse(400, 'Email invalido');
        }

        if (!verificationCode || verificationCode.length !== 6) {
            return formatDefaultResponse(400, 'Codigo invalido');
        }

        await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).confirmEmail(email, verificationCode);
        return formatDefaultResponse(200, 'Usuario verificado com sucesso!')

    } catch (error) {
        console.log('Error on confirm user:', error)
        return formatDefaultResponse(500, 'Erro ao confirmar usuario! tente novamente ou contacte o administrador do sistema');
    }
}
export const forgotPassword: Handler = async (event: APIGatewayEvent)
    : Promise<DefaultJsonResponse> => {
    try {
        const { USER_POOL_ID, USER_POOL_CLIENT_ID, error } = validateEnvs(['USER_POOL_ID',
            'USER_POOL_CLIENT_ID'])

        if (error) {
            return formatDefaultResponse(500, error)
        }
        if (!event.body) {
            return formatDefaultResponse(400, 'Parametros de entrada invalidos');
        }

        const request = JSON.parse(event.body);
        const { email } = request;

        if (!email || !email.match(emailRegex)) {
            return formatDefaultResponse(400, 'Email invalido');
        }

        await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).forgotPassword(email);
        return formatDefaultResponse(200, 'Solicita????o de troca de senha enviada com sucesso!')

    } catch (error) {
        console.log('Error on request forgot password:', error)
        return formatDefaultResponse(500, 'Erro ao solicitar troca de senha de usuario! tente novamente ou contacte o administrador do sistema');
    }
}
export const changePassword: Handler = async (event: APIGatewayEvent)
    : Promise<DefaultJsonResponse> => {
    try {
        const { USER_POOL_ID, USER_POOL_CLIENT_ID, error } = validateEnvs(['USER_POOL_ID',
            'USER_POOL_CLIENT_ID'])

        if (error) {
            return formatDefaultResponse(500, error)
        }
        if (!event.body) {
            return formatDefaultResponse(400, 'Parametros de entrada invalidos');
        }

        const request = JSON.parse(event.body) as ChangePasswordRequest;
        const { email, verificationCode, password } = request;

        if (!email || !email.match(emailRegex)) {
            return formatDefaultResponse(400, 'Email invalido');
        }

        if (!verificationCode || verificationCode.length !== 6) {
            return formatDefaultResponse(400, 'Codigo invalido');
        }

        if (!password || !password.match(passwordRegex)) {
            return formatDefaultResponse(400, 'Senha invalida');
        }

        await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).changePassword(email, password, verificationCode);
        return formatDefaultResponse(200, 'Senha alterada com sucesso!')

    } catch (error) {
        console.log('Error on change password:', error)
        return formatDefaultResponse(500, 'Erro ao trocar de senha do usuario! tente novamente ou contacte o administrador do sistema');
    }
}