// SETTING UP LOCAL SERVER REMINDER!!!!

// cd <drag in full directory> ENTER

// type in "node index.js"

// PRESTO

require('dotenv').config();

const ciqlJson = require("ciql-json");

const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT);

app.use(express.static("public"));

console.log("Server online");

const socket = require("socket.io");

const io = socket(server, {
  cors: {
    methods: ["GET", "PATCH", "POST", "PUT"],
    origin: true
  }
});

const Matter = require("matter-js");

const functions = require("./raycast.js");

let messageLoad = [];

let ticks = 0,
lastTime = Date.now();

const tickRate = 250;

const Engine = Matter.Engine,
  World = Matter.World,
  Composite = Matter.Composite,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  engine = Engine.create(void 0, {
    gravity: {
      y: 0 // For some reason, this doesn't work
    }
  }),
  world = engine.world;
const runner14832948 = Matter.Runner.run(engine);

let imageBodyList = [];

engine.gravity.y = 0;

class bullet {
  coordinates = { start: {}, finish: {} };
  emitter;
  angle;
  timeLeft;
  tracerLength;
  collisionSurface = [];
  shouldEjectCartridge;

  constructor(coordinates, emitter, angle, timeLeft, collisionSurface, shouldEjectCartridge) {
    this.coordinates = coordinates;
    this.emitter = emitter;
    this.angle = angle;
    this.timeLeft = timeLeft;
    this.collisionSurface = collisionSurface;
    this.tracerLength = squaredDist({x: coordinates.start.x, y: coordinates.start.y}, {x: coordinates.finish.x, y: coordinates.finish.y});
    this.shouldEjectCartridge = shouldEjectCartridge;
  }
}

class weapon {
  name;
  type;
  magSize;
  view;
  fireDelay;
  spread;
  damage;
  bulletsPerShot;
  handPositions;
  images = {};
  reloadLength;
  roundsPerReload;
  playerDensity;
  damageArea;
  recoilImpulse;
  lifeTime;
  sounds;

  constructor(data) {
    this.name = data.name;
    this.type = data.type;
    if(data.type != "melee") {
      this.magSize = data.magSize;
      this.spread = data.spread;
      this.bulletsPerShot = data.bulletsPerShot;
      this.reloadLength = data.reloadLength;
      this.roundsPerReload = data.roundsPerReload;
      this.damageArea = {};
      this.lifeTime = data.lifeTime;
    } else {
      this.magSize = 1;
      this.spread = 0;
      this.bulletsPerShot = 1;
      this.reloadLength = 1;
      this.roundsPerReload = Infinity;
      this.damageArea = data.damageArea;
      this.lifeTime = 0;
    }
    this.view = data.view;
    this.fireDelay = data.fireDelay;
    this.damage = data.damage;
    this.handPositions = data.handPositions;
    this.images = data.images;
    this.playerDensity = data.playerDensity;
    this.recoilImpulse = data.recoilImpulse;
    this.sounds = data.sounds;
  }
}

class particle {
  position;
  rotation;
  angle;
  colour;
  opacity;
  src;
  size;
  type;

  constructor(position, rotation, angle, colour, opacity, src, size, type) {
    this.position = position;
    this.rotation = rotation;
    this.angle = angle;
    this.colour = colour;
    this.opacity = opacity;
    this.src = src;
    this.size = size;
    this.type = type;
  }
}

