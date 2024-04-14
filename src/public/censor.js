(() => {
    // if they put enough effort to overwrite IsLocalhost they would find a way to bypass anyways
    if (isLocalhost) return;

    let timeoutId = null;
    const cover = document.getElementById("loading-cover");

    function integrityCheck() {
        const documentCover = document.getElementById("loading-cover");

        if (documentCover == null || documentCover !== cover)
            location.reload();
    }

    setInterval(integrityCheck, 100);

    function censor(visible) {
        const delay = visible ? 300 : 0;

        cover.style.alignItems = "center";
        cover.style.justifyContent = "center";

        cover.innerHTML = `
        <h1 style="text-align: center">
            <b style="font-size: 80px">👁️👁️</b><br>
            Game Paused
        </h1>`;
        cover.style.opacity = visible ? "0" : "1";

        cover.style.transitionDuration = visible ? "300ms" : "0ms";
        cover.style.transitionDelay = visible ? "300ms" : "0ms";
        cover.style.backdropFilter = visible ? "blur(0px)" : "blur(300px) brightness(0.8)";

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            cover.style.display = visible ? "none" : "flex";
        }, delay * 2);
    }

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Meta' || event.key === 'OS') {
            censor(false);
        }
    });

    window.addEventListener('keyup', function (event) {
        if (event.key === 'Meta' || event.key === 'OS') {
            censor(true);
        }
    });

    function onVisibilityChange(callback) {
        var visible = true;

        if (!callback) {
            throw new Error('no callback given');
        }

        function focused() {
            if (!visible) {
                callback(visible = true);
            }
        }

        function unfocused() {
            if (visible) {
                callback(visible = false);
            }
        }

        // Standards:
        if ('hidden' in document) {
            visible = !document.hidden;
            document.addEventListener('visibilitychange',
                function () { (document.hidden ? unfocused : focused)() });
        }
        if ('mozHidden' in document) {
            visible = !document.mozHidden;
            document.addEventListener('mozvisibilitychange',
                function () { (document.mozHidden ? unfocused : focused)() });
        }
        if ('webkitHidden' in document) {
            visible = !document.webkitHidden;
            document.addEventListener('webkitvisibilitychange',
                function () { (document.webkitHidden ? unfocused : focused)() });
        }
        if ('msHidden' in document) {
            visible = !document.msHidden;
            document.addEventListener('msvisibilitychange',
                function () { (document.msHidden ? unfocused : focused)() });
        }
        // IE 9 and lower:
        if ('onfocusin' in document) {
            document.onfocusin = focused;
            document.onfocusout = unfocused;
        }
        // All others:
        window.onpageshow = window.onfocus = focused;
        window.onpagehide = window.onblur = unfocused;
    };

    onVisibilityChange(censor);
})();