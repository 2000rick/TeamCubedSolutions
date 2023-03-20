const electron = require("electron");

/*
    Component relating to logging in and logging out.
*/

export class AuthenticationModule {
    currentLoggedInUser = "";

    login() {
        if (this.currentLoggedInUser == "") {
            electron.ipcRenderer.invoke("prompt", {
                title: "Authentication",
                label: "No user logged in - enter your name:"
            }).then(result => {
                this.currentLoggedInUser = result;
            });
        } else {
            electron.ipcRenderer.invoke("prompt", {
                title: "Authentication",
                label: "Please enter your name:"
            }).then(result => {
                this.currentLoggedInUser = result;
            });
        }
    }
}