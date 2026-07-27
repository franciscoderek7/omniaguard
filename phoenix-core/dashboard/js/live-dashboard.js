async function loadPanel(file, element){

try{

const response = await fetch("data/" + file + ".json");

const data = await response.json();

document.getElementById(element).innerHTML =
"<pre>" + JSON.stringify(data,null,2) + "</pre>";

}

catch(error){

document.getElementById(element).innerHTML =
"Offline";

}

}


loadPanel("revenue-dashboard","revenue");
loadPanel("system-health","security");
loadPanel("operations","operations");
loadPanel("agents","agents");
