const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const R = new AWS.Rekognition();
const moment = require('moment');
exports.handler = async function (event, context, callback) {
    let messageResponse = "";
    try{
        // get event body
        const base64 = event.body;

        // image buffer
        const base64Data = new Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = base64.split(';')[0].split('/')[1];
        
        // save to s3
        const s3Response = await saveImageToS3(base64Data , type);

        // call rekognition
        const objectResponse = await detectObject(s3Response);
        
        messageResponse = objectResponse;
       
       
       console.log("type:" + typeof(objectResponse));
    }catch(e){
        messageResponse = "Error : " + e;
    }
    
    const response = {
        statusCode: 200,
        body: JSON.stringify(messageResponse),
        isBase64Encoded: true,
        headers: { "Access-Control-Allow-Origin": "*" },
    };
    return response;
};

/**
 * Call Rekognition api to detect the object 
 * from s3
 * @param {*} s3Object 
 */
const detectObject = async (s3Object) =>{
    const params = {
      Image: {
        S3Object: {
          Bucket: s3Object.Bucket,
          Name: s3Object.Key,
        },
      },
      MaxLabels: 10,
      MinConfidence: 50
    };
    const rekognitionResponse = R.detectLabels(params).promise();
    
    return rekognitionResponse;
};

/**
 * Save image to S3
 * @param {} base64Data 
 * @param {*} type 
 */
const saveImageToS3 = async (base64Data, type) =>{
    let params = {
            Bucket: 'api-rekognition-repo',
            Key: `${moment().format('YYYY-MMM-DD-HH-MM-SS')}.png`,
            Body: base64Data,
            ContentEncoding: 'base64',
            ContentType: `image/${type}` 
        };
    
    return s3.upload(params).promise();
};