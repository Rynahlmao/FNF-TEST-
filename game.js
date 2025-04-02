let game;
let chartData;
let notes = [];
let instAudio, voicesAudio;
let score = 0;
let hitAccuracy = 0;
let totalNotes = 0;

document.getElementById('chartFile').addEventListener('change', handleChartUpload);
document.getElementById('instFile').addEventListener('change', handleInstUpload);
document.getElementById('voicesFile').addEventListener('change', handleVoicesUpload);

function handleChartUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            chartData = JSON.parse(e.target.result);
            console.log("Chart Loaded", chartData);
        };
        reader.readAsText(file);
    }
}

function handleInstUpload(event) {
    const file = URL.createObjectURL(event.target.files[0]);
    instAudio = new Audio(file);
}

function handleVoicesUpload(event) {
    const file = URL.createObjectURL(event.target.files[0]);
    voicesAudio = new Audio(file);
}

function startGame() {
    if (!chartData || !instAudio || !voicesAudio) {
        alert("Please upload all files (Chart, Instrumental, and Voices)!");
        return;
    }

    if (game) {
        game.destroy(true);
    }

    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight * 0.7,
        parent: 'game-container',
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    game = new Phaser.Game(config);
}

function preload() {
    this.load.audio('inst', instAudio.src);
    this.load.audio('voices', voicesAudio.src);
}

function create() {
    let scene = this;

    instAudio.play();
    voicesAudio.play();

    const sections = chartData.song.notes;
    sections.forEach(section => {
        section.sectionNotes.forEach(note => {
            notes.push({
                time: note[0],
                lane: note[1],
                sprite: null,
                hit: false
            });
        });
    });

    totalNotes = notes.length;

    this.input.keyboard.on('keydown', function(event) {
        handleInput(event.key);
    });

    document.querySelectorAll('.touch-btn').forEach(button => {
        button.addEventListener('touchstart', function() {
            handleInput(button.dataset.lane);
        });
    });

    this.add.text(10, 10, "Score: 0", { fontSize: '24px', fill: '#fff' }).setName('scoreText');
}

function update(time) {
    let scene = this.scene;

    notes.forEach(note => {
        if (!note.sprite && time >= note.time) {
            note.sprite = this.add.rectangle(100 + note.lane * 100, 0, 50, 50, 0xff0000);
        }
        if (note.sprite) {
            note.sprite.y += 5;
            if (note.sprite.y > window.innerHeight * 0.7 - 50 && !note.hit) {
                noteMissed(note);
            }
        }
    });
}

function handleInput(input) {
    let lane;
    if (input === "ArrowLeft") lane = 0;
    if (input === "ArrowDown") lane = 1;
    if (input === "ArrowUp") lane = 2;
    if (input === "ArrowRight") lane = 3;
    if (!lane && lane !== 0) return;

    let closestNote = notes.find(note => note.lane == lane && !note.hit);
    if (closestNote && closestNote.sprite.y > window.innerHeight * 0.7 - 100) {
        noteHit(closestNote);
    }
}

function noteHit(note) {
    note.hit = true;
    score += 100;
    hitAccuracy += 1;
    updateScore();
    note.sprite.destroy();
}

function noteMissed(note) {
    note.hit = true;
    score -= 50;
    updateScore();
}

function updateScore() {
    let accuracy = (hitAccuracy / totalNotes) * 100;
    let scoreText = game.scene.scenes[0].children.list.find(obj => obj.name === "scoreText");
    if (scoreText) {
        scoreText.setText(`Score: ${score} | Accuracy: ${accuracy.toFixed(1)}%`);
    }
}
