import serverless from "serverless-http";
import { createApp } from "../../server/app";

let serverlessHandler: any;

export const handler: any = async (event: any, context: any) => {
    if (!serverlessHandler) {
        const app = await createApp();
        serverlessHandler = serverless(app);
    }
    return serverlessHandler(event, context);
};
