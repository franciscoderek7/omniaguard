console.log("Phoenix Core Command Center Online");

async function loadSystem(){

let files=[
"empire",
"revenue",
"security",
"agents"
];

for(let file of files){

let response = await fetch(
"data/"+file+".json"
);

let data = await response.json();

console.log(file,data);

}

}

loadSystem();
