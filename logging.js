/*
    A separate module to log changes to a file.
*/
let currentYear = 2023;
let logPath = `${homeDir}\\Documents\\${"KeoghLongBeach"+currentYear+".txt"}`;

// we can use this function for log file purposes
async function GetDateTime() {
    let apiData = await fetch("http://worldtimeapi.org/api/timezone/America/Los_Angeles");
    let data = await apiData.json();
    const monthAndDate = data['datetime'].substring(0,10);
    const year = Number(monthAndDate.substring(0,4));
    const month = Number(monthAndDate.substring(5,7));
    const date = Number(monthAndDate.substring(8,10));
    if (month == 12 && date > 25 && year != currentYear + 1) { // First, check if we have opened the program during the "going dark" time. In this case, 
        currentYear++;
    } else if (year != currentYear) { //If it is not the "going dark" period, just make sure that the year is correct for the sake of the path.
        currentYear = year;
    }
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