import { Handler } from "aws-lambda";
import { UserModel } from "../models/UserModel";
import { PostModel } from '../models/PostModel';
import { DefaultListPaginatedResponse } from "../types/DefaultListPaginatedResponse";
import { getUserIdFromEvent } from "../utils/authenticationHandlerUtils";
import { validateEnvs } from "../utils/environmentsUtils";
import { DefaultJsonResponse, formatDefaultResponse } from "../utils/formatResponseUtil";
import { S3Service } from "../services/S3Services";
import { FeedLastKeyRequest } from "../types/feed/FeedLastKeyRequest";

export const findByUserId: Handler = async (event: any)
    : Promise<DefaultJsonResponse> => {
    try {
        const { error, POST_BUCKET } = validateEnvs(['USER_TABLE', 'POST_BUCKET', 'POST_TABLE'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        const {userId} = event.pathParameters || {userId:getUserIdFromEvent(event)};
        if (!userId) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const user = await UserModel.get({'cognitoId': userId})
        if (!user) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const lastKey = (event.queryStringParameters || null) as FeedLastKeyRequest;

        const query = PostModel.query({'userId':userId}).sort("descending");

        if(lastKey && lastKey.id && lastKey.userId && lastKey.date){
            query.startAt(lastKey);
        }
        
        const result = await query.limit(15).exec();

        const response = {} as DefaultListPaginatedResponse;

        if(result){
            response.count = result.count;
            response.lastKey = result.lastKey
            
            for (const document of result) {
                if(document && document.image){
                    document.image = await new S3Service().getImageURL(POST_BUCKET, document.image)
                }
            }

            response.data = result;
        }

        return formatDefaultResponse(200, undefined, response)

    } catch (error) {
        console.log('Error on get user feed:', error)
        return formatDefaultResponse(500, 'Erro ao capturar feed por usuario! tente novamente ou contacte o administrador do sistema');
    }
}

export const feedHome: Handler = async (event: any)
    : Promise<DefaultJsonResponse> => {
    try {
        const { error, POST_BUCKET } = validateEnvs(['USER_TABLE', 'POST_BUCKET', 'POST_TABLE'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const user = await UserModel.get({'cognitoId': userId})
        if (!user) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const {lastKey} = event.queryStringParameters || '';

        const userToSearch = user.following;
        userToSearch.push(userId);

        const query = PostModel.scan('userId').in(userToSearch)

        if(lastKey){
            query.startAt({id:lastKey});
        }
        
        const result = await query.limit(20).exec();

        const response = {} as DefaultListPaginatedResponse;

        if(result){
            response.count = result.count;
            response.lastKey = result.lastKey
            
            for (const document of result) {
                if(document && document.image){
                    document.image = await new S3Service().getImageURL(POST_BUCKET, document.image)
                }
            }

            response.data = result;
        }

        return formatDefaultResponse(200, undefined, response)

    } catch (error) {
        console.log('Error on get feed home:', error)
        return formatDefaultResponse(500, 'Erro ao buscar feed da home! tente novamente ou contacte o administrador do sistema');
    }
}