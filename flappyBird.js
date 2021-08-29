class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    plus(other) {
        return new Vec(this.x + other.x, this.y + other.y);
    }
    times(factor) {
        return new Vec(this.x * factor, this.y * factor);
    }
}

class Bird {
    constructor(position, speed) {
        this.position = position;
        this.speed = speed;
        this.birdRotateAngle = 0;
    }

    update(speed) {
        this.speed = this.speed.plus(speed);
        this.position = this.position.plus(this.speed);

        //the steeper the angle the greater the addition (simulates acceleration)
        //26 is to insure the angle is positive and greater than 0, the 10 is a factor to make the value smaller
        if (gameStarted) {
            let angleFactor = (this.birdRotateAngle + 26) / 8;
            if (this.birdRotateAngle + angleFactor < 90) this.birdRotateAngle += angleFactor;
            else this.birdRotateAngle = 90;
        }
    }

    static size = new Vec(54, 36);
}

class Pipe {
    constructor(position, img, length) {
        this.position = position;
        this.img = img;
        this.size = new Vec(Pipe.pipeWidth, length);
        Pipe.pipesInState.push(this);
    }

    static create() {
        let randomPipeFactor = Math.floor((Math.random() * 100)) * 1.5;

        let lowerPipeYPosition = (backgroundHeight / 2) + randomPipeFactor;
        new Pipe(new Vec(backgroundWidth, lowerPipeYPosition), pipeImg, backgroundHeight - lowerPipeYPosition);
        let upperPipeYPosition = 0 - (Pipe.pipesVerticalSpacing - randomPipeFactor);
        new Pipe(new Vec(backgroundWidth, upperPipeYPosition), upperPipeImg, upperPipeYPosition + (backgroundHeight / 2));
    }

    static pipesInState = [];
    static pipeWidth = 80;
    static pipesVerticalSpacing = 149;
    static werePipesCreatedRecently = false;

    static update() {
        for (let pipe of Pipe.pipesInState) {
            pipe.position = pipe.position.plus(stateScrollingSpeed);
        }
        //deleting pipes that exited the screen
        if (Pipe.pipesInState[0].position.x <= 0 - Pipe.pipeWidth) {
            Pipe.pipesInState = Pipe.pipesInState.slice(2);
            Pipe.werePipesCreatedRecently = false;
        }
        //adding pipes when the first ones reach the middle of the screen
        else if (Pipe.pipesInState[0].position.x <= (backgroundWidth / 2) - Pipe.pipeWidth && !Pipe.werePipesCreatedRecently) {
            Pipe.create(backgroundHeight);
            Pipe.werePipesCreatedRecently = true;
            score++;
        }
    }
}

class Ground {
    constructor(position) {
        this.position = position;
        Ground.groundPiecesInState.push(this);
    }

    static groundPiecesInState = [];
    static groundPieceWidth = 37;
    static wasGroundCreatedRecently = false;

    static update() {
        for (let groundPiece of Ground.groundPiecesInState) {
            groundPiece.position = groundPiece.position.plus(stateScrollingSpeed);
        }

        //deleting grounds that exited the screen
        if (Ground.groundPiecesInState[0].position.x <= 0 - Ground.groundPieceWidth) {
            Ground.groundPiecesInState.shift();
            Ground.wasGroundCreatedRecently = false;
        }
        if (Ground.groundPiecesInState[0].position.x <= 0 && !Ground.wasGroundCreatedRecently) {
            let newGroundHorizontalPosition = Ground.groundPiecesInState[Ground.groundPiecesInState.length - 1].position.x + Ground.groundPieceWidth;
            new Ground(new Vec(newGroundHorizontalPosition, backgroundHeight));
            Ground.wasGroundCreatedRecently = true;
        }
    }
}

let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");

let backgroundImg = document.createElement('img');
backgroundImg.src = './canvas pictures/background.png';
let groundImg = document.createElement('img');
groundImg.src = './canvas pictures/ground.png';
let pipeImg = document.createElement('img');
pipeImg.src = './canvas pictures/pipe.png';
let upperPipeImg = document.createElement('img');
upperPipeImg.src = './canvas pictures/upper-pipe.png';
let restartButtonImg = document.createElement('img');
restartButtonImg.src = './canvas pictures/restart.png'
let scoreBoardImg = document.createElement('img');
scoreBoardImg.src = './canvas pictures/scoreBoard.png'

