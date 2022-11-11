import { UserModel } from '../models/UserModel';
import { APIGatewayEvent, Handler } from "aws-lambda";
import { getUserIdFromEvent } from "../utils/authenticationHandlerUtils";
import { DefaultJsonResponse, formatDefaultResponse } from "../utils/formatResponseUtil";
import { S3Service } from '../services/S3Services';
import { parse } from 'aws-multipart-parser';
import { FileData } from 'aws-multipart-parser/dist/models';
import { imageExtensionsAllowed } from '../constants/Regexes';
import { validateEnvs } from '../utils/environmentsUtils';
import { PostModel } from '../models/PostModel';
import * as Uuid from 'uuid';
import * as moment from 'moment';

export const create: Handler = async (event: APIGatewayEvent)
    : Promise<DefaultJsonResponse> => {
    try {
        const { POST_BUCKET, error } = validateEnvs(['POST_BUCKET',
            'POST_TABLE'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const user = await UserModel.get({ 'cognitoId': userId });
        if (!user) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const formData = parse(event, true);
        const file = formData.file as FileData;
        const description = formData.description as string;


        if (!description || description.trim().length < 5) {
            return formatDefaultResponse(400, 'Descricao invalida');
        };

        if (!file || !imageExtensionsAllowed.exec(file.filename)) {
            return formatDefaultResponse(400, "Extensão informada do arquivo nao é valida");
        }

        const imageKey = await new S3Service().saveImage(POST_BUCKET, 'post', file)

        const post = {
            id: Uuid.v4(),
            userId,
            description,
            date: moment().format(),
            image: imageKey
        }

        await PostModel.create(post);
        user.posts = user.posts + 1;
        await UserModel.update(user);

        return formatDefaultResponse(200, 'Publicacao criada com sucesso!')
    } catch (error) {
        console.log('Error on create post:', error)
        return formatDefaultResponse(500, 'Erro ao criar publicacao! tente novamente ou contacte o administrador do sistema');
    }
}
export const toggleLike: Handler = async (event: any)
    : Promise<DefaultJsonResponse> => {
    try {
        const { error } = validateEnvs(['POST_TABLE'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const user = await UserModel.get({ 'cognitoId': userId });
        if (!user) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const { postId } = event.pathParameters;
        const post = await PostModel.get({ id: postId });
        if (!post) {
            return formatDefaultResponse(400, 'Publicacao nao encontrada')
        }

        const hasLikedIndex = post.likes.findIndex(obj => {
            const result = obj.toString() === userId;
            return result;
        })

        if (hasLikedIndex != -1) {
            post.likes.splice(hasLikedIndex, 1);
            await PostModel.update(post);
            return formatDefaultResponse(200, 'Like removido com sucesso!')
        } else {
            post.likes.push(userId);
            await PostModel.update(post);
            return formatDefaultResponse(200, 'Like adicionado com sucesso!')
        }


    } catch (error) {
        console.log('Error on toggle like:', error)
        return formatDefaultResponse(500, 'Erro ao curtir/descurtir publicacao! tente novamente ou contacte o administrador do sistema');
    }
}
export const postComent: Handler = async (event: any)
    : Promise<DefaultJsonResponse> => {
    try {
        const { error } = validateEnvs(['POST_TABLE'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const user = await UserModel.get({ 'cognitoId': userId });
        if (!user) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const { postId } = event.pathParameters;
        const post = await PostModel.get({ id: postId });
        if (!post) {
            return formatDefaultResponse(400, 'Publicacao nao encontrada')
        }

        const request = JSON.parse(event.body);
        const { coment } = request;

        if (!coment || coment.length < 2) {
            return formatDefaultResponse(400, 'Comentario invalido')
        }

        const comentObj = {
            userId,
            Username: user.name,
            date: moment().format(),
            coment
        }

        post.coments.push(comentObj);
        await PostModel.update(post);
        return formatDefaultResponse(200, 'Comentario adicionado com sucesso')

    } catch (error) {
        console.log('Error on post coment:', error)
        return formatDefaultResponse(500, 'Erro ao comentar na publicacao! tente novamente ou contacte o administrador do sistema');
    }
}
export const get: Handler = async (event: any)
    : Promise<DefaultJsonResponse> => {
    try {
        const { POST_BUCKET, error } = validateEnvs(['POST_BUCKET',
            'POST_TABLE'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const user = await UserModel.get({ 'cognitoId': userId });
        if (!user) {
            return formatDefaultResponse(400, 'Usuario não encontrado')
        }

        const { postId } = event.pathParameters;
        if (!postId) {
            return formatDefaultResponse(400, 'Publicacao nao encontrada')
        }

        const post = await PostModel.get({ id: postId });
        if (!post) {
            return formatDefaultResponse(400, 'Publicacao nao encontrada')
        }

        post.image = await new S3Service().getImageURL(POST_BUCKET, post.image);
        return formatDefaultResponse(200, undefined, post);
    } catch (error) {
        console.log('Error on get post by id:', error)
        return formatDefaultResponse(500, 'Erro ao buscar dados da publicacao! tente novamente ou contacte o administrador do sistema');
    }


}