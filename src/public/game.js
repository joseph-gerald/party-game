const old = document.getElementById("old");
const current = document.getElementById("current");
const next = document.getElementById("next");

let username = localStorage.getItem("username");

async function getScreen(screen) {
    return fetch("screens/" + screen + ".html").then((res) => res.text());
}

function pushHTML(screen) {
    old.innerHTML = current.innerHTML;
    current.innerHTML = next.innerHTML;
    next.innerHTML = screen;
    
    next.style.transitionDuration = "0s";
    next.classList.add("opaque")

    /* get SCRIPT tag from next screen and eval */
    const script = next.querySelector("script");
    
    if (script) {
        eval(script.innerHTML);
    }

    setTimeout(() => {
        next.style.transitionDuration = "0.4s";
        next.classList.remove("opaque")
    }, 1);
}

async function pushScreen(screen) {
    if (screen) {
        pushHTML(await getScreen(screen));
    }
}

async function init() {
    while (!window.connected) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!username) {
        pushScreen("first");
    } else {
        pushScreen("options");
        connection.socket.send(username);
    }
}

init();