let birdAnimation = [];
birdAnimation[0] = document.createElement('img');
birdAnimation[1] = document.createElement('img');
birdAnimation[2] = document.createElement('img');
birdAnimation[3] = document.createElement('img');
birdAnimation[0].src = './canvas pictures/bird0.png';
birdAnimation[1].src = './canvas pictures/bird1.png';
birdAnimation[2].src = './canvas pictures/bird0.png';
birdAnimation[3].src = './canvas pictures/bird2.png';



let gameStarted = false;
let restartEnabled = false;

let backgroundWidth = 480;
let backgroundHeight = 550;
let randomPipeFactor = Math.floor((Math.random() * 100)) * 1.5;

const speedLimit = new Vec(0, 8);
const constantSpeed = new Vec(0, 0);
const gravity = new Vec(0, 0.9);
let startingScreenGravity = new Vec(0, 0.05);
let startingScreenSpeedLimit = new Vec(0, 1);
const stateScrollingSpeed = new Vec(-3, 0);


//initial game objects
let bird = new Bird(new Vec(200, 300), new Vec(0, 0));
//pipes are created when game starts
let groundWidth = Ground.groundPieceWidth;
for (let i = 0; i <= backgroundWidth; i += groundWidth) {
    new Ground(new Vec(i, backgroundHeight));
    ctx.drawImage(groundImg, i, backgroundHeight);
}

let gameOver = false;
let lives = 5;//
let doesCollideWithPipes = true;
let frame = 0;
let topScore = 0;
let score;
draw();

function draw() {
    ctx.drawImage(backgroundImg, 0, 0, backgroundWidth, backgroundHeight);

    //drawing the pipes
    if (gameStarted) {
        drawPipes();
    }
    //drawing and rotating the bird
    drawBirdAtAnAngle();
    //drawing the ground
    drawGround();

    drawScore(lives, 50, 50);//

    if (gameStarted) drawScore(score, backgroundWidth / 2 - 25, 160);

    if (!gameOver) {
        frame++;
        if (gameStarted) {
            if (frame === 20) frame = 0;
            collisionDetection();
        }

        stateUpdate();
        requestAnimationFrame(draw);
    } else {
        endOfGameAnimation();
    }
}

function drawBirdAtAnAngle() {
    ctx.save();
    ctx.translate(bird.position.x, bird.position.y);
    ctx.rotate(bird.birdRotateAngle * Math.PI / 180);
    birdSize = Bird.size;
    if (bird.birdRotateAngle > 45) frame = 0;
    if (gameStarted) ctx.drawImage(birdAnimation[parseInt(frame / 5)], -birdSize.x / 2, -birdSize.y / 2, birdSize.x, birdSize.y);
    else ctx.drawImage(birdAnimation[0], -birdSize.x / 2, -birdSize.y / 2, birdSize.x, birdSize.y)
    ctx.restore();
}

function drawPipes() {
    for (let pipe of Pipe.pipesInState) {
        let pipePosition = pipe.position;
        ctx.drawImage(pipe.img, pipePosition.x, pipePosition.y, Pipe.pipeWidth, backgroundHeight / 2);
    }
}

function drawGround() {
    for (let groundPiece of Ground.groundPiecesInState) {
        let groundPosition = groundPiece.position;
        ctx.drawImage(groundImg, groundPosition.x, groundPosition.y);
    }
}

function drawScore(score, x, y) {
    ctx.font = '55px Teko, sans-serif';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 8;
    ctx.strokeText(score, x, y);
    ctx.fillStyle = 'white';
    ctx.fillText(score, x, y);
}

