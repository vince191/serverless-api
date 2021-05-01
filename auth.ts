import jwk from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import request from "request";

const iss = "https://cognito-idp.eu-west-1.amazonaws.com/12345";

const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = "2021-05-01";
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

export const authorize = (event, context, cb) => {
  console.log("Auth function invoked");
  if (event.authorizationToken) {
    const token = event.authorizationToken.substring(7);
    request(
      { url: `${iss}/.well-known/jwks.json`, json: true },
      (error, response, body) => {
        if (error || response.statusCode !== 200) {
          console.log("Request error:", error);
          cb("Unauthorized");
        }
        const keys = body;
        const k = keys.keys[0];
        const jwkArray = {
          kty: k.kty,
          n: k.n,
          e: k.e,
        };
        const pem = jwkToPem(jwkArray);
        jwk.verify(token, pem, { issuer: iss }, (err, decoded) => {
          if (err) {
            console.log("Unauthorized user:", err.message);
            cb("Unauthorized");
          } else {
            cb(null, generatePolicy(decoded.sub, "Allow", event.methodArn));
          }
        });
      }
    );
  } else {
    console.log("No token was found in the header.");
    cb("Unauthorized");
  }
};
