const electron = require("electron");
const log = require("./logging.js");

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
        log.writeToFile(`${result} has logged in.`);
        return result;
    }
}

module.exports = {
    auth: new AuthenticationModule()
};