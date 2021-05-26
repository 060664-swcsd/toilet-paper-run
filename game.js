function setup() {

    TPGameInstance = new Game();

    TPGameInstance.init();

    if (typeof onTPRunLoad != "undefined")
        onTPRunLoad.apply(TPGameInstance);

    TPGameInstance.start();

}

function draw() {
    if (typeof TPGameInstance === "undefined") return;

    TPGameInstance.draw.call(TPGameInstance);
}

function keyPressed() {
    if (typeof TPGameInstance === "undefined") return;

    TPGameInstance.keyPressed.call(TPGameInstance, [keyCode]);
}

window.onerror = function(message) {
    if (typeof TPGameInstance !== "undefined") {
        TPGameInstance.err = message + "\nCheck console for more details";
        TPGameInstance.isPlaying = false;    
    }
// console.log(message, source, lineno, colno, error);
}