function endOfGameAnimation() {
    ctx.drawImage(backgroundImg, 0, 0, backgroundWidth, backgroundHeight);
    drawPipes();

    bird.birdRotateAngle = 90;
    bird.speed = new Vec(0, 11);
    bird.update(new Vec(0, 0));
    drawBirdAtAnAngle();

    drawGround();

    if (bird.position.y + Bird.size.y < backgroundHeight + 20) requestAnimationFrame(endOfGameAnimation);
    else {
        ctx.drawImage(restartButtonImg, 125, 280);
        ctx.drawImage(scoreBoardImg, 150, 30);
        drawScore(score, 220, 140);
        drawScore(topScore, 220, 230);
        restartEnabled = true;
    }
}

function getCursorPosition(canvas, event) {
    if (gameOver && restartEnabled) {
        const rect = canvas.getBoundingClientRect()
        if (event.type === 'mousedown') {
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            console.log("x: " + x + " y: " + y)
            if (x >= 125 && x <= 338.5 && y >= 280 && y <= 353.5) restart();
        } else if (event.type === 'touchstart') {
            const touchX = event.targetTouches[0].pageX - rect.left;
            const touchY = event.targetTouches[0].pageY - rect.top;
            console.log(touchX, touchY);
            if (touchX >= 125 && touchX <= 338.5 && touchY >= 280 && touchY <= 353.5) restart();
        }
    }
}


function stateUpdate() {
    if (gameStarted) {
        if (bird.speed.y < speedLimit.y) bird.update(gravity);
        else bird.update(constantSpeed);

        if (Pipe.pipesInState.length > 0) Pipe.update();
    } else {
        if (Math.abs(bird.speed.y) < startingScreenSpeedLimit.y) bird.update(startingScreenGravity);
        else {
            bird.speed = new Vec(0, 0);
            startingScreenGravity = startingScreenGravity.times(-1);
        }
    }
    Ground.update();
}


function collisionDetection() {
    //the numbers here are random factors, they are meaningless
if (doesCollideWithPipes) {
    for (let pipe of Pipe.pipesInState) {
        if (bird.position.x + Bird.size.x >= pipe.position.x + 35 && bird.position.x <= pipe.position.x + pipe.size.x) {
            let pipeEnd;
            if (pipe.img === upperPipeImg) {
                if (bird.position.y < pipe.size.y + 20) {
                    lives--;//
                    doesCollideWithPipes = false;
                    //gameOver = true;
                    setTimeout(() => {
                        doesCollideWithPipes = true;
                    }, 1000);
                }
            } else {
                pipeEnd = backgroundHeight - pipe.size.y;
                if (bird.position.y + Bird.size.y >= pipeEnd + 15) {
                    doesCollideWithPipes = false;
                    lives--;//
                    //gameOver = true;
                    setTimeout(() => {
                        doesCollideWithPipes = true;
                    }, 1000);
                }
            }
        }
    }
}

    if (bird.position.y + Bird.size.y > backgroundHeight) {
        bird.position.y = bird.position.y - 50;
        lives--;//
        //gameOver = true;
    }

    if (lives === 0) gameOver = true;//

    if (gameOver) {
        ctx.beginPath();
        ctx.rect(0, 0, backgroundWidth, 640);
        ctx.fillStyle = "grey";
        ctx.fill();
        if (score > topScore) topScore = score;
    }
}

function birdJump() {
    if (!gameOver) {
        if (!gameStarted) {
            gameStarted = true;
            frame = 0;
            score = 0;

            //creating the starting pipes
            const pipesDelay = 3500;
            setTimeout(() => {
                Pipe.create();
            }, pipesDelay);
        }

        bird = new Bird(bird.position, new Vec(0, -11), false);
        bird.birdRotateAngle = -25;
    }
}



canvas.addEventListener('mousedown', function (e) {
    if (!gameOver) birdJump();
    getCursorPosition(canvas, e);
});
window.addEventListener('keydown', function (e) {
    if (e.keyCode === 32) {
        e.preventDefault();
        if (!gameOver) birdJump();
    }
});
canvas.addEventListener('touchstart', function (e) {
    if (!gameOver) birdJump();
    getCursorPosition(canvas, e);
});
canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
});


function restart() {
    gameStarted = false;
    gameOver = false;
    restartEnabled = false;
    bird = new Bird(new Vec(200, 300), new Vec(0, 0));
    frame = 0;
    score = 0;
    Pipe.pipesInState = [];
    Pipe.werePipesCreatedRecently = false;
    draw();
}