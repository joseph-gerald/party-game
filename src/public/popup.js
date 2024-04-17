function setText(text, type = "h1") {
    popup.querySelectorAll("#popup *").forEach(message => message.remove());

    const popupMessage = document.createElement(type);

    popupMessage.innerHTML = text.replaceAll(" ", "&nbsp;");

    showPopup();

    popup.appendChild(popupMessage);
}

function showText(text, type = "h1") {
    const popupMessage = document.createElement(type);

    popupMessage.innerHTML = text.replaceAll(" ", "&nbsp;");
    popupMessage.style.transform = "translateX(calc(-50vw - 100%))";
    popupMessage.style.textAlign = "center";
    popupMessage.style.scale = "1";

    showPopup();

    popup.appendChild(popupMessage);

    setTimeout(() => {
        popupMessage.style.transition = ".5s";
        popupMessage.style.transform = "none";
    }, 10)
}

function hideText() {
    const popupMessage = popup.querySelectorAll("#popup h1");

    hidePopup();

    for (const message of popupMessage) {
        message.style.transition = ".5s";
        message.style.transform = "translateX(calc(-50vw - 100%))";

        setTimeout(() => {
            message.remove();
        }, 800)
    }
}

function clearPopup() {
    popup.innerHTML = "";
    hidePopup();
}