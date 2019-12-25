const functions = require('firebase-functions');
const app = require('express')();
//const { FireBaseAuth } = require ('./util/FireBaseAuth');
const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, signin, uploadImage }  = require('./handlers/users');
const { admin, db } = require('./util/admin')

const FireBaseAuth = (req, res, next) => {
    let idtoken
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idtoken = req.headers.authorization.split('Bearer ')[1]; // get the token 
    } else {
        console.error('No token found');
        return res.status(403).json({
            error: 'Unauthorized'
        })
    }
    // we have token, but check if it;s not random token
    admin
        .auth().
        verifyIdToken(idtoken)
        .then(decodedToken => {
            console.log(decodedToken);
            req.user = decodedToken;
            // since we dont store additional data in auth, reach out db and get the 
            // user handle 
            return db
                .collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get();
        }).then(data => {
            req.user.handle = data.docs[0].data().handle;
            return next();
        }).catch(err => {
            console.error('Error while verifying token', err);
            return res.status(403).json(err)
        })
}
/** Scream Route */
app.get('/screams', getAllScreams);
app.post('/scream', FireBaseAuth, postOneScream);
/** User Route  */
app.post('/signup', signup);
app.post('/login', signin);
app.post('user/image',uploadImage)
exports.api = functions.https.onRequest(app);