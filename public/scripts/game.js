let socket,
  gameData,
  assetsLoaded = {},
  assetsAreLoaded = false,
  queuedCameraLocation = {
    x: 0,
    y: 0,
    z: 0,
    targetX: 0,
    targetY: 0,
    targetZ: 0
  },
  cameraLocation = {
    x: 0,
    y: 0,
    z: 0,
    targetX: 0,
    targetY: 0,
    targetZ: 0
  },
  keys = [],
  updateDebugMenu,
  debug = false,
  sourceSansPro,
  ping,
  state = "menu-main",
  permanentID,
  mostRecentMS;

if(window.location.href.includes("render") || window.location.href.includes("localhost")) {
  socket = io.connect(window.location.origin);
} else {
  socket = io.connect("wss://rekoil-dm-usw.onrender.com");
}

function mousePressed() {
  if(assetsAreLoaded && state.includes("ingame") && mouseButton == LEFT) {
    keys[950] = true;
    socket.emit("move-key-change", {keys: keys});
  }
}

function mouseReleased() {
  if(assetsAreLoaded && state.includes("ingame") && mouseButton == LEFT) {
    keys[950] = false;
    socket.emit("move-key-change", {keys: keys});
  }
}

function keyReleased() {
  if(assetsAreLoaded) {
    keys[keyCode] = false;
    socket.emit("move-key-change", {keys: keys});
  }
}

