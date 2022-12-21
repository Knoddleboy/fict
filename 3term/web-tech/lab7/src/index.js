const playButton = document.querySelector(".play-btn");
const closeButton = document.querySelector(".close-btn");
const startButton = document.querySelector(".circles-start-btn");
const consoleField = document.querySelector(".console-output");
const fastConsoleField = document.querySelector(".fast-console-output");

const footerBox = document.querySelector(".footer-box");

const workBlock = {
    el: document.querySelector(".work"),
    get width() {
        return this.el.clientWidth;
    },
    get height() {
        return this.el.clientHeight;
    },
};

const animBlock = {
    el: document.querySelector(".anim"),
    get width() {
        return this.el.clientWidth;
    },
    get height() {
        return this.el.clientHeight;
    },
};

const timeouts = [];

const ENUM__ROLES = {
    INFO: "INFO",
    WARN: "WARN",
    FAST: "FAST",
};

function outputConsole(msg, role = ENUM__ROLES.INFO) {
    const parent = role === ENUM__ROLES.FAST ? fastConsoleField : consoleField;

    switch (role) {
        case ENUM__ROLES.INFO: // default info
            msg = `&#8505;&#65039; ${msg}`;
            break;
        case ENUM__ROLES.WARN: // warning
            msg = `&#9888;&#65039; ${msg}`;
            break;
        case ENUM__ROLES.FAST:
            msg = `&#127921; ${msg}`;
            break;
    }

    function addMsgEl() {
        const msgSpan = document.createElement("span");
        msgSpan.innerHTML = msg;

        parent.appendChild(msgSpan);
    }

    function outAnimation(timeout = 2500, callback) {
        const last = parent.lastChild;

        if (timeouts.length) {
            timeouts.forEach((t) => clearTimeout(t));
        }

        const t1 = setTimeout(() => {
            last.classList.add("console--out");

            const t2 = setTimeout(() => {
                parent.removeChild(last);

                if (callback) callback();
            }, 300);

            timeouts.push(t2);
        }, timeout);

        timeouts.push(t1);
    }

    if (parent.children.length) {
        if (role !== ENUM__ROLES.FAST) {
            outAnimation(0, () => {
                addMsgEl();
                // outAnimation();
            });
        } else {
            parent.replaceChildren();
            addMsgEl();
        }
    } else {
        addMsgEl();
        // if (role !== ENUM__ROLES.FAST) outAnimation();
    }
}

let circles = [];

function isCollide(c1, c2) {
    if (c1 === c2) return;

    const c1Rect = c1.el.getBoundingClientRect();
    const c2Rect = c2.el.getBoundingClientRect();

    return !(
        c1Rect.top + c1Rect.height <= c2Rect.top ||
        c1Rect.top >= c2Rect.top + c2Rect.height ||
        c1Rect.left + c1Rect.width <= c2Rect.left ||
        c1Rect.left >= c2Rect.left + c2Rect.width
    );
}

class Circle {
    constructor(color, dx, dy) {
        this.color = color;
        this.dx = dx || 0;
        this.dy = dy || 0;

        this.width = 20;
        this.height = 20;

        this.el = document.createElement("div");

        const styles = `
            width: ${this.width}px;
            height: ${this.height}px;
            border-radius: 50%;
            background-color: ${color};
            position: absolute;
            top: 0;
            left: 0;
        `;

        this.el.setAttribute("style", styles);

        animBlock.el.appendChild(this.el);
    }

    placeRandomly(w, h) {
        this.el.style.top = (Math.random() * (h - this.height)).toFixed() + "px";
        this.el.style.left = (Math.random() * (w - this.width)).toFixed() + "px";
    }

    #moveTo(x, y) {
        this.el.style.left = x + "px";
        this.el.style.top = y + "px";
    }

    #changeDirectionIfNecessary(x, y) {
        if (x < 0 || x > animBlock.width - this.width) {
            this.dx = -this.dx;

            outputConsole(`<b>${this.color}</b> circle touched wall`, ENUM__ROLES.FAST);
        }
        if (y < 0 || y > animBlock.height - this.height) {
            this.dy = -this.dy;

            outputConsole(`<b>${this.color}</b> circle touched wall`, ENUM__ROLES.FAST);
        }
    }

    getXY(parent = animBlock.el) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = this.el.getBoundingClientRect();
        const offsetY = elRect.top - parentRect.top;
        const offsetX = elRect.left - parentRect.left;
        return [offsetX, offsetY];
    }

    drawFromCurrentPosition(parent) {
        const [offsetX, offsetY] = this.getXY(parent);

        this.draw(offsetX, offsetY);
    }

    draw(x, y) {
        this.#moveTo(x, y);

        const ball = this;

        setTimeout(() => {
            if (isCollide(circles[0], circles[1])) {
                reloadAnimation();
                clearInterval(playTimer);

                outputConsole("circles collided");

                return;
            } else if (playTimerValue > 60) {
                reloadAnimation();
                clearInterval(playTimer);

                outputConsole("animation <b>time out</b>");

                return;
            }

            ball.#changeDirectionIfNecessary(x, y);
            ball.draw(x + ball.dx * 0.6, y + ball.dy * 0.4);
        }, 1000 / 240);
    }
}

function createCircles() {
    const { width, height } = animBlock;

    const c1 = new Circle("yellow", 4, 3);
    const c2 = new Circle("red", 2, 6);

    c1.placeRandomly(width, height);
    c2.placeRandomly(width, height);

    return [c1, c2];
}

function reloadAnimation() {
    startButton.innerHTML = "Reload";
    startButton.removeAttribute("disabled");
}

playButton.addEventListener("click", () => {
    workBlock.el.style.display = "initial";

    if (!circles.length) {
        circles = createCircles();
    }

    outputConsole("click: <b>play</b> button");
});

closeButton.addEventListener("click", () => {
    workBlock.el.style.display = "none";

    timeouts.forEach((t) => clearTimeout(t));
});

let playTimer;
let playTimerValue;

startButton.addEventListener("click", () => {
    if (!circles.length) {
        outputConsole("first create circles: click <b>play</b> button", ENUM__ROLES.WARN);
        return;
    }

    // actual reload click
    if (startButton.innerHTML === "Reload") {
        startButton.innerHTML = "Start";

        animBlock.el.replaceChildren();
        fastConsoleField.replaceChildren();
        footerBox.innerHTML = "0s";

        circles = createCircles();

        outputConsole("click: <b>reload</b> button");

        return;
    }

    circles.forEach((circle) => {
        circle.drawFromCurrentPosition(animBlock.el);
    });

    startButton.setAttribute("disabled", true);

    (() => {
        playTimerValue = 1;
        footerBox.innerHTML = "0s";
        playTimer = setInterval(() => {
            footerBox.innerHTML = `${playTimerValue}s`;
            playTimerValue++;
        }, 1000);
    })();

    outputConsole("click: <b>start</b> button");
});