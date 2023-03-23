const electron = require("electron");

/*
    Component relating to logging in and logging out.
*/

class AuthenticationModule {
    currentLoggedInUser = "";

    async login() {
        let result;
        if (this.currentLoggedInUser == "") {
            result = await electron.ipcRenderer.invoke("prompt", {
                title: "Authentication",
                label: "No user logged in - enter your name:"
            });
        } else {
            result = electron.ipcRenderer.invoke("prompt", {
                title: "Authentication",
                label: "Please enter your name:"
            });
        }
        this.currentLoggedInUser = result;
        return result;
    }
}

module.exports = {
    auth: new AuthenticationModule()
};