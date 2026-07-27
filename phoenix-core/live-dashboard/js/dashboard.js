async function loadData(){

let files=[
"system",
"revenue",
"agents",
"security",
"operations",
"analytics"
];

for(let file of files){

let response=await fetch("../data/"+file+".json");

let data=await response.json();

console.log(file,data);

}

}

loadData();
