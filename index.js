const logging = require("./logging");

/*
    The JS file associated with index.html.
*/
const auth = require("./login-logout").auth;

const userWelcomeNode = document.getElementById("welcome_message");
const loginButton = document.getElementById("login");
const submitCommentButton = document.getElementById("submit_comment_button");
const cancelCommentButton = document.getElementById("cancel_comment_button");
const commentForm = document.getElementById("user_comment");
const commentFormBody = document.getElementsByClassName("submit-comment-form")[0];

const loadUnloadButton = document.getElementById("load_ship_button");
const balanceButton = document.getElementById("balance_ship_button");

//See if we have a query parameter that is associated with the user.
const params = new URL(window.location).searchParams;
const user = params.get("user");

function updateButton(username) {
    if(username != null && userWelcomeNode != null) {
        auth.currentLoggedInUser = username;
        if(submitCommentButton != null) {
            submitCommentButton.disabled = false;
        }
        userWelcomeNode.innerText = `Current Operator: ${username}`;
    } else {
        if(submitCommentButton != null) {
            submitCommentButton.disabled = true;
        }
        userWelcomeNode.innerText = `No operator logged in currently.`;
    }
    userWelcomeNode.appendChild(loginButton);
}

function hideCommentForm() {
    commentForm.value = "";
    commentFormBody.hidden = true;
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
        window.location=`move_crates.html?filepath=${filepath}&user=${auth.currentLoggedInUser}`;
    });
}

if(balanceButton != null) {
    balanceButton.addEventListener("click", () => {
        let filepath = document.getElementById('manifest_import_file').files[0]['path'];
		if (document.getElementById('manifest_import_file').value != "")
			window.location=`algorithm.html?filepath=${filepath}&method=2&user=${auth.currentLoggedInUser}`;
    });
}

console.log(auth.currentLoggedInUser);
updateButton(user);