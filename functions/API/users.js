const { admin, db } = require('../util/admin');
const config = require('../util/config');

const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");

initializeApp(config);

const { validateLoginData, validateSignUpData } = require('../util/validators');

exports.loginUser = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }

    const { valid, errors } = validateLoginData(user);
    if (!valid) return response.status(400).json(errors);

    const auth = getAuth();
    signInWithEmailAndPassword(auth, user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((token) => {
            return response.json({ token });
        })
        .catch((error) => {
            console.error(error);
            return response.status(403).json({ general: "Wrong credentials, please try again"});
        })
};

exports.signUpUser = (request, response) => {
    const newUser = {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        phoneNumber: request.body.phoneNumber,
        country: request.body.country,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        username: request.body.username
    };

    const { valid, errors } = validateSignUpData(newUser);
    if (!valid) return response.status(400).json(errors);

    let token, userId;
    db
        .doc(`/users/${newUser.username}`)
        .get()
        .then((doc) => {
            if (doc.exists) return response.status(400).json({ username: "This username is already taken "});
            else {
                const auth = getAuth();
                return createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idtoken) => {
            token = idtoken;
            const userCredentials = {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                username: newUser.username,
                phoneNumber: newUser.phoneNumber,
                country: newUser.country,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            return db
                .doc(`/users/${newUser.username}`)
                .set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({ token });
        })
        .catch((err) => {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                return response.status(400).json({ email: "Email already in use"});
            } else {
                return response.status(500).json({ general: "Something went wrong, please try again" });
            }
        });
};

deleteImage = (imageName) => {
    const bucket = admin.storage().bucket();
    const path = `${imageName}`;
    return bucket.file(path).delete()
        .then(() => {})
        .catch(() => {});
};

exports.uploadProfilePhoto = (request, response) => {
    const BusBoy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");
    const busboy = BusBoy({ headers: request.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on("file", (name, file, info) => {
        const { filename, mimeType } = info;

        if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
            return response.status(400).json({ error: `Wrong file type submitted. Submitted ${mimeType}` });
        }
        const imageExtension = filename.split('.')[filename.split(".").length - 1];
        imageFileName = `${request.user.username}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filePath, mimetype: mimeType};
        file.pipe(fs.createWriteStream((filePath)));
    });
    deleteImage(imageFileName).then(() => {});
    busboy.on("finish", () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${request.user.username}`).update({
                    imageUrl
                });
            })
            .then(() => {
                return response.json({ message: "Image uploaded successfully" });
            })
            .catch((error) => {
                console.error(error);
                return response.status(500).json({ error: error.code });
            });
    });
    busboy.end(request.rawBody);
}

exports.getUserDetail = (request, response) => {
    let userData = {};
    db
        .doc(`/users/${request.user.username}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.userCredentials = doc.data();
                return response.json(userData);
            }
        })
        .catch((error) => {
            console.error(error);
            return response.status(500).json({error: error.code})
        })
}

exports.updateUserDetails = (request, response) => {
    let document = db.doc(`/users/${request.user.username}`);
    document.update(request.body)
        .then(() => {
            response.json({ message: "Updated successfully" });
        })
        .catch((error) => {
            console.error(error);
            return response.status(500).json({ message: "Cannot update the value" });
        });
}