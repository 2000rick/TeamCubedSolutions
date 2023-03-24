/*
    A separate module to log changes to a file.
*/
let currentYear = 2023;
const logPath = `${homeDir}\\Documents\\${"KeoghLongBeach"+currentYear+".txt"}`;

// we can use this function for log file purposes
async function GetDateTime() {
    let apiData = await fetch("http://worldtimeapi.org/api/timezone/America/Los_Angeles");
    let data = await apiData.json();
    datetime = new Date(data['datetime'].substring(0, 19)).toString();
    let result = datetime.toString().substr(4,11) + ':' + datetime.toString().substr(15, 6) + ' ' + data['abbreviation'];
    return result;
}

class Logger {
    // https://www.geeksforgeeks.org/node-js-fs-chmod-method/
    async writeToFile(text) {
        const datetime = await GetDateTime();
        text = datetime + ' ' + text + "\n";
        if(fs.existsSync(logPath)) {
            fs.chmodSync(logPath, 0o600); //Read/Write
        }
        fs.appendFileSync(logPath, text);
        fs.chmodSync(logPath, 0o444); //Changes File to Read Only
    }
}

module.exports = new Logger();