async function loadCore(){

const sources = [
"core-status",
"revenue-dashboard",
"system-health",
"agents"
];

for (const source of sources){

try{

const response = await fetch(
"data/"+source+".json"
);

const data = await response.json();

console.log(
"Phoenix Core:",
source,
data
);

}

catch(error){

console.log(
"Unavailable:",
source
);

}

}

}

loadCore();
