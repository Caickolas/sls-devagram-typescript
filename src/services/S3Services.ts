import { FileData } from 'aws-multipart-parser/dist/models';
import * as AWS from 'aws-sdk';
import * as Uuid from 'uuid';
import { imageExtensionsAllowed } from '../constants/Regexes';

const S3 = new AWS.S3();

export class S3Service {

    public saveImage(bucket: string, type: string, file: FileData) : Promise<any> {
        return new Promise<any>((resolve,reject) => {
            try{
                const uuidAvatar = Uuid.v4();
                const extension = imageExtensionsAllowed.exec(file.filename) || [''];

                const key = `${type}-${uuidAvatar}${extension[0]}`

                const config = {
                    Bucket: bucket,
                    Key: key,
                    Body: file.content
                }

                S3.upload(config, (err, res) => {
                    if(err){
                        return reject(err);
                    }
                    resolve(res);
                })

            }catch(error){
                reject(error);
            }
        })
    }
}