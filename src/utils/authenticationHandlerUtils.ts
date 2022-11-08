import { APIGatewayEvent } from "aws-lambda"

export const getUserIdFromEvent = (event: APIGatewayEvent) => {
    if(!event?.requestContext?.authorizer?.jwt?.claims['sub']){
        return null;
    }

    return event?.requestContext?.authorizer?.jwt?.claims['sub']
}