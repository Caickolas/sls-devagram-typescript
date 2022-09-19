import type {Handler,APIGatewayEvent} from 'aws-lambda';

export const register : Handler = async(event: APIGatewayEvent) => {
    return {
        headers: {
            'Access-Control-Allow-Origin' : '*'
        },
        statusCode: 200,
        body: JSON.stringify('Cadastro efetuado com sucesso')
    }
}