function keyPressed() {
  if(assetsAreLoaded) {
    keys[keyCode] = true;
    socket.emit("move-key-change", {keys: keys});

    if(keys[49]) {
      socket.emit("change-weapon-index", {index: 0});
      keys[49] = false;
      if(gameData.players[permanentID].state.activeWeaponIndex != 0) {
        assetsLoaded[gameData.weapons[gameData.players[permanentID].guns[gameData.players[permanentID].state.activeWeaponIndex]].sounds.reload].stop();
      }
    }
    if(keys[50]) {
      socket.emit("change-weapon-index", {index: 1});
      keys[50] = false;
      if(gameData.players[permanentID].state.activeWeaponIndex != 1) {
        assetsLoaded[gameData.weapons[gameData.players[permanentID].guns[gameData.players[permanentID].state.activeWeaponIndex]].sounds.reload].stop();      
      }
    }
    if(keys[51]) {
      socket.emit("change-weapon-index", {index: 2});
      keys[51] = false;
      if(gameData.players[permanentID].state.activeWeaponIndex != 2) {
        assetsLoaded[gameData.weapons[gameData.players[permanentID].guns[gameData.players[permanentID].state.activeWeaponIndex]].sounds.reload].stop();
      }
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  document.getElementById("defaultCanvas0").style.display = "none";
  background("#333333");
  pixelDensity(1);
  noLoop();
  window.addEventListener(
    "resize",
    function() {
      resizeCanvas(windowWidth, windowHeight);
      background("#333333");
    }
  );

  rectMode(CENTER);
  imageMode(CENTER);
  angleMode(DEGREES)
  noStroke();

  sourceSansPro = loadFont("/fonts/SourceSansPro-Black.ttf");

  assetsLoaded["/assets/player/player-base.svg"] = loadImage("/assets/player/player-base.svg");
  assetsLoaded["/assets/player/player-hand.svg"] = loadImage("/assets/player/player-hand.svg");
  assetsLoaded["/assets/weapons/bullet.svg"] = loadImage("/assets/weapons/bullet.svg");
  assetsLoaded["/assets/weapons/ak47-----TOPDOWN.svg"] = loadImage("/assets/weapons/ak47-----TOPDOWN.svg");
  assetsLoaded["/assets/misc/particle.svg"] = loadImage("/assets/misc/particle.svg");
  assetsLoaded["/assets/weapons/cartridge.svg"] = loadImage("/assets/weapons/cartridge.svg");
  assetsLoaded["/assets/audio/guns/gunshot-sound-effect-single-shot.mp3"] = new Howl({ src: ["/assets/audio/guns/gunshot-sound-effect-single-shot.mp3"], volume: 1 });

  document.getElementById("play-button").addEventListener("click", function() {requestConnectToGame();});

  socket.on("load-world", data => { // first time loading world, right after pressing play
    gameData = data;
    permanentID = socket.id;
    assetsLoaded[data.mapData.config["ground-image"]] = loadImage(data.mapData.config["ground-image"]);
    for(let i = 0; i < data.mapData.obstacles.length; i++) {
      assetsLoaded[data.mapData.obstacles[i]["display-data"].src] = loadImage(data.mapData.obstacles[i]["display-data"].src);
    }
    assetsAreLoaded = true;
    state = "ingame-weaponselect";
    queuedCameraLocation = {
      x: gameData.players[permanentID].state.position.x,
      y: gameData.players[permanentID].state.position.y,
      z: 2200 + gameData.weapons[gameData.players[permanentID].guns[gameData.players[permanentID].state.activeWeaponIndex]].view,
      targetX: gameData.players[permanentID].state.position.x,
      targetY: gameData.players[permanentID].state.position.y,
      targetZ: 0
    };
    loop();
    document.getElementById("defaultCanvas0").style.display = "block";
  });
  
  socket.on("world-update", data => { // LITERALLY EVERY "50" MILLISECOND !!
    gameData.players = data.players,
    gameData.point = data.point,
    gameData.usersOnline = data.usersOnline,
    gameData.secondsLeft = data.secondsLeft,
    gameData.users = data.users;
    gameData.currentRoundScore = data.currentRoundScore;
    gameData.certificate = data.certificate;
    gameData.queuedSounds = data.queuedSounds;
    gameData.timeStamp = Date.now();
    gameData.lastTickDelay = data.lastTickDelay;
    const timestamp = secondsToTimestamp(gameData.secondsLeft);
    for(let i = 0; i < data.bullets.length; i++) {
      let angle = Math.atan2(data.bullets[i].collisionSurface[0].y - data.bullets[i].collisionSurface[1].y, data.bullets[i].collisionSurface[0].x - data.bullets[i].collisionSurface[1].x) + Math.PI / 2;
      gameData.bullets.push(data.bullets[i]);
      gameData.bullets[gameData.bullets.length - 1].timeStamp = Date.now();
      gameData.bullets[gameData.bullets.length - 1].tracerLength = Math.ceil(Math.sqrt(gameData.bullets[gameData.bullets.length - 1].tracerLength));/*
      gameData.particles.push(
        {
          position: { x: data.bullets[i].coordinates.finish.x, y: data.bullets[i].coordinates.finish.y },
          rotation: Math.random() * 360,
          angle: angle,
          colour: data.bullets[i].collisionSurface[0].colour,
          opacity: 250,
          src: '/assets/misc/particle.svg',
          size: 200,
          type: 'residue',
          timeStamp: Date.now()
        }
      );*/
      if(data.bullets[i].shouldEjectCartridge) {
        gameData.particles.push(
          {
            position: {x: data.bullets[i].coordinates.start.x + Math.cos((data.bullets[i].angle * Math.PI / 180) + Math.PI) * 165, y: data.bullets[i].coordinates.start.y + Math.sin((data.bullets[i].angle * Math.PI / 180) + Math.PI) * 155},
            rotation: data.bullets[i].angle * Math.PI / 180 + (Math.random() - 0.5) / 2 - Math.PI / 2,
            angle: data.bullets[i].angle * Math.PI / 180 + (Math.random() - 0.5) / 2 - Math.PI / 2,
            colour: "none",
            opacity: 250,
            src: "/assets/weapons/cartridge.svg",
            size: 100,
            type: "cartridge",
            timeStamp: Date.now()
          }
        );
      }
    }
    for(let i = 0; i < data.particles.length; i++) {
      gameData.particles.push(data.particles[i]);
      gameData.particles[gameData.particles.length - 1].timeStamp = Date.now();
    }
    for(let i = 0; i < gameData.queuedSounds.length; i++) {
      assetsLoaded[gameData.queuedSounds[i].path].volume(0);
      if((0.7 - Math.sqrt(squaredDist(gameData.players[permanentID].state.position, gameData.queuedSounds[i].origin)) / 10000) >= 0) {
        assetsLoaded[gameData.queuedSounds[i].path].volume(0.7 - (Math.sqrt(squaredDist(gameData.players[permanentID].state.position, gameData.queuedSounds[i].origin)) / 10000));
      }
      assetsLoaded[gameData.queuedSounds[i].path].play();
    }
  });
}

function draw() {
  try {
    displayWorld();
  }
  catch {}
}