class playerLike {
  #body;
  get body() { return this.#body; }
  guns; // array of guns in inventory
  health; // self explanatory, out of 100
  view; // fov
  keys = []; // list of all keys on the keyboard, in order of keycodes
  name; // red or blue
  platform;
  state = {
    fireTimer: 0,
    isReloading: false,
    reloadProgress: 0,
    angle: 0,
    previousPosition: 0,
    isMoving: false,
    position: {},
    previousPosition: {x: 0, y: 0},
    spawnNumber: 0,
    recoilTimer: 0,
    spawnpoint: {},
    mag: [0, 0, 0],
    activeWeaponIndex: 0,
    hasStarted: false,
    objectRenderList: [],
    ping: 0,
    force: {x: 0, y: 0}
  };

  constructor(body, angle, guns, health, view, name, platform) {
    this.#body = body;
    this.state.angle = angle;
    this.view = view;
    this.guns = guns;
    this.health = health;
    this.view = view;
    this.name = name;
    this.state.isMoving = false;
    this.platform = platform;
    this.state.position = body.position;
    this.state.previousPosition = {x: body.position.x / 1, y: body.position.y / 1}
  }
  destroy() {
    this.#body = void 0;
  }
}

let gameData = {
  mapData: ciqlJson.open("maps/bero_ryale.json").data,
  teamNumbers: { "blue": 0, "red": 0 },
  roundsWonScore: {"blue": 0, "red": 0},
  currentRoundScore: { "blue": 0, "red": 0 },
  secondsLeft: 360,
  players: {},
  objects: [],
  bullets: [],
  particles: [],
  point: {},
  usersOnline: 0,
  users: [],
  certificate: "",
  queuedSounds: [],
  weapons: {},
  loadouts: ciqlJson.open("maps/bero_ryale.json").data.config.loadouts,
  lastTickDelay: tickRate,
  shouldUpdateUI: false
};

function squaredDist(ptA, ptB) {
  return (ptB.x - ptA.x) ** 2 + (ptB.y - ptA.y) ** 2;
}

function fillWeapons() {
  const gunAPI = ciqlJson.open("public/api/weapons.json").data.weapons;
  for(let i = 0; i < gunAPI.length; i++) {
    gameData.weapons[gunAPI[i].name] = new weapon(gunAPI[i]);
  }
}

function initialize() {  
  Composite.clear(world, false);
  imageBodyList = [];
  for (let i = 0; i < gameData.mapData.obstacles.length; i++) {
    const obstacle = gameData.mapData.obstacles[i]["body-data"];
    let body;
    switch (obstacle.type) {
      case "rectangle":
        body = Bodies.rectangle(obstacle.position.x, obstacle.position.y, obstacle.dimensions.width, obstacle.dimensions.height, obstacle.options);
      break;
      case "circle": 
        body = Bodies.circle(obstacle.position.x, obstacle.position.y, obstacle.radius, obstacle.options);
      break;
    }
    Composite.add(world, body);
    imageBodyList.push(
      Bodies.rectangle(
        obstacle.position.x + gameData.mapData.obstacles[i]["display-data"].offset.x, 
        obstacle.position.y + gameData.mapData.obstacles[i]["display-data"].offset.y, 
        gameData.mapData.obstacles[i]["display-data"].dimensions.width, 
        gameData.mapData.obstacles[i]["display-data"].dimensions.height, 
        {
          angle: (gameData.mapData.obstacles[i]["display-data"].offset.angle * Math.PI / 180),
          tag: "" + i
        }
      )
    );
  }
  if(gameData.mapData.config.gamemode == "hardpoint") {
    gameData.point = {
      position: gameData.mapData.config.point.position,
      state: "uncontested",
      teamNumbers: {
        blue: 0,
        red: 0,
      }
    }
  }
  fillWeapons();
}

initialize();

let updateCertificate = setInterval(function() { gameData.certificate = Math.random() * 5 + ""; }, 10000),
updateSecondsLeft = setInterval(function() {
  if(gameData.users.length > 0) {
    gameData.secondsLeft--;
  }
  if(gameData.secondsLeft < -20) {
    gameData.secondsLeft = 360;
  }
}, 1000);

function updatePlayerPrev() {
  for(let i = 0; i < gameData.users.length; i++) {
    const body = gameData.players[gameData.users[i]].body,
    player = gameData.players[gameData.users[i]];

    player.state.previousPosition = {x: body.position.x / 1, y: body.position.y / 1};
    player.state.previousAngle = player.state.angle;
  }
}

function updatePlayer(player, delay) {
  const w = !!player.keys[83],
    a = !!player.keys[65],
    s = !!player.keys[87],
    d = !!player.keys[68],
    body = player.body,
    base = player.body.circleRadius / (14.14);

  player.state.force = {x: (player.state.position.x - player.state.previousPosition.x), y: (player.state.position.y - player.state.previousPosition.y)};

  if(w || s) {
    Body.setVelocity(body, {
      x: body.velocity.x,
      y: +(w ^ s) && (((a ^ d) ? 0.7071 : 1) * [-1, 1][+w] * base * delay * 2/ (body.density / 0.15))
    });
  }
  if(a || d) {
    Body.setVelocity(body, {
      x: +(a ^ d) && (((w ^ s) ? 0.7071 : 1) * [-1, 1][+d] * base * delay * 2 / (body.density / 0.15)),
      y: body.velocity.y
    });
  }

  player.state.isMoving = !!Math.round(body.velocity.x) || !!Math.round(body.velocity.y);

  if(player.keys[950]) {
    const position = { x: player.state.position.x, y: player.state.position.y },
    currentWeapon = gameData.weapons[player.guns[player.state.activeWeaponIndex]];
    let randomAngleOffset = (Math.random() - 0.5) * currentWeapon.spread.standing;
    let activeWeaponSpread = currentWeapon.spread.standing;
    if(player.state.isMoving) {
      randomAngleOffset = (Math.random() - 0.5) * currentWeapon.spread.moving;
      activeWeaponSpread = currentWeapon.spread.moving;
    }
    const bulletLength = gameData.mapData.config["map-dimensions"].width + gameData.mapData.config["map-dimensions"].height;
    if (player.state.fireTimer > currentWeapon.fireDelay && player.state.mag[player.state.activeWeaponIndex] > 0 && player.state.hasStarted && player.health > 0 && !player.state.isReloading) {
      if(currentWeapon.type == "melee") {
        const angle = player.state.angle * Math.PI / 180 - Math.PI;
        let playerBodies = [];
        for(let i = 0; i < gameData.users.length; i++) {
          if(gameData.users[i] != socket.id) {
            playerBodies.push(gameData.players[gameData.users[i]].body);
          }
        }
        const collisions = Matter.Query.collides(Matter.Bodies.circle(player.state.position.x + Math.cos(angle) * 300, player.state.position.y + Math.sin(angle) * 300, 150), playerBodies);
        player.state.recoilTimer = 1;
        player.state.fireTimer = 0;
        if(collisions[0]) {
          const ray = functions.raycast(Composite.allBodies(world), position, { x: player.state.position.x + Math.cos(Math.atan2(collisions[0].bodyA.position.y - position.y, collisions[0].bodyA.position.x - position.x)) * 300, y: player.state.position.y + Math.sin(Math.atan2(collisions[0].bodyA.position.y - position.y, collisions[0].bodyA.position.x - position.x)) * 300 }, true);
          if(ray[1] && ray[1].body == collisions[0].bodyA) {
            gameData.particles.push(new particle({x: ray[1].point.x / 1, y: ray[1].point.y / 1}, Math.random() * 360, player.state.angle * Math.PI / 180 + (Math.random() - 2) * 1 + Math.PI / 2, ray[1].body.tag, 250, "/assets/misc/particle.svg", 100, "residue"));
            for(let i = 0; i < gameData.users.length; i++) {
              if(gameData.players[gameData.users[i]].body == collisions[0].bodyA) {
                gameData.players[gameData.users[i]].health -= currentWeapon.damage;
                if (gameData.players[gameData.users[i]].health < 1) {   
                  gameData.players[gameData.users[i]].health = 0;
                  //Body.setPosition(gameData.players[gameData.users[i]].body, gameData.players[gameData.users[i]].state.spawnpoint);
                  gameData.players[gameData.users[i]].state.hasStarted = false;
                  Composite.remove(world, gameData.players[gameData.users[i]].body);
                  gameData.players[gameData.users[i]].keys = [];
                  gameData.currentRoundScore[player.name]+=5;
                  gameData.players[gameData.users[i]].state.mag[0] = gameData.weapons[gameData.players[gameData.users[i]].guns[0]].magSize;
                  gameData.players[gameData.users[i]].state.isReloading = false;
                }
              }
            }
          }
        }
      } else {
        player.state.reloadProgress = 0;
        if (currentWeapon.bulletsPerShot > 1) {
          for (let j = 0; j < currentWeapon.bulletsPerShot; j++) {
            let angle = ((player.state.angle + (activeWeaponSpread / currentWeapon.bulletsPerShot) * (j - Math.floor(currentWeapon.bulletsPerShot / 2))) + (Math.random() - 0.5) * activeWeaponSpread / 30) * Math.PI / 180 - Math.PI;
            let ray = functions.raycast(Composite.allBodies(world), position, { x: player.state.position.x + Math.cos(angle) * bulletLength, y: player.state.position.y + Math.sin(angle) * bulletLength }, true);
            let finish = ray[1].point;
            /*if(ray[1].body.tag != "none") {
              let vertsAngle = Math.atan2(ray[1].verts[0].y - ray[1].verts[1].y, ray[1].verts[0].x - ray[1].verts[1].x) + Math.PI * 2.5;
              gameData.particles.push(new particle({x: ray[1].point.x / 1, y: ray[1].point.y / 1}, Math.random() * 360, (vertsAngle), ray[1].body.tag, 250, "/assets/misc/particle.svg", 100, "residue"));
            }*/
            for (let i = 0; i < gameData.users.length; i++) {
              if (gameData.players[gameData.users[i]].body == ray[1].body && gameData.players[gameData.users[i]] != player) {
                finish = ray[1].point;
                gameData.players[gameData.users[i]].health -= currentWeapon.damage;
                if (gameData.players[gameData.users[i]].health < 1) {    
                  gameData.players[gameData.users[i]].health = 0;
                  //Body.setPosition(gameData.players[gameData.users[i]].body, gameData.players[gameData.users[i]].state.spawnpoint);
                  gameData.players[gameData.users[i]].state.hasStarted = false;
                  Composite.remove(world, gameData.players[gameData.users[i]].body);
                  gameData.players[gameData.users[i]].keys = [];
                  gameData.currentRoundScore[player.name]+=5;
                  gameData.players[gameData.users[i]].state.mag[0] = gameData.weapons[gameData.players[gameData.users[i]].guns[0]].magSize;
                  gameData.players[gameData.users[i]].state.isReloading = false;
                }
              }
            }
            let shouldEjectCartridge = false;
            if(j == 0) {
              shouldEjectCartridge = true;
            }
            gameData.bullets.push(new bullet({ start: player.state.position, finish: finish }, player.name, player.state.angle + (activeWeaponSpread / currentWeapon.bulletsPerShot) * (j - Math.floor(currentWeapon.bulletsPerShot / 2)), currentWeapon.lifeTime, [{x: ray[1].verts[0].x, y: ray[1].verts[0].y, colour: ray[1].body.tag}, {x: ray[1].verts[1].x, y: ray[1].verts[1].y, colour: ray[1].body.tag}], shouldEjectCartridge));
          }
          player.state.fireTimer = 0;
        } else {
          let ray = functions.raycast(Composite.allBodies(world), position, { x: player.state.position.x + Math.cos((player.state.angle + randomAngleOffset) * Math.PI / 180 - Math.PI) * bulletLength, y: player.state.position.y + Math.sin((player.state.angle + randomAngleOffset) * Math.PI / 180 - Math.PI) * bulletLength }, true);
          let finish = ray[1].point;
          /*if(ray[1].body.tag != "none") {
            let vertsAngle = Math.atan2(ray[1].verts[0].y - ray[1].verts[1].y, ray[1].verts[0].x - ray[1].verts[1].x) + Math.PI * 2.5;
            gameData.particles.push(new particle({x: ray[1].point.x / 1, y: ray[1].point.y / 1}, Math.random() * 360, (vertsAngle), ray[1].body.tag, 250, "/assets/misc/particle.svg", 100, "residue"));
          }*/
          for (let i = 0; i < gameData.users.length; i++) {
            if (gameData.players[gameData.users[i]].body == ray[1].body && gameData.players[gameData.users[i]] != player) {
              finish = ray[1].point;
              gameData.players[gameData.users[i]].health -= currentWeapon.damage;
              if (gameData.players[gameData.users[i]].health < 1) { 
                gameData.players[gameData.users[i]].health = 0;
                gameData.players[gameData.users[i]].state.hasStarted = false;
                Composite.remove(world, gameData.players[gameData.users[i]].body);
                gameData.players[gameData.users[i]].keys = [];
                gameData.currentRoundScore[player.name] += 5;
                gameData.players[gameData.users[i]].state.mag[0] = gameData.weapons[gameData.players[gameData.users[i]].guns[0]].magSize;                  
                gameData.players[gameData.users[i]].state.isReloading = false;
              }
            }
          }
          gameData.bullets.push(new bullet({ start: player.state.position, finish: finish }, player.name, player.state.angle + randomAngleOffset, currentWeapon.lifeTime, [{x: ray[1].verts[0].x, y: ray[1].verts[0].y, colour: ray[1].body.tag}, {x: ray[1].verts[1].x, y: ray[1].verts[1].y, colour: ray[1].body.tag}], true));
          player.state.fireTimer = 0;
        }
        player.state.recoilTimer = 1;
      }
      gameData.shouldUpdateUI = true;
      gameData.queuedSounds.push({path: currentWeapon.sounds.fire, origin: player.state.position});
    }
    if(player.state.mag[player.state.activeWeaponIndex] <= 0 && !player.state.isReloading) {
      player.state.isReloading = true;
      player.state.reloadProgress = 0;
      gameData.queuedSounds.push({path: currentWeapon.sounds.reload, origin: player.state.position});
    }
  }
}

function updateGame() {
  if (gameData.usersOnline > 0) {
    let time = Date.now();
    
    const tickDelay = ((time - lastTime) / ((25 / tickRate) * tickRate));
    gameData.lastTickDelay = (time - lastTime);

    lastTime = Date.now();
    for (let x = 0; x < gameData.users.length; x++) {
      const player = gameData.players[gameData.users[x]];
      const currentWeapon = gameData.weapons[player.guns[player.state.activeWeaponIndex]];
      player.state.fireTimer+=tickDelay;
      if (player.state.recoilTimer > 0) {
        player.state.recoilTimer -= 1 / 7 * tickDelay;
      }
      if(player.state.isReloading) {
        if(player.state.reloadProgress >= currentWeapon.reloadLength) {
          if(currentWeapon.roundsPerReload == "all") {
            player.state.isReloading = false;
            player.state.mag[player.state.activeWeaponIndex] = currentWeapon.magSize;
          } else {
            player.state.mag[player.state.activeWeaponIndex] += currentWeapon.roundsPerReload;
            if(player.state.mag[player.state.activeWeaponIndex] >= currentWeapon.magSize) {
              player.state.isReloading = false;
            } else {
              gameData.queuedSounds.push({path: currentWeapon.sounds.reload, origin: player.state.position});
            }
          }
          player.state.reloadProgress = 0;
          player.state.fireTimer = currentWeapon.fireDelay - 5;
        } else {
          player.state.reloadProgress+=tickDelay;
        }
        gameData.shouldUpdateUI = true;
      }
      updatePlayer(player, tickDelay);
    }
    for(let x = 0; x < gameData.users.length; x++) {
      io.to(gameData.users[x]).emit("world-update", {
        players: gameData.players,
        bullets: gameData.bullets,
        particles: gameData.particles,
        usersOnline: gameData.usersOnline,
        secondsLeft: gameData.secondsLeft,
        users: gameData.users,
        point: gameData.point,
        currentRoundScore: gameData.currentRoundScore,
        certificate: gameData.certificate,
        queuedSounds: gameData.queuedSounds,
        lastTickDelay: gameData.lastTickDelay,
        shouldUpdateUI: gameData.shouldUpdateUI
      });
    }
    gameData.bullets = [],
    gameData.particles = [];
    gameData.queuedSounds = [];
    gameData.shouldUpdateUI = false;
    updatePlayerPrev();
  }
}

var updateGameTimer = setInterval(updateGame, tickRate),
updateObjectRenderLists = setInterval(function() {
  for(let i = 0; i < gameData.users.length; i++) {
    const player = gameData.players[gameData.users[i]];

    player.state.objectRenderList = [];
    const collisionList = Matter.Query.collides(Bodies.rectangle(player.state.position.x, player.state.position.y, 5000 + gameData.weapons[player.guns[player.state.activeWeaponIndex]].view ** 1.15, 3000 + gameData.weapons[player.guns[player.state.activeWeaponIndex]].view ** 1.15), imageBodyList);
    for (let i = 0; i < collisionList.length; i++) {
      player.state.objectRenderList.push(collisionList[i].bodyA.tag / 1);
    }
  }
}, tickRate * 10);

io.sockets.on("connection", newConnection);

function newConnection(socket) {
  socket.on("play-request", (data) => {
    if (gameData.usersOnline < 6) {
      let alreadyExists = false;
      for(let j = 0; j < gameData.users.length; j++) {
        if(gameData.users[j] == socket.id) {
          alreadyExists = true;
        }
      }
      if(!alreadyExists) {
        console.log("New client. " + (gameData.usersOnline + 1) + " Users online.");
        gameData.usersOnline++;
        gameData.users.push(socket.id);
        gameData.players[socket.id] = new playerLike(
          Bodies.circle(gameData.mapData.config["map-dimensions"].width / 2, gameData.mapData.config["map-dimensions"].height / 2, 115, {
            friction: 0,
            restitution: 0,
            inertia: 1,
            density: 0.015,
            frictionAir: 0.25,
            tag: "none"
          }),
          0,
          gameData.loadouts["ak47"],
          100,
          0,
          socket.handshake.address,
          data.platform || "desktop"
        );
        const player = gameData.players[socket.id];
        player.state.fireTimer = 1000;
        player.state.hasStarted = true;
        Body.setDensity(player.body, gameData.weapons[player.guns[player.state.activeWeaponIndex]].playerDensity * 2.5);
        player.health = 100;


        Body.setPosition(player.body, {x: Math.random() * gameData.mapData.config["map-dimensions"].width, y: Math.random() * gameData.mapData.config["map-dimensions"].height})
        Composite.add(world, player.body);

        gameData.shouldUpdateUI = true;
        gameData.players[socket.id].state.mag[gameData.players[socket.id].state.activeWeaponIndex] = gameData.weapons[gameData.players[socket.id].guns[gameData.players[socket.id].state.activeWeaponIndex]].magSize;
        socket.emit("load-world", gameData);

        socket.on("disconnect", function() {
          if (gameData.players[socket.id]) {
            gameData.usersOnline--;
            console.log(gameData.usersOnline + " Users connected. 1 user has disconnected.");
            Composite.remove(world, gameData.players[socket.id].body);
            gameData.players[socket.id] = void 0;
            for (let i = 0; i < gameData.users.length; i++) {
              if (gameData.users[i] === socket.id) {
                gameData.users.splice(i, 1);
              }
            }
          }
        });
        socket.on("move-key-change", (data) => {
          try {
            let player = gameData.players[socket.id];
            if(player.health > 0) {
              if(player.state.hasStarted) {
                player.keys = data.keys;
    
                if(player.keys[82] && player.state.mag[player.state.activeWeaponIndex] < gameData.weapons[player.guns[player.state.activeWeaponIndex]].magSize && !player.state.isReloading) {
                  player.state.isReloading = true;
                  gameData.queuedSounds.push({path: gameData.weapons[player.guns[player.state.activeWeaponIndex]].sounds.reload, origin: player.state.position});
                }
              }
            }
          }
          catch { }
        });
        socket.on("angle-change", (data) => {
          try {
            if(gameData.players[socket.id].state.hasStarted && data.certificate == gameData.certificate && gameData.players[socket.id].health > 0) {
              gameData.players[socket.id].state.angle = data.angle;
            }
          }
          catch { } 
        });
        socket.on("spawn", (data) => {
          try {
            let player = gameData.players[socket.id];
            if(!player.state.hasStarted || gameData.players[socket.id].health < 0) {
              player.guns = gameData.loadouts[data.class];
              player.state.mag[0] = gameData.weapons[player.guns[0]].magSize;
              player.state.fireTimer = 1000;
              player.state.hasStarted = true;
              Body.setDensity(player.body, gameData.weapons[player.guns[player.state.activeWeaponIndex]].playerDensity * 2.5);
              player.health = 100;

              const spawn = gameData.mapData.config.spawns[player.name][Math.floor(Math.random() * gameData.mapData.config.spawns[player.name].length)];

              Body.setPosition(player.body, {x: spawn.x, y: spawn.y})
              Composite.add(world, player.body);

              gameData.shouldUpdateUI = true;
            }
          }
          catch { }
        });
        socket.on("ping", (data) => {
          gameData.players[socket.id].state.ping = Date.now() - data.time;
        });
      }
    }
  });
}







