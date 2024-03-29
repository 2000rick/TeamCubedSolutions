var url = new URL(window.location);
var manifest_file = url.searchParams.get('filepath');
let crate_list = {};
let load_table = [];
let unload_table = [];
var fs = require("fs");

const table = document.querySelector('table');
for (let i = 0; i < 8; i++) {
  const row = document.createElement('tr');
  for (let j = 0; j < 12; j++) {
    const cell = document.createElement('td');
    cell.className = "interact_cell";
    cell.addEventListener( 'click', function(){
        if(!this.classList.contains("nan") && !this.classList.contains("unused")) {
            this.classList.toggle('selected');
            this.classList.toggle('inuse');
        }
    } );
    cell.textContent = `${8 - i},${j + 1}`;
    row.appendChild(cell);
  }
  table.appendChild(row);
}



function init_func() {
    //url = new URL(window.location);
    //manifest_file = url.searchParams.get('filepath');
    
    if (manifest_file != null) {
        
        let manifest_name = manifest_file.toString().substring(manifest_file.toString().lastIndexOf('_')+1, manifest_file.toString().lastIndexOf('.'));
        document.getElementById("ship_name").innerHTML = "Current Ship: " + manifest_name;
        document.getElementById("allow_load").hidden = false;
        //https://www.tutorialspoint.com/how-to-read-and-write-a-file-using-javascript
        fs.readFile(manifest_file, 'utf-8', function (err, data) {
            if (err) throw err;
            fill_manifest_table(data);
        });
    }
    else {
        document.getElementById("error_message_div").hidden = false;
        let home_path = url.href.toString().substring(0, url.href.lastIndexOf("/"));
        document.getElementById("error_message_text").innerHTML = "No manifest file selected... Go back to <a href=\"" + home_path +"\">main menu</a>";
    }
}
//Open table functions
function open_unload_table() {
    if (document.getElementById("open_table_btn").innerText == "Select from table") {
        document.getElementById("open_table_btn").innerText = "Fill in text";
        document.getElementById("unload_table_selector").hidden = false;
        document.getElementById("unload_text_selector").hidden = true;
    }
    else {
        document.getElementById("open_table_btn").innerText = "Select from table";
        document.getElementById("unload_table_selector").hidden = true;
        document.getElementById("unload_text_selector").hidden = false;
    }
}
//Fill manifest table with vals
function fill_manifest_table(result) {
    var output = result.toString().split("\n");
    for (let i = 0; i < output.length; i++) {
        let line = output[i].split(", ");
        let strpos = line[0].split(',');
        let pos = [ Number(strpos[0].substring(1)) , Number(strpos[1].substring(0, strpos[1].length - 1)) ];
        //console.log("["+ pos[0] + "," + pos[1] + "]");
        let data = table.childNodes[9-pos[0]].childNodes[pos[1]-1];
        if (line[2][line[2].length-1] == '\r') data.dataset.crate_name = line[2].substring(0,line[2].length - 1)
        else data.dataset.crate_name = line[2];
        //console.log("*" + line[2] + "*");
        if (data.dataset.crate_name.toUpperCase().indexOf('NAN') == 0) {
            console.log("nan at " + pos[0] + "," + pos[1]);
            data.classList.add('nan');
        }
        else if (data.dataset.crate_name.toUpperCase().indexOf('UNUSED') == 0) {
            console.log("unused at " + pos[0] + "," + pos[1]);
            data.classList.add('unused');
        }
        else {
            data.classList.add('inuse');
            if (crate_list[data.dataset.crate_name] != "") crate_list[data.dataset.crate_name] = [pos];
            else crate_list[data.dataset.crate_name].push(pos);
            let new_el = document.createElement('option');
            new_el.innerText = data.dataset.crate_name;
            document.getElementById("unload_text").appendChild(new_el);
        }               
    }
    
    
    
}

// Load / Unload
function add_unload_text() {
    let un_txt = document.getElementById("unload_text");
    if (add_unload(un_txt.value  + ", [" + crate_list[un_txt.value][0].toString() + "]")) {
    
        let pos = crate_list[un_txt.value][0];
        unload_table.push(pos);
        let data = table.childNodes[9-pos[0]].childNodes[pos[1]-1];
        data.classList.add('chosen');
        
        un_txt.remove(un_txt.selectedIndex);
    }
}

function add_unload_table() {
    for (let i = 0; i < table.childNodes.length; i++) {
          let row = table.childNodes[i];
        for (let j = 0; j < row.childNodes.length; j++) {
               let data = row.childNodes[j];
            if (data.className.toString().indexOf("selected") != -1) {
                data.classList.remove('selected');
                data.classList.add('chosen');
                if (add_unload(data.dataset.crate_name)) {
                    unload_table.push([9-i,j+1]);
                    let un_txt = document.getElementById("unload_text");
                    for (let k = 0; k < un_txt.length; k++) {
                        if (un_txt.options[k].value == data.dataset.crate_name) { 
                            un_txt.remove(k);
                            break;
                        }
                    }
                }
                
                
            }
        }
    }
}
 
function add_unload(text) {
    if (text != "") {
        let unload_tb = document.getElementById("unload_table");
        if (unload_tb.childNodes.length != 1) unload_tb.size = unload_tb.size + 1;
        let new_el = document.createElement('option');
        new_el.innerText = text;
        unload_tb.appendChild(new_el);
        return true;
    }
    return false;
}

const integersOnly = /^[0-9]{1,5}$/;

function add_load_text() {
    const weight = document.getElementById("load_weight").value;
    if(integersOnly.test(weight) == false) {
        document.getElementById("error_message_div").hidden = false;
        document.getElementById("error_message_text").innerText = "Invalid input for new container weight. Try again.";
    } else {
        document.getElementById("error_message_div").hidden = true;
        document.getElementById("error_message_text").innerText = "";
        add_load(document.getElementById("load_text").value + ", " + document.getElementById("load_weight").value);
        load_table.push(document.getElementById("load_text").value + ",,," + document.getElementById("load_weight").value);
        document.getElementById("load_text").value = "";
        document.getElementById("load_weight").value = "";
    }
}
function add_load(text) {
    if (text != "") {
        let load_tb = document.getElementById("load_table");
        if (load_tb.childNodes.length != 1) load_tb.size = load_tb.size + 1;
        let new_el = document.createElement('option');
        new_el.innerText = text;
        load_tb.appendChild(new_el);
        
    }
}

// Generate Moves
function generate_move_page() {
    let args = "?filepath=" + url.searchParams.get("filepath");
    args += "&method=1";
    args += "&load=[";
    for (let i = 0; i < load_table.length; i++) {
        args += "[\"" + load_table[i] + "\"]";
        if (i < load_table.length - 1) args += ",";
    }
    args += "]";
    args += "&unload=[";
    for (let i = 0; i < unload_table.length; i++) {
        args += "[" + unload_table[i][0] + "," + unload_table[i][1] + "]"
        if (i < unload_table.length - 1) args += ",";
    }
    args += "]";

    const user = url.searchParams.get('user');
    args += `&user=${user}`;
    window.location='algorithm.html' + args;
}

document.getElementById("add_load_btn").addEventListener("click", add_load_text);
document.getElementById("add_unload_btn").addEventListener("click", add_unload_text);
document.getElementById("open_table_btn").addEventListener("click", open_unload_table);
document.getElementById("unload_table_selector_btn").addEventListener("click", add_unload_table);
document.getElementById("generate_moves_btn").addEventListener("click", generate_move_page);

init_func();