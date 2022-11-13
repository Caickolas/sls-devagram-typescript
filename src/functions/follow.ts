import { Handler } from "aws-lambda";
import { UserModel } from "../models/UserModel";
import { getUserIdFromEvent } from "../utils/authenticationHandlerUtils";
import { validateEnvs } from "../utils/environmentsUtils";
import { DefaultJsonResponse, formatDefaultResponse } from "../utils/formatResponseUtil";

export const toggle: Handler = async (event: any)
    : Promise<DefaultJsonResponse> => {
    try {
        const { error } = validateEnvs(['USER_TABLE'])

        if (error) {
            return formatDefaultResponse(500, error)
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return formatDefaultResponse(400, 'Usuario logado não encontrado')
        }

        const loggedUser = await UserModel.get({ 'cognitoId': userId });

        const { followId } = event.pathParameters;
        if (!followId) {
            return formatDefaultResponse(400, 'Usuario a ser seguido não encontrado')
        }

        if (userId === followId) {
            return formatDefaultResponse(400, 'Usuario nao pode seguir a si mesmo')
        }

        const toFollowUser = await UserModel.get({ 'cognitoId': followId });
        if (!toFollowUser) {
            return formatDefaultResponse(400, 'Usuario a ser seguido não encontrado')
        }

        const hasFollow = loggedUser.following.findIndex(obj => {
            const result = obj.toString() === followId;
            return result;
        })

        if (hasFollow != -1) {
            loggedUser.following.splice(hasFollow, 1);
            toFollowUser.followers = toFollowUser.followers-1;
            await UserModel.update(loggedUser);
            await UserModel.update(toFollowUser);
            return formatDefaultResponse(200, 'Usuario deixado de seguir com sucesso!')
        } else {
            loggedUser.following.push(followId);
            toFollowUser.followers = toFollowUser.followers+1;
            await UserModel.update(loggedUser);
            await UserModel.update(toFollowUser);
            return formatDefaultResponse(200, 'Usuario seguido com sucesso!')
        }


    } catch (error) {
        console.log('Error on follow/unfollow user:', error)
        return formatDefaultResponse(500, 'Erro ao seguir/desseguir um usuario! tente novamente ou contacte o administrador do sistema');
    }
}