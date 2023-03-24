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
const commentFormBody = document.getElementsByClassName("submit-comment-form")[0]

//See if we have a query parameter that is associated with the user.
const params = new URL(window.location).searchParams;
const user = params.get("user");

function updateButton(username) {
    if(username != null && userWelcomeNode != null) {
        auth.currentLoggedInUser = username;
        submitCommentButton.disabled = false;
        userWelcomeNode.innerText = `Welcome, ${username}`;
    } else {
        submitCommentButton.disabled = true;
        userWelcomeNode.innerText = `Nobody logged in.`;
    }
    userWelcomeNode.appendChild(loginButton);
}

function hideCommentForm() {
    commentForm.value = "";
    commentFormBody.hidden = true;
}

submitCommentButton.addEventListener("click", (_) => {
    logging.writeToFile(`[${auth.currentLoggedInUser}]: ${commentForm.value}`);
    hideCommentForm();
});

cancelCommentButton.addEventListener("click", hideCommentForm);

loginButton.addEventListener("click", () => {
    auth.login().then(username => updateButton(username));
});

updateButton(user);