/*
    The JS file associated with index.html.
*/
const auth = require("./login-logout").auth;
const logging = require("./logging");

const userWelcomeNode = document.getElementById("welcome_message");
const loginButton = document.getElementById("login");
const submitCommentButton = document.getElementById("submit_comment_button");
const cancelCommentButton = document.getElementById("cancel_comment_button");
const commentForm = document.getElementById("user_comment");
const commentFormBody = document.getElementsByClassName("submit-comment-form")[0];

const uploadManifestButton = document.getElementById("manifest_import_file");
const loadUnloadButton = document.getElementById("load_ship_button");
const balanceButton = document.getElementById("balance_ship_button");

//See if we have a query parameter that is associated with the user.
const params = new URL(window.location).searchParams;
const user = params.get("user");

function updateButton(username) {
    if((username != null && username != "") && userWelcomeNode != null) {
        auth.currentLoggedInUser = username;
        if(submitCommentButton != null) {
            submitCommentButton.disabled = false;
        }
        if(uploadManifestButton != null) {
            uploadManifestButton.disabled = false;
        }
        userWelcomeNode.innerText = `Current Operator: ${username}`;
    } else {
        if(submitCommentButton != null) {
            submitCommentButton.disabled = true;
        }
        if(uploadManifestButton != null) {
            uploadManifestButton.disabled = true;
        }
        userWelcomeNode.innerText = `No operator logged in currently.`;
    }
    userWelcomeNode.appendChild(loginButton);
}

function hideCommentForm() {
    commentForm.value = "";
    commentFormBody.hidden = true;
}

function appendLoggedInUser(urlString) {
    return `${urlString}&user=${auth.currentLoggedInUser}`;
}

if(submitCommentButton != null) {
    submitCommentButton.addEventListener("click", (_) => {
        logging.writeToFile(`[${auth.currentLoggedInUser}]: ${commentForm.value}`);
        hideCommentForm();
    });
}

if(cancelCommentButton != null) {
    cancelCommentButton.addEventListener("click", hideCommentForm);
}

if(loginButton != null) {
    loginButton.addEventListener("click", () => {
        auth.login().then(username => updateButton(username));
    });
}

if(loadUnloadButton != null) {
    loadUnloadButton.addEventListener("click", () => {
        let filepath = document.getElementById('manifest_import_file').files[0]['path'];
		if (filepath != "")
        window.location=appendLoggedInUser(`move_crates.html?filepath=${filepath}`);
    });
}

if(balanceButton != null) {
    balanceButton.addEventListener("click", () => {
        let filepath = document.getElementById('manifest_import_file').files[0]['path'];
		if (document.getElementById('manifest_import_file').value != "")
			window.location=appendLoggedInUser(`algorithm.html?filepath=${filepath}&method=2`);
    });
}

updateButton(user);