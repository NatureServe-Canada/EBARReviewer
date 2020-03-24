
import * as esriLoader from 'esri-loader';
import config from "../config";

const Promise = require('es6-promise').Promise;
const esriLoaderOptions = {
    url: 'https://js.arcgis.com/4.10'
};
// before using esri-loader, tell it to use the promise library if the Promise polyfill is being used
esriLoader.utils.Promise = Promise;

const OAuthManager = function(oauth_appid){
    
    let userCredential = null;
    let isAnonymous = true;
    let poralUser = null;
    let info = null;
    let esriId = null;
    
    const signIn = ()=>{
        esriId.getCredential(info.portalUrl + "/sharing").then((res)=>{
            console.log("signIned as : " + info.portalUrl)
            setUserCredential(res);
        });
    };

    const signOut = ()=>{
        esriId.destroyCredentials();
        window.location.reload();
    };

    const setUserCredential = (credentialObject)=>{
        userCredential = credentialObject;
        isAnonymous = credentialObject ? false : true;
    };

    const getUserContentUrl = ()=>{
        const outputUrl =  `${userCredential.server}/sharing/rest/content/users/${userCredential.userId}`;
        return outputUrl
    };

    const checkIsAnonymous = ()=>{
        return isAnonymous;
    };

    const setPortalUser = ()=>{

        return new Promise((resolve, reject)=>{

            esriLoader.loadModules([
                "esri/portal/Portal"
            ], esriLoaderOptions).then(([
                Portal
            ])=>{
                const portal = new Portal();
                portal.url = config.portalURL, // "https://gis.natureserve.ca/arcgis"
                // Setting authMode to immediate signs the user in once loaded
                portal.authMode = "immediate";
        
                // Once loaded, user is signed in
                portal.load().then(()=>{
                    resolve(portal.user);
                }).catch(err=>{
                    reject(err);
                });
            });
        });

    };

    const init = ()=>{

        return new Promise((resolve, reject)=>{
            esriLoader.loadModules([
                "esri/identity/OAuthInfo",
                "esri/identity/IdentityManager",
            ], esriLoaderOptions).then(([
                OAuthInfo, IdentityManager
            ]) => {

                esriId = IdentityManager;

                info = new OAuthInfo({
                    appId: oauth_appid,
                    popup: false,
                    portalUrl: config.portalURL, // "https://gis.natureserve.ca/arcgis"
                });

                esriId.useSignInPage = false;

                esriId.registerOAuthInfos([info]);

                esriId.checkSignInStatus(info.portalUrl + "/sharing").then((res)=>{
                    setUserCredential(res);
                    setPortalUser().then(res=>{
                        poralUser = res;
                        resolve(res);
                    });
                    
                }).catch(()=>{
                    // console.log('Anonymous view, sign in first');
                    signIn();
                });
            
            }).catch(err=>{
                reject(err);
                console.error(err);
            })
        });

    };

    const getUserID = ()=>{
        return poralUser ? poralUser.username : userCredential.userId;
    };

    const getToken = ()=>{
        return userCredential.token;
    };

    const getPoralUser = ()=>{
        return poralUser;
    }

    return {
        init,
        signIn,
        signOut,
        getUserContentUrl,
        isAnonymous: checkIsAnonymous,
        getUserID,
        getToken,
        getPoralUser
    };

};

export default OAuthManager;